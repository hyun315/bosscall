/**
 * Firestore 보안 규칙 테스트 (명세 §29 보안 인수 기준)
 * 실행: npm run test:rules   (Java 11+ 필요, Firebase 에뮬레이터 자동 실행)
 */
import { after, before, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, collection, setDoc, updateDoc } from "firebase/firestore";

let env: RulesTestEnvironment;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "bosscall-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    // Group A: owner-a, member-a, driver-a  /  Group B: owner-b, driver-b
    await setDoc(doc(db, "groups/A"), { id: "A", name: "Yang Family", ownerId: "owner-a" });
    await setDoc(doc(db, "groups/A/members/owner-a"), { role: "OWNER", userId: "owner-a" });
    await setDoc(doc(db, "groups/A/members/member-a"), { role: "MEMBER", userId: "member-a" });
    await setDoc(doc(db, "groups/A/members/driver-a"), { role: "DRIVER", userId: "driver-a", driverId: "d1" });
    await setDoc(doc(db, "groups/A/drivers/d1"), { id: "d1", status: "ON_DUTY" });
    await setDoc(doc(db, "groups/A/calls/c1"), { id: "c1", status: "CALLING", driverId: "d1", callerId: "member-a" });
    await setDoc(doc(db, "groups/A/calls/c1/events/e1"), { eventType: "CREATED" });
    await setDoc(doc(db, "groups/A/auditLogs/l1"), { action: "X" });
    await setDoc(doc(db, "groups/B"), { id: "B", name: "Other", ownerId: "owner-b" });
    await setDoc(doc(db, "groups/B/members/owner-b"), { role: "OWNER", userId: "owner-b" });
    await setDoc(doc(db, "groups/B/members/driver-b"), { role: "DRIVER", userId: "driver-b", driverId: "d2" });
    await setDoc(doc(db, "groups/B/calls/c2"), { id: "c2", status: "CALLING", driverId: "d2" });
    await setDoc(doc(db, "users/member-a"), { id: "member-a" });
    await setDoc(doc(db, "invites/CODE"), { groupId: "A" });
    await setDoc(doc(db, "groups/A/members/driver-a2"), { role: "DRIVER", userId: "driver-a2", driverId: "d3" });
    await setDoc(doc(db, "groups/A/driverLocations/d1"), { driverId: "d1", lat: -6.2, lng: 106.8 });
    await setDoc(doc(db, "groups/A/payrollSettings/d1"), { driverId: "d1", monthlyBase: 5000000, shareWithDriver: true });
    await setDoc(doc(db, "groups/A/payrollSettings/d3"), { driverId: "d3", monthlyBase: 4000000, shareWithDriver: false });
  });
});

const as = (uid: string) => env.authenticatedContext(uid).firestore();

test("구성원은 자기 그룹의 호출·기사·이벤트를 읽을 수 있다", async () => {
  await assertSucceeds(getDoc(doc(as("member-a"), "groups/A/calls/c1")));
  await assertSucceeds(getDoc(doc(as("driver-a"), "groups/A/calls/c1")));
  await assertSucceeds(getDocs(collection(as("owner-a"), "groups/A/calls/c1/events")));
  await assertSucceeds(getDoc(doc(as("member-a"), "groups/A/drivers/d1")));
});

test("다른 Group 데이터 접근 불가", async () => {
  await assertFails(getDoc(doc(as("owner-a"), "groups/B")));
  await assertFails(getDoc(doc(as("member-a"), "groups/B/calls/c2")));
  await assertFails(getDocs(collection(as("owner-a"), "groups/B/calls")));
});

test("Driver가 다른 Group의 호출 조회 불가", async () => {
  await assertFails(getDoc(doc(as("driver-a"), "groups/B/calls/c2")));
  await assertFails(getDoc(doc(as("driver-b"), "groups/A/calls/c1")));
});

test("비로그인 사용자는 아무것도 읽을 수 없다", async () => {
  const anon = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anon, "groups/A")));
  await assertFails(getDoc(doc(anon, "groups/A/calls/c1")));
});

