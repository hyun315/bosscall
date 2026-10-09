"use client";
/**
 * 운영자 도구 — 서비스 운영자(OPERATOR_EMAILS)만 쓰는 화면이라 한국어로만 둔다.
 *  · 익명 운행 통계 리포트 (CSV 내려받기)
 *  · 자체 장소 목록(POI) 등록 — 운행 도착 지점을 골프장·학교 등으로 분류하는 기준
 */
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/common/Button";
import { EmptyState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { REPORT_DIMENSIONS, REPORT_MIN_COUNT, type ReportDimension } from "@/lib/tripData";
import { getOperatorStatus, getPois, getTripReport, uploadPois, type TripReport } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { PLACE_CATEGORIES, type PoiDoc } from "@/types/domain";

const DIM_LABEL: Record<ReportDimension, string> = {
  month: "월",
  weekday: "요일(0=일)",
  timeBand: "3시간대",
  dropoffCategory: "도착 분류",
  dropoffCell: "도착 구역(1km)",
  pickupCell: "출발 구역(1km)",
};

function monthStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function OperatorPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    getOperatorStatus()
      .then((r) => setAllowed(r.operator))
      .catch(() => setAllowed(false));
  }, []);

  return (
    <>
      <AppHeader title="운영자 도구" back="/settings" />
      <main className="mx-auto max-w-md space-y-6 px-4 pb-8 pt-3">
        {allowed === null && <LoadingState />}
        {allowed === false && (
          <EmptyState icon="🔒" title="운영자만 볼 수 있습니다." description="서버 환경변수 OPERATOR_EMAILS 에 이 Google 계정을 넣어야 합니다." />
        )}
        {allowed && (
          <>
            <ReportSection />
            <PoiSection />
          </>
        )}
      </main>
    </>
  );
}

function ReportSection() {
  const toast = useToast();
  const now = new Date();
  const [dims, setDims] = useState<ReportDimension[]>(["month", "dropoffCategory"]);
  const [from, setFrom] = useState(monthStr(new Date(now.getFullYear(), now.getMonth() - 2, 1)));
  const [to, setTo] = useState(monthStr(now));
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<TripReport | null>(null);

  const run = async () => {
    setBusy(true);
    try {
      setReport(await getTripReport(dims, from, to));
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!report) return;
    // 엑셀에서 한글이 깨지지 않도록 BOM
    const blob = new Blob(["﻿" + report.csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bosscall-trips-${from}_${to}-${dims.join("-")}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  return (
    <section className="space-y-3">
      <h2 className="section-title">익명 운행 통계</h2>
      <div className="card space-y-4 p-4">
        <div>
          <span className="label">묶는 기준</span>
          <div className="flex flex-wrap gap-2">
            {REPORT_DIMENSIONS.map((d) => {
              const on = dims.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setDims(on ? dims.filter((x) => x !== d) : [...dims, d])}
                  className={`min-h-[40px] rounded-full border px-3 text-sm ${
                    on ? "border-action bg-action-soft font-semibold text-action" : "border-line text-ink-sub"
                  }`}
                >
                  {DIM_LABEL[d]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="rep-from">시작 월</label>
            <input id="rep-from" type="month" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="rep-to">끝 월</label>
            <input id="rep-to" type="month" className="field" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <Button block loading={busy} disabled={dims.length === 0} onClick={() => void run()}>
          리포트 만들기
        </Button>
        <p className="text-xs leading-relaxed text-ink-faint">
          통계 활용에 동의한 호출자의 운행만 들어 있습니다. 같은 묶음이 {REPORT_MIN_COUNT}건 미만이면 자동으로 뺍니다.
          기준을 많이 고를수록 묶음이 잘게 나뉘어 빠지는 건수가 늘어납니다.
        </p>
      </div>

      {report && (
        <div className="card space-y-3 p-4">
          <p className="text-sm text-ink">
            전체 {report.totalTrips}건 · 묶음 {report.groups}개 · 제외 {report.suppressedTrips}건
            {report.truncated && " · 최대 건수에 걸려 일부만 집계됨"}
          </p>
          {report.preview.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-ink-sub">
                  <tr>
                    {dims.map((d) => (
                      <th key={d} className="py-1 pr-3 font-medium">{DIM_LABEL[d]}</th>
                    ))}
                    <th className="py-1 pr-3 font-medium">건수</th>
                    <th className="py-1 font-medium">평균 분</th>
                  </tr>
                </thead>
                <tbody>
                  {report.preview.map((r, i) => (
                    <tr key={i} className="border-t border-line tabular-nums">
                      {dims.map((d) => (
                        <td key={d} className="py-1.5 pr-3">{r.key[d]}</td>
                      ))}
                      <td className="py-1.5 pr-3">{r.count}</td>
                      <td className="py-1.5">{r.avgTripMinutes ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-ink-sub">내보낼 수 있는 묶음이 아직 없습니다.</p>
          )}
          <Button variant="secondary" block onClick={download} disabled={report.groups === 0}>
            CSV 내려받기
          </Button>
        </div>
      )}
    </section>
  );
}

const POI_EXAMPLE = "이름,분류,위도,경도,반경m\n예) 골프장 A,GOLF,-6.2800,106.7800,400";

function PoiSection() {
  const toast = useToast();
  const [pois, setPois] = useState<PoiDoc[] | null>(null);
  const [csv, setCsv] = useState("");
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ line: number; reason: string }[]>([]);

  const load = () =>
    getPois()
      .then((r) => setPois(r.pois))
      .catch((e) => toast(errorMessage(e), "error"));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async () => {
    setBusy(true);
    setErrors([]);
    try {
      const r = await uploadPois(csv, replace);
      if (r.errors.length > 0) {
        setErrors(r.errors);
      } else {
        toast(`${r.saved}곳을 저장했습니다.`, "success");
        setCsv("");
        await load();
      }
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="section-title">자체 장소 목록 {pois ? `(${pois.length})` : ""}</h2>
      <div className="card space-y-3 p-4">
        <p className="text-sm leading-relaxed text-ink-sub">
          운행이 끝난 지점(기사 GPS)이 이 장소의 반경 안이면 그 분류로 셉니다. 분류: {PLACE_CATEGORIES.join(", ")}
        </p>
        <p className="text-xs leading-relaxed text-warning-text">
          좌표는 현장 GPS나 지도 핀으로 직접 확인한 값만 넣으세요. 구글 검색 결과의 좌표를 옮겨 적으면 구글 약관 위반입니다.
        </p>
        <textarea
          className="field min-h-[140px] font-mono text-sm"
          placeholder={POI_EXAMPLE}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="h-5 w-5 accent-action" checked={replace} onChange={() => setReplace(!replace)} />
          기존 목록을 지우고 새로 넣기
        </label>
        {errors.length > 0 && (
          <ul className="space-y-1 text-sm text-danger">
            {errors.slice(0, 10).map((e) => (
              <li key={e.line}>
                {e.line}번째 줄: {e.reason}
              </li>
            ))}
          </ul>
        )}
        <Button block loading={busy} disabled={!csv.trim()} onClick={() => void upload()}>
          등록
        </Button>
      </div>
      {pois && pois.length > 0 && (
        <div className="card divide-y divide-line">
          {pois.slice(0, 50).map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="truncate text-ink">{p.name}</span>
              <span className="shrink-0 text-ink-sub">
                {p.category} · {p.radiusM}m
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
