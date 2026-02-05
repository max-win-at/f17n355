# Architecture Documentation

## Project Overview

This is a Progressive Web Application (PWA) and single-page application (SPA) built with pure ES6 JavaScript, following strict architectural principles and patterns. The application must work fully offline and sync data when connectivity is restored.

## Core Technology Stack

### JavaScript Framework

- **Alpine.js**: Primary reactive framework for all UI interactions
- **Pure ES6 JavaScript**: No transpilation, no build step required
- All-in on Alpine.js - no mixing with other reactive frameworks

### Styling

- **Tailwind CSS**: Primary styling framework (use Tailwind utilities first)
- **Custom CSS**: Only when Tailwind utilities are insufficient
- **Google Material Design**: Fonts and icons standard

### Design Pattern

- **MVVM (Model-View-ViewModel)**: Strict separation of concerns for all visual components

### Progressive Web App (PWA)

- **Offline-First**: Application must function without network connectivity
- **Service Worker**: Cache assets and API responses for offline access
- **Installable**: Users can install the app on their devices
- **App Manifest**: Proper manifest.json configuration
- **Background Sync**: Sync offline data when connectivity returns

## Architectural Principles

### 1. Dependency Injection & IoC Container

#### app.js as Central Registry

- `app.js` serves as the IoC container and dependency collector
- All services, repositories, and utilities are instantiated in `app.js`
- Dependencies are passed via constructor injection
- No global variables or service locators

#### Registration Pattern

```javascript
// IoC manual object creation & resolution
const viewModel = new ViewModel(dependency1, dependency2);

//... more creation and resolution - order relevant

// Register singletons via Alpine.data()
Alpine.data("viewModelName", viewModel);
// Transients are created on-demand but follow same pattern
Alpine.data(
  "anotherViewModelName",
  new AnotherViewModel(
    dependency1,
    dependency2,
    viewModel /*e.g.: parent viewmodel*/,
  ),
);
```

#### Dependency Flow

```
app.js → constructs services → injects into ViewModels via Alpine.data()
```

### 2. Repository Pattern & Data Persistence

#### Repository Pattern

- **All data persistence goes through repositories**
- Repositories provide explicit, semantic methods for data operations
- No direct storage access from ViewModels or Services
- Repositories are injected as dependencies

#### Storage Strategy

##### localStorage - User Preferences

- Use for user settings, preferences, and configuration
- Lightweight key-value storage
- Synchronous API is acceptable for preferences
- Examples: theme, language, UI layout preferences

##### IndexedDB - Offline Data

- Use for offline recorded data (e.g., training proof, workout logs)
- Structured data that needs to be synced later
- Asynchronous API required
- Examples: training sessions, measurements, logs

##### Future Sync to NoSQL Service

- IndexedDB data will eventually sync to remote NoSQL storage
- Repository layer abstracts the sync mechanism
- Conflict resolution handled by repository
- Sync status tracked per record

#### Repository Method Guidelines

```javascript
// ✅ Good: Explicit semantic methods
class TrainingRepository {
  async saveTrainingSession(session) {
    /* ... */
  }
  async getTrainingSessionById(id) {
    /* ... */
  }
  async getAllPendingSyncSessions() {
    /* ... */
  }
  async markSessionAsSynced(id) {
    /* ... */
  }
}

// ✅ Good: User preferences repository
class UserPreferencesRepository {
  saveThemePreference(theme) {
    /* localStorage */
  }
  getThemePreference() {
    /* localStorage */
  }
  saveLanguage(language) {
    /* localStorage */
  }
  getLanguage() {
    /* localStorage */
  }
}

// ❌ Bad: Generic CRUD methods
class GenericRepository {
  save(entity) {
    /* too generic */
  }
  get(id) {
    /* unclear what entity */
  }
  update(entity) {
    /* lacks domain semantics */
  }
}
```

#### Repository Implementation Rules

1. **Semantic Method Names**: Methods should clearly express business intent
2. **Type Safety**: Accept and return specific domain models
3. **Error Handling**: Repositories handle storage errors gracefully
4. **Abstraction**: Hide storage implementation details
5. **Sync Awareness**: IndexedDB repositories track sync status

