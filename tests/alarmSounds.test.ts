import { test } from "node:test";
import assert from "node:assert/strict";
import { ALARM_SOUNDS, DEFAULT_ALARM_SOUND, alarmCycleSeconds, isAlarmSound, renderAlarmCycle } from "../src/lib/alarmSounds";

test("기본 알람은 경고음", () => {
  assert.equal(DEFAULT_ALARM_SOUND, "alarm");
  assert.ok(isAlarmSound("ring"));
  assert.ok(!isAlarmSound("siren"));
  assert.ok(!isAlarmSound(null));
});

test("모든 소리: 한 주기 길이·범위·무음 아님", () => {
  for (const id of ALARM_SOUNDS) {
    const sr = 44100;
    const s = renderAlarmCycle(id, sr);
    assert.equal(s.length, Math.round(alarmCycleSeconds(id) * sr), id);
    let peak = 0;
    for (const v of s) {
      assert.ok(Number.isFinite(v), id);
      peak = Math.max(peak, Math.abs(v));
    }
    assert.ok(peak <= 1, `${id} 넘침`);
    assert.ok(peak > 0.2, `${id} 너무 작음`);
    // 반복 이음새가 튀지 않게 시작·끝은 조용해야 한다
    assert.ok(Math.abs(s[0] ?? 0) < 0.01 && Math.abs(s[s.length - 1] ?? 0) < 0.01, `${id} 이음새`);
  }
});

test("경고음은 주기 끝에 쉬는 구간이 있다", () => {
  const sr = 8000;
  const s = renderAlarmCycle("alarm", sr);
  const tail = s.slice(Math.round(1.0 * sr));
  assert.ok(tail.every((v) => v === 0));
});
