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

test("slotLayout: 1~5번 고정 자리, 픽업·목적지는 호출 묶음 우선, 1번 비면 한인업소록", () => {
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
    slotLayout(all, slot, now).map((x) => (x.kind === "paid" ? x.c.id : x.kind));
  assert.deepEqual(show("homeBenefits", 10), ["house", "p2", "empty", "p4", "old"]);
  assert.deepEqual(show("pickup", 10), ["b1", "b2", "empty", "p4", "old"]);
  // b1 이 끝나도 아래 광고가 올라오지 않는다 — 1번은 비면 한인업소록
  assert.deepEqual(show("pickup", 60), ["house", "b2", "empty", "p4", "old"]);
  assert.equal(campaignLabel(all[1]!), "호출 묶음 2");
  assert.equal(campaignLabel(all[4]!), "프리미엄 5");
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
