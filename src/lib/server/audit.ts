import "server-only";
import type { Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export interface AuditEntry {
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  before?: Json;
  after?: Json;
}

/** 감사 로그 (명세 §24). Owner만 조회 가능 (firestore.rules) */
export function writeAudit(groupId: string, entry: AuditEntry, tx?: Transaction): void | Promise<unknown> {
  const ref = adminDb().collection(`groups/${groupId}/auditLogs`).doc();
  const data = { ...entry, id: ref.id, groupId, createdAt: Date.now() };
  if (tx) {
    tx.set(ref, data);
    return;
  }
  return ref.set(data);
}
