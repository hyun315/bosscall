"use client";
import {
  DEFAULT_ALARM_SOUND,
  alarmCycleSeconds,
  isAlarmSound,
  renderAlarmCycle,
  type AlarmSoundId,
} from "@/lib/alarmSounds";

/**
 * 기사 알람 — 휴대폰 쪽 (앱이 실행 중일 때).
 *
 * 원칙 (사장님 결정): 홈 화면에 추가 = 소리에 동의. 기사가 [확인]할 때까지 경보음처럼 계속 울린다.
 *   - 소리: 휴대폰 무음 스위치와 상관없이 울린다 (아이폰 audioSession "playback").
 *   - 진동: 소리와 항상 같이 (안드로이드). 아이폰 웹앱은 진동을 낼 수 없어, 무음일 땐 휴대폰 알림이 진동한다.
 *   - 배터리 때문에 대기 중에는 아무 소리도 틀지 않는다 (사장님 결정). 그래서 BossCall이 뒤에 있거나 화면이
 *     꺼져 있으면 휴대폰이 앱을 재운다 → 그때는 서버가 5초마다 보내는 휴대폰 알림(배너+알림음)이 울린다.
 *     알림을 보고 앱을 열면 그때부터 경보음이 끊김 없이 울린다. 울리던 중 화면을 꺼도 계속 울린다.
 *   - 휴대폰은 "사용자가 화면을 한 번 누른 뒤"에만 앱 소리를 허락한다. 출근 단추·화면 아무 곳을 누르는
 *     순간 소리를 연다. 앱을 새로 연 직후엔 첫 터치에서 열린다.
 *   - 서버 반복 알림: services/server/driverAlerts.ts
 */

const STORAGE_KEY = "bosscall.alarmSound";
const VIBRATE_PATTERN = [600, 200, 600, 200, 900];
const VIBRATE_EVERY_MS = 2_700;

export interface AlarmState {
  /** 지금 울려야 하는 상태 (응답 대기·취소·놓친 호출) */
  wanted: boolean;
  /** 실제로 알람 소리가 나는 중 */
  playing: boolean;
  /** 휴대폰이 소리를 막고 있음 — 화면을 한 번 눌러야 함 */
  blocked: boolean;
}
type Listener = (s: AlarmState) => void;

let ctx: AudioContext | null = null;
let alarmNode: AudioBufferSourceNode | null = null;
let alarmSound: AlarmSoundId | null = null;
let vibrateTimer: ReturnType<typeof setInterval> | null = null;
let previewTimer: ReturnType<typeof setTimeout> | null = null;
let installed = false;
let state: AlarmState = { wanted: false, playing: false, blocked: false };
const listeners = new Set<Listener>();
const buffers = new Map<string, AudioBuffer>();

function emit(next: Partial<AlarmState>): void {
  state = { ...state, ...next };
  for (const l of listeners) l(state);
}

export function subscribeAlarm(l: Listener): () => void {
  listeners.add(l);
  l(state);
  return () => listeners.delete(l);
}

export function getAlarmSound(): AlarmSoundId {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isAlarmSound(v) ? v : DEFAULT_ALARM_SOUND;
  } catch {
    return DEFAULT_ALARM_SOUND;
  }
}

export function setAlarmSound(id: AlarmSoundId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* 저장 불가 — 이번 화면에서만 */
  }
}

/* ───────── 오디오 ───────── */

