/**
 * Proof method enumeration
 */
export const ProofMethod = {
  ESCROW: Symbol("escrow"),
  VIDEO: Symbol("video"),
  RECORD: Symbol("record"), // Off the record / no proof

  fromString(str) {
    switch (str) {
      case "escrow":
        return ProofMethod.ESCROW;
      case "video":
        return ProofMethod.VIDEO;
      case "record":
        return ProofMethod.RECORD;
      default:
        return ProofMethod.RECORD;
    }
  },

  toString(method) {
    if (method === ProofMethod.ESCROW) return "escrow";
    if (method === ProofMethod.VIDEO) return "video";
    return "record";
  },

  getLabel(method) {
    if (method === ProofMethod.ESCROW) return "Escrow";
    if (method === ProofMethod.VIDEO) return "Video Proof";
    return "Off Record";
  },
};

/**
 * Workout model representing a logged workout
 */
export class Workout {
  constructor(id, type, proofMethod, milestoneType, tier) {
    this._id = id;
    this.type = type;
    this.proofMethod = proofMethod;
    this.milestoneType = milestoneType;
    this.tier = tier;
    this.date = new Date().toISOString();
    this.verified = false;
    this.notes = "";
  }

  get id() {
    return this._id;
  }

  /**
   * Check if this workout has verifiable proof
   */
  get hasProof() {
    return this.proofMethod !== ProofMethod.RECORD;
  }

  /**
   * Get human-readable proof method
   */
  get proofLabel() {
    return ProofMethod.getLabel(this.proofMethod);
  }

  /**
   * Serialize to plain object for storage
   */
  toJSON() {
    return {
      id: this._id,
      type: this.type,
      proofMethod: ProofMethod.toString(this.proofMethod),
      milestoneType: this.milestoneType,
      tier: this.tier,
      date: this.date,
      verified: this.verified,
      notes: this.notes,
    };
  }

  /**
   * Create Workout from plain object
   */
  static fromJSON(data) {
    const workout = new Workout(
      data.id,
      data.type,
      ProofMethod.fromString(data.proofMethod),
      data.milestoneType,
      data.tier,
    );
    workout.date = data.date;
    workout.verified = data.verified || false;
    workout.notes = data.notes || "";
    return workout;
  }
}
