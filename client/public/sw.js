// public/sw.js
//
// Web push service worker. Runs in the background, independent of any
// open tab — this is what lets a notification appear even when
// GoodCreator isn't open in the browser at all.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'GoodCreator', body: event.data.text() };
  }

  const { title = 'GoodCreator', body = '', url = '/', skipIfVisible = false } = payload;

  event.waitUntil(
    (async () => {
      if (skipIfVisible) {
        // iPhones require every push to be shown (otherwise the subscription is cancelled),
        // so only skip on other devices
        const isApple = /iPhone|iPad|iPod/i.test(self.navigator.userAgent || '');
        if (!isApple) {
          const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          if (windows.some((w) => w.visibilityState === 'visible')) return;
        }
      }
      await self.registration.showNotification(title, {
        body,
        icon: '/android-chrome-192x192.png',
        badge: '/android-chrome-192x192.png',
        data: { url },
      });
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
