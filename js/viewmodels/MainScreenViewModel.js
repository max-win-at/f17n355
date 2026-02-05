import { getAllWorkoutTypes } from "../models/TierConfiguration.js";
import { ProofMethodType } from "../constants/ProofMethodType.js";

/**
 * MainScreenViewModel - Handles main workout screen with milestones and tier progress
 */
export class MainScreenViewModel {
  constructor(
    athleteRepository,
    workoutRepository,
    progressionService,
    proofService,
    logger,
  ) {
    this._athleteRepository = athleteRepository;
    this._workoutRepository = workoutRepository;
    this._progressionService = progressionService;
    this._proofService = proofService;
    this._logger = logger;

    // Public fields for Alpine.js bindings
    this.athlete = null;
    this.currentTier = 0;
    this.tierName = "Beginner";
    this.milestones = [];
    this.completedMilestones = 0;
    this.totalMilestones = 0;
    this.tierProgressPercent = 0;
    this.totalWorkoutsCompleted = 0;
    this.totalWorkoutsNeeded = 0;
    this.isLoading = false;
    this.errorMessage = "";
    this.successMessage = "";

    // Workout adding state - step 1: select workout
    this.showWorkoutSelectionModal = false;
    this.availableMilestones = [];
    this.groupedMilestones = {}; // { 'early': [...], 'late': [...] }
    this.selectedMilestone = "";
    this.selectedWorkoutType = "";
    this.availableWorkoutTypes = [];
    this.selectedBenchmarkIndex = null; // For benchmark milestones
    this.availableBenchmarks = []; // Benchmark workout options
    this.isBenchmarkMilestone = false; // Flag to indicate if selected milestone uses benchmarks

    // Workout adding state - step 2: select proof method
    this.showProofMethodModal = false;
    this.selectedProofMethod = "";

    // Escrow waiting state
    this.isEscrowWaiting = false;
    this.escrowWaitingWorkout = null;
    this.escrowWaitingResult = null;
    this.escrowIconSuccess = false; // Flag to show green success state before fade out

    // Level up celebration state
    this.showLevelUp = false;
    this.newTierName = "";
  }

  /**
   * Get avatar image path based on athlete and tier
   */
  get avatarImagePath() {
    if (!this.athlete) {
      return "img/male0.png";
    }
    return this.athlete.getAvatarPath(this.currentTier);
  }

