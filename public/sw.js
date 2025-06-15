
const CACHE_NAME = 'restaurant-link-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Notification scheduling for meal periods
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Schedule notifications (this would need to be triggered by the main app)
function scheduleNotification(title, body, time) {
  self.registration.showNotification(title, {
    body: body,
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    tag: 'meal-reminder',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Menus'
      }
    ]
  });
}
