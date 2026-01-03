
const CACHE_NAME = 'ledgerpro-v3';

// الأصول الثابتة التي يجب تخزينها عند التثبيت لضمان العمل Offline
const PRE_CACHE_ASSETS = [
  './',
  './index.html',
  './index.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap',
  'https://fonts.gstatic.com/s/cairo/v28/SLXGc1nu6Hkv3SInm1Y.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('LedgerPro: Pre-caching core assets...');
      return cache.addAll(PRE_CACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // استثناء طلبات Google Gemini API من التخزين لأنها تتطلب اتصالاً دائماً
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // تخزين ملفات esm.sh والمكتبات الخارجية لضمان استقرار التطبيق
        if (
          event.request.url.includes('esm.sh') || 
          event.request.url.includes('fonts.gstatic.com') ||
          event.request.url.endsWith('.js') ||
          event.request.url.endsWith('.css')
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // في حال عدم وجود إنترنت وعدم وجود الملف في الذاكرة المخبأة، نقوم بإرجاع الصفحة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