function audio(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  // 아이폰: 무음 스위치와 상관없이, BossCall이 뒤에 있어도 재생 (음악 앱과 같은 방식)
  try {
    const nav = navigator as unknown as { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* 미지원 */
  }
  // 전화가 오거나 다른 앱이 소리를 가져가면 멈춘다 → 돌아오면 다시
  ctx.onstatechange = () => {
    if (ctx?.state !== "running" && state.wanted) void ctx?.resume().catch(() => undefined);
    if (ctx?.state === "running") refresh();
  };
  return ctx;
}

const running = () => ctx?.state === "running";

function alarmBuffer(c: AudioContext, id: AlarmSoundId): AudioBuffer {
  const key = `${id}@${c.sampleRate}`;
  const hit = buffers.get(key);
  if (hit) return hit;
  const samples = renderAlarmCycle(id, c.sampleRate);
  const buf = c.createBuffer(1, samples.length, c.sampleRate);
  buf.getChannelData(0).set(samples);
  buffers.set(key, buf);
  return buf;
}

function loop(c: AudioContext, buf: AudioBuffer): AudioBufferSourceNode {
  const s = c.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.connect(c.destination);
  s.start(0);
  return s;
}

function stopNode(n: AudioBufferSourceNode | null): void {
  if (!n) return;
  try {
    n.stop();
  } catch {
    /* 이미 멈춤 */
  }
  n.disconnect();
}

/** 지금 상태에 맞게 소리를 맞춘다: 알람 / 없음. force = 사용자가 방금 누름(바로 재생을 건다) */
function refresh(force = false): void {
  const c = audio();
  if (!c) return;
  if (!running() && !force) {
    emit({ playing: false, blocked: state.wanted });
    return;
  }
  const ringing = state.wanted || previewTimer !== null;
  const want = ringing ? (alarmSound ?? getAlarmSound()) : null;
  if (want === null) {
    stopNode(alarmNode);
    alarmNode = null;
  } else if (!alarmNode || alarmNode.buffer !== alarmBuffer(c, want)) {
    stopNode(alarmNode);
    alarmNode = loop(c, alarmBuffer(c, want));
  }
  emit({ playing: !!alarmNode && state.wanted, blocked: false });
}

/** 사용자가 화면을 누른 그 순간 — 소리를 연다 (휴대폰 규칙: 터치 안에서만 열 수 있다) */
function unlock(): void {
  const c = audio();
  if (!c) return;
  if (!running()) void c.resume().catch(() => undefined);
  // 터치 안에서 바로 재생을 걸어야 아이폰이 허락한다 (resume 이 끝나기를 기다리지 않음)
  refresh(true);
}

/** 앱 시작 시 한 번 — 화면 어디든 누르면 소리가 열리도록 */
export function installAlarmUnlock(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const opts = { capture: true, passive: true } as const;
  for (const ev of ["pointerdown", "touchend", "keydown"]) window.addEventListener(ev, unlock, opts);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.wanted) {
      void ctx?.resume().then(() => refresh()).catch(() => undefined);
    }
  });
}

/* ───────── 진동 (안드로이드) ───────── */

function buzz(p: number | number[]): void {
  try {
    navigator.vibrate?.(p);
  } catch {
    /* 미지원 (아이폰) */
  }
}

function startVibrate(): void {
  if (vibrateTimer || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  buzz(VIBRATE_PATTERN);
  vibrateTimer = setInterval(() => buzz(VIBRATE_PATTERN), VIBRATE_EVERY_MS);
}

function stopVibrate(): void {
  if (vibrateTimer) clearInterval(vibrateTimer);
  vibrateTimer = null;
  if (typeof navigator !== "undefined") buzz(0);
}

/* ───────── 바깥에서 쓰는 것 ───────── */

/** 출근 단추 등 사용자가 누른 순간에 부른다 — 알람 소리를 켠다 */
export function primeAlarmAudio(): void {
  unlock();
}

/** 알람 시작 — 응답·확인할 때까지 소리 + 진동 반복 */
export function startCallAlarm(): void {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = null;
  alarmSound = getAlarmSound();
  if (!state.wanted) emit({ wanted: true });
  if (!running()) void audio()?.resume().catch(() => undefined); // 이미 허락된 경우엔 바로 열린다
  refresh();
  startVibrate();
}

/** 알람 끄기 */
export function stopCallAlarm(): void {
  if (state.wanted) emit({ wanted: false });
  if (ctx) refresh();
  stopVibrate();
}

/** 설정 화면 미리 듣기 — 누른 동작 안에서 부른다. 소리 + 짧은 진동 */
export function previewAlarm(id: AlarmSoundId): void {
  if (state.wanted) return;
  alarmSound = id;
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(
    () => {
      previewTimer = null;
      alarmSound = null;
      refresh();
    },
    Math.max(1500, Math.ceil(alarmCycleSeconds(id) * 2) * 1000),
  );
  unlock();
  buzz([400, 150, 400]);
}

/* ───────── 누르는 즉시 멈추기 ─────────
 * 수락·거절·확인을 누르면 서버 응답을 기다리지 않고 바로 소리를 끈다. 같은 호출은 다시 울리지 않는다
 * (서버 처리가 실패하면 unsilenceCall 로 되돌린다).
 */
const silenced = new Set<string>();

export function silenceCall(key: string): void {
  silenced.add(key);
  stopCallAlarm();
  closeCallNotifications(key.replace(/^cancel-/, ""));
  emit({});
}

export function unsilenceCall(key: string): void {
  if (silenced.delete(key)) emit({});
}

export function isCallSilenced(key: string): boolean {
  return silenced.has(key);
}

/** 이 호출의 휴대폰 알림도 지운다 (알림마다 tag 가 "call-<id>-<시각>") */
function closeCallNotifications(callId: string): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.ready
    .then((reg) => reg.getNotifications())
    .then((ns) => ns.filter((n) => n.tag === `call-${callId}` || n.tag.startsWith(`call-${callId}-`)).forEach((n) => n.close()))
    .catch(() => undefined);
}
