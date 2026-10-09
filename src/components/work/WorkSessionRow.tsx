"use client";
import { useState } from "react";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { formatDate, formatDuration, formatTime, fromDateTimeInputValue, toDateTimeInputValue, workDurationMs } from "@/lib/time";
import { editWorkSession } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import type { WorkSessionDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/** 근무기록 한 줄 — Owner는 탭하여 수정 (§29 기록 수정 권한 통제: 서버에서 Owner만 허용 + 감사 로그) */
export function WorkSessionRow({
  session,
  driverName,
  tz,
  now,
  editable,
  groupId,
}: {
  session: WorkSessionDoc;
  driverName: string;
  tz: string;
  now: number;
  editable: boolean;
  groupId: string;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const dur = workDurationMs(session.clockInAt, session.clockOutAt, now);
  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">
          {formatDate(session.clockInAt, tz, locale)} · {driverName}
        </p>
        <p className="mt-0.5 text-sm tabular-nums text-ink-sub">
          {formatTime(session.clockInAt, tz)} ~ {session.clockOutAt ? formatTime(session.clockOutAt, tz) : t("common.inProgress")}
          {session.editedAt ? ` · ${t("work.edited")}` : ""}
        </p>
      </div>
      <span className={`text-[15px] font-bold tabular-nums ${session.clockOutAt ? "text-ink" : "text-success"}`}>
        {formatDuration(dur, locale)}
      </span>
      {editable && (
        <span className="text-ink-faint" aria-hidden>
          ›
        </span>
      )}
    </div>
  );
  if (!editable) return content;
  return (
    <>
      <button className="block w-full text-left active:bg-bg" onClick={() => setOpen(true)} aria-label={t("work.editAria", { name: driverName })}>
        {content}
      </button>
      {open && <WorkSessionEditor session={session} tz={tz} groupId={groupId} onClose={() => setOpen(false)} />}
    </>
  );
}

function WorkSessionEditor({
  session,
  tz,
  groupId,
  onClose,
}: {
  session: WorkSessionDoc;
  tz: string;
  groupId: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const { t } = useI18n();
  const [inV, setInV] = useState(toDateTimeInputValue(session.clockInAt, tz));
  const [outV, setOutV] = useState(session.clockOutAt ? toDateTimeInputValue(session.clockOutAt, tz) : "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const clockInAt = fromDateTimeInputValue(inV, tz);
    const clockOutAt = outV ? fromDateTimeInputValue(outV, tz) : null;
    if (clockInAt === null || (outV && clockOutAt === null)) {
      toast(t("work.badTime"), "error");
      return;
    }
    setBusy(true);
    try {
      await editWorkSession(groupId, session.id, clockInAt, clockOutAt);
      toast(t("work.editedToast"), "success");
      onClose();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} title={t("work.editTitle")}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="ws-in">
            {t("work.clockIn")}
          </label>
          <input id="ws-in" type="datetime-local" className="field" value={inV} onChange={(e) => setInV(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="ws-out">
            {t("work.clockOut")} {session.clockOutAt ? "" : t("work.keepOpenHint")}
          </label>
          <input id="ws-out" type="datetime-local" className="field" value={outV} onChange={(e) => setOutV(e.target.value)} />
        </div>
        <p className="text-xs text-ink-sub">{t("work.tzNoteEdit", { tz })}</p>
        <Button block loading={busy} onClick={() => void save()}>
          {t("common.save")}
        </Button>
      </div>
    </BottomSheet>
  );
}
