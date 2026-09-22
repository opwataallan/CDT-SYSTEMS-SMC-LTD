// Firebase Cloud Messaging (FCM) Service Worker & Background Push Listener
// Supports standard Web Push events & future Firebase Web SDK background messaging

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      notification: {
        title: 'Cyber Dynamic Technologies',
        body: event.data.text(),
      },
    };
  }

  const notification = payload.notification || {};
  const data = payload.data || {};

  const title = notification.title || data.title || 'Cyber Dynamic Technologies';
  const body = notification.body || data.body || data.message || 'New tech update available';
  const icon = notification.icon || data.icon || '/pwa-192x192.png';
  const badge = notification.badge || '/pwa-192x192.png';
  const image = notification.image || data.image || data.banner_image;
  const tag = data.tag || data.type || 'cdt-push';

  const actions = [];
  if (data.type === 'order_update' || data.type === 'order_status') {
    actions.push({ action: 'view_order', title: 'Track Order 🚚' });
  } else if (data.type === 'flash_sale') {
    actions.push({ action: 'view_sale', title: 'Shop Deals ⚡' });
  }

  const options = {
    body,
    icon,
    badge,
    image,
    tag,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      ...data,
      url: data.click_action || data.target_url || '/',
      timestamp: Date.now(),
    },
    actions,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'CDT_PUSH_NOTIFICATION_CLICKED',
            data,
          });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
