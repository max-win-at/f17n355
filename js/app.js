/**
 * Fitness Supreme - IoC Container / Composition Root
 *
 * This is the main entry point that wires up all dependencies
 * and initializes the Alpine.js application.
 */

// Services
import { Logger } from "./services/Logger.js";
import { StorageService } from "./services/StorageService.js";
import { ProofService } from "./services/ProofService.js";
import { ProgressionService } from "./services/ProgressionService.js";

// Repositories
import { AthleteRepository } from "./repositories/AthleteRepository.js";
import { WorkoutRepository } from "./repositories/WorkoutRepository.js";

// ViewModels
import { AthleteSetupViewModel } from "./viewmodels/AthleteSetupViewModel.js";
import { MainScreenViewModel } from "./viewmodels/MainScreenViewModel.js";
import { WorkoutHistoryViewModel } from "./viewmodels/WorkoutHistoryViewModel.js";

// Models (for type exports)
import { ProofMethod } from "./models/Workout.js";
import { MilestoneType } from "./models/Milestone.js";
import { getAllWorkoutTypes } from "./models/TierConfiguration.js";

// Debug interface
import { DebugInterface } from "./debug/DebugInterface.js";

/**
 * Application container - manages dependency injection
 */
class AppContainer {
  constructor() {
    // Core services
    this._logger = new Logger("f17n355");
    this._storageService = new StorageService();

    // Repositories
    this._athleteRepository = new AthleteRepository(this._storageService);
    this._workoutRepository = new WorkoutRepository(this._storageService);

    // Services
    this._proofService = new ProofService(this._logger);
    this._progressionService = new ProgressionService(
      this._athleteRepository,
      this._workoutRepository,
      this._storageService,
    );

    // ViewModels
    this._athleteSetupViewModel = new AthleteSetupViewModel(
      this._athleteRepository,
      this._logger,
    );
    this._mainScreenViewModel = new MainScreenViewModel(
      this._athleteRepository,
      this._workoutRepository,
      this._progressionService,
      this._proofService,
      this._logger,
    );
    this._workoutHistoryViewModel = new WorkoutHistoryViewModel(
      this._workoutRepository,
      this._logger,
    );
  }

  get logger() {
    return this._logger;
  }
  get storageService() {
    return this._storageService;
  }
  get athleteRepository() {
    return this._athleteRepository;
  }
  get workoutRepository() {
    return this._workoutRepository;
  }
  get proofService() {
    return this._proofService;
  }
  get progressionService() {
    return this._progressionService;
  }
  get athleteSetupViewModel() {
    return this._athleteSetupViewModel;
  }
  get mainScreenViewModel() {
    return this._mainScreenViewModel;
  }
  get workoutHistoryViewModel() {
    return this._workoutHistoryViewModel;
  }
}

// Create global container instance
const container = new AppContainer();

/**
 * Create the Alpine.js app component
 */
function createAppComponent() {
  return {
    // Current screen state
    currentScreen: "setup",

    // Sub-viewmodels
    athlete: container.athleteSetupViewModel,
    main: container.mainScreenViewModel,
    history: container.workoutHistoryViewModel,

    // Gender and skin tone options (from setup viewmodel)
    genderOptions: container.athleteSetupViewModel.genderOptions,
    skinToneOptions: container.athleteSetupViewModel.skinToneOptions,

    // Computed properties delegated to viewmodels
    get isSetupValid() {
      return this.athlete.isValid;
    },

    get avatarImagePath() {
      return this.main.avatarImagePath;
    },

    get currentTier() {
      return this.main.currentTier;
    },

    get currentTierMilestones() {
      return this.main.milestones;
    },

    get completedMilestones() {
      return this.main.completedMilestones;
    },

    get totalMilestones() {
      return this.main.totalMilestones;
    },

    get totalWorkoutsCompleted() {
      return this.main.totalWorkoutsCompleted;
    },

    get totalWorkoutsNeeded() {
      return this.main.totalWorkoutsNeeded;
    },

    get tierProgressPercent() {
      return this.main.tierProgressPercent;
    },

    get workouts() {
      return this.history.workouts;
    },

    // Initialization
    async init() {
      container.logger.log("App initializing...");

      try {
        // Initialize storage
        await container.storageService.initialize();

        // Check if athlete profile exists
        const hasProfile = await container.athleteRepository.hasProfile();

        if (hasProfile) {
          // Load existing data and go to main screen
          await this.athlete.loadExistingAthlete();
          await this.main.initialize();
          this.currentScreen = "main";
        } else {
          // Show setup screen
          this.currentScreen = "setup";
        }

        container.logger.log("App initialized successfully");
      } catch (error) {
        container.logger.error("Failed to initialize app", error);
      }
    },

    // Navigation
    navigateTo(screen) {
      container.logger.log(`Navigating to: ${screen}`);

      if (screen === "history") {
        this.history.loadWorkouts();
      } else if (screen === "main") {
        this.main.refreshProgress();
      } else if (screen === "setup") {
        this.athlete.loadExistingAthlete();
      }

      this.currentScreen = screen;
    },

    // Launch app (from setup screen)
    async launchApp() {
      const success = await this.athlete.saveAthlete();
      if (success) {
        await this.main.initialize();
        this.currentScreen = "main";
      }
    },

    // Add workout (from main screen) - Step 1: select workout
    addWorkout() {
      this.main.startAddWorkout();
    },

    // Get milestone class for styling
    getMilestoneClass(milestone) {
      return this.main.getMilestoneClass(milestone);
    },

    // Format date for history display
    formatDate(isoDate) {
      return this.history.formatDate(isoDate);
    },

    // Get proof badge class
    getProofBadgeClass(proofMethod) {
      return this.history.getProofBadgeClass(proofMethod);
    },

    // Get proof label
    getProofLabel(proofMethod) {
      return this.history.getProofLabel(proofMethod);
    },
  };
}

/**
 * Register the app data component with Alpine
 * Called from index.html before Alpine.start()
 */
export function registerAppData(Alpine) {
  container.logger.log("Registering Alpine.js app data component");
  Alpine.data("app", createAppComponent);
  container.logger.log("Alpine app component registered");
}

// Export for debugging/testing
window.__f17n355 = {
  container,
  ProofMethod,
  MilestoneType,
  getAllWorkoutTypes,
};

// Initialize debug interface
const debugInterface = new DebugInterface(container);
debugInterface.initialize().catch((error) => {
  container.logger.error("Failed to initialize debug interface", error);
});

container.logger.log("App module loaded");
