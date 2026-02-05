/**
 * ProofMethodType - Constants for workout proof methods
 * Eliminates magic strings and provides semantic type safety
 */
export const ProofMethodType = {
  ESCROW: "escrow",
  VIDEO: "video",
  RECORD: "record",

  /**
   * Get all valid proof method types as array
   */
  getAll() {
    return [this.ESCROW, this.VIDEO, this.RECORD];
  },

  /**
   * Validate if a proof method type is valid
   */
  isValid(methodType) {
    return this.getAll().includes(methodType);
  },

  /**
   * Get user-friendly label for proof method
   */
  getLabel(methodType) {
    const labels = {
      [this.ESCROW]: "Guarantor Verification",
      [this.VIDEO]: "Video Proof",
      [this.RECORD]: "Record Attempt",
    };
    return labels[methodType] || methodType;
  },
};

Object.freeze(ProofMethodType);
