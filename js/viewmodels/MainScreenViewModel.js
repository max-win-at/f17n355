import { getAllWorkoutTypes } from "../models/TierConfiguration.js";

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
   * Select a milestone and scroll to workout options
   */
  selectMilestone(milestoneType) {
    this.selectedMilestone = milestoneType;
    this.updateWorkoutTypes();
    this.scrollToWorkoutOptions();
  }

  /**
   * Scroll workout selection modal to exercise list and continue button
   */
  scrollToWorkoutOptions() {
    const container = document.getElementById(
      "workout-selection-modal-content",
    );
    const exerciseSection = document.getElementById(
      "workout-selection-exercise",
    );
    const nextButton = document.getElementById("workout-selection-next-button");

    if (!container || !exerciseSection) {
      return;
    }

    const isInView = (element) => {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return (
        elementRect.top >= containerRect.top &&
        elementRect.bottom <= containerRect.bottom
      );
    };

    requestAnimationFrame(() => {
      container.scrollTo({
        top: Math.max(exerciseSection.offsetTop - 16, 0),
        behavior: "smooth",
      });

      if (nextButton) {
        setTimeout(() => {
          if (!isInView(nextButton)) {
            const targetBottom =
              nextButton.offsetTop + nextButton.offsetHeight + 16;
            const scrollTop = Math.max(
              targetBottom - container.clientHeight,
              0,
            );
            container.scrollTo({ top: scrollTop, behavior: "smooth" });
          }
        }, 200);
      }
    });
  }

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

      // Handle proof method (stub implementations)
      if (this.selectedProofMethod === "escrow") {
        await this._proofService.initiateEscrowProof(workout);
      } else if (this.selectedProofMethod === "video") {
        await this._proofService.initiateVideoProof(workout);
      }

      if (result.success) {
        if (this.isBenchmarkMilestone) {
          this.successMessage = `Benchmark completed! ${result.milestoneProgress.name}: ${result.milestoneProgress.progress}/${result.milestoneProgress.required} benchmarks`;
        } else {
          this.successMessage = `Workout logged! ${result.milestoneProgress.name}: ${result.milestoneProgress.progress}/${result.milestoneProgress.required}`;
        }

        // Handle tier level up
        if (result.tierLevelUp && result.tierLevelUp.leveledUp) {
          this.showLevelUp = true;
          this.newTierName = result.tierLevelUp.tierName;
          this.athlete = await this._athleteRepository.getCurrentAthlete();
        }

        // Handle milestone completion
        if (result.milestoneProgress.justCompleted) {
          this.successMessage = `🎉 Milestone completed: ${result.milestoneProgress.name}!`;
        }
      } else {
        this.errorMessage = result.error || "Failed to log workout";
      }

      // Refresh progress display
      await this.refreshProgress();
      await this.loadAvailableMilestones();

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
}
