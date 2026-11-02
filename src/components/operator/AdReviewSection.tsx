"use client";
/** 운영자 도구 › 광고 신청 검토 · 게재 관리 (한국어 전용) */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { PaidBanner } from "@/components/ads/AdSlot";
import { AdPlaceField } from "@/components/ads/AdPlaceField";
import {
  AD_MONTHS,
  BANNER_SPEC,
  DETAIL_SPEC,
  PRODUCT_INFO,
  SLOT_INFO,
  campaignLabel,
  campaignProduct,
  campaignWindow,
  jakartaDayStart,
  nextFreeRank,
  slotLayout,
  AD_TIERS_ENABLED,
  MAX_LIVE_ADS,
  SCREEN_CAP,
  type AdCampaignDoc,
  type AdRequestDoc,
} from "@/lib/ads";
import {
  approveAd,
  endAdCampaign,
  getAdRequest,
  getAdRequests,
  rejectAd,
  setAdCampaignPlace,
  updateAdCampaign,
  type AdStats,
} from "@/services/client/actions";
import { ImageCropper } from "@/components/ads/ImageCropper";
import { BANNER_SAFE } from "@/components/ads/BannerSpecGuide";
import { ProductRankPicker, type ProductRank } from "@/components/operator/ProductRankPicker";
import { errorMessage } from "@/services/client/api";

type Tab = "pending" | "live" | "done";

const day = (ms: number) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Jakarta", month: "numeric", day: "numeric" }).format(ms);
const slotName = (s: string) => SLOT_INFO.find((x) => x.slot === s)?.title ?? s;

