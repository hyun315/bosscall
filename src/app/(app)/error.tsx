"use client";
import { CrashScreen } from "@/components/common/CrashScreen";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <CrashScreen error={error} reset={reset} />;
}
