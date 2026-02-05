# Long-Term Memory

## 2026-02-05: Initial SPA Implementation

### Implementation Summary

- Built complete PWA-ready fitness tracking SPA using Alpine.js, Tailwind CSS (CDN), Material Design 3
- Architecture: MVVM with constructor DI, ES6 modules, atomic design methodology
- 5-tier progression system with 5 milestones per tier (bronze/silver/gold/platinum/diamond)
- 3 proof methods: Escrow (stub), Video (stub), Off-record
- Gender mapping: trans-male/trans-female → male/female avatar sets
- Offline-first: IndexedDB via StorageService, service worker caching

### File Structure Created

```
js/
├── app.js                          # IoC container, Alpine registration
├── models/                         # Domain models (Athlete, Workout, Milestone, Tier, TierConfiguration)
├── repositories/                   # Data access layer (IndexedDB)
├── services/                       # Business logic (ProgressionService, ProofService, StorageService, Logger)
└── viewmodels/                     # Alpine.js components (Setup, Main, History)
```

### Critical Issue Resolved: Alpine.js + ES6 Modules Loading Order

**Problem**: ES6 modules (`type="module"`) always execute AFTER deferred scripts, causing Alpine to auto-start before `Alpine.data('app')` registration → "app is not defined" errors.

**Failed Approaches**:

1. ✗ `defer` on Alpine, module registers via `alpine:init` → module runs after Alpine starts
2. ✗ Queue pattern with `window.queueAlpineData` → same timing issue
3. ✗ `deferLoadingAlpine` (Alpine v2 API, doesn't exist in v3)

**Working Solution**: Import Alpine as ES module for manual control

```html
<script type="module">
  import Alpine from "https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/module.esm.js";
  import { registerAppData } from "./js/app.js";
  window.Alpine = Alpine;
  registerAppData(Alpine);
  Alpine.start();
</script>
```

### TierConfiguration Details

- **Tier 1 (Beginner)**: 5-30 workouts/milestone, habit building (walking, yoga, stretching)
- **Tier 2 (Novice)**: 10-40 workouts, variety expansion (strength intro, cardio explorer)
- **Tier 3 (Intermediate)**: 15-50 workouts, serious training (power, endurance, HIIT)
- **Tier 4 (Advanced)**: 25-60 workouts, high performance (strength master, cardio elite)
- **Tier 5 (Master)**: 35-75 workouts, ultimate achievement (legend status)

Each milestone can specify accepted workout types or accept all (empty array).

### Technical Decisions

- No build step: Pure ES6 modules, CDN for Tailwind/Alpine
- Tailwind CDN: Use only for prototyping (not production per warning)
- Proof service: Stub implementations for future integration (escrow/video)
- Service worker: v3 cache, offline-first strategy
- Icons: Generated solid-color PNGs (Material primary #6750A4) via Python

### UI Screens

1. **Athlete Setup**: Name, birthday, gender (4 options), skin tone (4 options)
2. **Main Screen**: Avatar background (tier-based), milestone medals, add workout FAB with submenu
3. **Workout History**: Chronological list with proof badges, milestone attribution

## 2026-02-05: Enhanced Milestone System with Workout Requirements & Benchmarks

### Changes Made

**Milestone Model Enhancements**:

- Replaced simple workout type arrays with structured requirements: `{workoutType, reps, timeMinutes}`
- Added benchmark workout system for Platinum/Diamond milestones: `{name, exercises: [{workoutType, reps}], timeCapMinutes}`
- New properties: `benchmarksCompleted[]`, `usesBenchmarks` getter
- New methods: `completeBenchmark(index)`, `getRequirementForWorkoutType(type)`
- Updated serialization to persist benchmark progress

**TierConfiguration Updates**:

- Bronze/Silver/Gold milestones: Now specify exact reps and time requirements per workout type
- Platinum/Diamond milestones: Use challenging benchmark workouts (2-6 benchmarks each)
  - Example: Beginner Platinum "Endurance Challenge" = 30 runs + 20 push-ups in 40 min
  - Example: Master Diamond "Legend of Legends" = 100 pull-ups + 100 deadlifts + 200 push-ups + 250 squats in 120 min
- Added helper methods: `getWorkoutRequirementsForMilestone()`, `getBenchmarkWorkoutsForMilestone()`
- All 5 tiers completely restructured with progressive difficulty

**Technical Notes**:

- Backward compatible serialization via JSON fromJSON/toJSON methods
- No changes needed to Tier model (already handles new Milestone structure)
- All syntax validated with Node.js --check

### Next Steps / Known Issues

- Tailwind CDN warning: Consider PostCSS setup for production
- Tracking prevention on jsdelivr (Alpine CDN): Minor, doesn't affect functionality
- Proof services need external integration (buddy system, video recording UI)
- No icon graphics: Using solid color placeholders (need actual tier avatar imagery)
- UI needs updating to display workout requirements and benchmark challenges
- Workout logging needs to validate against requirements (reps/time) and mark benchmarks complete
