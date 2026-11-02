/*
 * 인앱 브라우저(카카오톡·라인·인스타그램·페이스북·네이버 등)에서 열리면 외부 브라우저로 옮긴다.
 * 구글 로그인은 인앱 브라우저를 막고(disallowed_useragent), 알림·홈 화면 추가도 안 되기 때문.
 *  - 카카오톡: 아이폰 kakaotalk://web/openExternal (Safari), 안드로이드 Chrome intent
 *  - 라인: ?openExternalBrowser=1
 *  - 안드로이드 그 밖의 인앱: Chrome 으로 intent
 *  - 아이폰 그 밖의 인앱: 자동으로는 불가 → 앱 화면에서 "Safari로 열기" 안내 (InAppBrowserNotice)
 * 같은 탭에서 두 번 이상 시도하지 않는다 (실패 시 무한 반복 방지).
 */
(function () {
  try {
    var ua = navigator.userAgent || "";
    var href = location.href;
    var KEY = "bosscall.extTried";
    if (sessionStorage.getItem(KEY)) return;
    var isAndroid = /Android/i.test(ua);
    var go = null;
    var toChrome =
      "intent://" + location.host + location.pathname + location.search + location.hash +
      "#Intent;scheme=https;package=com.android.chrome;end";
    if (/KAKAOTALK/i.test(ua)) {
      // 안드로이드는 Chrome 으로 (기본 브라우저가 삼성 인터넷이면 홈 화면 앱이 Play 프로텍트에 막힌다)
      go = isAndroid ? toChrome : "kakaotalk://web/openExternal?url=" + encodeURIComponent(href);
    } else if (/ Line\//i.test(ua)) {
      if (!/[?&]openExternalBrowser=1/.test(href)) go = href + (href.indexOf("?") < 0 ? "?" : "&") + "openExternalBrowser=1";
    } else if (isAndroid && /; wv\)|FBAN|FBAV|Instagram|NAVER\(inapp|DaumApps|everytimeApp|Whale\/.*inapp/i.test(ua)) {
      go = toChrome;
    }
    if (go) {
      sessionStorage.setItem(KEY, "1");
      location.href = go;
    }
  } catch (e) {
    /* 무시 — 앱 화면의 안내가 대신한다 */
  }
})();
