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

/* ───────── iPhone·iPad: <audio> 요소로 재생 ─────────
 * iOS의 Web Audio는 무음 스위치에 묶여 소리가 안 나거나, resume()이 끝나지 않고 멈춰 있는 일이 잦다.
 * <audio> 요소는 무음 스위치와 상관없이 재생되고, 사용자 동작 안에서 한 번 재생해 두면
 * 이후(호출이 왔을 때)에도 동작 없이 다시 재생할 수 있다.
 */
let el: HTMLAudioElement | null = null;
let elUnlocked = false;
const wavUrls = new Map<AlarmSoundId, string>();

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function wavUrl(id: AlarmSoundId): string {
  const hit = wavUrls.get(id);
  if (hit) return hit;
  const rate = 44100;
  const samples = renderAlarmCycle(id, rate);
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, t: string) => {
    for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const x = Math.max(-1, Math.min(1, samples[i] ?? 0));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  const url = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  wavUrls.set(id, url);
  return url;
}

function audioEl(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.loop = true;
    el.preload = "auto";
    el.setAttribute("playsinline", "");
    try {
      // 무음 스위치가 켜져 있어도 알람으로 재생 (지원하는 iOS에서)
      const nav = navigator as unknown as { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = "playback";
    } catch {
      /* 미지원 */
    }
  }
  return el;
}

function setElSound(a: HTMLAudioElement, id: AlarmSoundId): void {
  const url = wavUrl(id);
  if (a.src !== url) a.src = url;
}

/** 사용자 동작 안에서 — 소리 없이 한 번 재생해 두어 나중에 호출이 오면 바로 울리게 한다 */
function unlockEl(): void {
  if (elUnlocked || state.wanted) return;
  const a = audioEl();
  setElSound(a, currentSound ?? getAlarmSound());
  a.muted = true;
  a.play()
    .then(() => {
      if (!state.wanted && !previewTimer) a.pause();
      a.muted = false;
      elUnlocked = true;
    })
    .catch(() => {
      a.muted = false;
    });
}

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
  if (isIOS()) {
    unlockEl();
    if (state.wanted && !state.playing) startSource(currentSound ?? getAlarmSound());
    return;
  }
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
      if (isIOS()) {
        startSource(currentSound ?? getAlarmSound());
        return;
      }
      void ctx?.resume().then(() => {
        if (state.wanted) startSource(currentSound ?? getAlarmSound());
      });
    }
  });
}

function startSource(id: AlarmSoundId): void {
  if (isIOS()) {
    const a = audioEl();
    a.pause();
    setElSound(a, id);
    a.currentTime = 0;
    a.muted = false;
    currentSound = id;
    a.play()
      .then(() => {
        elUnlocked = true;
        emit({ playing: true, blocked: false });
      })
      .catch(() => emit({ playing: false, blocked: true }));
    return;
  }
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
  if (el) el.pause();
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
  if (!isIOS()) {
    audioContext();
    if (ctx && !running()) void ctx.resume().catch(() => undefined); // 이미 허용된 경우엔 바로 열린다
  }
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
  const ms = Math.max(1500, Math.ceil(alarmCycleSeconds(id) * 2) * 1000);
  const stopLater = () => {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      previewTimer = null;
      if (!state.wanted) stopSource();
    }, ms);
  };
  if (isIOS()) {
    // 누른 동작 안에서 바로 play() — promise를 기다렸다 재생하면 iOS가 막는다
    startSource(id);
    stopLater();
    return;
  }
  const c = audioContext();
  if (!c) return;
  if (c.state === "running") {
    startSource(id);
    stopLater();
    return;
  }
  void c.resume().then(() => {
    startSource(id);
    stopLater();
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

/** 사용자가 단추를 누른 그 순간에 부른다 — 호출 소리를 미리 열어 둔다 (출근 단추 등) */
export function primeAlarmAudio(): void {
  unlock();
}
