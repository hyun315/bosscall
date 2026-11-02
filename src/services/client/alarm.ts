"use client";
import {
  DEFAULT_ALARM_SOUND,
  alarmCycleSeconds,
  isAlarmSound,
  renderAlarmCycle,
  type AlarmSoundId,
} from "@/lib/alarmSounds";

/**
 * 기사 호출 알람 플레이어 (앱이 화면에 열려 있을 때).
 *
 * - 응답(수락·거절)하거나 호출이 끝날 때까지 소리를 반복하고, 안드로이드는 진동도 반복한다.
 * - 브라우저는 사용자가 화면을 한 번 누르기 전에는 소리를 막는다. 그래서 앱 어디든 처음 누를 때
 *   오디오를 미리 열어 두고, 막혀 있는 동안 호출이 오면 "화면을 누르면 소리가 납니다" 상태를 알린다.
 * - 앱이 닫혀 있거나 화면이 꺼져 있으면 웹앱은 소리를 낼 수 없다 → 그때는 푸시 알림(시스템 소리)이 대신한다.
 */

const STORAGE_KEY = "bosscall.alarmSound";
const VIBRATE_PATTERN = [500, 200, 500, 200, 800];

export interface AlarmState {
  /** 지금 울려야 하는 상태인지 */
  wanted: boolean;
  /** 실제로 소리가 나는 중인지 */
  playing: boolean;
  /** 브라우저가 소리를 막고 있음 (화면을 한 번 눌러야 함) */
  blocked: boolean;
}

type Listener = (s: AlarmState) => void;

let ctx: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let currentSound: AlarmSoundId | null = null;
let vibrateTimer: ReturnType<typeof setInterval> | null = null;
let previewTimer: ReturnType<typeof setTimeout> | null = null;
let installed = false;
let state: AlarmState = { wanted: false, playing: false, blocked: false };
const listeners = new Set<Listener>();
const buffers = new Map<AlarmSoundId, AudioBuffer>();

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
    /* 저장 불가 (사생활 보호 모드 등) — 이번 화면에서만 적용 */
  }
}

function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    typeof window === "undefined"
      ? undefined
      : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  // iPhone: 무음 스위치가 켜져 있어도 알람이 들리게 (Safari 16.4+ 지원 시)
  try {
    const nav = navigator as unknown as { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* 미지원 */
  }
  return ctx;
}

function bufferFor(c: AudioContext, id: AlarmSoundId): AudioBuffer {
  const cached = buffers.get(id);
  if (cached && cached.sampleRate === c.sampleRate) return cached;
  const samples = renderAlarmCycle(id, c.sampleRate);
  const buf = c.createBuffer(1, samples.length, c.sampleRate);
  buf.getChannelData(0).set(samples);
  buffers.set(id, buf);
  return buf;
}

function running(): boolean {
  return ctx?.state === "running";
}

/** 첫 터치 때 오디오를 연다. 막혀 있는 동안 울려야 하면 바로 울린다. */
function unlock(): void {
  const c = audioContext();
  if (!c) return;
  void c
    .resume()
    .then(() => {
      // iOS: 사용자 동작 안에서 아주 짧은 무음을 한 번 재생해야 이후 재생이 허용된다
      try {
        const s = c.createBufferSource();
        s.buffer = c.createBuffer(1, 1, c.sampleRate);
        s.connect(c.destination);
        s.start(0);
      } catch {
        /* 무시 */
      }
      if (state.wanted && !source) startSource(currentSound ?? getAlarmSound());
      emit({ blocked: state.wanted && !running() });
    })
    .catch(() => undefined);
}

