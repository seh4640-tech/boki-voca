// 오프라인에서도 열리도록 캐시 (파일이 바뀌면 VERSION을 올리세요)
const VERSION = 'v15';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'garden.js', 'words.js', 'audio.js', 'sentences.js', 'manifest.json', 'icon.svg', 'icon-192.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 발음 녹음(외부 mp3)은 브라우저 기본 캐시에 맡김 (아이폰 재생 호환)
  if (url.origin !== location.origin) return;
  // 앱 파일: 네트워크 우선, 안 되면 캐시
  e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req)));
});
