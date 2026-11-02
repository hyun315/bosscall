import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AD_SLOTS,
  PRODUCT_INFO,
  campaignLabel,
  campaignWindow,
  nextFreeRank,
  placeHref,
  jakartaDayStart,
  rankTaken,
  slotLayout,
  simpleLayout,
  overlappingCount,
  SCREEN_CAP,
  type AdCampaignDoc,
} from "../src/lib/ads";
import { jpegSize } from "../src/lib/jpeg";

const H = 3600_000;

test("상품 구성: 프리미엄 4곳, 호출 묶음 2곳, 모두 실제 광고 자리", () => {
  assert.deepEqual([...PRODUCT_INFO.premium.slots].sort(), [...AD_SLOTS].sort());
  assert.deepEqual([...PRODUCT_INFO.callBundle.slots], ["pickup", "destinationSearch"]);
});

test("jakartaDayStart / campaignWindow: 자카르타 0시, 월말 보정", () => {
  assert.equal(jakartaDayStart("2026-11-05"), Date.UTC(2026, 10, 4, 17));
  assert.equal(jakartaDayStart("2026/11/05"), null);
  const w = campaignWindow("2026-11-05", 3)!;
  assert.equal(w.startAt, Date.UTC(2026, 10, 4, 17));
  assert.equal(w.endAt, Date.UTC(2027, 1, 4, 17)); // 2027-02-05 0시 WIB
  // 1월 31일 + 1개월 → 2월 28일
  assert.equal(campaignWindow("2027-01-31", 1)!.endAt, Date.UTC(2027, 1, 28) - 7 * H);
  // 연도 넘김
  assert.equal(campaignWindow("2026-12-15", 1)!.endAt, Date.UTC(2027, 0, 15) - 7 * H);
});

const camp = (id: string, slots: AdCampaignDoc["slots"], startAt: number, endAt: number): AdCampaignDoc => ({
  id,
  requestId: id,
  company: id,
  slots,
  startAt,
  endAt,
  bannerUrl: "",
  detailUrl: "",
  linkUrl: null,
  createdAt: 0,
});

test("slotLayout: 홈은 프리미엄 고정 자리, 픽업·목적지는 호출 묶음 자리 → 그 아래 프리미엄 자동", () => {
  const P = PRODUCT_INFO.premium.slots;
  const B = PRODUCT_INFO.callBundle.slots;
  const all = [
    { ...camp("p2", [...P], 0, 100), product: "premium" as const, rank: 2 },
    { ...camp("b2", [...B], 0, 100), product: "callBundle" as const, rank: 2 },
    { ...camp("p4", [...P], 0, 100), product: "premium" as const, rank: 4 },
    { ...camp("b1", [...B], 0, 50), product: "callBundle" as const, rank: 1 }, // 50에 끝남
    camp("old", [...P], 0, 100), // 예전 광고: 4곳이면 프리미엄, 번호 없으면 5
  ];
  const show = (slot: "pickup" | "homeBenefits", now: number) =>
    slotLayout(all, slot, now).map((x) => (x.kind === "paid" ? x.c.id : x.kind === "empty" ? `e${x.n}` : x.kind));
  // 홈: 프리미엄 N 이 N번, 끝난 자리·빈 자리는 빈칸 그대로
  assert.deepEqual(show("homeBenefits", 10), ["house", "p2", "e3", "p4", "old"]);
  // 픽업: 호출 묶음 1·2 → 프리미엄 번호순 (5칸이 넘으면 빈 자리 안내 없음)
  assert.deepEqual(show("pickup", 10), ["b1", "b2", "p2", "p4", "old"]);
  // b1 이 끝나도 b2 는 2번 자리 그대로 — 1번은 한인업소록
  assert.deepEqual(show("pickup", 60), ["house", "b2", "p2", "p4", "old"]);
  // 호출 묶음이 없으면: 한인업소록 → 프리미엄 → 남은 자리 안내 (5칸까지)
  const onlyP = all.filter((c) => c.id === "p2");
  assert.deepEqual(
    slotLayout(onlyP, "pickup", 10).map((x) => (x.kind === "paid" ? x.c.id : x.kind === "empty" ? `e${x.n}` : x.kind)),
    ["house", "p2", "e2", "e3", "e4"],
  );
  // 호출 묶음 3번만 있으면 1·2번 자리는 비어 있는 채로 유지
  const b3 = [{ ...camp("b3", [...B], 0, 100), product: "callBundle" as const, rank: 3 }];
  assert.deepEqual(
    slotLayout(b3, "pickup", 10).map((x) => (x.kind === "paid" ? x.c.id : x.kind === "empty" ? `e${x.n}` : x.kind)),
    ["house", "e2", "b3", "e4", "e5"],
  );
  assert.equal(campaignLabel(all[1]!), "호출 묶음 2");
  assert.equal(campaignLabel(all[4]!), `${PRODUCT_INFO.premium.name} 5`);
});

