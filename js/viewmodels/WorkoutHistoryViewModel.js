import { ProofMethod } from "../models/Workout.js";

/**
 * WorkoutHistoryViewModel - Handles workout history display
 */
export class WorkoutHistoryViewModel {
  constructor(workoutRepository, logger) {
    this._workoutRepository = workoutRepository;
    this._logger = logger;

    // Public fields for Alpine.js bindings
    this.workouts = [];
    this.isLoading = false;
    this.errorMessage = "";
    this.filterMilestone = "";
    this.filterProofMethod = "";
  }

  /**
   * Load all workouts
   */
  async loadWorkouts() {
    this.isLoading = true;
    this.errorMessage = "";

    try {
      this.workouts = await this._workoutRepository.getAllWorkouts();
      this._logger.log(`Loaded ${this.workouts.length} workouts`);
    } catch (error) {
      this._logger.error("Failed to load workouts", error);
      this.errorMessage = "Failed to load workout history";
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get filtered workouts
   */
  get filteredWorkouts() {
    let result = this.workouts;

    if (this.filterMilestone) {
      result = result.filter((w) => w.milestoneType === this.filterMilestone);
    }

    if (this.filterProofMethod) {
      result = result.filter(
        (w) => ProofMethod.toString(w.proofMethod) === this.filterProofMethod,
      );
    }

    return result;
  }

  /**
   * Get workout count
   */
  get totalCount() {
    return this.workouts.length;
  }

  /**
   * Format date for display
   */
  formatDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now - date;

    // Less than 24 hours ago
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      if (hours === 0) {
        const minutes = Math.floor(diff / 60000);
        return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
      }
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }

    // Less than 7 days ago
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return days === 1 ? "Yesterday" : `${days} days ago`;
    }

    // Format as date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  /**
   * Get proof method label
   */
  getProofLabel(proofMethod) {
    if (typeof proofMethod === "string") {
      return ProofMethod.getLabel(ProofMethod.fromString(proofMethod));
    }
    return ProofMethod.getLabel(proofMethod);
  }

  /**
   * Get proof badge CSS class
   */
  getProofBadgeClass(proofMethod) {
    const method =
      typeof proofMethod === "string"
        ? proofMethod
        : ProofMethod.toString(proofMethod);
    return `proof-${method}`;
  }

  /**
   * Get milestone color class
   */
  getMilestoneColorClass(milestoneType) {
    return `text-${milestoneType}`;
  }

  /**
   * Clear filter
   */
  clearFilters() {
    this.filterMilestone = "";
    this.filterProofMethod = "";
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(workoutId) {
    try {
      await this._workoutRepository.deleteWorkout(workoutId);
      this.workouts = this.workouts.filter((w) => w.id !== workoutId);
      this._logger.log(`Deleted workout: ${workoutId}`);
    } catch (error) {
      this._logger.error("Failed to delete workout", error);
      this.errorMessage = "Failed to delete workout";
    }
  }
}
