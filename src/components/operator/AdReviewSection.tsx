"use client";
/** 운영자 도구 › 광고 신청 검토 · 게재 관리 (한국어 전용) */
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { PaidBanner } from "@/components/ads/AdSlot";
import { AdPlaceField } from "@/components/ads/AdPlaceField";
import { AD_MONTHS, PRODUCT_INFO, SLOT_INFO, type AdCampaignDoc, type AdRequestDoc } from "@/lib/ads";
import { approveAd, endAdCampaign, getAdRequest, getAdRequests, rejectAd, setAdCampaignPlace } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";

type Tab = "pending" | "live" | "done";

const day = (ms: number) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Jakarta", month: "numeric", day: "numeric" }).format(ms);
const slotName = (s: string) => SLOT_INFO.find((x) => x.slot === s)?.title ?? s;

export function AdReviewSection() {
  const toast = useToast();
  const [data, setData] = useState<{ requests: AdRequestDoc[]; campaigns: AdCampaignDoc[] } | null>(null);
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
  const campaigns = (data?.campaigns ?? []).filter((c) => c.endAt > now);

  return (
    <section className="space-y-3">
      <h2 className="section-title">광고 신청</h2>
      <div className="flex gap-1 rounded-btn bg-line/60 p-1">
        {(
          [
            ["pending", `검토 대기 ${pending.length}`],
            ["live", `게재 중·예정 ${campaigns.length}`],
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
          {campaigns.map((c) => (
            <div key={c.id} className="card space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-ink">{c.company}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.startAt <= now ? "bg-success-soft text-success" : "bg-warning-soft text-warning-text"}`}
                >
                  {c.startAt <= now ? "게재 중" : "예정"}
                </span>
              </div>
              <p className="text-sm text-ink-sub">
                {day(c.startAt)} ~ {day(c.endAt - 1)} · {c.slots.map(slotName).join(", ")}
              </p>
              <PaidBanner
                company={c.company}
                bannerUrl={c.bannerUrl}
                detailUrl={c.detailUrl}
                linkUrl={c.linkUrl}
                onGo={c.place ? () => undefined : undefined}
              />
              <div>
                <span className="label">업소 위치 ([여기로 가기] 단추)</span>
                <AdPlaceField
                  value={c.place ?? null}
                  onChange={(p) => {
                    setAdCampaignPlace(c.id, p)
                      .then(() => {
                        toast(p ? "위치를 넣었습니다. 몇 분 안에 앱에 반영됩니다." : "위치를 지웠습니다.");
                        load();
                      })
                      .catch((e) => toast(errorMessage(e), "error"));
                  }}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (!window.confirm(`${c.company} 광고를 지금 내릴까요?`)) return;
                  endAdCampaign(c.id)
                    .then(() => {
                      toast("광고를 내렸습니다.");
                      load();
                    })
                    .catch((e) => toast(errorMessage(e), "error"));
                }}
              >
                지금 내리기
              </Button>
            </div>
          ))}
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

function RequestCard({ r, open, onToggle, onDone }: { r: AdRequestDoc; open: boolean; onToggle: () => void; onDone: () => void }) {
  const toast = useToast();
  const [images, setImages] = useState<{ banner: string | null; detail: string | null } | null>(null);
  const [startDate, setStartDate] = useState(r.startDate);
  const [months, setMonths] = useState<number>(r.months);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [full, setFull] = useState<string[] | null>(null);

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
      const res = await approveAd(r.id, startDate, months);
      if (res.ok) {
        toast("승인했습니다. 시작일에 자동으로 올라갑니다.");
        onDone();
      } else setFull(res.fullSlots);
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
          {full && (
            <p className="rounded-btn bg-warning-soft px-3 py-2 text-sm text-warning-text">
              이 기간에 자리가 찼습니다 ({full.map(slotName).join(", ")} — 최대 3곳). 시작일을 바꿔 다시 승인하세요.
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