  /**
   * Initialize main screen data
   */
  async initialize() {
    this.isLoading = true;
    this.errorMessage = "";

    try {
      // Initialize progression service
      await this._progressionService.initialize();

      // Load athlete
      this.athlete = await this._athleteRepository.getCurrentAthlete();

      // Load progress
      await this.refreshProgress();

      // Load available milestones for workout form
      await this.loadAvailableMilestones();

      this._logger.log("Main screen initialized");
    } catch (error) {
      this._logger.error("Failed to initialize main screen", error);
      this.errorMessage = "Failed to load data";
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Refresh tier progress data
   */
  async refreshProgress() {
    try {
      const summary = await this._progressionService.getTierProgressSummary();

      this.currentTier = summary.tierLevel;
      this.tierName = summary.tierName;
      this.completedMilestones = summary.completedMilestones;
      this.totalMilestones = summary.totalMilestones;
      this.tierProgressPercent = summary.progressPercent;
      this.totalWorkoutsCompleted = summary.totalWorkoutsCompleted || 0;
      this.totalWorkoutsNeeded = summary.totalWorkoutsNeeded || 0;
      this.milestones = summary.milestones;
    } catch (error) {
      this._logger.error("Failed to refresh progress", error);
    }
  }

  /**
   * Load available milestones for workout form, grouped by priority
   */
  async loadAvailableMilestones() {
    const allMilestones =
      await this._progressionService.getAvailableMilestones();

    // Group milestones into early (bronze, silver, gold) and late (platinum, diamond)
    const early = [];
    const late = [];

    for (const milestone of allMilestones) {
      if (["bronze", "silver", "gold"].includes(milestone.type)) {
        early.push(milestone);
      } else {
        late.push(milestone);
      }
    }

    this.availableMilestones = allMilestones;
    this.groupedMilestones = {
      early: early,
      late: late,
    };
  }

  /**
   * Check if all early milestones (bronze, silver, gold) are completed
   */
  areEarlyMilestonesCompleted() {
    const early = this.groupedMilestones.early || [];
    return early.length > 0 && early.every((m) => m.completed);
  }

  /**
   * Get milestones to display in selection modal
   */
  getDisplayMilestones() {
    if (this.areEarlyMilestonesCompleted()) {
      // Show late milestones if early ones are done
      return this.groupedMilestones.late || [];
    }
    // Otherwise show early milestones
    return this.groupedMilestones.early || [];
  }

  /**
   * Update available workout types or benchmarks based on selected milestone
   */
  updateWorkoutTypes() {
    const milestone = this.availableMilestones.find(
      (m) => m.type === this.selectedMilestone,
    );

    if (!milestone) {
      this.availableWorkoutTypes = [];
      this.availableBenchmarks = [];
      this.isBenchmarkMilestone = false;
      return;
    }

    // Check if this milestone uses benchmarks
    this.isBenchmarkMilestone = milestone.usesBenchmarks || false;

    if (this.isBenchmarkMilestone) {
      // Load benchmark workouts for this milestone
      this.availableBenchmarks = milestone.benchmarks || [];
      this.availableWorkoutTypes = [];
      this.selectedWorkoutType = "";
      this.selectedBenchmarkIndex =
        this.availableBenchmarks.length > 0 ? 0 : null;
    } else {
      // Load regular workout types
      if (milestone.workoutTypes && milestone.workoutTypes.length > 0) {
        this.availableWorkoutTypes = milestone.workoutTypes;
      } else {
        this.availableWorkoutTypes = getAllWorkoutTypes();
      }
      this.availableBenchmarks = [];
      this.selectedBenchmarkIndex = null;

      if (this.availableWorkoutTypes.length > 0) {
        this.selectedWorkoutType = this.availableWorkoutTypes[0];
      }
    }
  }

  /**
   * Select a milestone and signal for view scrolling
   */
  selectMilestone(milestoneType) {
    this.selectedMilestone = milestoneType;
    this.updateWorkoutTypes();
    this.shouldAutoScrollToExercises = true;
  }

  /**
   * Signal that the view should scroll (handled by Alpine directives)
   * Flag indicates the view should auto-scroll to the exercise selection
   */
  shouldAutoScrollToExercises = false;

  /**
   * Step 1: Start adding a workout - show workout selection modal
   */
  startAddWorkout() {
    this.showWorkoutSelectionModal = true;
    this.selectedMilestone = "";
    this.selectedWorkoutType = "";
    this.selectedBenchmarkIndex = null;
    this.errorMessage = "";
    this._logger.log("Starting Add Workout flow - workout selection");
  }

  /**
   * Select a workout and milestone, move to proof method selection
   */
  selectWorkout() {
    if (!this.selectedMilestone) {
      this.errorMessage = "Please select a milestone";
      return;
    }

    if (this.isBenchmarkMilestone) {
      if (this.selectedBenchmarkIndex === null) {
        this.errorMessage = "Please select a benchmark workout";
        return;
      }
    } else {
      if (!this.selectedWorkoutType) {
        this.errorMessage = "Please select a workout type";
        return;
      }
    }

    this.showWorkoutSelectionModal = false;
    this.showProofMethodModal = true;
    this.errorMessage = "";

    if (this.isBenchmarkMilestone) {
      const benchmarkName =
        this.availableBenchmarks[this.selectedBenchmarkIndex]?.name ||
        "Benchmark";
      this._logger.log(
        `Benchmark selected: ${benchmarkName} for ${this.selectedMilestone}`,
      );
    } else {
      this._logger.log(
        `Workout selected: ${this.selectedWorkoutType} for ${this.selectedMilestone}`,
      );
    }
  }

  /**
   * Cancel workout selection modal
   */
  cancelWorkoutSelection() {
    this.showWorkoutSelectionModal = false;
    this.selectedMilestone = "";
    this.selectedWorkoutType = "";
    this.selectedBenchmarkIndex = null;
    this.errorMessage = "";
  }

  /**
   * Cancel proof method selection modal
   */
  cancelProofMethodSelection() {
    this.showProofMethodModal = false;
    this.selectedProofMethod = "";
    this.errorMessage = "";
  }

  /**
   * Step 2: Select proof method and submit workout
   */
  async selectProofMethodAndSubmit(proofMethod) {
    if (!this.selectedMilestone) {
      this.errorMessage = "Please select milestone";
      return;
    }

    if (this.isBenchmarkMilestone) {
      if (this.selectedBenchmarkIndex === null) {
        this.errorMessage = "Please select benchmark workout";
        return;
      }
    } else {
      if (!this.selectedWorkoutType) {
        this.errorMessage = "Please select workout type";
        return;
      }
    }

    this.selectedProofMethod = proofMethod;
    this.isLoading = true;
    this.errorMessage = "";
    this.successMessage = "";

    try {
      let workout;
      let result;

      if (this.isBenchmarkMilestone) {
        // For benchmark milestones, complete the selected benchmark
        const benchmarkName =
          this.availableBenchmarks[this.selectedBenchmarkIndex]?.name ||
          "Benchmark";

        // Create workout with benchmark name as the type
        workout = await this._workoutRepository.createWorkout(
          benchmarkName,
          this.selectedProofMethod,
          this.selectedMilestone,
          this.currentTier,
        );

        // Complete the specific benchmark
        result = await this._progressionService.completeBenchmark(
          workout,
          this.selectedBenchmarkIndex,
        );
      } else {
        // Regular workout flow
        workout = await this._workoutRepository.createWorkout(
          this.selectedWorkoutType,
          this.selectedProofMethod,
          this.selectedMilestone,
          this.currentTier,
        );

        // Update progression
        result = await this._progressionService.addWorkoutProgress(workout);
      }

      // Special handling for Escrow: show waiting indicator instead of immediately processing
      if (this.selectedProofMethod === ProofMethodType.ESCROW) {
        this._logger.log("Escrow proof initiated, showing waiting indicator");
        
        // Store workout and result for later processing
        this.escrowWaitingWorkout = workout;
        this.escrowWaitingResult = result;
        
        // Show the waiting icon and start the simulated waiting period
        this.isEscrowWaiting = true;
        this.escrowIconSuccess = false;
        this.showProofMethodModal = false;
        
        // Simulate 8 second waiting period for guarantor verification
        const ESCROW_WAIT_TIME = 8000;
        await new Promise(resolve => setTimeout(resolve, ESCROW_WAIT_TIME));
        
        // Process the result after waiting period
        this._processWorkoutResult(result, this.selectedMilestone, workout);
        
        // Change icon color to green to indicate success
        this.escrowIconSuccess = true;
        
        // Wait for the fade-out animation to complete before hiding the icon
        const FADE_OUT_DURATION = 500;
        await new Promise(resolve => setTimeout(resolve, FADE_OUT_DURATION));
        this.isEscrowWaiting = false;
        this.escrowIconSuccess = false;
        
        return;

      }

      // Handle other proof methods normally
      if (this.selectedProofMethod === ProofMethodType.VIDEO) {
        await this._proofService.initiateVideoProof(workout);
      }

      // Process result immediately for non-escrow methods
      this._processWorkoutResult(result, this.selectedMilestone, workout);

      // Close modals on success
      if (result.success) {
        this.showProofMethodModal = false;
        this.selectedProofMethod = "";
        this.selectedMilestone = "";
        this.selectedWorkoutType = "";
        this.selectedBenchmarkIndex = null;
      }

      this._logger.log("Workout submitted successfully", workout);
    } catch (error) {
      this._logger.error("Failed to submit workout", error);
      this.errorMessage = "Failed to log workout";
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Process workout result and trigger animations/celebrations
   * @private
   */
  _processWorkoutResult(result, selectedMilestone, workout) {
    if (result.success) {
      // Get the milestone element to animate from
      const milestoneElement = this._findMilestoneElement(selectedMilestone);

      if (this.isBenchmarkMilestone) {
        this.successMessage = `Benchmark completed! ${result.milestoneProgress.name}: ${result.milestoneProgress.progress}/${result.milestoneProgress.required} benchmarks`;
      } else {
        this.successMessage = `Workout logged! ${result.milestoneProgress.name}: ${result.milestoneProgress.progress}/${result.milestoneProgress.required}`;
      }

      // Handle milestone completion
      if (result.milestoneProgress.justCompleted) {
        this.successMessage = `🎉 Milestone completed: ${result.milestoneProgress.name}!`;
        // Trigger clap animation for milestone completion from the milestone
        this.triggerClapRain(milestoneElement);
      } else {
        // Trigger dumbbell rain for regular workout from the milestone
        this.triggerDumbbellRain(milestoneElement);
      }

      // Handle tier level up
      if (result.tierLevelUp && result.tierLevelUp.leveledUp) {
        this.newTierName = result.tierLevelUp.tierName;
        this._athleteRepository.getCurrentAthlete().then(athlete => {
          this.athlete = athlete;
        });
        // Trigger fireworks after a short delay
        setTimeout(() => {
          this.triggerTierUpFireworks();
        }, 500);
        // Show level up overlay after animation starts
        setTimeout(() => {
          this.showLevelUp = true;
        }, 1000);
      }
    } else {
      this.errorMessage = result.error || "Failed to log workout";
    }

    // Refresh progress display
    this.refreshProgress();
    this.loadAvailableMilestones();
  }

  /**
   * Dismiss level up celebration
   */
  dismissLevelUp() {
    this.showLevelUp = false;
    this.newTierName = "";
  }

  /**
   * Get CSS class for milestone badge
   */
  getMilestoneClass(milestone) {
    const baseClass = `milestone-${milestone.type}`;
    if (milestone.completed) {
      return `${baseClass} milestone-completed`;
    }
    return baseClass;
  }

  /**
   * Create and trigger falling dumbbells animation
   * Called when a workout is successfully added
   */
  triggerDumbbellRain(milestoneElement) {
    this._createRainingAnimation("💪", "dumbbell", milestoneElement, 15);
  }

  /**
   * Create and trigger falling claps animation
   * Called when a milestone is completed
   */
  triggerClapRain(milestoneElement) {
    this._createRainingAnimation("👏", "clap", milestoneElement, 20);
  }

  /**
   * Create and trigger fireworks explosion animation
   * Called when tier level up happens
   */
  triggerTierUpFireworks() {
    this._createFireworksAnimation(30);
  }

  /**
   * Find milestone element in the DOM by milestone type
   * @private
   */
  _findMilestoneElement(milestoneType) {
    if (!milestoneType) return null;
    const selector = `[data-milestone-type="${milestoneType}"]`;
    return document.querySelector(selector);
  }

  /**
   * Helper: Create raining particle animation from a specific milestone
   * @private
   */
  _createRainingAnimation(emoji, className, sourceElement, particleCount) {
    // Get the position to start from (center of screen if no element)
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 3; // Start from upper area

    if (sourceElement) {
      const rect = sourceElement.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }

    // Create container
    const container = document.createElement("div");
    container.className = "celebration-rain-container";
    document.body.appendChild(container);

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = `celebration-particle ${className}`;
      particle.textContent = emoji;

      // Random horizontal offset
      const randomOffset = (Math.random() - 0.5) * 300;
      const randomDelay = Math.random() * 0.3;
      const duration = 2.5 + Math.random() * 1;

      particle.style.left = startX + randomOffset + "px";
      particle.style.top = startY + "px";
      particle.style.setProperty("--duration", duration + "s");

      // Set animation with random delay and direction variation
      if (randomOffset < -50) {
        particle.style.animation = `fall-left ${duration}s linear ${randomDelay}s forwards`;
      } else if (randomOffset > 50) {
        particle.style.animation = `fall-right ${duration}s linear ${randomDelay}s forwards`;
      } else {
        particle.style.animation = `fall-center ${duration}s linear ${randomDelay}s forwards`;
      }

      container.appendChild(particle);
    }

    // Clean up after animation completes
    setTimeout(() => {
      container.remove();
    }, 3500);
  }

  /**
   * Helper: Create fireworks explosion animation from center
   * @private
   */
  _createFireworksAnimation(particleCount) {
    // Create container at center
    const container = document.createElement("div");
    container.className = "fireworks-container";
    document.body.appendChild(container);

    // Tier up symbols: medals (🏅), diamonds (💎), crowns (👑)
    const symbols = ["🏅", "💎", "👑"];

    // Create fireworks particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "fireworks-particle";

      // Cycle through symbols
      const symbol = symbols[i % symbols.length];
      particle.textContent = symbol;

      // Calculate burst direction (radial from center)
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 200 + Math.random() * 150;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      // Add some randomness
      const randomDelay = Math.random() * 0.1;
      const randomDuration = 1.8 + Math.random() * 0.4;

      particle.style.setProperty("--tx", tx + "px");
      particle.style.setProperty("--ty", ty + "px");
      particle.style.animationDelay = randomDelay + "s";
      particle.style.animationDuration = randomDuration + "s";

      container.appendChild(particle);
    }

    // Clean up after animation completes
    setTimeout(() => {
      container.remove();
    }, 2500);
  }
}
