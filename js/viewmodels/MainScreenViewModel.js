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
    this.isLoading = false;
    this.errorMessage = "";
    this.successMessage = "";

    // Workout adding state
    this.showWorkoutForm = false;
    this.selectedProofMethod = "";
    this.selectedWorkoutType = "";
    this.selectedMilestone = "";
    this.availableWorkoutTypes = [];
    this.availableMilestones = [];

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
      this.milestones = summary.milestones;
    } catch (error) {
      this._logger.error("Failed to refresh progress", error);
    }
  }

  /**
   * Load available milestones for workout form
   */
  async loadAvailableMilestones() {
    this.availableMilestones =
      await this._progressionService.getAvailableMilestones();
    if (this.availableMilestones.length > 0 && !this.selectedMilestone) {
      this.selectedMilestone = this.availableMilestones[0].type;
      this.updateWorkoutTypes();
    }
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
   * Start adding a workout with specific proof method
   */
  startAddWorkout(proofMethod) {
    this.selectedProofMethod = proofMethod;
    this.showWorkoutForm = true;
    this.updateWorkoutTypes();
    this._logger.log(`Starting workout add flow with proof: ${proofMethod}`);
  }

  /**
   * Cancel workout form
   */
  cancelAddWorkout() {
    this.showWorkoutForm = false;
    this.selectedProofMethod = "";
    this.errorMessage = "";
  }

  /**
   * Submit workout
   */
  async submitWorkout() {
    if (!this.selectedWorkoutType || !this.selectedMilestone) {
      this.errorMessage = "Please select workout type and milestone";
      return;
    }

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

      // Close form on success
      if (result.success) {
        this.showWorkoutForm = false;
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
