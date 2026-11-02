import { BANNER_SPEC, DETAIL_SPEC } from "@/lib/ads";

/** 광고 이미지 규격 안내 — 광고 안내 페이지와 신청 페이지에서 같이 쓴다 */
export const BANNER_SAFE = { x: 6, y: 12 }; // 가로·세로 여백 % (1200×400 기준 약 1056×304)

export function BannerSpecGuide() {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 rounded-card border border-line bg-surface p-4">
      <div className="min-w-0 space-y-3 text-sm leading-relaxed text-ink">
        <div>
          <p className="font-bold">① {BANNER_SPEC.label} · {BANNER_SPEC.w} × {BANNER_SPEC.h} px ({BANNER_SPEC.ratio})</p>
          <p className="text-ink-sub">앱 화면에 보이는 가로 띠입니다. 휴대폰에서는 폭 약 350px 로 작게 보이니, 글자는 짧고 크게 (한두 줄).</p>
        </div>
        <div>
          <p className="font-bold">② {DETAIL_SPEC.label} · {DETAIL_SPEC.w} × {DETAIL_SPEC.h} px ({DETAIL_SPEC.ratio})</p>
          <p className="text-ink-sub">배너를 누르면 크게 열리는 이미지입니다. 메뉴·가격·혜택·위치·연락처를 넣어 주세요.</p>
        </div>
        <ul className="list-disc space-y-0.5 pl-4 text-ink-sub">
          <li>JPG 또는 PNG. 다른 크기로 올려도 이 비율로 잘라 맞춥니다.</li>
          <li>배너 글자는 가장자리 여백 안쪽(점선)에 — 잘리지 않게.</li>
          <li>연결 링크(홈페이지·인스타그램·WhatsApp)는 선택입니다.</li>
        </ul>
      </div>
      <div className="flex w-16 flex-col items-center gap-2 pt-1" aria-hidden>
        <span className="block aspect-[3/1] w-16 rounded-md bg-navy/80" />
        <span className="text-[10px] text-ink-faint">3 : 1</span>
        <span className="block aspect-[4/5] w-12 rounded-md bg-action/60" />
        <span className="text-[10px] text-ink-faint">4 : 5</span>
      </div>
    </div>
  );
}
