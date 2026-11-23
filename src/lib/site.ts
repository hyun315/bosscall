/**
 * 공식 사이트 주소와 검색엔진 등록 정보.
 * 대표 주소는 www.bosscallapp.com (bosscallapp.com 은 www 로 자동 이동).
 */
export const SITE_URL = "https://www.bosscallapp.com";
export const SITE_HOST = "www.bosscallapp.com";

/**
 * 검색엔진 소유 확인 코드 — Google Search Console·네이버 서치어드바이저에서
 * 「HTML 태그」 방식으로 받은 content 값만 넣는다 (비밀값 아님).
 */
export const SITE_VERIFICATION = {
  google: "",
  naver: "",
};

/** 로그인 없이 열리는 공개 페이지 — sitemap.xml 에 실린다 */
export const PUBLIC_PATHS = ["/login", "/about", "/guide", "/guide/driver", "/manual", "/manual/driver", "/advertise"];