export function AdReviewSection() {
  const toast = useToast();
  const [data, setData] = useState<{ requests: AdRequestDoc[]; campaigns: AdCampaignDoc[]; stats: Record<string, AdStats> } | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    getAdRequests()
      .then(setData)
      .catch((e) => toast(errorMessage(e), "error"));
  }, [toast]);
  useEffect(load, [load]);

  const now = Date.now();
  const pending = data?.requests.filter((r) => r.status === "PENDING") ?? [];
  const done = data?.requests.filter((r) => r.status !== "PENDING") ?? [];
  // 게재 중·예정 먼저, 그다음 최근 종료(90일) — 종료된 것도 기간을 늘려 다시 올릴 수 있게
  const campaigns = [...(data?.campaigns ?? [])].sort(
    (a, b) => Number(a.endAt <= now) - Number(b.endAt <= now) || a.startAt - b.startAt,
  );
  const liveCount = campaigns.filter((c) => c.endAt > now).length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">광고 신청</h2>
        <Link href="/operator/ads/new" className="rounded-full bg-action px-3 py-1.5 text-sm font-bold text-white active:bg-action-dark">
          + 광고 직접 올리기
        </Link>
      </div>
      <div className="flex gap-1 rounded-btn bg-line/60 p-1">
        {(
          [
            ["pending", `검토 대기 ${pending.length}`],
            ["live", `게재 광고 ${liveCount}`],
            ["done", "처리 완료"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`min-h-[40px] flex-1 rounded-[10px] text-sm font-semibold ${tab === k ? "bg-surface text-ink shadow-card" : "text-ink-sub"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!data && <p className="px-1 text-sm text-ink-sub">불러오는 중…</p>}

      {data && tab === "pending" && (
        <div className="space-y-2">
          {pending.length === 0 && <p className="card p-4 text-sm text-ink-sub">검토할 신청이 없습니다.</p>}
          {pending.map((r) => (
            <RequestCard
              key={r.id}
              r={r}
              campaigns={data.campaigns}
              open={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              onDone={() => {
                setOpenId(null);
                load();
              }}
            />
          ))}
        </div>
      )}

      {data && tab === "live" && (
        <div className="space-y-2">
          {campaigns.length === 0 && <p className="card p-4 text-sm text-ink-sub">게재 중인 광고가 없습니다. 빈 자리는 한인업소록이 나옵니다.</p>}
          {campaigns.length > 0 && (AD_TIERS_ENABLED ? <PositionMap campaigns={campaigns} now={now} /> : <QueueView campaigns={campaigns} now={now} />)}
          {!AD_TIERS_ENABLED &&
            campaigns
              .slice()
              .sort((a, b) => Number(a.endAt <= now) - Number(b.endAt <= now) || a.createdAt - b.createdAt)
              .map((c) => <CampaignCard key={c.id} c={c} all={campaigns} stats={data.stats[c.id]} now={now} onChanged={load} />)}
          {AD_TIERS_ENABLED && (["premium", "callBundle"] as const).map((p) => {
            const list = campaigns
              .filter((c) => campaignProduct(c) === p)
              .sort((a, b) => Number(a.endAt <= now) - Number(b.endAt <= now) || (a.rank ?? 5) - (b.rank ?? 5) || a.startAt - b.startAt);
            if (list.length === 0) return null;
            return (
              <div key={p} className="space-y-2 pt-2">
                <h3 className="px-1 text-sm font-bold text-ink">
                  {PRODUCT_INFO[p].name} <span className="font-normal text-ink-sub">· {PRODUCT_INFO[p].desc}</span>
                </h3>
                {list.map((c) => (
                  <CampaignCard key={c.id} c={c} all={campaigns} stats={data.stats[c.id]} now={now} onChanged={load} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {data && tab === "done" && (
        <div className="card divide-y divide-line">
          {done.length === 0 && <p className="p-4 text-sm text-ink-sub">아직 없습니다.</p>}
          {done.map((r) => (
            <div key={r.id} className="p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{r.company}</span>
                <span className={r.status === "APPROVED" ? "text-success" : "text-danger"}>{r.status === "APPROVED" ? "승인" : "반려"}</span>
              </div>
              <p className="mt-0.5 text-ink-sub">
                {PRODUCT_INFO[r.product].name} · {r.startDate} · {r.months}개월
                {r.rejectReason ? ` · 사유: ${r.rejectReason}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RequestCard({
  r,
  campaigns,
  open,
  onToggle,
  onDone,
}: {
  r: AdRequestDoc;
  campaigns: AdCampaignDoc[];
  open: boolean;
  onToggle: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [images, setImages] = useState<{ banner: string | null; detail: string | null } | null>(null);
  const [startDate, setStartDate] = useState(r.startDate);
  const [months, setMonths] = useState<number>(r.months);
  const win = campaignWindow(startDate, months);
  const [pick, setPick] = useState<ProductRank>(() => ({
    product: r.product,
    rank: win ? nextFreeRank(campaigns, r.product, win.startAt, win.endAt) : 1,
  }));
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [full, setFull] = useState<string | null>(null);

  useEffect(() => {
    if (!open || images) return;
    getAdRequest(r.id)
      .then((d) => setImages({ banner: d.banner, detail: d.detail }))
      .catch((e) => toast(errorMessage(e), "error"));
  }, [open, images, r.id, toast]);

  const approve = async () => {
    setBusy("approve");
    setFull(null);
    try {
      const res = await approveAd(r.id, startDate, months, pick.rank, pick.product);
      if (res.ok) {
        toast("승인했습니다. 시작일에 자동으로 올라갑니다.");
        onDone();
      } else setFull(res.reason);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    const reason = window.prompt("반려 사유 (광고주에게 전달할 내용)");
    if (!reason?.trim()) return;
    setBusy("reject");
    try {
      await rejectAd(r.id, reason.trim());
      toast("반려했습니다.");
      onDone();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const wa = r.whatsapp ? `https://wa.me/${r.whatsapp.replace(/[^0-9]/g, "").replace(/^0/, "62")}` : null;

  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2 p-4 text-left">
        <span className="min-w-0">
          <span className="block font-bold text-ink">{r.company}</span>
          <span className="block text-sm text-ink-sub">
            {PRODUCT_INFO[r.product].name} · {r.startDate} 부터 {r.months}개월 · {r.industry}
          </span>
        </span>
        <span className="text-ink-faint">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-line p-4">
          <dl className="grid grid-cols-[72px_1fr] gap-y-1 text-sm">
            <dt className="text-ink-sub">담당자</dt>
            <dd className="text-ink">{r.contactName}</dd>
            {r.whatsapp && (
              <>
                <dt className="text-ink-sub">WhatsApp</dt>
                <dd>
                  <a className="font-semibold text-action" href={wa ?? "#"} target="_blank" rel="noopener">
                    {r.whatsapp}
                  </a>
                </dd>
              </>
            )}
            {r.kakaoId && (
              <>
                <dt className="text-ink-sub">카카오톡</dt>
                <dd className="text-ink">{r.kakaoId}</dd>
              </>
            )}
            <dt className="text-ink-sub">이메일</dt>
            <dd>
              <a className="font-semibold text-action" href={`mailto:${r.email}`}>
                {r.email}
              </a>
            </dd>
            <dt className="text-ink-sub">위치</dt>
            <dd className="text-ink">{r.place ? `${r.place.name} · ${r.place.address}` : "없음 (승인 후 게재 중 탭에서 넣을 수 있음)"}</dd>
            <dt className="text-ink-sub">링크</dt>
            <dd className="break-all text-ink">
              {r.linkUrl ? (
                <a className="text-action" href={r.linkUrl} target="_blank" rel="noopener">
                  {r.linkUrl}
                </a>
              ) : (
                "없음"
              )}
            </dd>
          </dl>

          {images?.banner ? (
            <PaidBanner company={r.company} bannerUrl={images.banner} detailUrl={images.detail} linkUrl={r.linkUrl} />
          ) : (
            <div className="flex aspect-[3/1] items-center justify-center rounded-card bg-line text-sm text-ink-sub">이미지 불러오는 중…</div>
          )}
          <p className="text-xs text-ink-sub">배너를 누르면 상세 이미지가 열립니다.</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">시작일</span>
              <input type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <span className="label">기간</span>
              <select className="field" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                {AD_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}개월
                  </option>
                ))}
              </select>
            </div>
          </div>
          {AD_TIERS_ENABLED && (
            <ProductRankPicker
              value={pick}
              onChange={setPick}
              campaigns={campaigns}
              startAt={win?.startAt ?? null}
              endAt={win?.endAt ?? null}
            />
          )}
          {full && (
            <p className="rounded-btn bg-warning-soft px-3 py-2 text-sm text-warning-text">
              {full}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" loading={busy === "reject"} disabled={busy !== null} onClick={() => void reject()}>
              반려
            </Button>
            <Button loading={busy === "approve"} disabled={busy !== null} onClick={() => void approve()}>
              승인
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 자카르타 날짜 "YYYY-MM-DD" */
const ymd = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10);

/** 올라간 광고 한 건 — 보기 / 수정(이미지·기간·링크) / 위치 / 내리기 */
function CampaignCard({
  c,
  all,
  stats,
  now,
  onChanged,
}: {
  c: AdCampaignDoc;
  all: AdCampaignDoc[];
  stats?: AdStats;
  now: number;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(ymd(c.startAt));
  const [lastDate, setLastDate] = useState(ymd(c.endAt - 1));
  const [link, setLink] = useState(c.linkUrl ?? "");
  const [pick, setPick] = useState<ProductRank>({ product: campaignProduct(c), rank: c.rank ?? 5 });
  const [busy, setBusy] = useState(false);
  const [full, setFull] = useState<string | null>(null);

  const state = c.endAt <= now ? "종료" : c.startAt <= now ? "게재 중" : "예정";
  const tone =
    state === "게재 중" ? "bg-success-soft text-success" : state === "예정" ? "bg-warning-soft text-warning-text" : "bg-line text-ink-sub";

  const open = () => {
    setBanner(null);
    setDetail(null);
    setStartDate(ymd(c.startAt));
    setLastDate(ymd(c.endAt - 1));
    setLink(c.linkUrl ?? "");
    setPick({ product: campaignProduct(c), rank: c.rank ?? 5 });
    setFull(null);
    setEditing(true);
  };

  const save = async () => {
    const patch: Parameters<typeof updateAdCampaign>[1] = {};
    if (banner) patch.bannerImage = banner;
    if (detail) patch.detailImage = detail;
    if (startDate !== ymd(c.startAt)) patch.startDate = startDate;
    if (lastDate !== ymd(c.endAt - 1)) patch.lastDate = lastDate;
    if (link.trim() !== (c.linkUrl ?? "")) patch.linkUrl = link.trim() || null;
    if (pick.rank !== (c.rank ?? 5)) patch.rank = pick.rank;
    if (pick.product !== campaignProduct(c)) {
      patch.product = pick.product;
      patch.rank = pick.rank;
    }
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }
    if (lastDate < startDate) {
      toast("종료일이 시작일보다 빠릅니다.", "error");
      return;
    }
    setBusy(true);
    setFull(null);
    try {
      const r = await updateAdCampaign(c.id, patch);
      if (!r.ok) {
        setFull(r.reason);
        return;
      }
      toast("저장했습니다. 몇 분 안에 앱에 반영됩니다.");
      setEditing(false);
      onChanged();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`card space-y-3 p-4 ${state === "종료" ? "opacity-80" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 font-bold text-ink">
          {c.company}
          {AD_TIERS_ENABLED && (
            <span className="ml-2 rounded-full bg-navy px-2 py-0.5 align-middle text-[11px] font-semibold text-white">{campaignLabel(c)}</span>
          )}
        </span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{state}</span>
      </div>
      <p className="text-sm text-ink-sub">
        {day(c.startAt)} ~ {day(c.endAt - 1)} · {c.slots.map(slotName).join(", ")}
      </p>
      {/* 내부 참고용 — 광고주에게 제공하지 않음 */}
      <p className="grid grid-cols-4 gap-1 rounded-btn bg-bg px-2 py-1.5 text-center text-[11px] text-ink-sub">
        {(
          [
            ["노출", stats?.impressions],
            ["클릭", stats?.clicks],
            ["출발지", stats?.pickup],
            ["목적지", stats?.destination],
          ] as const
        ).map(([k, v]) => (
          <span key={k}>
            <b className="block text-[14px] text-ink">{(v ?? 0).toLocaleString()}</b>
            {k}
          </span>
        ))}
      </p>

      {!editing ? (
        <>
          <PaidBanner
            company={c.company}
            bannerUrl={c.bannerUrl}
            detailUrl={c.detailUrl}
            linkUrl={c.linkUrl}
            onGo={c.place ? () => toast("앱에서는 이 위치가 출발지·목적지로 들어갑니다.") : undefined}
          />
          <div>
            <span className="label">업소 위치 ([출발지로 설정·목적지로 설정] 단추)</span>
            <AdPlaceField
              value={c.place ?? null}
              onChange={(p) => {
                setAdCampaignPlace(c.id, p)
                  .then(() => {
                    toast(p ? "위치를 넣었습니다. 몇 분 안에 앱에 반영됩니다." : "위치를 지웠습니다.");
                    onChanged();
                  })
                  .catch((e) => toast(errorMessage(e), "error"));
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={open}>
              ✏️ 수정
            </Button>
            {state !== "종료" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (!window.confirm(`${c.company} 광고를 지금 내릴까요?`)) return;
                  endAdCampaign(c.id)
                    .then(() => {
                      toast("광고를 내렸습니다.");
                      onChanged();
                    })
                    .catch((e) => toast(errorMessage(e), "error"));
                }}
              >
                지금 내리기
              </Button>
            ) : (
              <span className="self-center text-center text-xs text-ink-sub">기간을 늘리면 다시 올라갑니다</span>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4 rounded-btn bg-bg p-3">
          <div>
            <span className="label">
              배너 ({BANNER_SPEC.w}×{BANNER_SPEC.h}) — 바꿀 때만 새 이미지 선택
            </span>
            <ImageCropper spec={BANNER_SPEC} value={banner ?? c.bannerUrl} onChange={setBanner} safe={BANNER_SAFE} />
          </div>
          <div>
            <span className="label">
              상세 이미지 ({DETAIL_SPEC.w}×{DETAIL_SPEC.h})
            </span>
            <div className="mx-auto w-2/3">
              <ImageCropper spec={DETAIL_SPEC} value={detail ?? c.detailUrl} onChange={setDetail} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">시작일</span>
              <input type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <span className="label">마지막 날</span>
              <input type="date" className="field" value={lastDate} min={startDate} onChange={(e) => setLastDate(e.target.value)} />
            </div>
          </div>
          {AD_TIERS_ENABLED && (
            <ProductRankPicker
              value={pick}
              onChange={setPick}
              campaigns={all}
              exceptId={c.id}
              startAt={jakartaDayStart(startDate)}
              endAt={(jakartaDayStart(lastDate) ?? c.endAt - 86400_000) + 86400_000}
            />
          )}
          <div>
            <span className="label">연결 링크 (비우면 없음)</span>
            <input
              className="field"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              inputMode="url"
              autoCapitalize="none"
              placeholder="https://…"
            />
          </div>
          {full && (
            <p className="rounded-btn bg-warning-soft px-3 py-2 text-sm text-warning-text">
              {full}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => setEditing(false)}>
              취소
            </Button>
            <Button loading={busy} onClick={() => void save()}>
              저장
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 지금 화면별 광고 순서 — 홈·응답 대기 / 픽업·목적지 (앱에 나오는 순서 그대로) */
function PositionMap({ campaigns, now }: { campaigns: AdCampaignDoc[]; now: number }) {
  const cols = [
    { title: "홈 · 응답 대기", cells: slotLayout(campaigns, "homeBenefits", now) },
    { title: "픽업 · 목적지", cells: slotLayout(campaigns, "pickup", now) },
  ];
  return (
    <div className="card overflow-hidden">
      <p className="border-b border-line px-4 py-2 text-xs font-semibold text-ink-sub">지금 화면별 광고 순서 (위에서부터)</p>
      <div className="grid grid-cols-2 divide-x divide-line">
        {cols.map((col) => (
          <ol key={col.title} className="space-y-1 p-3 text-[13px]">
            <li className="pb-1 text-xs font-semibold text-ink-sub">{col.title}</li>
            {col.cells.map((cell, i) => (
              <li key={i} className={`truncate ${cell.kind === "empty" ? "text-ink-faint" : "text-ink"}`}>
                {cell.kind === "paid" ? (
                  <>
                    <span className="mr-1 rounded bg-navy px-1 text-[10px] font-semibold text-white">{campaignLabel(cell.c)}</span>
                    {cell.c.company}
                  </>
                ) : cell.kind === "house" ? (
                  "한인업소록"
                ) : (
                  `빈 자리 (${col.title.startsWith("홈") ? "프리미엄" : "호출 묶음"} ${cell.n})`
                )}
              </li>
            ))}
          </ol>
        ))}
      </div>
    </div>
  );
}

/** 선착순 운영: 지금 올라간 광고 순서와 화면별 칸 수 */
function QueueView({ campaigns, now }: { campaigns: AdCampaignDoc[]; now: number }) {
  const live = campaigns.filter((c) => c.startAt <= now && c.endAt > now).sort((a, b) => a.createdAt - b.createdAt);
  const home = SCREEN_CAP.homeBenefits - 1;
  const call = SCREEN_CAP.pickup - 1;
  return (
    <div className="card space-y-2 p-4 text-[13px]">
      <p className="text-xs font-semibold text-ink-sub">
        지금 게재 {live.length} / 최대 {MAX_LIVE_ADS}곳 · 승인 순서 (노출 순서는 무작위)
      </p>
      {live.length > 0 && (
        <ol className="list-decimal space-y-0.5 pl-5 text-ink">
          {live.map((c) => (
            <li key={c.id} className="truncate">
              {c.company}
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs leading-relaxed text-ink-sub">
        화면마다 맨 위는 한인업소록, 그 아래 광고 홈 {home}칸 · 응답 대기·픽업·목적지 {call}칸 (픽업·목적지는 최근 장소 아래). 무료
        기간이라 화면에 들어올 때마다 무작위 순서로 나오고, 칸보다 많으면 그중 일부만 나옵니다.
      </p>
    </div>
  );
}
