const CACHE_NAME = 'noura-kasir-v1.2';
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Amiri&display=swap'
];

// Install Service Worker dan simpan aset ke cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Mengunduh aset inti ke dalam cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aktivasi Service Worker dan bersihkan cache lama jika ada
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Strategi Fetch: Network First, Fallback to Cache
// Mengutamakan jaringan agar data transaksi & Al-Qur'an dari API tetap terupdate secara real-time
self.addEventListener('fetch', event => {
  // Abaikan request Google Apps Script dan API Al-Qur'an agar tidak terjadi bentrok cache data harian
  if (event.request.url.includes('script.google.com') || event.request.url.includes('equran.id')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Jika sukses di jaringan, salin ke cache untuk cadangan offline aset statis
        if (response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
