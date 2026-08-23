// Basit önbellek: uygulama tamamen statik olduğu için tüm dosyaları kurulumda alıp
// çevrimdışı çalıştırıyoruz. Dosya değiştikçe SURUM numarasını artır.
const SURUM = "kpss-lab-v3";
const DOSYALAR = [
  "./", "./index.html", "./style.css", "./app.js", "./ai.js", "./manifest.json",
  "./icon-192.png", "./icon-512.png",
  "./data/turkce.js", "./data/turkce2.js",
  "./data/matematik.js", "./data/matematik2.js",
  "./data/tarih.js", "./data/tarih2.js",
  "./data/cografya.js", "./data/cografya2.js",
  "./data/vatandaslik.js", "./data/vatandaslik2.js",
  "./data/kartlar.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SURUM)
    .then(c => Promise.allSettled(DOSYALAR.map(d => c.add(d))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== SURUM).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // AI istekleri ağa gitsin
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request).then(r => {
      const kopya = r.clone();
      caches.open(SURUM).then(ch => ch.put(e.request, kopya));
      return r;
    }).catch(() => caches.match("./index.html")))
  );
});
