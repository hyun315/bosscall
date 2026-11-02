import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AD_SLOTS,
  MAX_ADS_PER_SLOT,
  PRODUCT_INFO,
  campaignLabel,
  campaignWindow,
  nextFreeRank,
  placeHref,
  fullSlots,
  jakartaDayStart,
  liveCampaigns,
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

test("fullSlots: 겹치는 기간에 화면당 유료 광고 최대 4곳 (5칸 중 1칸은 한인업소록)", () => {
  assert.equal(MAX_ADS_PER_SLOT, 4);
  const ex = Array.from({ length: MAX_ADS_PER_SLOT }, (_, i) => camp(`c${i}`, ["pickup", "destinationSearch"], 0, 100));
  assert.deepEqual(fullSlots(ex, PRODUCT_INFO.premium.slots, 50, 150), ["pickup", "destinationSearch"]);
  assert.deepEqual(fullSlots(ex, ["homeBenefits"], 50, 150), []);
  // 끝난 직후부터는 비어 있음
  assert.deepEqual(fullSlots(ex, ["pickup"], 100, 200), []);
});

test("liveCampaigns: 지금 기간 안 · 그 자리만 · 고정 순서", () => {
  const all = [camp("b", ["pickup"], 10, 100), camp("a", ["pickup"], 10, 100), camp("x", ["waiting"], 10, 100), camp("f", ["pickup"], 60, 100)];
  assert.deepEqual(liveCampaigns(all, "pickup", 50).map((c) => c.id), ["a", "b"]);
  assert.deepEqual(liveCampaigns(all, "pickup", 100), []);
});

test("liveCampaigns: 프리미엄 1~5 → 호출 묶음 1~5, 최대 4곳", () => {
  const P = PRODUCT_INFO.premium.slots;
  const B = PRODUCT_INFO.callBundle.slots;
  const all = [
    { ...camp("b1", [...B], 0, 100), product: "callBundle" as const, rank: 1 },
    { ...camp("p3", [...P], 0, 100), product: "premium" as const, rank: 3 },
    { ...camp("p1", [...P], 0, 100), product: "premium" as const, rank: 1 },
    { ...camp("b2", [...B], 0, 100), product: "callBundle" as const, rank: 2 },
    { ...camp("b3", [...B], 0, 100), product: "callBundle" as const, rank: 3 },
    camp("old", [...P], 0, 100), // 예전 광고: 4곳이면 프리미엄, 순번 없으면 5
  ];
  assert.deepEqual(liveCampaigns(all, "pickup", 50).map((c) => c.id), ["p1", "p3", "old", "b1"]);
  assert.deepEqual(liveCampaigns(all, "homeBenefits", 50).map((c) => c.id), ["p1", "p3", "old"]);
  assert.equal(campaignLabel(all[0]!), "호출 묶음 1");
  assert.equal(campaignLabel(all[5]!), "프리미엄 5");
  // 같은 상품·겹치는 기간의 빈 순번
  assert.equal(nextFreeRank(all, "premium", 0, 100), 2);
  assert.equal(nextFreeRank(all, "callBundle", 0, 100), 4);
  assert.equal(nextFreeRank(all, "premium", 100, 200), 1);
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
