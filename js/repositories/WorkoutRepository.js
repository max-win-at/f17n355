import { Workout, ProofMethod } from "../models/Workout.js";

/**
 * WorkoutRepository - Data access layer for Workout entities
 */
export class WorkoutRepository {
  constructor(storageService) {
    this._storageService = storageService;
    this._storeName = "workouts";
  }

  /**
   * Generate unique workout ID
   */
  _generateId() {
    return `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all workouts
   */
  async getAllWorkouts() {
    const data = await this._storageService.getAllItems(this._storeName);
    return data
      .map((w) => Workout.fromJSON(w))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Get workout by ID
   */
  async getWorkoutById(id) {
    const data = await this._storageService.getItem(this._storeName, id);
    if (!data) return null;
    return Workout.fromJSON(data);
  }

  /**
   * Get workouts by tier
   */
  async getWorkoutsByTier(tier) {
    const data = await this._storageService.queryByIndex(
      this._storeName,
      "tier",
      tier,
    );
    return data.map((w) => Workout.fromJSON(w));
  }

  /**
   * Get workouts by milestone type
   */
  async getWorkoutsByMilestone(milestoneType) {
    const data = await this._storageService.queryByIndex(
      this._storeName,
      "milestoneType",
      milestoneType,
    );
    return data.map((w) => Workout.fromJSON(w));
  }

  /**
   * Create and save new workout
   */
  async createWorkout(type, proofMethodString, milestoneType, tier) {
    const id = this._generateId();
    const proofMethod = ProofMethod.fromString(proofMethodString);
    const workout = new Workout(id, type, proofMethod, milestoneType, tier);

    await this._storageService.putItem(this._storeName, workout.toJSON());
    return workout;
  }

  /**
   * Update existing workout
   */
  async updateWorkout(workout) {
    await this._storageService.putItem(this._storeName, workout.toJSON());
    return workout;
  }

  /**
   * Delete workout by ID
   */
  async deleteWorkout(id) {
    await this._storageService.deleteItem(this._storeName, id);
  }

  /**
   * Get workout count for a specific tier and milestone
   */
  async getWorkoutCount(tier, milestoneType) {
    const workouts = await this.getAllWorkouts();
    return workouts.filter(
      (w) => w.tier === tier && w.milestoneType === milestoneType,
    ).length;
  }

  /**
   * Get total workout count for a tier
   */
  async getTotalWorkoutsForTier(tier) {
    const workouts = await this.getWorkoutsByTier(tier);
    return workouts.length;
  }

  /**
   * Clear all workouts
   */
  async clearAllWorkouts() {
    await this._storageService.clearStore(this._storeName);
  }
}
