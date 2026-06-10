// Funil de Vendas Franquias e Máquinas — Service Worker v5.0
const CACHE_NAME = 'funil-vendas-v7';

// Assets to cache on install (app shell)
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
];

// External CDN scripts to cache
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

// ── INSTALL: cache app shell ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache local assets (required)
      cache.addAll(SHELL_ASSETS).catch(() => {});
      // Cache CDN assets (best-effort)
      CDN_ASSETS.forEach(url => cache.add(url).catch(() => {}));
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: remove old caches ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: strategy per request type ─────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip Supabase API calls — always network (real-time data)
  if (url.hostname.includes('supabase.co')) {
    return; // fall through to browser default
  }

  // CDN assets: cache-first (they're versioned and stable)
  if (url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // App shell (HTML + local files): network-first, fallback to cache
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Recurso não disponível offline.', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return the app shell for navigation requests
    if (request.mode === 'navigate') {
      const shell = await caches.match('/index.html');
      if (shell) return shell;
    }
    return new Response('Sem conexão com a internet.', { status: 503 });
  }
}
