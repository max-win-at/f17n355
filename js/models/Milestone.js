/**
 * Milestone difficulty type enumeration
 */
export const MilestoneType = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
  DIAMOND: "diamond",
};

/**
 * Milestone icons mapping
 */
export const MilestoneIcons = {
  [MilestoneType.BRONZE]: "🥉",
  [MilestoneType.SILVER]: "🥈",
  [MilestoneType.GOLD]: "🥇",
  [MilestoneType.PLATINUM]: "💎",
  [MilestoneType.DIAMOND]: "👑",
};

/**
 * Milestone model representing a workout achievement goal
 */
export class Milestone {
  /**
   * @param {string} type - Milestone type (bronze, silver, gold, platinum, diamond)
   * @param {string} name - Milestone display name
   * @param {number} requiredWorkouts - Number of workouts needed to complete (for bronze/silver/gold)
   * @param {Array} workoutRequirements - Array of workout requirements, each with {workoutType, reps, timeMinutes}
   * @param {Array} benchmarkWorkouts - Array of benchmark challenges (for platinum/diamond)
   */
  constructor(
    type,
    name,
    requiredWorkouts,
    workoutRequirements = [],
    benchmarkWorkouts = [],
  ) {
    this._type = type;
    this._name = name;
    this._requiredWorkouts = requiredWorkouts;
    this._workoutRequirements = workoutRequirements; // [{workoutType, reps, timeMinutes}, ...]
    this._benchmarkWorkouts = benchmarkWorkouts; // [{name, exercises: [{workoutType, reps}], timeCapMinutes}, ...]
    this.progress = 0;
    this.benchmarksCompleted = []; // Track which benchmarks are done
  }

  get type() {
    return this._type;
  }

  get name() {
    return this._name;
  }

  get requiredWorkouts() {
    return this._requiredWorkouts;
  }

  get workoutRequirements() {
    return this._workoutRequirements;
  }

  get benchmarkWorkouts() {
    return this._benchmarkWorkouts;
  }

  /**
   * Get all workout types accepted by this milestone
   */
  get workoutTypes() {
    if (this._workoutRequirements.length === 0) {
      return []; // Accept all
    }
    return this._workoutRequirements.map((req) => req.workoutType);
  }

  get icon() {
    return MilestoneIcons[this._type] || "🏅";
  }

  /**
   * Check if milestone uses benchmark system (platinum/diamond)
   */
  get usesBenchmarks() {
    return this._benchmarkWorkouts.length > 0;
  }

  get isCompleted() {
    if (this.usesBenchmarks) {
      // For benchmark milestones, all benchmarks must be completed
      return this.benchmarksCompleted.length >= this._benchmarkWorkouts.length;
    }
    return this.progress >= this._requiredWorkouts;
  }

  get progressPercent() {
    if (this.usesBenchmarks) {
      if (this._benchmarkWorkouts.length === 0) return 0;
      return Math.min(
        100,
        (this.benchmarksCompleted.length / this._benchmarkWorkouts.length) *
          100,
      );
    }
    return Math.min(100, (this.progress / this._requiredWorkouts) * 100);
  }

  /**
   * Add progress towards milestone
   */
  addProgress(count = 1) {
    this.progress = Math.min(this.progress + count, this._requiredWorkouts);
    return this.isCompleted;
  }

  /**
   * Mark a benchmark workout as completed
   * @param {number} benchmarkIndex - Index of the benchmark in the benchmarkWorkouts array
   */
  completeBenchmark(benchmarkIndex) {
    if (!this.benchmarksCompleted.includes(benchmarkIndex)) {
      this.benchmarksCompleted.push(benchmarkIndex);
    }
    return this.isCompleted;
  }

  /**
   * Check if a workout type counts towards this milestone
   */
  acceptsWorkoutType(workoutType) {
    if (this._workoutRequirements.length === 0) {
      return true; // Accept all workout types
    }
    return this._workoutRequirements.some(
      (req) => req.workoutType === workoutType,
    );
  }

  /**
   * Get requirement details for a specific workout type
   * @returns {Object|null} - {reps, timeMinutes} or null if not found
   */
  getRequirementForWorkoutType(workoutType) {
    const req = this._workoutRequirements.find(
      (r) => r.workoutType === workoutType,
    );
    if (!req) return null;
    return { reps: req.reps, timeMinutes: req.timeMinutes };
  }

  /**
   * Reset progress
   */
  reset() {
    this.progress = 0;
    this.benchmarksCompleted = [];
  }

  /**
   * Clone milestone with fresh progress
   */
  clone() {
    return new Milestone(
      this._type,
      this._name,
      this._requiredWorkouts,
      [...this._workoutRequirements],
      [...this._benchmarkWorkouts],
    );
  }

  /**
   * Serialize to plain object
   */
  toJSON() {
    return {
      type: this._type,
      name: this._name,
      requiredWorkouts: this._requiredWorkouts,
      workoutRequirements: this._workoutRequirements,
      benchmarkWorkouts: this._benchmarkWorkouts,
      progress: this.progress,
      benchmarksCompleted: this.benchmarksCompleted,
    };
  }

  /**
   * Create Milestone from plain object
   */
  static fromJSON(data) {
    const milestone = new Milestone(
      data.type,
      data.name,
      data.requiredWorkouts,
      data.workoutRequirements || [],
      data.benchmarkWorkouts || [],
    );
    milestone.progress = data.progress || 0;
    milestone.benchmarksCompleted = data.benchmarksCompleted || [];
    return milestone;
  }
}