#### Storage Access Pattern

```
ViewModel → Service → Repository → Storage (localStorage/IndexedDB)
         ↑
         └─ Never direct storage access
```

### 3. MVVM Pattern Implementation

#### ViewModel Rules

- **ViewModels are registered via `Alpine.data()`**
- All UI state lives in public fields of ViewModels
- ViewModels receive dependencies through constructor parameters
- ViewModels expose:
  - **Public fields**: Bound directly to HTML elements
  - **Public methods**: Called from HTML event handlers
  - **Computed properties**: Derived state using getters
  - **Events**: For ViewModel-to-ViewModel communication
- ViewModel composite pattern:
  - Sub/child viewmodel are injected to parent
  - parent subscribes to sub viewmodel events
  - sub viewmodel remains unaware to parent

#### Model Layer

- Business logic and data structures
- Independent of UI concerns
- Injected into ViewModels as services

#### View Layer (HTML)

- Pure declarative markup
- All elements bind to ViewModel public fields
- Use Alpine.js directives: `x-data`, `x-bind`, `x-on`, `x-model`, `x-show`, `x-if`, etc.
- No inline JavaScript logic beyond simple property access

### 4. No Direct DOM Manipulation

#### Strict Prohibition

- **NEVER** access `document.querySelector()` in ViewModels
- **NEVER** create DOM elements programmatically in ViewModels
- **NEVER** manipulate `element.style`, `element.classList`, etc. in ViewModels

#### Allowed Approaches

- **Field bindings**: Use `x-bind:class`, `x-bind:style`, `x-model`
- **Conditional rendering**: Use `x-if`, `x-show`
- **Event handlers**: Use `x-on:click`, `x-on:input`, etc.
- **ViewModel events**: Use custom events or observable patterns for communication

#### Example of Correct Pattern

```html
<!-- View -->
<div x-data="myViewModel()">
  <button
    x-on:click="handleClick()"
    x-bind:class="buttonClass"
    x-bind:disabled="isDisabled"
  >
    <span x-text="buttonText"></span>
  </button>
</div>
```

```javascript
// ViewModel
Alpine.data("myViewModel", (someService) => ({
  // Public fields (bound to view)
  buttonText: "Click Me",
  isDisabled: false,

  // Computed properties
  get buttonClass() {
    return this.isDisabled
      ? "opacity-50 cursor-not-allowed"
      : "hover:bg-blue-600";
  },

  // Public methods (called from view)
  handleClick() {
    this.isDisabled = true;
    someService.doSomething().then(() => {
      this.isDisabled = false;
    });
  },
}));
```

### 5. Markup and HTML Structure

#### HTML is Source of Truth

- All markup is explicit and lives in HTML files
- No programmatic HTML generation in JavaScript
- Use `x-for` for dynamic lists
- Use `x-if` and `x-show` for conditional rendering
- Templates can use `<template>` tags with Alpine.js directives

#### Multi-File Structure

- Separate HTML files are allowed and encouraged for modularity
- Each HTML file can contain multiple Alpine.js components
- Use proper semantic HTML5 structure

### 6. Styling Guidelines

#### Tailwind First

- Use Tailwind utility classes for all standard styling needs
- Responsive design: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes
- State variants: `hover:`, `focus:`, `active:`, `disabled:`
- Dark mode: Use `dark:` prefix when applicable

#### Custom CSS

- Only add custom CSS when Tailwind utilities are genuinely insufficient
- Place custom styles in dedicated CSS files
- Use CSS custom properties (variables) for theme values
- Follow BEM or similar naming convention for custom classes

#### Material Design Integration

- **Fonts**: Use Google Material Design font recommendations
  - Primary: Roboto, Inter, or similar
- **Icons**: Use Material Icons (icon font or SVG)
  - Include via CDN or local copy
  - Reference in HTML: `<i class="material-icons">icon_name</i>`

### 7. Application Structure

#### File Organization

