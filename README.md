# BossCall 2.0

> 내 기사, 한 번에 호출. — 개인 기사를 쓰는 가족·소규모 조직을 위한 Driver Management System

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS · Firebase (Auth · Firestore · Cloud Messaging) · Google Maps Platform · Vercel

---

## 1. 구조 한눈에 보기

```
브라우저(PWA) ──읽기(실시간 구독)──▶ Firestore  ◀──쓰기(Admin SDK)── Vercel API (/api/*)
      │                                              ▲
      └────────── 모든 변경 요청 (ID 토큰) ───────────┘
```

- **클라이언트는 읽기만** 합니다. 호출 생성·상태 변경·출퇴근·초대 등 모든 쓰기는 서버 API가 권한과 상태머신을 검증한 뒤 수행합니다 (명세 §7, §27-4~8).
- **call.status 가 단일 진실 공급원**입니다. 화면은 Firestore 실시간 구독 결과만 보여줍니다.
- 모든 상태 변경은 `groups/{groupId}/calls/{callId}/events` 에 append-only 로 남습니다 (call_events).
- 모든 업무 데이터는 `groups/{groupId}/…` 아래에 있어 그룹(tenant) 단위로 격리됩니다. 보안 규칙: `firestore.rules`.

| 폴더 | 내용 |
|---|---|
| `src/app/(app)/*` | 로그인·그룹 소속이 필요한 화면 (홈·호출·기록·기사·설정) |
| `src/app/api/*` | 서버 API (Firebase Admin) |
| `src/services/server` | 서버 비즈니스 로직 (호출·근무·그룹·즐겨찾기) |
| `src/services/client` | 클라이언트 API 호출·위치·푸시 |
| `src/lib/callStateMachine.ts` | 호출 상태머신 (순수 함수, 단위 테스트 포함) |
| `src/components` | 공통/호출/기사/위치/근무 컴포넌트 (명세 §18) |
| `src/lib/tripData.ts` | 출발지·목적지 데이터 활용 규칙 (좌표 출처·분류·익명 통계·리포트) |
| `src/i18n/messages/*.ts` | 화면 문구 — 한국어·인도네시아어·영어를 한 줄에 나란히 |
| `public/firebase-messaging-sw.js` | 푸시 수신 서비스워커 |

## 2. 준비물

- Firebase 프로젝트 1개 (Blaze 요금제 **불필요** — Cloud Functions를 쓰지 않습니다)
- Google Cloud 결제 계정 (Google Maps Platform 필수)
- GitHub 저장소 + Vercel 계정

## 3. Firebase 설정

