import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCALES, pickLocale } from "../src/i18n/core";
import { NAMESPACES, translate } from "../src/i18n/index";
import type { Tri } from "../src/i18n/core";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("모든 문구가 세 언어 모두 비어있지 않음", () => {
  for (const [ns, table] of Object.entries(NAMESPACES)) {
    for (const [key, tri] of Object.entries(table as Record<string, Tri>)) {
      for (const l of LOCALES) assert.ok(tri[l]?.trim(), `${ns}:${key} [${l}] 비어 있음`);
    }
  }
});

test("같은 키가 두 파일에 중복 정의되지 않음", () => {
  const seen = new Map<string, string>();
  for (const [ns, table] of Object.entries(NAMESPACES)) {
    for (const key of Object.keys(table)) {
      assert.ok(!seen.has(key), `${key} 가 ${seen.get(key)} 와 ${ns} 에 중복`);
      seen.set(key, ns);
    }
  }
});

test("언어별 {자리표시자} 가 같음", () => {
  for (const table of Object.values(NAMESPACES)) {
    for (const [key, tri] of Object.entries(table as Record<string, Tri>)) {
      const ko = placeholders(tri.ko);
      assert.deepEqual(placeholders(tri.id), ko, `${key} id`);
      assert.deepEqual(placeholders(tri.en), ko, `${key} en`);
    }
  }
});

test("translate: 자리표시자 · @키 참조 · 모르는 키", () => {
  assert.equal(translate("en", "home.greeting", { name: "Budi" }), "Hello, Budi");
  assert.equal(translate("id", "home.greeting", { name: "Budi" }), "Halo, Budi");
  assert.equal(translate("id", "pay.roundN", { n: 30 }), "30 menit");
  assert.equal(translate("ko", "no.such.key"), "no.such.key");
  // "@키" 는 같은 언어로 번역되어 들어간다
  const inner = translate("id", "settings.language");
  assert.equal(translate("id", "pay.roundN", { n: "@settings.language" }), `${inner} menit`);
});

test("pickLocale", () => {
  assert.equal(pickLocale("id-ID,id;q=0.9"), "id");
  assert.equal(pickLocale("in"), "id");
  assert.equal(pickLocale("ko-KR"), "ko");
  assert.equal(pickLocale("en-US"), "en");
  assert.equal(pickLocale("fr-FR"), "en");
  assert.equal(pickLocale(null, "ko"), "ko");
});
