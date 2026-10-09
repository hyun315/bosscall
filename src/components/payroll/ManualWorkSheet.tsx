"use client";
import { useState } from "react";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { fromDateTimeInputValue } from "@/lib/time";
import { addManualWorkSession } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { useI18n } from "@/i18n/client";

/** 근무기록 직접 추가 (사장님) — 기사가 출퇴근을 누르지 못한 날 */
export function ManualWorkSheet({
  groupId,
  driverId,
  tz,
  onClose,
}: {
  groupId: string;
  driverId: string;
  tz: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const { t } = useI18n();
  const [inV, setInV] = useState("");
  const [outV, setOutV] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const a = fromDateTimeInputValue(inV, tz);
    const b = fromDateTimeInputValue(outV, tz);
    if (a === null || b === null) {
      toast(t("work.needBoth"), "error");
      return;
    }
    setBusy(true);
    try {
      await addManualWorkSession(groupId, driverId, a, b);
      toast(t("work.addedToast"), "success");
      onClose();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} title={t("work.addTitle")}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="mw-in">{t("work.clockIn")}</label>
          <input id="mw-in" type="datetime-local" className="field" value={inV} onChange={(e) => setInV(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="mw-out">{t("work.clockOut")}</label>
          <input id="mw-out" type="datetime-local" className="field" value={outV} onChange={(e) => setOutV(e.target.value)} />
        </div>
        <p className="text-xs text-ink-sub">{t("work.tzNoteAdd", { tz })}</p>
        <Button block loading={busy} disabled={!inV || !outV} onClick={() => void save()}>
          {t("common.add")}
        </Button>
      </div>
    </BottomSheet>
  );
}