```
/
├── index.html              # Main HTML entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── css/
│   ├── tailwind.css       # Tailwind CSS
│   └── custom.css         # Custom styles (if needed)
├── js/
│   ├── app.js             # IoC container, dependency registration
│   ├── viewmodels/        # ViewModel definitions
│   ├── services/          # Business logic services
│   ├── repositories/      # Data access layer (localStorage, IndexedDB)
│   ├── models/            # Data models
│   ├── sync/              # Background sync handlers
│   └── utils/             # Utility functions
└── img/                   # Static assets and icons (PWA icons)
```

#### app.js Template

```javascript
// Import services and dependencies
import { SomeService } from "./services/SomeService.js";
import { TrainingRepository } from "./repositories/TrainingRepository.js";
import { UserPreferencesRepository } from "./repositories/UserPreferencesRepository.js";

// Initialize Alpine.js
document.addEventListener("alpine:init", () => {
  // Instantiate repositories (singletons)
  const userPrefsRepo = new UserPreferencesRepository();
  const trainingRepo = new TrainingRepository();

  // Instantiate services with repository dependencies
  const someService = new SomeService(trainingRepo, userPrefsRepo);

  // Register ViewModels with injected dependencies
  Alpine.data("mainViewModel", () => ({
    // ViewModel implementation
    init() {
      // Initialization logic
    },
    // ... public fields and methods
  }));

  Alpine.data("anotherViewModel", () => {
    // Inject dependencies via closure
    const service = someService;

    return {
      init() {
        // Access injected service
        service.initialize();
      },
      // ... public fields and methods
    };
  });
});

// Start Alpine.js
Alpine.start();
```

### 8. Best Practices

#### ViewModel Lifecycle

- Use `init()` method for initialization logic
- Use `destroy()` for cleanup if needed
- Leverage Alpine.js lifecycle: `x-init`, `x-effect`

#### State Management

- Keep state in ViewModels
- For shared state, use a service injected into multiple ViewModels
- Avoid prop drilling - use dependency injection

#### Event Communication

- ViewModels can dispatch custom events: `$dispatch('eventName', data)`
- ViewModels can listen: `x-on:event-name="handleEvent"`
- Keep events scoped and well-documented

#### Testing Considerations

- Services should be easily unit-testable (pure functions, no DOM)
- ViewModels test via integration tests or Alpine.js testing utilities
- Mock dependencies during tests

#### PWA & Offline Considerations

- Service Worker handles caching strategy (cache-first for static assets)
- IndexedDB operations should always handle QuotaExceededError
- Implement retry logic for failed sync operations
- Show offline indicator in UI when network is unavailable
- Use Background Sync API for reliable data synchronization

#### Repository Best Practices

- One repository per aggregate root or business concept
- Repositories return domain models, not raw storage objects
- Handle storage migrations within repositories
- Use transactions for multi-step IndexedDB operations
- Log sync failures for debugging and recovery

## Common Patterns

### Service Injection Pattern

```javascript
// In app.js
const userService = new UserService();

Alpine.data("userProfile", () => {
  const service = userService; // Capture in closure

  return {
    user: null,
    loading: false,

    async init() {
      this.loading = true;
      this.user = await service.getCurrentUser();
      this.loading = false;
    },
  };
});
```

### Computed Properties Pattern

```javascript
Alpine.data("shoppingCart", () => ({
  items: [],

  get total() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  },

  get itemCount() {
    return this.items.length;
  },
}));
```

### List Rendering Pattern

```html
<ul x-data="itemList()">
  <template x-for="item in items" :key="item.id">
    <li
      x-text="item.name"
      x-bind:class="item.selected ? 'bg-blue-100' : ''"
    ></li>
  </template>
</ul>
```

### Repository Pattern - localStorage

```javascript
// repositories/UserPreferencesRepository.js
export class UserPreferencesRepository {
  constructor() {
    this.storageKey = "user_preferences";
  }

  saveThemePreference(theme) {
    const prefs = this.getAllPreferences();
    prefs.theme = theme;
    localStorage.setItem(this.storageKey, JSON.stringify(prefs));
  }

  getThemePreference() {
    const prefs = this.getAllPreferences();
    return prefs.theme || "light";
  }

  getAllPreferences() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : {};
  }
}
```

