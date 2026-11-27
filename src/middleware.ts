import { NextResponse, type NextRequest } from "next/server";

/**
 * 원치 않는 로봇 차단 — robots.txt 를 무시하는 수집기(SEO·AI 학습·대량 크롤러)를 화면 요청에서 403 으로 막는다.
 * 검색엔진(구글·네이버·빙·다음)과 링크 미리보기 로봇, 실제 사용자는 그대로 통과한다.
 * AI 검색 로봇(OAI-SearchBot·ChatGPT-User·PerplexityBot·Perplexity-User·Claude-SearchBot·Claude-User)도 통과 —
 * AI 답변에 보스콜이 소개되도록. AI 학습용 수집기(GPTBot·ClaudeBot·CCBot 등)는 계속 막는다.
 * API·정적 파일·로그인 경로는 검사하지 않는다(정기 실행 curl, 서버 호출 보호).
 */
const BLOCKED = new RegExp(
  [
    "AhrefsBot",
    "SemrushBot",
    "MJ12bot",
    "DotBot",
    "PetalBot",
    "Bytespider",
    "GPTBot",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "CCBot",
    "Amazonbot",
    "Applebot-Extended",
    "Google-Extended",
    "meta-externalagent",
    "ImagesiftBot",
    "DataForSeoBot",
    "BLEXBot",
    "serpstatbot",
    "SeekportBot",
    "MegaIndex",
    "Barkrowler",
    "Sogou",
    "YandexBot",
    "Baiduspider",
    "HeadlessChrome",
    "PhantomJS",
    "python-requests",
    "python-urllib",
    "aiohttp",
    "Go-http-client",
    "Scrapy",
    "node-fetch",
    "axios",
    "libwww-perl",
    "Wget",
    "zgrab",
    "masscan",
    "Nmap",
  ].join("|"),
  "i",
);

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BLOCKED.test(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  // 화면 요청만 검사 — API, Next 정적 파일, 로그인 프록시, 확장자가 있는 파일(robots.txt·sitemap.xml·이미지·PDF 등)은 제외
  matcher: ["/((?!api/|_next/|__/|_vercel/|.*\\..*).*)"],
};
