/**
 * Athlete model representing a user's profile
 */
export class Athlete {
  constructor(id, name, birthday, gender, skinTone) {
    this._id = id;
    this.name = name || "";
    this.birthday = birthday || null;
    this.gender = gender || "male";
    this.skinTone = skinTone || "neutral";
    this.currentTier = 0;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  get id() {
    return this._id;
  }

  /**
   * Get the avatar set based on gender
   * Trans male/female maps to male/female respectively
   */
  get avatarSet() {
    if (this.gender === "male" || this.gender === "trans-male") {
      return "male";
    }
    return "female";
  }

  /**
   * Get the current avatar image path based on tier
   */
  getAvatarPath(tier) {
    const tierLevel = tier ?? this.currentTier;
    return `img/${this.avatarSet}${tierLevel}.png`;
  }

  /**
   * Calculate age from birthday
   */
  get age() {
    if (!this.birthday) return null;
    const today = new Date();
    const birth = new Date(this.birthday);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }

  /**
   * Check if athlete profile is complete
   */
  get isComplete() {
    return (
      this.name && this.name.trim().length > 0 && this.birthday && this.gender
    );
  }

  /**
   * Serialize to plain object for storage
   */
  toJSON() {
    return {
      id: this._id,
      name: this.name,
      birthday: this.birthday,
      gender: this.gender,
      skinTone: this.skinTone,
      currentTier: this.currentTier,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create Athlete from plain object
   */
  static fromJSON(data) {
    const athlete = new Athlete(
      data.id,
      data.name,
      data.birthday,
      data.gender,
      data.skinTone,
    );
    athlete.currentTier = data.currentTier || 0;
    athlete.createdAt = data.createdAt;
    athlete.updatedAt = data.updatedAt;
    return athlete;
  }
}
