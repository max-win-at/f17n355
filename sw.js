// Service Worker for Fitness Supreme PWA
// Cache version controlled by version.json file
let CACHE_VERSION = "f17n355-0.1.0.0";
let CACHE_NAME = CACHE_VERSION;
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

// Check version file to detect deployments
async function checkVersion() {
  try {
    const response = await fetch("/version.json?t=" + Date.now());
    if (response.ok) {
      const data = await response.json();
      const newVersion = "f17n355-" + data.version;
      if (newVersion !== CACHE_VERSION) {
        CACHE_VERSION = newVersion;
        CACHE_NAME = newVersion;
        console.log("Cache version updated to:", CACHE_NAME);
        // Clear old caches when version changes
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("Deleting old cache:", name);
              return caches.delete(name);
            }
          }),
        );
      }
    }
  } catch (error) {
    console.error("Failed to check version:", error);
  }
}

// Check version on install
async function installWithVersionCheck() {
  await checkVersion();
  return caches
    .open(CACHE_NAME)
    .then((cache) => {
      console.log("Caching static assets with version:", CACHE_NAME);
      return cache.addAll(STATIC_ASSETS);
    })
    .then(() => self.skipWaiting());
}

// Install event - cache static assets with version check
self.addEventListener("install", (event) => {
  event.waitUntil(installWithVersionCheck());
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

  // Stale-while-revalidate for HTML - serve cache immediately, update in background
  if (isHtmlRequest) {
    event.respondWith(
      (async () => {
        // Check version before serving
        await checkVersion();

        const cachedResponse = await caches.match(event.request);
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

        // Return cached response immediately, or wait for network if no cache
        return cachedResponse || fetchPromise;
      })(),
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