1. [Firebase 콘솔](https://console.firebase.google.com) › 프로젝트 만들기
2. **Authentication** › 로그인 방법 › **Google** 사용 설정
3. Authentication › 설정 › **승인된 도메인**에 Vercel 도메인 추가 (예: `bosscall.vercel.app`)
4. **Firestore Database** › 데이터베이스 만들기 › 위치 **asia-southeast2 (Jakarta)** 권장 › 프로덕션 모드
5. Firestore › **규칙** 탭에 이 저장소의 `firestore.rules` 내용을 그대로 붙여넣고 게시
   (별도 색인 배포는 필요 없습니다. 콘솔에 색인 생성 링크가 뜨면 눌러 주세요.)
6. (선택) Firestore › **TTL** › 컬렉션 그룹 `rateLimits`, 필드 `expireAt` 추가 — 레이트리밋 카운터 자동 삭제
7. 프로젝트 설정 › 일반 › 내 앱 › **웹 앱 추가** → 표시되는 설정값을 `NEXT_PUBLIC_FIREBASE_*` 에 사용
8. 프로젝트 설정 › **클라우드 메시징** › 웹 푸시 인증서 › **키 쌍 생성** → `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
9. 프로젝트 설정 › **서비스 계정** › 새 비공개 키 생성 → JSON 의 `project_id`, `client_email`, `private_key` 를 서버 환경변수로 사용 (파일은 저장소에 올리지 마세요)

> **iPhone 로그인 안정화**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` 을 `xxx.firebaseapp.com` 이 아니라 **앱 도메인**(예: `bosscall.vercel.app`)으로 설정하세요. `next.config.mjs` 가 `/__/auth/*` 를 Firebase로 프록시합니다. 그리고 Google Cloud 콘솔 › API 및 서비스 › 사용자 인증 정보 › *Web client (auto created by Google Service)* 의 **승인된 리디렉션 URI** 에 `https://bosscall.vercel.app/__/auth/handler` 를 추가합니다.

## 4. Google Maps Platform 설정 (명세 §34 — 필수)

[Google Cloud 콘솔](https://console.cloud.google.com) (Firebase와 같은 프로젝트 사용 가능)

1. **API 사용 설정**: Maps JavaScript API · Places API (New) · Geocoding API · (향후) Routes API
2. **Key 2개 발급** (명세 §34.4)

| Key | 환경변수 | 애플리케이션 제한 | API 제한 |
|---|---|---|---|
| 브라우저용 | `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | 웹사이트: `https://bosscall.vercel.app/*`, (개발) `http://localhost:3000/*` | Maps JavaScript API, Places API (New) |
| 서버용 | `GOOGLE_MAPS_SERVER_KEY` | 없음 (Vercel IP는 고정이 아님) | Geocoding API **만** |

3. **결제 › 예산 및 알림**: 월 예산(예: $50)과 50/90/100% 알림 설정 (§34.5)
4. API 및 서비스 › 할당량에서 Places·Geocoding 일일 한도를 낮게 걸어두면 비용 폭주를 막을 수 있습니다.
5. 개발/운영 Key 분리를 권장합니다 — Vercel 환경변수를 Preview/Production 별로 다르게 넣으면 됩니다.

비용 절감 설계: 자동완성은 350ms 디바운스 + 세션 토큰(입력~선택을 1세션으로 과금), 지도 이동 시 역지오코딩은 멈춘 뒤 0.7초 후 1회만, 사용량은 Firestore `usageDaily/{날짜}` 에 일별 집계됩니다.

## 5. Vercel 배포

1. 이 폴더를 GitHub 저장소에 올립니다 (`.env*` 는 `.gitignore` 로 제외됨)
2. Vercel › Add New Project › 저장소 Import (Framework: Next.js 자동 인식)
3. Settings › Environment Variables 에 `.env.example` 의 모든 항목 입력
   - `FIREBASE_PRIVATE_KEY` 는 JSON의 값을 그대로 붙여넣으면 됩니다 (`\n` 포함 그대로 OK)
   - `NEXT_PUBLIC_APP_URL` = 실제 배포 주소
4. Deploy

로컬 개발 (PC가 있을 때): `cp .env.example .env.local` → 값 입력 → `npm install && npm run dev`

## 6. 첫 사용 흐름 (명세 §20 — 목표 3분)

1. 사장님: 앱 접속 → Google로 계속 → 가족 이름·기사 이름 입력 → **시작하기**
2. 화면의 **WhatsApp** 버튼으로 기사님께 초대 링크 전송
3. 기사님: 링크 열기 → Google로 계속 → **연결하기** → 알림 켜기 → **출근하기**
4. 사장님: 홈 › **🚗 기사 호출** → 픽업(현재 위치/즐겨찾기/최근/지도/검색) → 목적지 → **기사 호출**
5. 가족 초대: 설정 › 가족 구성원 › **+ 가족 초대**

> iPhone은 Safari 공유 버튼 › **홈 화면에 추가** 로 설치한 앱에서만 푸시 알림이 동작합니다 (iOS 16.4+).

## 7. 테스트

```bash
npm test          # 상태머신·검증·시간·위치 전송·급여 계산·다국어·데이터 활용 단위 테스트 (49개)
npm run test:rules  # Firestore 보안규칙 테스트 — Java 11+ 필요, 에뮬레이터 자동 실행
npm run typecheck
```

### 실기기 푸시 테스트 매트릭스 (명세 §14 — 반드시 실제 기기에서)

| 환경 | 화면 켜짐 | 화면 잠금 | 백그라운드 | 앱 종료 | 권한 거부 |
|---|---|---|---|---|---|
| iOS 홈 화면 PWA | ☐ | ☐ | ☐ | ☐ | ☐ |
| iOS Safari 탭 (푸시 불가 안내 확인) | ☐ | — | — | — | — |
| Android Chrome PWA | ☐ | ☐ | ☐ | ☐ | ☐ |
| Android Chrome 탭 | ☐ | ☐ | ☐ | ☐ | ☐ |

앱이 열려 있으면 푸시와 별개로 Firestore 실시간 구독으로 호출이 즉시 표시됩니다(기사 화면 자동 전환 + 진동).

### 자카르타 지도 테스트 (명세 §34.6)

☐ 현재 위치 표시 ☐ 주요 장소 검색 (Grand Indonesia, SCBD, Pacific Place) ☐ 자동완성 ☐ 선택 후 좌표·주소·Place ID 저장 (Firestore에서 확인) ☐ 지도에서 픽업 선택 ☐ 위치 권한 거부 → 지도 선택 안내 ☐ GPS 오차 100m 초과 → "지도에서 수정" 안내 ☐ 없는 장소 검색 → 안내 문구 ☐ 비행기 모드 → 네트워크 오류 ☐ 브라우저 Key 리퍼러 제한 불일치 → "Key 설정 확인" 안내

## 8. 명세 대비 해석·결정 사항

| 항목 | 구현 | 비고 |
|---|---|---|
| 기존 코드 | 새 프로젝트로 작성 | 기존 BossCall 코드·데이터 이관은 하지 않음 |
| 백엔드 | Firebase 유지 (Supabase 대신) | 명세 §25 "기존 스택 유지" 원칙. PostgreSQL RLS 대신 Firestore 규칙 + 서버 API 검증 |
| 인증 | Google 로그인 | 명세 S02의 전화/이메일 OTP 대신 선택 |
| RECEIVED 상태 | 기사 앱이 호출을 화면에 띄우는 순간 서버에 기록 | "전달됐는지 추측하지 않는다" (§0.3) |
| RECEIVED → 거절/취소/타임아웃 | 허용 | 명세 예외 목록엔 CALLING만 있으나, 막으면 기사가 화면을 연 뒤 거절이 불가능 |
| ON_THE_WAY 이후 취소 | 불가 | 명세 예외 목록 그대로 (필요 시 정책 결정) |
| 타임아웃 | 기본 90초 (`CALL_TIMEOUT_SECONDS`) | 초 단위 스케줄러 없이, 카운트다운 종료·새 호출·퇴근 시 **서버가 만료 시각을 재검증**해 전이 |
| 동시 호출 | 기사 1명당 진행 중 호출 1건 | 가족 두 명이 동시에 부르면 두 번째는 "이미 진행 중" 안내 |
| 무료 요금제 가족 수 | **5명(임시값)** | 명세 §22에 숫자가 없음 → `src/lib/permissions.ts` 에서 변경 |
| 목적지 | 필수 | 명세 C02 기준 |
| 운행 중 출퇴근 | 진행 중 호출이 있으면 퇴근 불가 | 관리자는 근무기록 수정으로 마감 가능 (감사 로그) |
| 호출 탭 수 | 홈 CTA → 픽업 → 목적지 → 확인 (4탭) | 확인 화면(C03)을 명세대로 유지. §29 "3탭 이내 호출 시작"은 호출 흐름 진입 기준으로 해석 |

## 9. 기사 위치 공유 (명세 §30에서 제외했던 기능 — 사장님 요청으로 추가)

- **언제**: 기사가 출근할 때 "위치 공유하고 출근 / 공유 없이 출근" 중 직접 선택. 근무 중에도 홈에서 끄고 켤 수 있음
- **무엇을**: 최신 위치 1건만 `groups/{groupId}/driverLocations/{driverId}` 에 덮어씀. **이동 경로는 저장하지 않음**
- **얼마나 자주**: 1분마다, 또는 100m 이상 이동 시 (최소 20초 간격, 오차 1km 초과 위치는 버림)
- **삭제**: 퇴근·공유 끄기·관리자 근무 마감·기사 연결 해제 시 즉시 삭제
- **누가 봄**: 관리자·가족 + 기사 본인 (다른 기사·다른 그룹 불가 — `firestore.rules`)
- **어디서 봄**: 홈 "📍 기사 위치 보기", 기사 상세 상단 지도, 호출 화면(수락~운행 중)
- **동의 기록**: 처음 공유에 동의한 시각을 `drivers.locationConsentAt` 에, 켜기/끄기는 감사 로그에 남김

> ⚠ **웹앱의 한계**: 기사 폰에서 BossCall이 **화면에 열려 있을 때만** 위치가 전송됩니다. 화면이 꺼지거나 다른 앱(예: Google 지도 길안내)으로 넘어가면 전송이 멈추고, 관리자 화면에는 "⚠ 12분 전 위치"처럼 오래된 위치로 표시됩니다. 화면이 꺼져도 계속 보내려면 Capacitor 등 네이티브 앱 래핑(명세 §14 2차)이 필요합니다.
>
> 인도네시아 개인정보보호법(UU PDP)상 위치는 개인정보입니다. 고용계약·근무수칙에 근무 중 위치 공유를 명시하고 기사님께 설명하는 것을 권장합니다 (법률 자문은 아님).

실기기 확인: ☐ 출근 시 위치 권한 요청 ☐ 관리자 지도에 1분 내 표시 ☐ 100m 이동 시 갱신 ☐ 기사 화면 끄면 5분 후 "오래된 위치" 경고 ☐ 공유 끄기 → 관리자 화면 즉시 "공유 꺼짐" ☐ 퇴근 → 위치 삭제 확인 (Firestore)

## 10. 급여 계산 (보스첵 요구사항을 BossCall에 통합)

- **어디서**: 기사 › (기사 선택) › **급여** 탭 — 관리자(Owner)만. 가족은 급여를 볼 수 없음
- **조건 설정**: 월 기본급(Rp) · 시간외 수당(시간당 Rp) · 하루 기본 근무시간 · 근무 요일 · 시간외 계산 단위(1/15/30/60분 내림) · 기사에게 공개 여부
- **계산**: 급여 = 기본급 + 시간외 합계 × 시간당 수당
  - 근무일: 하루 근무 합계 중 기본 근무시간 초과분이 시간외 (같은 날 여러 번 출퇴근은 합산)
  - 쉬는 요일 근무: 전부 시간외
  - 자정을 넘는 근무는 출근한 날짜로, 근무 중인 기록은 현재 시각까지 계산 ("금액이 바뀔 수 있음" 표시)
- **화면**: 월 이동(‹ 2026년 9월 ›), 예상 급여 합계, 기본급/시간외/근무일 요약, 날짜별 출퇴근·시간외 표
- **명세 보내기**: 인도네시아어 급여명세(Slip Gaji)를 WhatsApp으로 바로 전송 또는 복사
- **양방향 입력**: 기사는 출근/퇴근 버튼, 관리자는 근무기록 수정 + **근무기록 추가**(기사가 누르지 못한 날, 겹침 자동 검사). 모든 변경은 감사 로그
- **기사 화면**: 관리자가 공개하면 기사 앱 ‘기록 › 급여’ 탭에서 본인 내역만 확인 (보안 규칙으로 강제)
- **저장 위치**: `groups/{groupId}/payrollSettings/{driverId}` — 급여명세는 저장하지 않고 근무기록에서 매번 계산

> 계산은 사장님이 정한 조건에 따른 참고용입니다. 인도네시아 법정 시간외 수당(월급 ÷ 173 기준, 1시간째 1.5배·이후 2배 등)과 다를 수 있으니 계약 조건과 맞춰 설정하세요. 명세서 §22는 급여 계산을 Premium 기능으로 두었지만, 요금제가 아직 없어 모든 그룹에 열어 두었습니다.

## 11. 언어 설정 (한국어 · Bahasa Indonesia · English)

- **바꾸는 곳**: 로그인 화면 하단 · 온보딩 첫 단계 · 초대 수락 화면 · 설정 › 언어(계정) · 기사 프로필
- **우선순위**: 계정에 저장된 언어 → 이 기기에서 고른 언어 → 휴대폰 언어(id/in → 인니어, ko → 한국어, 그 외 영어)
- **계정에 저장**: 로그인 상태에서 바꾸면 `users/{uid}.locale` 에 저장되어 다른 기기에서도 같은 언어
- **서버 오류 메시지**: 서버는 문구 대신 키를 돌려주고, 요청 헤더 `X-BossCall-Locale` 언어로 번역
- **푸시 알림**: 받는 사람 각자의 언어로 전송 (사장님은 한국어, 기사는 인니어 등)
- **그대로 두는 것**: 급여명세(Slip Gaji)는 기사용이라 항상 인도네시아어, Google 주소·장소명은 현지 표기, 기사 초대 메시지는 관리자 언어 + 인니어 안내 병기
- **문구 추가·수정**: `src/i18n/messages/<영역>.ts` 한 곳만 고치면 됩니다. 세 언어 중 하나라도 빠지면 타입 오류, `tests/i18n.test.ts` 가 빈 문구·중복 키·`{자리표시자}` 불일치를 검사

## 12. 출발지·목적지 데이터 활용 기초 (광고·통계 사업 대비)

지금은 **쌓는 방식**만 갖춰 두었습니다. 광고 화면·제휴 기능은 아직 없습니다.

| 무엇 | 어떻게 |
|---|---|
| **선택 동의 2가지** | 사장님·가족이 처음 앱을 열 때 한 번 묻습니다: ① 이동 통계 활용 ② 맞춤 혜택 받기. 기본값은 모두 꺼짐, 설정 › 개인정보·데이터 활용에서 언제든 변경. 변경 이력은 `users/{uid}/consentLog` 에 남습니다. 문구를 바꾸면 `src/lib/tripData.ts` 의 `CONSENT_VERSION` 을 올리세요 → 다시 묻습니다 |
| **좌표 출처 표시** | 모든 장소에 `source` 저장: `gps`(휴대폰 위치) · `map`(지도 핀) · `google`(장소 검색) |
| **실제 승하차 지점** | 기사가 "탑승 시작"·"운행 완료"를 누를 때 기사 휴대폰 GPS(위치 권한이 이미 있을 때만, 오차 150m 이내)를 `actualPickup` / `actualDropoff` 로 저장 — 우리가 직접 모은 데이터 |
| **장소 분류** | 집·회사·학교·골프장·식당·쇼핑몰·호텔·공항·여가·기타. ① 즐겨찾기 저장 때 사용자가 고른 분류 ② 운영자가 등록한 자체 장소 목록(`pois`) 반경 안에 도착하면 그 분류. 병원·종교시설처럼 민감한 추정을 낳는 분류는 일부러 두지 않았습니다 |
| **익명 통계** (`tripStats`) | 통계 동의자의 운행 완료 1건마다 1줄: 월·요일·시·약 1.1km 구역·분류·운행 시간(5분 단위). 그룹·사용자·호출 id와 정확한 좌표는 넣지 않습니다. 구역은 자체 좌표로만 계산 |
| **맞춤 혜택 프로필** (`adProfiles/{uid}`) | 혜택 동의자의 목적지 분류별 횟수(집·회사 제외). 동의를 끄면 즉시 삭제 |
| **구글 좌표 30일 정리** | 구글에서 받은 좌표는 약관상 30일까지만 보관 가능 → 매일 새벽(자카르타 02:00) `/api/cron/retention` 이 지난 좌표를 지웁니다. Place ID는 남겨 두고, 다시 쓸 때 Place ID로 좌표를 새로 받습니다 |
| **운영자 도구** (`/operator`) | `OPERATOR_EMAILS` 에 넣은 계정만. 설정 화면 맨 아래 "운영자 도구" → 리포트(묶는 기준·기간 선택 → CSV 내려받기, 5건 미만 묶음 자동 제외), 자체 장소 CSV 등록(`이름,분류,위도,경도,반경m`) |

**배포 때 할 일**
1. Vercel 환경변수에 `CRON_SECRET`(긴 무작위 문자열), `OPERATOR_EMAILS`(본인 Google 이메일) 추가
2. `firebase deploy --only firestore:indexes,firestore:rules` — `geoExpiresAt` 컬렉션 그룹 색인이 있어야 정리 작업이 동작
3. 자체 장소 목록은 현장 GPS나 지도 핀으로 직접 확인한 좌표만 넣기 (구글 검색 결과 좌표를 옮겨 적으면 약관 위반)

> 장소 검색(Places)에서 받은 장소 이름·주소는 호출 기록 화면에 계속 보여 주고 있습니다. 구글 약관상 Place ID와 좌표 외의 장소 정보를 계속 보관해도 되는지는 명확하지 않으니, 상용화 전에 Google Maps 약관을 한 번 더 확인하세요. 통계·광고에는 이 정보를 쓰지 않습니다.
> 인도네시아 개인정보보호법(UU PDP)상 통계를 제휴사에 제공하거나 광고에 쓰기 전에는 현지 법률 검토를 받으세요.

### MVP 범위에서 제외 (명세 §1 "MVP 이후", §30)
광고·관리자 대시보드·구독/결제·수당/공제 항목(식대·보너스 등)·급여 확정/지급 기록·이동 경로 기록·Native wrapper.
데이터 구조(다중 기사, `plan`, `analyticsEvents`, `usageDaily`)는 이후 기능을 붙일 수 있게 준비되어 있습니다.
