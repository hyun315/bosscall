import "server-only";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { unauthorized, forbidden, notFound } from "@/lib/server/http";
import type { GroupDoc, MemberDoc, MemberRole } from "@/types/domain";

export interface AuthedUser {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
}

/** Authorization: Bearer <Firebase ID token> 검증 — 모든 API의 서버측 인증 (명세 §24) */
export async function requireUser(req: Request): Promise<AuthedUser> {
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer (.+)$/.exec(header);
  if (!m?.[1]) throw unauthorized();
  try {
    const decoded = await adminAuth().verifyIdToken(m[1]);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: typeof decoded.name === "string" ? decoded.name : null,
      picture: typeof decoded.picture === "string" ? decoded.picture : null,
      emailVerified: decoded.email_verified === true,
    };
  } catch {
    throw unauthorized("err.sessionExpired");
  }
}

export interface Membership {
  group: GroupDoc;
  member: MemberDoc;
  role: MemberRole;
}

/**
 * group_id 기반 서버측 권한 검사 (명세 §16, 코딩규칙 5).
 * current_user → group_members → authorized group
 */
export async function requireMember(
  groupId: string,
  uid: string,
  allowed?: readonly MemberRole[],
): Promise<Membership> {
  const db = adminDb();
  const [gSnap, mSnap] = await Promise.all([
    db.doc(`groups/${groupId}`).get(),
    db.doc(`groups/${groupId}/members/${uid}`).get(),
  ]);
  if (!gSnap.exists) throw notFound("err.groupNotFound");
  if (!mSnap.exists) throw forbidden("err.notMember");
  const member = mSnap.data() as MemberDoc;
  if (allowed && !allowed.includes(member.role)) throw forbidden();
  return { group: gSnap.data() as GroupDoc, member, role: member.role };
}

/** 서비스 운영자인지 (서버 환경변수 OPERATOR_EMAILS — 쉼표로 구분) */
export function isOperator(user: AuthedUser): boolean {
  const list = (process.env.OPERATOR_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return user.emailVerified && !!user.email && list.includes(user.email.toLowerCase());
}

/** 운영자 전용 API — 익명 통계 리포트·자체 장소 목록 관리 */
export async function requireOperator(req: Request): Promise<AuthedUser> {
  const user = await requireUser(req);
  if (!isOperator(user)) throw forbidden();
  return user;
}