/** 앱 시작 시 한 번 호출 — 화면 아무 곳이나 처음 누를 때 오디오를 준비한다 */
export function installAlarmUnlock(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const opts = { capture: true, passive: true } as const;
  for (const ev of ["pointerdown", "touchend", "keydown"]) window.addEventListener(ev, unlock, opts);
  document.addEventListener("visibilitychange", () => {
    // 다른 앱에 다녀오면 iOS가 오디오를 멈춘다 → 돌아왔을 때 다시 울린다
    if (document.visibilityState === "visible" && state.wanted) {
      stopSource();
      void ctx?.resume().then(() => {
        if (state.wanted) startSource(currentSound ?? getAlarmSound());
      });
    }
  });
}

function startSource(id: AlarmSoundId): void {
  const c = audioContext();
  if (!c) return;
  stopSource();
  if (!running()) {
    emit({ playing: false, blocked: true });
    return;
  }
  const s = c.createBufferSource();
  s.buffer = bufferFor(c, id);
  s.loop = true;
  s.connect(c.destination);
  s.start(0);
  source = s;
  currentSound = id;
  emit({ playing: true, blocked: false });
}

function stopSource(): void {
  if (source) {
    try {
      source.stop();
    } catch {
      /* 이미 멈춤 */
    }
    source.disconnect();
    source = null;
  }
  emit({ playing: false });
}

function startVibrate(): void {
  if (vibrateTimer || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  const buzz = () => {
    try {
      navigator.vibrate(VIBRATE_PATTERN);
    } catch {
      /* 미지원 (iPhone) */
    }
  };
  buzz();
  vibrateTimer = setInterval(buzz, 2600);
}

function stopVibrate(): void {
  if (vibrateTimer) clearInterval(vibrateTimer);
  vibrateTimer = null;
  try {
    navigator.vibrate?.(0);
  } catch {
    /* 미지원 */
  }
}

/** 호출 알람 시작 — 응답할 때까지 반복 */
export function startCallAlarm(): void {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = null;
  const id = getAlarmSound();
  if (state.wanted && source && currentSound === id) return;
  currentSound = id;
  emit({ wanted: true });
  audioContext();
  if (ctx && !running()) void ctx.resume().catch(() => undefined); // 이미 허용된 경우엔 바로 열린다
  startSource(id);
  startVibrate();
}

/** 호출 알람 끄기 (응답·취소·시간 초과) */
export function stopCallAlarm(): void {
  emit({ wanted: false, blocked: false });
  stopSource();
  stopVibrate();
}

/** 설정 화면 미리듣기 — 버튼을 누른 동작 안에서 호출되므로 막히지 않는다 */
export function previewAlarm(id: AlarmSoundId): void {
  if (state.wanted) return; // 실제 호출이 울리는 중에는 미리듣기 안 함
  const c = audioContext();
  if (!c) return;
  void c.resume().then(() => {
    startSource(id);
    if (previewTimer) clearTimeout(previewTimer);
    const ms = Math.max(1500, Math.ceil(alarmCycleSeconds(id) * 2) * 1000);
    previewTimer = setTimeout(() => {
      previewTimer = null;
      if (!state.wanted) stopSource();
    }, ms);
  });
}

/* ───────── 누르는 즉시 멈추기 ─────────
 * 수락·거절·확인을 누르면 서버 응답·실시간 반영을 기다리지 않고 바로 소리를 끈다.
 * 같은 호출은 다시 울리지 않는다 (서버 처리가 실패하면 unsilenceCall 로 되돌린다).
 */
const silenced = new Set<string>();

export function silenceCall(callId: string): void {
  silenced.add(callId);
  stopCallAlarm();
  closeCallNotifications(callId);
  emit({});
}

export function unsilenceCall(callId: string): void {
  if (silenced.delete(callId)) emit({});
}

export function isCallSilenced(callId: string): boolean {
  return silenced.has(callId);
}

/** 이 호출의 휴대폰 알림(푸시)도 같이 지운다 */
function closeCallNotifications(callId: string): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.ready
    .then((reg) => reg.getNotifications({ tag: `call-${callId}` }))
    .then((ns) => ns.forEach((n) => n.close()))
    .catch(() => undefined);
}
