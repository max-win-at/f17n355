import { TierConfiguration } from "../models/TierConfiguration.js";

/**
 * ProgressionService - Handles tier progression and milestone calculations
 */
export class ProgressionService {
  constructor(athleteRepository, workoutRepository, storageService) {
    this._athleteRepository = athleteRepository;
    this._workoutRepository = workoutRepository;
    this._storageService = storageService;
    this._tierConfig = new TierConfiguration();
    this._progressStoreName = "progress";
    this._progressKey = "tier-progress";
  }

  get tierConfiguration() {
    return this._tierConfig;
  }

  /**
   * Initialize or load saved progress
   */
  async initialize() {
    const savedProgress = await this._storageService.getItem(
      this._progressStoreName,
      this._progressKey,
    );

    if (savedProgress && savedProgress.tiers) {
      this._tierConfig = TierConfiguration.fromJSON(savedProgress);
    }

    return this._tierConfig;
  }

  /**
   * Save current progress to storage
   */
  async saveProgress() {
    const data = {
      id: this._progressKey,
      ...this._tierConfig.toJSON(),
    };
    // Ensure data is structured-clone safe for IndexedDB
    const safeData = JSON.parse(JSON.stringify(data));
    await this._storageService.putItem(this._progressStoreName, safeData);
  }

  /**
   * Get current tier for athlete
   */
  async getCurrentTier() {
    const athlete = await this._athleteRepository.getCurrentAthlete();
    if (!athlete) return 0;
    return athlete.currentTier;
  }

  /**
   * Get tier object by level
   */
  getTier(level) {
    return this._tierConfig.getTierByLevel(level);
  }

  /**
   * Get milestones for current tier
   */
  async getCurrentTierMilestones() {
    const tierLevel = await this.getCurrentTier();
    const tier = this._tierConfig.getTierByLevel(tierLevel);
    if (!tier) return [];
    return tier.milestones;
  }

  /**
   * Add workout and update milestone progress
   */
  async addWorkoutProgress(workout) {
    const tier = this._tierConfig.getTierByLevel(workout.tier);
    if (!tier) return { success: false, error: "Invalid tier" };

    const milestone = tier.findMilestoneByType(workout.milestoneType);
    if (!milestone) return { success: false, error: "Invalid milestone" };

    // Check if workout type is accepted by milestone
    if (!milestone.acceptsWorkoutType(workout.type)) {
      return {
        success: false,
        error: `${workout.type} does not count towards ${milestone.name}`,
      };
    }

    const wasCompleted = milestone.isCompleted;
    milestone.addProgress(1);
    const nowCompleted = milestone.isCompleted;

    await this.saveProgress();

    const result = {
      success: true,
      milestoneProgress: {
        name: milestone.name,
        progress: milestone.progress,
        required: milestone.requiredWorkouts,
        justCompleted: !wasCompleted && nowCompleted,
      },
    };

    // Check for tier level up
    if (tier.isCompleted) {
      const leveledUp = await this._checkTierLevelUp(workout.tier);
      result.tierLevelUp = leveledUp;
    }

    return result;
  }

  /**
   * Check and process tier level up
   */
  async _checkTierLevelUp(currentTierLevel) {
    const nextTierLevel = currentTierLevel + 1;

    // Check if there's a next tier
    if (nextTierLevel >= this._tierConfig.tierCount) {
      return { leveledUp: false, maxTierReached: true };
    }

    // Reset progress for next tier
    const nextTier = this._tierConfig.getTierByLevel(nextTierLevel);
    if (nextTier) {
      nextTier.resetProgress();
    }

    // Update athlete's tier
    await this._athleteRepository.updateTier(nextTierLevel);
    await this.saveProgress();

    return {
      leveledUp: true,
      newTier: nextTierLevel,
      tierName: this._tierConfig.getTierByLevel(nextTierLevel).name,
    };
  }

  /**
   * Get progress summary for current tier
   */
  async getTierProgressSummary() {
    const tierLevel = await this.getCurrentTier();
    const tier = this._tierConfig.getTierByLevel(tierLevel);

    if (!tier) {
      return {
        tierLevel: 0,
        tierName: "Unknown",
        completedMilestones: 0,
        totalMilestones: 0,
        progressPercent: 0,
        milestones: [],
      };
    }

    return {
      tierLevel: tier.level,
      tierName: tier.name,
      completedMilestones: tier.completedMilestones,
      totalMilestones: tier.totalMilestones,
      totalWorkoutsNeeded: tier.getTotalWorkoutsNeeded(),
      totalWorkoutsCompleted: tier.getTotalWorkoutsCompleted(),
      progressPercent: tier.progressPercent,
      milestones: tier.milestones.map((m) => ({
        type: m.type,
        name: m.name,
        icon: m.icon,
        progress: m.progress,
        required: m.requiredWorkouts,
        completed: m.isCompleted,
        progressPercent: m.progressPercent,
      })),
    };
  }

  /**
   * Reset all progress (for testing/debug)
   */
  async resetAllProgress() {
    this._tierConfig = new TierConfiguration();
    await this.saveProgress();
    await this._athleteRepository.updateTier(0);
  }

  /**
   * Get available milestone types for adding a workout
   */
  async getAvailableMilestones() {
    const tierLevel = await this.getCurrentTier();
    const tier = this._tierConfig.getTierByLevel(tierLevel);

    if (!tier) return [];

    // Return incomplete milestones first, then completed ones
    return tier.milestones
      .map((m) => ({
        type: m.type,
        name: m.name,
        icon: m.icon,
        progress: m.progress,
        required: m.requiredWorkouts,
        completed: m.isCompleted,
        workoutTypes: m.workoutTypes,
      }))
      .sort((a, b) => a.completed - b.completed);
  }
}
