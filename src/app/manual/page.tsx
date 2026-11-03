"use client";
/**
 * 보스용 사용 설명서 (한국어) — 로그인 없이 열림. /manual  (?os=ios|android 로 기기 지정)
 * 원칙: 한 화면에 한 가지 일, 큰 글씨, 번호 순서, 실제 단추 모양을 그대로 그려서 "이걸 누르세요".
 * 설치·알림처럼 기기마다 다른 부분은 위의 "아이폰 / 안드로이드" 전환에 따라 바뀐다.
 */
import Link from "next/link";
import {
  AndroidInstallMock,
  B,
  IosAddToHomeMock,
  ManualShell,
  MockCard,
  Phone,
  PermissionMock,
  SettingsMock,
  useOs,
  type ManualFaq,
  type ManualSection,
} from "@/components/manual/kit";

export default function ManualPage() {
  const [os, setOs] = useOs();
  return (
    <ManualShell
      lang="ko"
      os={os}
      setOs={setOs}
      sections={SECTIONS}
      faq={FAQ}
      text={{
        kicker: "BossCall 사용 설명서 · 보스용",
        title: "이럴 땐, 이렇게",
        lead: "하고 싶은 일을 고르세요. 노란 테두리 단추를 그대로 따라 누르면 됩니다.",
        osAsk: "내 휴대폰은?",
        ios: "아이폰·아이패드",
        android: "안드로이드",
        faqTitle: "문제가 생겼을 때",
        print: "이 화면 인쇄하기",
      }}
      bottom={
        <section className="rounded-card bg-navy p-5 text-white print:hidden">
          <p className="text-[17px] font-bold">기사님용 설명서는 따로 있어요</p>
          <p className="mt-1 text-[15px] text-white/75">인도네시아어(한국어 전환 가능)로, 기사님이 할 일만 정리했습니다.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href={`/manual/driver?os=${os}`}
              className="flex min-h-[48px] items-center justify-center rounded-btn bg-white font-bold text-navy"
            >
              기사용 보기
            </Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                "Pak/Bu sopir, ini panduan BossCall. Tolong ikuti langkahnya:\nhttps://bosscall-ten.vercel.app/manual/driver",
              )}`}
              target="_blank"
              rel="noopener"
              className="flex min-h-[48px] items-center justify-center rounded-btn bg-[#25D366] font-bold text-white"
            >
              왓츠앱으로 보내기
            </a>
          </div>
        </section>
      }
    />
  );
}

/* ───────── 화면 그림 ───────── */

const HomeMock = (
  <Phone>
    <MockCard>
      <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-bold text-success">● 근무 중</span>
      <p className="mt-1 text-[13px] font-bold text-ink">Budi 기사</p>
      <p className="text-[10px] text-ink-sub">오늘 07:58 출근</p>
    </MockCard>
    <div className="flex h-11 items-center justify-center rounded-xl bg-action text-[13px] font-extrabold text-white ring-4 ring-[#F2C230]">
      🚗 기사 호출
    </div>
    <div className="grid grid-cols-2 gap-1.5">
      <MockCard>
        <p className="text-[9px] text-ink-sub">오늘 호출</p>
        <p className="text-[13px] font-bold text-ink">2</p>
      </MockCard>
      <MockCard>
        <p className="text-[9px] text-ink-sub">근무시간</p>
        <p className="text-[13px] font-bold text-ink">07:58~</p>
      </MockCard>
    </div>
  </Phone>
);

const PickupMock = (
  <Phone title="‹  픽업 위치">
    <div className="flex h-9 items-center justify-center rounded-xl bg-action text-[11px] font-bold text-white ring-4 ring-[#F2C230]">
      📍 현재 위치에서 픽업
    </div>
    <div className="rounded-xl bg-surface px-2 py-2 text-ink-faint ring-1 ring-line">🔍 장소 검색</div>
    <div className="rounded-xl bg-surface px-2 py-2 text-center font-semibold text-ink ring-1 ring-line">🗺 지도에서 선택</div>
    <MockCard>
      <p className="font-semibold text-ink">⭐ 집</p>
    </MockCard>
  </Phone>
);

const ProgressMock = (
  <Phone title="‹  호출">
    <div className="rounded-xl bg-success-soft px-2 py-2 font-bold text-success">✓ 기사님이 수락하고 출발했습니다</div>
    <div className="flex items-center justify-between rounded-xl bg-surface px-2 py-2 ring-1 ring-line">
      {["수락", "이동", "도착", "운행", "완료"].map((s, i) => (
        <span key={s} className={`text-[10px] font-bold ${i <= 1 ? "text-action" : "text-ink-faint"}`}>
          {s}
        </span>
      ))}
    </div>
    <MockCard>
      <p className="text-ink">📍 집</p>
      <p className="text-ink">🎯 Grand Indonesia</p>
    </MockCard>
    <div className="rounded-xl border border-danger/40 bg-surface py-2 text-center font-semibold text-danger">호출 취소</div>
  </Phone>
);

const DriverClockMock = (
  <Phone>
    <MockCard>
      <span className="rounded-full bg-line px-1.5 py-0.5 text-[10px] font-bold text-ink-sub">● 퇴근</span>
      <p className="mt-1 text-[13px] font-bold text-ink">Budi 기사</p>
    </MockCard>
    <div className="rounded-xl bg-surface py-2 text-center font-semibold text-ink ring-2 ring-[#F2C230]">기사님 대신 출근 처리</div>
    <div className="flex h-10 items-center justify-center rounded-xl bg-action/35 text-[12px] font-extrabold text-white">🚗 기사 호출</div>
  </Phone>
);

/* ───────── 내용 ───────── */

const SECTIONS: ManualSection[] = [
  {
    id: "start",
    icon: "🚀",
    title: "처음 시작하기",
    lead: "앱스토어에서 받지 않아요. 브라우저에서 열고 홈 화면에 붙여 놓으면 앱처럼 씁니다.",
    steps: {
      ios: [
        <>
          <b>Safari</b>로 <b>bosscall-ten.vercel.app</b> 열기 (카톡 안에서 열렸다면 Safari로 넘어갑니다)
        </>,
        <>
          <B>Google로 계속</B> → 우리 가족 이름, 기사님 이름·전화번호 → <B tone="blue">시작하기</B>
        </>,
        <>
          Safari 아래(아이패드는 위 오른쪽) <B>공유 ⬆︎</B> 단추 → 목록을 올려서 <B>홈 화면에 추가</B> → <B>추가</B>
        </>,
        <>
          이제부터는 <b>홈 화면의 BossCall 아이콘</b>으로 여세요. Safari로 열면 알림이 오지 않습니다
        </>,
      ],
      android: [
        <>
          <b>Chrome</b>으로 <b>bosscall-ten.vercel.app</b> 열기 (삼성 인터넷·카톡이 아니라 Chrome)
        </>,
        <>
          <B>Google로 계속</B> → 우리 가족 이름, 기사님 이름·전화번호 → <B tone="blue">시작하기</B>
        </>,
        <>
          Chrome 오른쪽 위 <B>⋮</B> → <B>앱 설치</B> (또는 <b>홈 화면에 추가</b>) → <B>설치</B>
        </>,
        <>
          이제부터는 <b>홈 화면의 BossCall 아이콘</b>으로 여세요
        </>,
      ],
    },
    mock: {
      ios: <IosAddToHomeMock share="공유" add="홈 화면에 추가" more="⬆︎ 공유 → 아래로 내려서 '홈 화면에 추가'" />,
      android: <AndroidInstallMock install="앱 설치" home="홈 화면에 추가" />,
    },
    tip: {
      ios: <>공유 단추(⬆︎)가 안 보이면 화면을 살짝 내리거나, 주소창 옆 <b>⋯</b> → <b>공유</b>를 누르세요. iOS 16.4 이상이어야 알림이 옵니다.</>,
      android: <>삼성 인터넷으로 설치하면 &quot;안전하지 않은 앱 차단됨&quot; 경고가 뜹니다. 꼭 Chrome으로 설치하세요.</>,
    },
  },
  {
    id: "push",
    icon: "🔔",
    title: "알림 켜기",
    lead: "기사님이 수락·도착하면 알림으로 알려 드려요. 처음 한 번만 하면 됩니다.",
    steps: {
      ios: [
        <>홈 화면 아이콘으로 BossCall 열기</>,
        <>
          <B>설정</B> → <B>알림 설정</B> → <B tone="blue">알림 켜기</B>
        </>,
        <>
          &quot;알림을 보내고자 합니다&quot; 창에서 <B>허용</B>
        </>,
        <>
          <B>5초 뒤 테스트 알림 받기</B> → 화면을 끄고 소리가 나는지 확인
        </>,
      ],
      android: [
        <>홈 화면 아이콘으로 BossCall 열기</>,
        <>
          <B>설정</B> → <B>알림 설정</B> → <B tone="blue">알림 켜기</B>
        </>,
        <>
          &quot;알림을 보내도록 허용할까요?&quot; 창에서 <B>허용</B>
        </>,
        <>
          <B>5초 뒤 테스트 알림 받기</B> → 화면을 끄고 소리가 나는지 확인
        </>,
      ],
    },
    mock: {
      ios: <PermissionMock os="ios" q={"\u201cBossCall\u201d에서 알림을 보내고자 합니다"} allow="허용" deny="허용 안 함" />,
      android: <PermissionMock os="android" q="BossCall에서 알림을 보내도록 허용하시겠습니까?" allow="허용" deny="허용 안함" />,
    },
    tip: {
      ios: <>테스트 뒤 결과 줄에 &quot;✓ 보냈습니다&quot;가 나왔는데 소리가 안 났다면, 아래 &quot;문제가 생겼을 때 › 알림 소리가 안 나요&quot;를 보세요.</>,
      android: <>테스트 뒤 결과 줄에 &quot;✓ 보냈습니다&quot;가 나왔는데 소리가 안 났다면, 아래 &quot;문제가 생겼을 때 › 알림 소리가 안 나요&quot;를 보세요.</>,
    },
  },
  {
    id: "connect",
    icon: "🤝",
    title: "기사님 연결하기",
    lead: "기사님 휴대폰에 BossCall을 연결해야 호출할 수 있어요.",
    steps: [
      <>
        아래 <B>기사</B> 탭 → 기사님 이름 → <B>기사 초대 링크 만들기</B>
      </>,
      <>
        <B>공유 / 복사</B> → 왓츠앱으로 기사님께 보내기 (인도네시아어 안내가 함께 갑니다)
      </>,
      <>기사님이 링크를 열고 Google로 가입하면 연결 끝. 기사 카드의 &quot;미연결&quot;이 사라집니다</>,
    ],
    tip: <>기사님이 할 일은 기사용 설명서에 인도네시아어로 정리돼 있어요. 설정 › 사용 안내에서 왓츠앱으로 보낼 수 있습니다.</>,
  },
  {
    id: "call",
    icon: "🚗",
    title: "기사 부르기",
    lead: "버튼 하나로 부르고, 기사님이 어디쯤인지 화면에서 봅니다.",
    mock: (
      <div className="space-y-3">
        {HomeMock}
        {PickupMock}
      </div>
    ),
    steps: [
      <>
        홈에서 <B tone="blue">🚗 기사 호출</B>
      </>,
      <>
        <b>픽업 위치</b> 고르기 — <B tone="blue">📍 현재 위치에서 픽업</B>을 누르면 지도에서 &quot;이 위치가 맞습니까?&quot;를 확인합니다
      </>,
      <>
        <b>목적지</b> 고르기 — 검색하거나, 즐겨찾기·최근 장소를 누르세요
      </>,
      <>
        확인 화면에서 <B tone="blue">🚗 기사 호출</B>
      </>,
    ],
  },
  {
    id: "track",
    icon: "📍",
    title: "부른 뒤에는",
    lead: "기사님 휴대폰은 응답할 때까지 알람이 계속 울립니다. 진행 상황은 화면과 알림으로 알려 드려요.",
    mock: ProgressMock,
    steps: [
      <>기사님이 수락하면 &quot;수락하고 출발했습니다&quot; 알림</>,
      <>
        화면 위 단계가 <b>수락 → 이동 → 도착 → 운행 → 완료</b> 순서로 바뀝니다
      </>,
      <>
        취소하려면 <B>호출 취소</B> — 기사님 휴대폰에 [확인]을 누를 때까지 알람이 가서 헛걸음을 막습니다
      </>,
      <>
        같은 길을 또 가려면 <B>기록</B> 탭 → 지난 호출 → <B>다시 호출</B>
      </>,
    ],
  },
  {
    id: "work",
    icon: "🕘",
    title: "기사님 출퇴근",
    lead: "기사님이 출근을 눌러야 호출할 수 있어요. 호출 단추가 흐리면 대부분 이 경우입니다.",
    mock: DriverClockMock,
    steps: [
      <>
        기사님은 매일 아침 <B tone="green">Mulai Kerja</B>(출근)를 누릅니다
      </>,
      <>
        깜빡했다면 홈의 <B>기사님 대신 출근 처리</B>를 누르세요
      </>,
      <>
        퇴근도 대신 할 수 있어요: <B>기사</B> 탭 → 기사님 → <B>기사님 대신 퇴근 처리</B>
      </>,
      <>기사님이 출근·퇴근하면 사장님과 가족에게 알림이 옵니다</>,
    ],
  },
  {
    id: "location",
    icon: "🗺",
    title: "기사님 위치 보기",
    lead: "기사님이 위치 공유를 켰을 때, 근무 시간에만 보입니다.",
    steps: [
      <>
        홈의 <B>📍 기사 위치 보기</B>
      </>,
      <>&quot;N분 전&quot;이 오래됐으면 기사님 휴대폰 화면이 꺼져 있거나 인터넷이 약한 경우입니다</>,
    ],
  },
  {
    id: "pay",
    icon: "💰",
    title: "근무 기록·급여",
    lead: "출퇴근 기록으로 근무 시간과 급여를 자동으로 계산합니다.",
    steps: [
      <>
        <B>기사</B> 탭 → 기사님 → <B>급여</B> 탭
      </>,
      <>처음 한 번 월급·근무 시간 등 조건을 입력하면 매달 자동 계산</>,
      <>
        근무 기록이 틀렸으면 <B>근무</B> 탭에서 고칠 수 있어요
      </>,
    ],
  },
  {
    id: "places",
    icon: "⭐",
    title: "자주 가는 곳 저장",
    lead: "집·회사·학교를 저장해 두면 두세 번 누르면 호출이 끝납니다.",
    steps: [
      <>
        <B>설정</B> → <B>장소 관리</B> → <B>장소 추가</B>
      </>,
      <>저장한 곳은 픽업·목적지 화면 맨 위 &quot;즐겨찾기&quot;에 나옵니다</>,
    ],
  },
  {
    id: "family",
    icon: "👨‍👩‍👧",
    title: "가족도 함께 쓰기",
    lead: "사모님·자녀도 같은 기사님을 부르고 기록을 함께 봅니다.",
    steps: [
      <>
        <B>설정</B> → <B>가족 구성원</B> → <B>가족 초대 링크 만들기</B>
      </>,
      <>카톡·왓츠앱으로 보내면, 가족이 링크를 열고 Google로 가입하면 끝</>,
    ],
  },
  {
    id: "drivers",
    icon: "👥",
    title: "기사가 여러 명일 때",
    lead: "홈에는 메인 기사만 보여서 깔끔합니다. 다른 기사는 필요할 때만 꺼내 보세요.",
    steps: [
      <>
        홈의 <B>다른 기사 N명 ▼</B>을 누르면 다른 기사가 보입니다
      </>,
      <>
        다른 기사를 보는 중에 <B>★ 메인 기사로</B>를 누르면 메인 기사가 바뀝니다
      </>,
      <>
        호출 화면에서도 기본은 메인 기사, 바꾸려면 <B>다른 기사 ›</B>
      </>,
      <>
        추가: <B>기사</B> 탭 → <B>+ 기사 추가</B> / 수정·삭제: 기사님 화면 오른쪽 위 <B>✏️ 수정</B>
      </>,
    ],
  },
];

const FAQ: ManualFaq[] = [
  {
    icon: "🔕",
    q: "알림 소리가 안 나요",
    a: {
      ios: (
        <>
          <p>
            ① 아이폰 옆 <b>무음 스위치</b>가 주황색이면 위로 올리세요. 화면 위에 🌙(집중 모드)가 있으면 끄세요.
          </p>
          <p>
            ② 아이폰 <b>설정 › 알림 › BossCall</b> → <b>알림 허용</b>·<b>사운드</b>를 켜세요.
          </p>
          <SettingsMock
            path="설정 › 알림 › BossCall"
            rows={[
              { label: "알림 허용", on: true, hl: true },
              { label: "사운드", on: true, hl: true },
              { label: "배지", on: true },
            ]}
          />
          <p>
            ③ <b>홈 화면 아이콘</b>으로 열어야 합니다. Safari 탭으로 열면 알림이 오지 않아요.
          </p>
          <p>
            ④ BossCall <B>설정</B> → <B>알림 설정</B> → <B>5초 뒤 테스트 알림 받기</B>. 결과 줄이 ✗이면 <B>이 기기 다시 등록</B>.
          </p>
          <p className="text-ink-sub">
            참고: 앱이 닫혀 있거나 화면이 꺼져 있으면 알림이 5초마다 울립니다(웹앱 제한으로 경보음 대신 알림음). 끊김 없는 경보음은 BossCall이 화면에 열려 있을 때 납니다.
          </p>
        </>
      ),
      android: (
        <>
          <p>
            ① 휴대폰이 <b>무음·진동</b>이거나 <b>방해 금지</b>면 끄세요 (화면을 위에서 내려서 확인).
          </p>
          <p>
            ② 휴대폰 <b>설정 › 애플리케이션 › BossCall › 알림</b> → <b>알림 허용</b>, <b>소리</b>, <b>팝업으로 표시</b>를 켜세요. BossCall이 목록에
            없으면 <b>Chrome</b>에서 찾으세요.
          </p>
          <SettingsMock
            path="애플리케이션 › BossCall › 알림"
            rows={[
              { label: "알림 허용", on: true, hl: true },
              { label: "소리", on: true, hl: true },
              { label: "팝업으로 표시", on: true, hl: true },
            ]}
          />
          <p>
            ③ <b>설정 › 애플리케이션 › Chrome › 배터리</b> → <b>제한 없음</b> (알림이 늦게 오는 것을 막아요).
          </p>
          <p>
            ④ BossCall <B>설정</B> → <B>알림 설정</B> → <B>5초 뒤 테스트 알림 받기</B>. 결과 줄이 ✗이면 <B>이 기기 다시 등록</B>.
          </p>
        </>
      ),
    },
  },
  {
    icon: "⚪",
    q: "기사 호출 단추가 흐려서 안 눌려요",
    a: (
      <>
        <p>
          • 기사님이 <b>아직 연결 안 됨</b>(카드에 &quot;미연결&quot;) → 초대 링크를 다시 보내세요.
        </p>
        <p>
          • 기사님이 <b>퇴근 상태</b> → 기사님이 출근하거나, <B>기사님 대신 출근 처리</B>.
        </p>
        <p>• 이미 다른 호출을 처리 중 → 끝나면 다시 부를 수 있어요.</p>
      </>
    ),
  },
  {
    icon: "💬",
    q: "카톡으로 받은 링크가 이상하게 열려요",
    a: (
      <p>
        카톡 안의 브라우저에서는 Google 로그인이 막힙니다. 보통 자동으로 넘어가고, 안 넘어가면 화면의 <B tone="blue">Safari로 열기</B>{" "}
        / <B tone="blue">Chrome으로 열기</B>를 누르세요. 카톡 오른쪽 아래 <b>⋯</b> → <b>다른 브라우저로 열기</b>도 됩니다.
      </p>
    ),
  },
  {
    icon: "⚠️",
    q: "\"안전하지 않은 앱 차단됨\" 경고가 떠요",
    only: "android",
    a: (
      <p>
        삼성 인터넷으로 설치해서 생기는 경고입니다. <b>확인</b>을 눌러 닫고, <b>Chrome</b>에서 BossCall을 열어 <b>⋮ → 앱 설치</b>로 다시 설치하세요.
      </p>
    ),
  },
  {
    icon: "📍",
    q: "현재 위치가 잘못 잡혀요",
    a: (
      <p>
        &quot;이 위치가 맞습니까?&quot; 지도에서 <b>지도를 움직여 핀을 정확한 곳에</b> 맞춘 뒤 확인을 누르세요. 건물 안에서는 GPS가 수십 m 틀릴 수 있어요.
      </p>
    ),
  },
  {
    icon: "🌙",
    q: "화면이 어두워요",
    a: {
      ios: <p>휴대폰이 다크 모드면 BossCall도 어둡게 나옵니다. 밝게 보려면 아이폰 <b>설정 › 디스플레이 및 밝기 › 라이트</b>.</p>,
      android: <p>휴대폰이 다크 모드면 BossCall도 어둡게 나옵니다. 밝게 보려면 <b>설정 › 디스플레이 › 라이트 모드</b>.</p>,
    },
  },
  {
    icon: "🔤",
    q: "글자를 인도네시아어/영어로 바꾸고 싶어요",
    a: (
      <p>
        <B>설정</B> → <B>언어</B>에서 한국어 · Indonesia · English 중에 고르세요. 기사님 화면은 기사님이 고른 언어로 나옵니다.
      </p>
    ),
  },
];
