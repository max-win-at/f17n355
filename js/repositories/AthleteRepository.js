import { Athlete } from "../models/Athlete.js";

/**
 * AthleteRepository - Data access layer for Athlete entities
 */
export class AthleteRepository {
  constructor(storageService) {
    this._storageService = storageService;
    this._storeName = "athletes";
    this._currentAthleteKey = "current-athlete";
  }

  /**
   * Get current athlete profile
   */
  async getCurrentAthlete() {
    const data = await this._storageService.getItem(
      this._storeName,
      this._currentAthleteKey,
    );
    if (!data) return null;
    return Athlete.fromJSON(data);
  }

  /**
   * Save current athlete profile
   */
  async saveAthlete(athlete) {
    athlete.updatedAt = new Date().toISOString();
    const data = {
      ...athlete.toJSON(),
      id: this._currentAthleteKey,
    };
    await this._storageService.putItem(this._storeName, data);
    return athlete;
  }

  /**
   * Create new athlete profile
   */
  async createAthlete(name, birthday, gender, skinTone) {
    const athlete = new Athlete(
      this._currentAthleteKey,
      name,
      birthday,
      gender,
      skinTone,
    );
    return this.saveAthlete(athlete);
  }

  /**
   * Update athlete's current tier
   */
  async updateTier(tierLevel) {
    const athlete = await this.getCurrentAthlete();
    if (!athlete) {
      throw new Error("No athlete profile found");
    }
    athlete.currentTier = tierLevel;
    return this.saveAthlete(athlete);
  }

  /**
   * Check if athlete profile exists
   */
  async hasProfile() {
    const athlete = await this.getCurrentAthlete();
    return athlete !== null && athlete.isComplete;
  }

  /**
   * Delete athlete profile
   */
  async deleteProfile() {
    await this._storageService.deleteItem(
      this._storeName,
      this._currentAthleteKey,
    );
  }
}
