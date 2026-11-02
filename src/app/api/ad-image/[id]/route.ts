import { readPublicImage } from "@/services/server/ads";

/** 승인된 광고 이미지 — 이미지 id는 바뀌지 않으므로 CDN·브라우저에 오래 캐시 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/.test(id)) return new Response("Not found", { status: 404 });
  const img = await readPublicImage(id).catch(() => null);
  if (!img) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
