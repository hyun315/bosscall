/* BossCall 서비스워커 — Web Push 수신 및 알림 클릭 처리.
 * 서버는 data-only FCM 메시지를 보내며(민감정보 없음), 여기서 직접 알림을 표시한다.
 * iOS(홈 화면 PWA)는 푸시마다 반드시 알림을 표시해야 하므로 항상 showNotification 을 호출한다.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

function readPayload(event) {
  try {
    const json = event.data ? event.data.json() : {};
    // FCM 웹 푸시 페이로드: { data: {...}, notification?: {...}, ... }
    const data = json.data || json;
    return {
      title: data.title || (json.notification && json.notification.title) || "BossCall",
      body: data.body || (json.notification && json.notification.body) || "앱에서 확인해주세요.",
      url: data.url || "/home",
      type: data.type || "",
      callId: data.callId || "",
      urgent: data.urgent === "1",
    };
  } catch (e) {
    return { title: "BossCall", body: "앱에서 확인해주세요.", url: "/home", type: "", callId: "", urgent: false };
  }
}

self.addEventListener("push", (event) => {
  const p = readPayload(event);
  const options = {
    body: p.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    tag: p.callId ? "call-" + p.callId : p.type || "bosscall",
    renotify: true,
    requireInteraction: p.urgent,
    vibrate: p.urgent ? [300, 150, 300, 150, 600] : [200],
    data: { url: p.url },
  };
  event.waitUntil(self.registration.showNotification(p.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/home", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (new URL(c.url).origin === self.location.origin && "focus" in c) {
          c.navigate(target);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
