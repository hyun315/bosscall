"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastCtx = createContext<(message: string, tone?: ToastTone) => void>(() => undefined);

/** 토스트 (§18 Toast) — 성공/오류 피드백 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const id = ++seq.current;
    setItems((xs) => [...xs.slice(-2), { id, message, tone }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), tone === "error" ? 4500 : 2800);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[calc(12px+var(--safe-top))] z-[60] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto w-full max-w-sm rounded-btn px-4 py-3 text-[15px] font-medium text-white shadow-modal ${
              t.tone === "error" ? "bg-danger" : t.tone === "success" ? "bg-success" : "bg-navy"
            }`}
          >
            {t.tone === "success" ? "✓ " : t.tone === "error" ? "⚠ " : ""}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
