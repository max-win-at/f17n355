import { Milestone } from "./Milestone.js";

/**
 * Tier model representing a progression level containing milestones
 */
export class Tier {
  constructor(level, name, milestones) {
    this._level = level;
    this._name = name;
    this._milestones = milestones || [];
  }

  get level() {
    return this._level;
  }

  get name() {
    return this._name;
  }

  get milestones() {
    return this._milestones;
  }

  /**
   * Get count of completed milestones
   */
  get completedMilestones() {
    return this._milestones.filter((m) => m.isCompleted).length;
  }

  /**
   * Get total milestone count
   */
  get totalMilestones() {
    return this._milestones.length;
  }

  /**
   * Check if tier is completed (all milestones done)
   */
  get isCompleted() {
    return this._milestones.every((m) => m.isCompleted);
  }

  /**
   * Get tier completion percentage (based on total workouts, not milestone count)
   */
  get progressPercent() {
    const totalWorkoutsNeeded = this.getTotalWorkoutsNeeded();
    if (totalWorkoutsNeeded === 0) return 0;
    const totalWorkoutsCompleted = this.getTotalWorkoutsCompleted();
    return Math.min(100, (totalWorkoutsCompleted / totalWorkoutsNeeded) * 100);
  }

  /**
   * Get total workouts needed for all milestones in this tier
   */
  getTotalWorkoutsNeeded() {
    return this._milestones.reduce((sum, milestone) => {
      if (milestone.usesBenchmarks) {
        // Option C: Benchmarks count as fixed percentage of tier
        // Each benchmark milestone counts as 15% of its nominal required workouts
        return sum + Math.ceil(milestone.requiredWorkouts * 0.15);
      }
      return sum + milestone.requiredWorkouts;
    }, 0);
  }

  /**
   * Get total workouts completed across all milestones in this tier
   */
  getTotalWorkoutsCompleted() {
    return this._milestones.reduce((sum, milestone) => {
      if (milestone.usesBenchmarks) {
        // Option C: Each completed benchmark counts proportionally
        const benchmarkValue = Math.ceil(milestone.requiredWorkouts * 0.15);
        return (
          sum +
          (milestone.benchmarksCompleted.length /
            milestone.benchmarkWorkouts.length) *
            benchmarkValue
        );
      }
      return sum + milestone.progress;
    }, 0);
  }

  /**
   * Find milestone by type
   */
  findMilestoneByType(type) {
    return this._milestones.find((m) => m.type === type);
  }

  /**
   * Add milestone to tier
   */
  addMilestone(milestone) {
    this._milestones.push(milestone);
  }

  /**
   * Reset all milestone progress
   */
  resetProgress() {
    this._milestones.forEach((m) => m.reset());
  }

  /**
   * Clone tier with fresh milestones
   */
  clone() {
    return new Tier(
      this._level,
      this._name,
      this._milestones.map((m) => m.clone()),
    );
  }

  /**
   * Serialize to plain object
   */
  toJSON() {
    return {
      level: this._level,
      name: this._name,
      milestones: this._milestones.map((m) => m.toJSON()),
    };
  }

  /**
   * Create Tier from plain object
   */
  static fromJSON(data) {
    return new Tier(
      data.level,
      data.name,
      data.milestones.map((m) => Milestone.fromJSON(m)),
    );
  }
}