### Repository Pattern - IndexedDB

```javascript
// repositories/TrainingRepository.js
export class TrainingRepository {
  constructor() {
    this.dbName = "fitness_app";
    this.storeName = "training_sessions";
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("syncStatus", "syncStatus", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });
  }

  async saveTrainingSession(session) {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      // Add metadata for sync tracking
      const sessionWithMetadata = {
        ...session,
        id: session.id || crypto.randomUUID(),
        syncStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const request = store.put(sessionWithMetadata);
      request.onsuccess = () => resolve(sessionWithMetadata);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPendingSyncSessions() {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const index = store.index("syncStatus");

      const request = index.getAll("pending");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markSessionAsSynced(id, remoteId) {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const session = getRequest.result;
        session.syncStatus = "synced";
        session.remoteId = remoteId;
        session.syncedAt = new Date().toISOString();

        const putRequest = store.put(session);
        putRequest.onsuccess = () => resolve(session);
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}
```

### Offline Sync Pattern

```javascript
// services/SyncService.js
export class SyncService {
  constructor(trainingRepository) {
    this.trainingRepo = trainingRepository;
    this.isOnline = navigator.onLine;

    // Listen for connectivity changes
    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());
  }

  async handleOnline() {
    this.isOnline = true;
    await this.syncPendingData();
  }

  handleOffline() {
    this.isOnline = false;
  }

  async syncPendingData() {
    const pendingSessions = await this.trainingRepo.getAllPendingSyncSessions();

    for (const session of pendingSessions) {
      try {
        // Sync to remote NoSQL service (to be implemented)
        const remoteId = await this.uploadToRemote(session);
        await this.trainingRepo.markSessionAsSynced(session.id, remoteId);
      } catch (error) {
        console.error("Sync failed for session", session.id, error);
        // Retry will happen on next online event
      }
    }
  }

  async uploadToRemote(session) {
    // TODO: Implement actual remote sync
    // For now, just simulate
    return Promise.resolve("remote-" + session.id);
  }
}
```

## Critical Rules Summary

### Core Architecture

1. ✅ **DO**: Use Alpine.data() for all ViewModel registrations
2. ✅ **DO**: Inject dependencies through app.js
3. ✅ **DO**: Bind all UI state to ViewModel public fields
4. ✅ **DO**: Use Tailwind utilities first, custom CSS second
5. ✅ **DO**: Keep all markup in HTML files
6. ✅ **DO**: Use Material Design fonts and icons

### Data & Persistence

7. ✅ **DO**: Use Repository pattern for ALL data persistence
8. ✅ **DO**: Use explicit semantic methods in repositories
9. ✅ **DO**: Store user preferences in localStorage
10. ✅ **DO**: Store offline recorded data in IndexedDB
11. ✅ **DO**: Track sync status for IndexedDB records
12. ✅ **DO**: Make app fully functional offline (PWA)

### Prohibitions

13. ❌ **DON'T**: Access DOM directly in ViewModels
14. ❌ **DON'T**: Create DOM elements programmatically in ViewModels
15. ❌ **DON'T**: Use global variables for dependency access
16. ❌ **DON'T**: Generate HTML strings in JavaScript
17. ❌ **DON'T**: Mix other reactive frameworks with Alpine.js
18. ❌ **DON'T**: Skip constructor injection for dependencies
19. ❌ **DON'T**: Access localStorage/IndexedDB directly from ViewModels or Services
20. ❌ **DON'T**: Use generic CRUD methods in repositories

## References

- **Alpine.js**: https://alpinejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Material Design**: https://material.io/
- **Material Icons**: https://fonts.google.com/icons
- **PWA**: https://web.dev/progressive-web-apps/
- **Service Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Background Sync**: https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API

---

_This architecture document serves as the single source of truth for all development decisions in this project. All code must conform to these patterns and principles._