test("클라이언트는 호출 상태를 직접 바꿀 수 없다 (서버만 변경)", async () => {
  await assertFails(updateDoc(doc(as("driver-a"), "groups/A/calls/c1"), { status: "ACCEPTED" }));
  await assertFails(updateDoc(doc(as("owner-a"), "groups/A/calls/c1"), { status: "CANCELLED" }));
  await assertFails(setDoc(doc(as("owner-a"), "groups/A/calls/c9"), { status: "CALLING" }));
  await assertFails(setDoc(doc(as("owner-a"), "groups/A/calls/c1/events/e9"), { eventType: "X" }));
});

test("일반 Member가 Owner-only 데이터(설정·구성원·감사로그) 변경/조회 불가", async () => {
  await assertFails(updateDoc(doc(as("member-a"), "groups/A"), { name: "hacked" }));
  await assertFails(setDoc(doc(as("member-a"), "groups/A/members/member-a"), { role: "OWNER" }));
  await assertFails(getDoc(doc(as("member-a"), "groups/A/auditLogs/l1")));
  await assertSucceeds(getDoc(doc(as("owner-a"), "groups/A/auditLogs/l1")));
});

test("자기 자신을 다른 그룹 구성원으로 추가할 수 없다", async () => {
  await assertFails(setDoc(doc(as("owner-a"), "groups/B/members/owner-a"), { role: "OWNER" }));
});

test("사용자 문서는 본인만 읽고, 초대/기타 경로는 서버 전용", async () => {
  await assertSucceeds(getDoc(doc(as("member-a"), "users/member-a")));
  await assertFails(getDoc(doc(as("owner-a"), "users/member-a")));
  await assertFails(getDoc(doc(as("owner-a"), "invites/CODE")));
  await assertFails(getDocs(collection(as("owner-a"), "analyticsEvents")));
});

test("기사 위치: 관리자·가족·본인만 읽기, 다른 기사·다른 그룹 불가, 쓰기는 서버만", async () => {
  await assertSucceeds(getDoc(doc(as("owner-a"), "groups/A/driverLocations/d1")));
  await assertSucceeds(getDoc(doc(as("member-a"), "groups/A/driverLocations/d1")));
  await assertSucceeds(getDoc(doc(as("driver-a"), "groups/A/driverLocations/d1")));
  await assertFails(getDoc(doc(as("driver-a2"), "groups/A/driverLocations/d1")));
  await assertFails(getDoc(doc(as("owner-b"), "groups/A/driverLocations/d1")));
  await assertFails(setDoc(doc(as("driver-a"), "groups/A/driverLocations/d1"), { lat: 0, lng: 0 }));
});

test("급여 조건: 관리자·(공개 시) 기사 본인만, 가족·다른 기사·비공개는 불가", async () => {
  await assertSucceeds(getDoc(doc(as("owner-a"), "groups/A/payrollSettings/d1")));
  await assertSucceeds(getDoc(doc(as("driver-a"), "groups/A/payrollSettings/d1")));
  await assertFails(getDoc(doc(as("member-a"), "groups/A/payrollSettings/d1")));
  await assertFails(getDoc(doc(as("driver-a2"), "groups/A/payrollSettings/d1")));
  await assertFails(getDoc(doc(as("driver-a2"), "groups/A/payrollSettings/d3")));
  await assertSucceeds(getDoc(doc(as("owner-a"), "groups/A/payrollSettings/d3")));
  await assertFails(setDoc(doc(as("owner-a"), "groups/A/payrollSettings/d1"), { monthlyBase: 1 }));
});

test("익명 통계·맞춤 혜택·자체 장소·동의 이력: 본인 것이라도 클라이언트 접근 불가", async () => {
  await assertFails(getDocs(collection(as("owner-a"), "tripStats")));
  await assertFails(getDoc(doc(as("member-a"), "adProfiles/member-a")));
  await assertFails(getDocs(collection(as("owner-a"), "pois")));
  await assertFails(getDocs(collection(as("member-a"), "users/member-a/consentLog")));
  await assertFails(setDoc(doc(as("member-a"), "adProfiles/member-a"), { categoryCounts: {} }));
});
