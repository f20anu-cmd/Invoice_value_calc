const CACHE = "ivc-cache-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./js/loadMaster.js",
  "./data/prices.xlsx",
  "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.map(k=>k!==CACHE?caches.delete(k):null)
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(resp =>
      resp || fetch(e.request).then(r=>{
        if(e.request.method==="GET"){
          const copy = r.clone();
          caches.open(CACHE).then(c=>c.put(e.request,copy));
        }
        return r;
      }).catch(()=>resp)
    )
  );
});
