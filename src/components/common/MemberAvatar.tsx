/** 구성원 아바타 (§18 MemberAvatar) — 사진이 없으면 이름 첫 글자 */
export function MemberAvatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const initial = name.trim().charAt(0) || "?";
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" referrerPolicy="no-referrer" className="shrink-0 rounded-full object-cover" style={style} />;
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-navy font-semibold text-white"
      style={style}
      aria-hidden
    >
      {initial}
    </span>
  );
}
