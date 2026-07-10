// firebase-messaging-sw.js
// Runs in the background — this is what lets a push notification arrive
// even when BossCall isn't open and the screen is locked.
// Must live at the SITE ROOT (same folder as index.html), not in /api.

importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC_BLG_30vhNNBeaP-WV9cXDTWgVEf2PMU",
  authDomain: "bosscall-c1644.firebaseapp.com",
  databaseURL: "https://bosscall-c1644-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bosscall-c1644",
  storageBucket: "bosscall-c1644.firebasestorage.app",
  messagingSenderId: "790009415217",
  appId: "1:790009415217:web:1cf42cde760972b982f710"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "BossCall";
  const body = (payload.notification && payload.notification.body) || "";
  self.registration.showNotification(title, {
    body,
    tag: "bosscall-alert",
    renotify: true,
    data: { url: (payload.fcmOptions && payload.fcmOptions.link) || "/" }
  });
});

// Tapping the notification focuses an already-open BossCall tab if there is
// one, otherwise opens a new one — this is what makes "탭하면 화면 이동" work
// even when the app was fully closed.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
