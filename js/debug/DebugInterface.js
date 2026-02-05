/**
 * DebugInterface - Hash-based debug commands for development/testing
 * Not a dependency of any app class - sits on top of the application
 *
 * Usage: Navigate to http://url/#reset, http://url/#tierup, http://url/#tierclear
 */
export class DebugInterface {
  constructor(container) {
    this._container = container;
    this._logger = container.logger;
  }

  /**
   * Initialize the debug interface and listen for hash changes
   */
  async initialize() {
    // Listen for hash changes
    window.addEventListener("hashchange", () => this._handleHashChange());

    // Handle initial hash if present
    await this._handleHashChange();
  }

  /**
   * Handle hash change events
   */
  async _handleHashChange() {
    const hash = window.location.hash.slice(1).toLowerCase().trim();

    if (!hash) return;

    // Clear the hash immediately to prevent endless loops on reload
    window.history.replaceState(null, "", window.location.pathname);

    this._logger.log(`[DEBUG] Hash command detected: ${hash}`);

    try {
      switch (hash) {
        case "reset":
          await this._reset();
          break;
        case "tierup":
          await this._tierup();
          break;
        case "tierclear":
          await this._tierclear();
          break;
        default:
          this._logger.log(`[DEBUG] Unknown command: ${hash}`);
      }
    } catch (error) {
      this._logger.error(`[DEBUG] Command failed: ${error.message}`, error);
    }
  }

  /**
   * RESET: Factory reset - clears localStorage and IndexedDB
   */
  async _reset() {
    this._logger.log("[DEBUG] Executing RESET command...");

    try {
      // Clear all IndexedDB stores
      const db = await this._container.storageService.getDb();
      const storeNames = ["athletes", "workouts", "progress"];

      for (const storeName of storeNames) {
        await this._container.storageService.clearStore(storeName);
        this._logger.log(`[DEBUG] Cleared store: ${storeName}`);
      }

      // Clear localStorage
      localStorage.clear();
      this._logger.log("[DEBUG] Cleared localStorage");

      // Delete IndexedDB database
      await this._deleteDatabase("f17n355-db");
      this._logger.log("[DEBUG] Deleted database");

      alert("✓ Factory reset complete. App will reload.");
      window.location.reload();
    } catch (error) {
      this._logger.error("[DEBUG] Reset failed", error);
      alert(`✗ Reset failed: ${error.message}`);
    }
  }

  /**
   * TIERUP: Fill milestones with required workouts in correct order
   * Follows the sequence: Bronze -> Silver -> Gold -> Platinum -> Diamond
   */
  async _tierup() {
    this._logger.log("[DEBUG] Executing TIERUP command...");

    try {
      // Ensure app is initialized
      const athlete =
        await this._container.athleteRepository.getCurrentAthlete();
      if (!athlete) {
        throw new Error(
          "No athlete profile found. Please complete setup first.",
        );
      }

      // Initialize progression service
      await this._container.progressionService.initialize();

      const tierLevel = athlete.currentTier;
      const tier =
        this._container.progressionService.tierConfiguration.getTierByLevel(
          tierLevel,
        );

      if (!tier) {
        throw new Error(`No tier found for level ${tierLevel}`);
      }

      this._logger.log(
        `[DEBUG] Filling tier ${tierLevel} (${tier.name}) with workouts...`,
      );

      // Define milestone order
      const milestoneOrder = [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
      ];

      for (const milestoneType of milestoneOrder) {
        const milestone = tier.findMilestoneByType(milestoneType);

        if (!milestone) {
          this._logger.log(
            `[DEBUG] Milestone ${milestoneType} not found in tier`,
          );
          continue;
        }

        this._logger.log(
          `[DEBUG] Processing ${milestoneType}: ${milestone.progress}/${milestone.requiredWorkouts}`,
        );

        // Check if this milestone uses benchmarks (Platinum/Diamond)
        if (milestone.usesBenchmarks) {
          // For benchmark milestones, complete all benchmarks
          const benchmarkCount = milestone.benchmarkWorkouts.length;
          milestone.benchmarksCompleted = milestone.benchmarkWorkouts.map(
            (_, index) => index,
          );
          this._logger.log(
            `[DEBUG] Completed ${benchmarkCount} benchmarks for ${milestoneType}`,
          );
          this._logger.log(
            `[DEBUG] ${milestoneType} isCompleted: ${milestone.isCompleted}, benchmarksCompleted.length: ${milestone.benchmarksCompleted.length}`,
          );
        } else {
          // For regular milestones (Bronze, Silver, Gold), add workouts until complete
          while (milestone.progress < milestone.requiredWorkouts) {
            // Get available workout types for this milestone
            const workoutTypes =
              this._container.progressionService.tierConfiguration.getWorkoutTypesForMilestone(
                tierLevel,
                milestoneType,
              );

            if (workoutTypes.length === 0) {
              throw new Error(
                `No workout types available for milestone ${milestoneType}`,
              );
            }

            // Use first available workout type
            const workoutType = workoutTypes[0];

            // Create workout
            const workout =
              await this._container.workoutRepository.createWorkout(
                workoutType,
                "record",
                milestoneType,
                tierLevel,
              );

            // Add progress
            const result =
              await this._container.progressionService.addWorkoutProgress(
                workout,
              );

            if (result.success) {
              this._logger.log(
                `[DEBUG] Added workout: ${workoutType} for ${milestoneType}`,
              );
            } else {
              throw new Error(
                `Failed to add workout: ${result.error || "Unknown error"}`,
              );
            }
          }
        }

        this._logger.log(`[DEBUG] Completed milestone: ${milestoneType}`);
      }

      // Check if tier is now complete and trigger level up if needed
      if (tier.isCompleted) {
        const nextTierLevel = tierLevel + 1;
        const tierCount =
          this._container.progressionService.tierConfiguration.tierCount;

        this._logger.log(
          `[DEBUG] Tier ${tierLevel} is complete! Checking for level up...`,
        );
        this._logger.log(
          `[DEBUG] Next tier level: ${nextTierLevel}, Tier count: ${tierCount}`,
        );

        if (nextTierLevel < tierCount) {
          // Trigger level up
          await this._container.athleteRepository.updateTier(nextTierLevel);
          const nextTier =
            this._container.progressionService.tierConfiguration.getTierByLevel(
              nextTierLevel,
            );
          nextTier.resetProgress();
          await this._container.progressionService.saveProgress();

          this._logger.log(
            `[DEBUG] Tier leveled up to: ${nextTierLevel} (${nextTier.name})`,
          );

          // Refresh Alpine app state
          await this._refreshAlpineState();
          alert(
            `✓ Tier ${tierLevel} completed! Advanced to Tier ${nextTierLevel}.`,
          );
        } else {
          this._logger.log("[DEBUG] Max tier reached");

          // Refresh Alpine app state
          await this._refreshAlpineState();
          alert(
            `✓ Tier ${tierLevel} completed! You have reached the maximum tier.`,
          );
        }
      } else {
        // Even if not completing the tier, refresh state
        this._logger.log(
          `[DEBUG] Tier ${tierLevel} not yet complete. Milestone statuses:`,
        );
        tier.milestones.forEach((m) => {
          this._logger.log(
            `[DEBUG]   ${m.type}: completed=${m.isCompleted}, progress=${m.progress}/${m.requiredWorkouts}, benchmarks=${m.benchmarksCompleted.length}/${m.benchmarkWorkouts.length}`,
          );
        });
        await this._refreshAlpineState();
      }
    } catch (error) {
      this._logger.error("[DEBUG] Tierup failed", error);
      alert(`✗ Tierup failed: ${error.message}`);
    }
  }

