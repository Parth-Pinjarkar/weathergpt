/**
 * WeatherGPT — Service Worker
 * ───────────────────────────
 * Provides:
 *  • Offline fallback for previously visited pages
 *  • Cache-first strategy for static assets
 *  • Network-first strategy for API calls (with cache fallback)
 *  • Background sync queue for failed requests
 */

const CACHE_VERSION = "weathergpt-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
];

// API paths that should be cached (network-first, then cache)
const API_CACHE_PATTERNS = [
  /\/api\/weather\//,
  /\/api\/alerts/,
  /\/api\/location/,
];

// ── Install: pre-cache static assets ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith("weathergpt-") && name !== STATIC_CACHE && name !== API_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategy ───────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // WebSocket — skip
  if (url.protocol === "ws:" || url.protocol === "wss:") return;

  // API routes: network-first, fall back to cache
  if (API_CACHE_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(networkFirstWithCache(request, API_CACHE, 10000));
    return;
  }

  // Static assets: cache-first
  event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
});

// ── Strategy: Network first, then cache ──────────────────────────────────────
async function networkFirstWithCache(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await Promise.race([
      fetch(request.clone()),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      ),
    ]);

    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Network failed — try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Return offline JSON for API calls
    return new Response(
      JSON.stringify({
        offline: true,
        message: "You are offline. Showing cached data.",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 503,
      }
    );
  }
}

// ── Strategy: Cache first, then network ──────────────────────────────────────
async function cacheFirstWithNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Return a minimal offline HTML page
    return new Response(
      `<!DOCTYPE html><html><head><title>WeatherGPT — Offline</title>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width">
      <style>body{background:#0f172a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
      .card{background:#1e293b;border-radius:16px;padding:2rem;text-align:center;max-width:400px;}
      h1{color:#6366f1;font-size:1.5rem;}p{color:#94a3b8;}</style></head>
      <body><div class="card"><h1>🌧️ WeatherGPT</h1>
      <p>You're currently offline. Please check your connection and try again.</p>
      <p>Previously viewed weather data may still be available in the app.</p></div></body></html>`,
      { headers: { "Content-Type": "text/html" }, status: 503 }
    );
  }
}

// ── Push notifications (for future server-sent alerts) ────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "WeatherGPT Alert", {
      body: data.body || "New weather alert for your area.",
      icon: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f326.png",
      badge: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f326.png",
      tag: "weathergpt-alert",
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
