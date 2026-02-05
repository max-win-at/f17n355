/**
 * AthleteSetupViewModel - Handles athlete profile setup screen
 */
export class AthleteSetupViewModel {
  constructor(athleteRepository, logger) {
    this._athleteRepository = athleteRepository;
    this._logger = logger;

    // Public fields for Alpine.js bindings
    this.name = "";
    this.birthday = "";
    this.gender = "male";
    this.skinTone = "neutral";
    this.isLoading = false;
    this.errorMessage = "";
    this.isExistingProfile = false;
  }

  /**
   * Gender options for toggle buttons
   */
  get genderOptions() {
    return [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "trans-male", label: "Trans Male" },
      { value: "trans-female", label: "Trans Female" },
    ];
  }

  /**
   * Skin tone options with display colors
   */
  get skinToneOptions() {
    return [
      { value: "neutral", label: "Neutral", color: "#C4A484" },
      { value: "white", label: "Light", color: "#FFE0BD" },
      { value: "brown", label: "Medium", color: "#A0785A" },
      { value: "black", label: "Dark", color: "#6B4423" },
    ];
  }

  /**
   * Check if setup form is valid
   */
  get isValid() {
    return this.name.trim().length > 0 && this.birthday;
  }

  /**
   * Load existing athlete data if available
   */
  async loadExistingAthlete() {
    this.isLoading = true;
    this.errorMessage = "";

    try {
      const athlete = await this._athleteRepository.getCurrentAthlete();
      if (athlete) {
        this.name = athlete.name || "";
        this.birthday = athlete.birthday || "";
        this.gender = athlete.gender || "male";
        this.skinTone = athlete.skinTone || "neutral";
        this.isExistingProfile = true;
        this._logger.log("Loaded existing athlete profile");
      } else {
        this.isExistingProfile = false;
      }
    } catch (error) {
      this._logger.error("Failed to load athlete profile", error);
      this.errorMessage = "Failed to load profile";
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Save athlete profile
   */
  async saveAthlete() {
    if (!this.isValid) {
      this.errorMessage = "Please fill in all required fields";
      return false;
    }

    this.isLoading = true;
    this.errorMessage = "";

    try {
      const existingAthlete = await this._athleteRepository.getCurrentAthlete();
      if (existingAthlete) {
        existingAthlete.name = this.name.trim();
        existingAthlete.birthday = this.birthday;
        existingAthlete.gender = this.gender;
        existingAthlete.skinTone = this.skinTone;
        await this._athleteRepository.saveAthlete(existingAthlete);
        this.isExistingProfile = true;
      } else {
        await this._athleteRepository.createAthlete(
          this.name.trim(),
          this.birthday,
          this.gender,
          this.skinTone,
        );
        this.isExistingProfile = true;
      }
      this._logger.log("Athlete profile saved successfully");
      return true;
    } catch (error) {
      this._logger.error("Failed to save athlete profile", error);
      this.errorMessage = "Failed to save profile";
      return false;
    } finally {
      this.isLoading = false;
    }
  }
}