  /**
   * TIERCLEAR: Remove all workouts and reset to fresh Tier 1
   */
  async _tierclear() {
    this._logger.log("[DEBUG] Executing TIERCLEAR command...");

    try {
      // Clear all workouts
      await this._container.workoutRepository.clearAllWorkouts();
      this._logger.log("[DEBUG] Cleared all workouts");

      // Reset athlete to Tier 1
      const athlete =
        await this._container.athleteRepository.getCurrentAthlete();
      if (!athlete) {
        throw new Error("No athlete profile found");
      }

      await this._container.athleteRepository.updateTier(0);
      this._logger.log("[DEBUG] Reset athlete to Tier 1");

      // Initialize and reset progression
      await this._container.progressionService.initialize();
      const tier0 =
        this._container.progressionService.tierConfiguration.getTierByLevel(0);
      if (tier0) {
        tier0.resetProgress();
      }
      await this._container.progressionService.saveProgress();
      this._logger.log("[DEBUG] Reset tier progress");

      // Refresh Alpine app state
      await this._refreshAlpineState();
      alert("✓ Tier clear complete. App reset to Tier 1.");
    } catch (error) {
      this._logger.error("[DEBUG] Tierclear failed", error);
      alert(`✗ Tierclear failed: ${error.message}`);
    }
  }

  /**
   * Helper: Delete IndexedDB database
   */
  _deleteDatabase(dbName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);

      request.onerror = () => {
        reject(new Error("Failed to delete database"));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Helper: Refresh Alpine.js app state
   */
  async _refreshAlpineState() {
    try {
      // Wait for Alpine component to be available (with timeout)
      const appComponent = await this._waitForAlpineComponent(3000);

      if (!appComponent) {
        this._logger.log(
          "[DEBUG] Could not find Alpine app component after timeout",
        );
        this._logger.log("[DEBUG] Falling back to full page reload");
        window.location.reload();
        return;
      }

      this._logger.log("[DEBUG] Alpine component found, refreshing state...");

      // Force reload the progression service by reinitializing it
      // This ensures it loads the latest persisted state from storage
      const progressionService = this._container.progressionService;

      // Explicitly reinitialize the progression service from storage
      await progressionService.initialize();
      this._logger.log("[DEBUG] ProgressionService reloaded from storage");

      // Re-initialize main screen to reload all data
      const mainViewModel = appComponent.main;
      await mainViewModel.initialize();
      this._logger.log("[DEBUG] Main screen view model reinitialized");

      this._logger.log("[DEBUG] Alpine app state refreshed successfully");
    } catch (error) {
      this._logger.error("[DEBUG] Failed to refresh Alpine state", error);
      // Fall back to full reload if refresh fails
      this._logger.log("[DEBUG] Falling back to full page reload due to error");
      window.location.reload();
    }
  }

  /**
   * Helper: Wait for Alpine component to be available
   */
  async _waitForAlpineComponent(timeoutMs = 3000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const appElement = document.querySelector("[x-data='app']");

      // Check if element exists and Alpine has initialized it
      if (appElement && appElement.__x && appElement.__x.$data) {
        return appElement.__x.$data;
      }

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return null;
  }
}
