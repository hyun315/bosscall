/*
 * 업데이트 직후 오래 켜 둔 화면이 옛 버전 파일을 찾다가 멈추는 경우(ChunkLoadError) — 한 번만 새로고침해서 최신으로.
 * 같은 탭에서 1분 안에 다시 일어나면 더 새로고침하지 않는다 (무한 반복 방지).
 */
(function () {
  var KEY = "bosscall.recoveredAt";
  function isStale(msg) {
    msg = String(msg || "");
    return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed/i.test(msg);
  }
  function recover(msg) {
    if (!isStale(msg)) return;
    try {
      var last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last < 60000) return;
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch (e) {}
    location.reload();
  }
  window.addEventListener("error", function (e) {
    recover((e && (e.message || (e.error && (e.error.name + " " + e.error.message)))) || "");
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    recover(r && (r.name + " " + r.message));
  });
})();
