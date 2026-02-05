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
      if (['bronze', 'silver', 'gold'].includes(milestone.type)) {
        early.push(milestone);
      } else {
        late.push(milestone);
      }
    }
    
    this.availableMilestones = allMilestones;
    this.groupedMilestones = {
      early: early,
      late: late
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
   * Update available workout types based on selected milestone
   */
  updateWorkoutTypes() {
    const milestone = this.availableMilestones.find(
      (m) => m.type === this.selectedMilestone,
    );
    if (milestone && milestone.workoutTypes.length > 0) {
      this.availableWorkoutTypes = milestone.workoutTypes;
    } else {
      this.availableWorkoutTypes = getAllWorkoutTypes();
    }

    if (this.availableWorkoutTypes.length > 0) {
      this.selectedWorkoutType = this.availableWorkoutTypes[0];
    }
  }

  /**
   * Step 1: Start adding a workout - show workout selection modal
   */
  startAddWorkout() {
    this.showWorkoutSelectionModal = true;
    this.selectedMilestone = "";
    this.selectedWorkoutType = "";
    this.errorMessage = "";
    this._logger.log("Starting Add Workout flow - workout selection");
  }

  /**
   * Select a workout and milestone, move to proof method selection
   */
  selectWorkout() {
    if (!this.selectedMilestone || !this.selectedWorkoutType) {
      this.errorMessage = "Please select both milestone and workout type";
      return;
    }
    
    this.showWorkoutSelectionModal = false;
    this.showProofMethodModal = true;
    this.errorMessage = "";
    this._logger.log(
      `Workout selected: ${this.selectedWorkoutType} for ${this.selectedMilestone}`
    );
  }

  /**
   * Cancel workout selection modal
   */
  cancelWorkoutSelection() {
    this.showWorkoutSelectionModal = false;
    this.selectedMilestone = "";
    this.selectedWorkoutType = "";
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
    if (!this.selectedWorkoutType || !this.selectedMilestone) {
      this.errorMessage = "Please select workout type and milestone";
      return;
    }

    this.selectedProofMethod = proofMethod;
    this.isLoading = true;
    this.errorMessage = "";
    this.successMessage = "";

    try {
      // Create workout in repository
      const workout = await this._workoutRepository.createWorkout(
        this.selectedWorkoutType,
        this.selectedProofMethod,
        this.selectedMilestone,
        this.currentTier,
      );

      // Handle proof method (stub implementations)
      if (this.selectedProofMethod === "escrow") {
        await this._proofService.initiateEscrowProof(workout);
      } else if (this.selectedProofMethod === "video") {
        await this._proofService.initiateVideoProof(workout);
      }

      // Update progression
      const result = await this._progressionService.addWorkoutProgress(workout);

      if (result.success) {
        this.successMessage = `Workout logged! ${result.milestoneProgress.name}: ${result.milestoneProgress.progress}/${result.milestoneProgress.required}`;

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
