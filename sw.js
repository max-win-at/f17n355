// Service Worker for Fitness Supreme PWA
const CACHE_NAME = "f17n355-v4";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/css/custom.css",
  "/js/app.js",
  "/js/models/Athlete.js",
  "/js/models/Workout.js",
  "/js/models/Milestone.js",
  "/js/models/Tier.js",
  "/js/models/TierConfiguration.js",
  "/js/repositories/AthleteRepository.js",
  "/js/repositories/WorkoutRepository.js",
  "/js/services/ProgressionService.js",
  "/js/services/StorageService.js",
  "/js/viewmodels/AthleteSetupViewModel.js",
  "/js/viewmodels/MainScreenViewModel.js",
  "/js/viewmodels/WorkoutHistoryViewModel.js",
  "/img/male0.png",
  "/img/male1.png",
  "/img/male2.png",
  "/img/male3.png",
  "/img/male4.png",
  "/img/female0.png",
  "/img/female1.png",
  "/img/female2.png",
  "/img/female3.png",
  "/img/female4.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  const isHtmlRequest =
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") || "").includes("text/html");

  // Network-first for HTML to ensure fresh app shell on hard refresh
  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put("/index.html", responseToCache);
          });
          return response;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  // Cache-first for other static assets with background update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    }),
  );
});

// Background sync for workout data (stub for future implementation)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-workouts") {
    event.waitUntil(syncWorkouts());
  }
});

async function syncWorkouts() {
  // TODO: Implement background sync for workout data
  console.log("Background sync triggered for workouts");
}
