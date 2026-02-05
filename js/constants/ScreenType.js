/**
 * ScreenType - Constants for navigation screens
 * Eliminates magic strings and provides semantic type safety
 */
export const ScreenType = {
  SETUP: "setup",
  MAIN: "main",
  HISTORY: "history",

  /**
   * Get all valid screen types as array
   */
  getAll() {
    return [this.SETUP, this.MAIN, this.HISTORY];
  },

  /**
   * Validate if a screen type is valid
   */
  isValid(screenType) {
    return this.getAll().includes(screenType);
  },
};

Object.freeze(ScreenType);