test("rankTaken / nextFreeRank: 같은 상품·같은 번호·겹치는 기간만", () => {
  const P = PRODUCT_INFO.premium.slots;
  const all = [
    { ...camp("p1", [...P], 0, 100), product: "premium" as const, rank: 1 },
    { ...camp("p2", [...P], 0, 100), product: "premium" as const, rank: 2 },
  ];
  assert.equal(rankTaken(all, "premium", 1, 50, 150)?.id, "p1");
  assert.equal(rankTaken(all, "premium", 1, 100, 200), null);
  assert.equal(rankTaken(all, "callBundle", 1, 50, 150), null);
  assert.equal(rankTaken(all, "premium", 1, 50, 150, "p1"), null);
  assert.equal(nextFreeRank(all, "premium", 0, 100), 3);
  assert.equal(nextFreeRank(all, "callBundle", 0, 100), 1);
});

test("jpegSize: SOF 에서 가로·세로", () => {
  // SOI, APP0(길이 16), SOF0(길이 17: 정밀도 8, 높이 400, 가로 1200)
  const app0 = [0xff, 0xe0, 0x00, 0x10, ...new Array(14).fill(0)];
  const sof0 = [0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x90, 0x04, 0xb0, ...new Array(10).fill(0)];
  assert.deepEqual(jpegSize(Buffer.from([0xff, 0xd8, ...app0, ...sof0])), { w: 1200, h: 400 });
  assert.equal(jpegSize(Buffer.from([0x89, 0x50, 0x4e, 0x47])), null);
});

test("placeHref: 출발지·목적지 /call/new 주소", () => {
  const p = { name: "서울 가든", address: "Jl. Senopati 1", placeId: "ChIJabc_123" };
  const d = new URL(placeHref(p, "destination"), "https://x.test");
  assert.equal(d.pathname, "/call/new");
  assert.equal(d.searchParams.get("dest"), "서울 가든");
  assert.equal(d.searchParams.get("destPlaceId"), "ChIJabc_123");
  const k = new URL(placeHref(p, "pickup"), "https://x.test");
  assert.equal(k.searchParams.get("pickPlaceId"), "ChIJabc_123");
  assert.equal(k.searchParams.get("dest"), null);
});

test("simpleLayout: 한인업소록 → 선착순, 칸 수 제한, 넘치면 돌아가며, 남으면 안내 1칸", () => {
  const mk = (id: string, createdAt: number, slots: AdCampaignDoc["slots"] = [...PRODUCT_INFO.premium.slots]) => ({
    ...camp(id, slots, 0, 100),
    createdAt,
  });
  const ids = (cells: ReturnType<typeof simpleLayout>) => cells.map((x) => (x.kind === "paid" ? x.c.id : x.kind));
  assert.equal(SCREEN_CAP.homeBenefits, 3);
  assert.equal(SCREEN_CAP.pickup, 2);
  // 광고 없음
  assert.deepEqual(ids(simpleLayout([], "homeBenefits", 10, 0)), ["house", "empty"]);
  assert.deepEqual(ids(simpleLayout([], "pickup", 10, 0)), ["house", "empty"]);
  // 1곳: 홈은 칸이 남아 안내, 픽업은 꽉 참. 호출 묶음으로 올렸던 광고도 홈에 나온다
  const one = [mk("a", 1, [...PRODUCT_INFO.callBundle.slots])];
  assert.deepEqual(ids(simpleLayout(one, "homeBenefits", 10, 0)), ["house", "a", "empty"]);
  assert.deepEqual(ids(simpleLayout(one, "pickup", 10, 0)), ["house", "a"]);
  // 3곳 (선착순 a, b, c): 홈 2칸, 픽업 1칸 — seed 로 시작점만 돈다
  const three = [mk("c", 3), mk("a", 1), mk("b", 2)];
  assert.deepEqual(ids(simpleLayout(three, "homeBenefits", 10, 0)), ["house", "a", "b"]);
  assert.deepEqual(ids(simpleLayout(three, "homeBenefits", 10, 2)), ["house", "c", "a"]);
  assert.deepEqual(ids(simpleLayout(three, "pickup", 10, 1)), ["house", "b"]);
  // 끝난 광고는 빠진다
  assert.deepEqual(ids(simpleLayout(three, "homeBenefits", 100, 0)), ["house", "empty"]);
  assert.equal(overlappingCount(three, 50, 150), 3);
  assert.equal(overlappingCount(three, 50, 150, "a"), 2);
  assert.equal(overlappingCount(three, 100, 150), 0);
});
