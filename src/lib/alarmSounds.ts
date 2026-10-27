/**
 * 기사 호출 알람 소리 — 음원 파일 없이 파형을 직접 만든다 (순수 함수, 단위 테스트 대상).
 * 한 주기(cycle)를 만들어 두고 플레이어가 반복 재생한다.
 */

export const ALARM_SOUNDS = ["alarm", "ring", "chime", "beep"] as const;
export type AlarmSoundId = (typeof ALARM_SOUNDS)[number];

/** 기본값: 경고음 */
export const DEFAULT_ALARM_SOUND: AlarmSoundId = "alarm";

export function isAlarmSound(v: unknown): v is AlarmSoundId {
  return typeof v === "string" && (ALARM_SOUNDS as readonly string[]).includes(v);
}

const PEAK = 0.6;

interface Tone {
  /** 시작 시각(초) */
  at: number;
  /** 길이(초) */
  dur: number;
  /** 주파수들 (함께 울림) */
  freqs: number[];
  /** 파형 */
  shape: "sine" | "square" | "bell";
}

interface Pattern {
  /** 한 주기 길이(초) */
  cycle: number;
  tones: Tone[];
}

/** 소리별 한 주기 설계 */
function pattern(id: AlarmSoundId): Pattern {
  switch (id) {
    case "alarm": {
      // 경고음: 높낮이가 번갈아 빠르게 반복 (960Hz ↔ 720Hz) × 4, 짧은 쉼
      const tones: Tone[] = [];
      for (let i = 0; i < 4; i++) {
        tones.push({ at: i * 0.22, dur: 0.18, freqs: [i % 2 === 0 ? 960 : 720], shape: "square" });
      }
      return { cycle: 1.3, tones };
    }
    case "ring":
      // 전화벨: 두 음이 섞인 벨 두 번 울리고 쉼
      return {
        cycle: 2.0,
        tones: [
          { at: 0, dur: 0.4, freqs: [440, 480], shape: "sine" },
          { at: 0.6, dur: 0.4, freqs: [440, 480], shape: "sine" },
        ],
      };
    case "chime":
      // 차임: 미-도-솔-도 아르페지오
      return {
        cycle: 1.8,
        tones: [
          { at: 0, dur: 0.45, freqs: [659.25], shape: "bell" },
          { at: 0.25, dur: 0.45, freqs: [523.25], shape: "bell" },
          { at: 0.5, dur: 0.45, freqs: [783.99], shape: "bell" },
          { at: 0.75, dur: 0.7, freqs: [1046.5], shape: "bell" },
        ],
      };
    case "beep":
      // 삐삐: 짧은 비프 세 번
      return {
        cycle: 1.4,
        tones: [0, 0.22, 0.44].map((at) => ({ at, dur: 0.12, freqs: [1000], shape: "sine" as const })),
      };
  }
}

/** 각진 소리를 귀에 거슬리지 않게: 홀수 배음 3개까지만 더한 사각파 */
function osc(shape: Tone["shape"], phase: number): number {
  const s = Math.sin(phase);
  if (shape === "square") return (s + Math.sin(3 * phase) / 3 + Math.sin(5 * phase) / 5) * 0.85;
  return s;
}

/**
 * 한 주기의 샘플(모노, -1..1). 각 음은 5ms 페이드인·아웃으로 '틱' 소리를 없앤다.
 */
export function renderAlarmCycle(id: AlarmSoundId, sampleRate: number): Float32Array {
  const p = pattern(id);
  const length = Math.max(1, Math.round(p.cycle * sampleRate));
  const out = new Float32Array(length);
  const fade = Math.round(0.005 * sampleRate);

  for (const tone of p.tones) {
    const start = Math.round(tone.at * sampleRate);
    const n = Math.round(tone.dur * sampleRate);
    for (let i = 0; i < n && start + i < length; i++) {
      const t = i / sampleRate;
      let v = 0;
      for (const f of tone.freqs) v += osc(tone.shape, 2 * Math.PI * f * t);
      v /= tone.freqs.length;
      let env = 1;
      if (tone.shape === "bell") env = Math.exp(-4.5 * t); // 종소리처럼 점점 작아짐
      else if (tone.freqs.length > 1) env = 0.75 + 0.25 * Math.sin(2 * Math.PI * 20 * t); // 벨 떨림
      if (i < fade) env *= i / fade;
      if (n - i < fade) env *= (n - i) / fade;
      out[start + i] = (out[start + i] ?? 0) + v * env * PEAK;
    }
  }
  // 겹친 음이 넘치지 않게
  for (let i = 0; i < length; i++) {
    const v = out[i] ?? 0;
    if (v > 1) out[i] = 1;
    else if (v < -1) out[i] = -1;
  }
  return out;
}

/** 한 주기 길이(초) — 미리듣기 시간 계산용 */
export function alarmCycleSeconds(id: AlarmSoundId): number {
  return pattern(id).cycle;
}
