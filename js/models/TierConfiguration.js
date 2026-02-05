import { Tier } from "./Tier.js";
import { Milestone, MilestoneType } from "./Milestone.js";

/**
 * Standard workout types available in the app
 */
export const WorkoutTypes = {
  // Cardio
  RUNNING: "Running",
  CYCLING: "Cycling",
  SWIMMING: "Swimming",
  JUMPING_ROPE: "Jumping Rope",
  HIIT: "HIIT",

  // Strength
  PUSH_UPS: "Push-ups",
  PULL_UPS: "Pull-ups",
  SQUATS: "Squats",
  DEADLIFTS: "Deadlifts",
  BENCH_PRESS: "Bench Press",

  // Flexibility
  YOGA: "Yoga",
  STRETCHING: "Stretching",
  PILATES: "Pilates",

  // Endurance
  WALKING: "Walking",
  HIKING: "Hiking",
  ROWING: "Rowing",

  // Sports
  BASKETBALL: "Basketball",
  SOCCER: "Soccer",
  TENNIS: "Tennis",
  MARTIAL_ARTS: "Martial Arts",
};

/**
 * Get all workout types as an array
 */
export function getAllWorkoutTypes() {
  return Object.values(WorkoutTypes);
}

/**
 * TierConfiguration - Configures the 5 tiers with milestones and workout requirements
 * Pre-initialized with demo values
 */
export class TierConfiguration {
  constructor() {
    this._tiers = this._createDefaultTiers();
  }

  get tiers() {
    return this._tiers;
  }

  get tierCount() {
    return this._tiers.length;
  }

  /**
   * Get tier by level (0-4)
   */
  getTierByLevel(level) {
    return this._tiers[level] || null;
  }

  /**
   * Get milestone types for a specific tier
   */
  getMilestoneTypesForTier(tierLevel) {
    const tier = this.getTierByLevel(tierLevel);
    if (!tier) return [];
    return tier.milestones.map((m) => m.type);
  }

  /**
   * Get available workout types for a milestone in a tier
   */
  getWorkoutTypesForMilestone(tierLevel, milestoneType) {
    const tier = this.getTierByLevel(tierLevel);
    if (!tier) return getAllWorkoutTypes();

    const milestone = tier.findMilestoneByType(milestoneType);
    if (!milestone || milestone.workoutTypes.length === 0) {
      return getAllWorkoutTypes();
    }
    return milestone.workoutTypes;
  }

  /**
   * Get workout requirements for a milestone in a tier
   */
  getWorkoutRequirementsForMilestone(tierLevel, milestoneType) {
    const tier = this.getTierByLevel(tierLevel);
    if (!tier) return [];

    const milestone = tier.findMilestoneByType(milestoneType);
    if (!milestone) return [];
    return milestone.workoutRequirements;
  }

  /**
   * Get benchmark workouts for a milestone in a tier
   */
  getBenchmarkWorkoutsForMilestone(tierLevel, milestoneType) {
    const tier = this.getTierByLevel(tierLevel);
    if (!tier) return [];

    const milestone = tier.findMilestoneByType(milestoneType);
    if (!milestone) return [];
    return milestone.benchmarkWorkouts;
  }

  /**
   * Clone configuration with fresh progress
   */
  cloneWithFreshProgress() {
    const config = new TierConfiguration();
    config._tiers = this._tiers.map((t) => t.clone());
    return config;
  }

  /**
   * Create the default tier structure with demo values
   */
  _createDefaultTiers() {
    return [
      // Tier 1: Beginner - Focus on building habits
      new Tier(0, "Beginner", [
        new Milestone(MilestoneType.BRONZE, "First Steps", 5, [
          { workoutType: WorkoutTypes.WALKING, reps: 15, timeMinutes: 30 },
          { workoutType: WorkoutTypes.STRETCHING, reps: 10, timeMinutes: 15 },
        ]),
        new Milestone(MilestoneType.SILVER, "Getting Moving", 10, [
          { workoutType: WorkoutTypes.WALKING, reps: 20, timeMinutes: 30 },
          { workoutType: WorkoutTypes.YOGA, reps: 15, timeMinutes: 20 },
          { workoutType: WorkoutTypes.STRETCHING, reps: 10, timeMinutes: 15 },
        ]),
        new Milestone(MilestoneType.GOLD, "Building Momentum", 15, [
          { workoutType: WorkoutTypes.RUNNING, reps: 20, timeMinutes: 25 },
          { workoutType: WorkoutTypes.CYCLING, reps: 30, timeMinutes: 30 },
          { workoutType: WorkoutTypes.SWIMMING, reps: 20, timeMinutes: 30 },
        ]),
        new Milestone(
          MilestoneType.PLATINUM,
          "Consistent",
          20,
          [],
          [
            {
              name: "Endurance Challenge",
              exercises: [
                { workoutType: WorkoutTypes.RUNNING, reps: 30 },
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 20 },
              ],
              timeCapMinutes: 40,
            },
            {
              name: "Flexibility Test",
              exercises: [
                { workoutType: WorkoutTypes.YOGA, reps: 25 },
                { workoutType: WorkoutTypes.STRETCHING, reps: 15 },
              ],
              timeCapMinutes: 35,
            },
          ],
        ),
        new Milestone(
          MilestoneType.DIAMOND,
          "Habit Formed",
          30,
          [],
          [
            {
              name: "Beginner Mastery",
              exercises: [
                { workoutType: WorkoutTypes.RUNNING, reps: 40 },
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 30 },
                { workoutType: WorkoutTypes.SQUATS, reps: 30 },
              ],
              timeCapMinutes: 45,
            },
            {
              name: "Cardio Foundation",
              exercises: [
                { workoutType: WorkoutTypes.CYCLING, reps: 50 },
                { workoutType: WorkoutTypes.JUMPING_ROPE, reps: 100 },
              ],
              timeCapMinutes: 50,
            },
          ],
        ),
      ]),

      // Tier 2: Novice - Expanding variety
      new Tier(1, "Novice", [
        new Milestone(MilestoneType.BRONZE, "Strength Intro", 10, [
          { workoutType: WorkoutTypes.PUSH_UPS, reps: 20, timeMinutes: 10 },
          { workoutType: WorkoutTypes.SQUATS, reps: 30, timeMinutes: 15 },
        ]),
        new Milestone(MilestoneType.SILVER, "Cardio Explorer", 15, [
          { workoutType: WorkoutTypes.RUNNING, reps: 30, timeMinutes: 25 },
          { workoutType: WorkoutTypes.CYCLING, reps: 40, timeMinutes: 30 },
          {
            workoutType: WorkoutTypes.JUMPING_ROPE,
            reps: 150,
            timeMinutes: 20,
          },
        ]),
        new Milestone(MilestoneType.GOLD, "Flexibility Focus", 12, [
          { workoutType: WorkoutTypes.YOGA, reps: 30, timeMinutes: 25 },
          { workoutType: WorkoutTypes.PILATES, reps: 25, timeMinutes: 25 },
          { workoutType: WorkoutTypes.STRETCHING, reps: 20, timeMinutes: 15 },
        ]),
        new Milestone(
          MilestoneType.PLATINUM,
          "All-Rounder",
          25,
          [],
          [
            {
              name: "Strength Cardio Mix",
              exercises: [
                { workoutType: WorkoutTypes.RUNNING, reps: 40 },
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 40 },
                { workoutType: WorkoutTypes.SQUATS, reps: 50 },
              ],
              timeCapMinutes: 50,
            },
            {
              name: "Dynamic Movement",
              exercises: [
                { workoutType: WorkoutTypes.JUMPING_ROPE, reps: 200 },
                { workoutType: WorkoutTypes.HIIT, reps: 15 },
                { workoutType: WorkoutTypes.CYCLING, reps: 50 },
              ],
              timeCapMinutes: 55,
            },
          ],
        ),
        new Milestone(
          MilestoneType.DIAMOND,
          "Rising Star",
          40,
          [],
          [
            {
              name: "Novice Champion",
              exercises: [
                { workoutType: WorkoutTypes.RUNNING, reps: 50 },
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 50 },
                { workoutType: WorkoutTypes.PULL_UPS, reps: 10 },
                { workoutType: WorkoutTypes.SQUATS, reps: 60 },
              ],
              timeCapMinutes: 60,
            },
            {
              name: "Complete Workout",
              exercises: [
                { workoutType: WorkoutTypes.CYCLING, reps: 60 },
                { workoutType: WorkoutTypes.YOGA, reps: 30 },
                { workoutType: WorkoutTypes.HIIT, reps: 20 },
              ],
              timeCapMinutes: 65,
            },
          ],
        ),
      ]),

      // Tier 3: Intermediate - Serious training
      new Tier(2, "Intermediate", [
        new Milestone(MilestoneType.BRONZE, "Power Builder", 15, [
          { workoutType: WorkoutTypes.DEADLIFTS, reps: 15, timeMinutes: 20 },
          { workoutType: WorkoutTypes.BENCH_PRESS, reps: 20, timeMinutes: 20 },
          { workoutType: WorkoutTypes.SQUATS, reps: 40, timeMinutes: 20 },
        ]),
        new Milestone(MilestoneType.SILVER, "Endurance Runner", 20, [
          { workoutType: WorkoutTypes.RUNNING, reps: 50, timeMinutes: 35 },
          { workoutType: WorkoutTypes.CYCLING, reps: 60, timeMinutes: 40 },
          { workoutType: WorkoutTypes.ROWING, reps: 40, timeMinutes: 30 },
        ]),
        new Milestone(MilestoneType.GOLD, "HIIT Master", 18, [
          { workoutType: WorkoutTypes.HIIT, reps: 25, timeMinutes: 25 },
          {
            workoutType: WorkoutTypes.JUMPING_ROPE,
            reps: 300,
            timeMinutes: 20,
          },
        ]),
        new Milestone(
          MilestoneType.PLATINUM,
          "Dedicated",
          35,
          [],
          [
            {
              name: "Strength Beast",
              exercises: [
                { workoutType: WorkoutTypes.DEADLIFTS, reps: 30 },
                { workoutType: WorkoutTypes.BENCH_PRESS, reps: 40 },
                { workoutType: WorkoutTypes.PULL_UPS, reps: 20 },
                { workoutType: WorkoutTypes.SQUATS, reps: 80 },
              ],
              timeCapMinutes: 60,
            },
            {
              name: "Cardio Crusher",
              exercises: [
                { workoutType: WorkoutTypes.RUNNING, reps: 70 },
                { workoutType: WorkoutTypes.ROWING, reps: 60 },
                { workoutType: WorkoutTypes.HIIT, reps: 30 },
              ],
              timeCapMinutes: 70,
            },
            {
              name: "Full Body Power",
              exercises: [
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 60 },
                { workoutType: WorkoutTypes.SQUATS, reps: 80 },
                { workoutType: WorkoutTypes.JUMPING_ROPE, reps: 400 },
              ],
              timeCapMinutes: 50,
            },
          ],
        ),
        new Milestone(
          MilestoneType.DIAMOND,
          "Committed",
          50,
          [],
          [
            {
              name: "Intermediate Elite",
              exercises: [
                { workoutType: WorkoutTypes.DEADLIFTS, reps: 40 },
                { workoutType: WorkoutTypes.PULL_UPS, reps: 30 },
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 100 },
                { workoutType: WorkoutTypes.SQUATS, reps: 100 },
              ],
              timeCapMinutes: 75,
            },
            {
              name: "Endurance Challenge",
              exercises: [
                { workoutType: WorkoutTypes.RUNNING, reps: 80 },
                { workoutType: WorkoutTypes.CYCLING, reps: 80 },
                { workoutType: WorkoutTypes.SWIMMING, reps: 50 },
              ],
              timeCapMinutes: 90,
            },
            {
              name: "Complete Athlete",
              exercises: [
                { workoutType: WorkoutTypes.HIIT, reps: 40 },
                { workoutType: WorkoutTypes.JUMPING_ROPE, reps: 500 },
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 70 },
              ],
              timeCapMinutes: 65,
            },
          ],
        ),
      ]),

      // Tier 4: Advanced - High performance
      new Tier(3, "Advanced", [
        new Milestone(MilestoneType.BRONZE, "Strength Master", 25, [
          { workoutType: WorkoutTypes.PULL_UPS, reps: 30, timeMinutes: 15 },
          { workoutType: WorkoutTypes.DEADLIFTS, reps: 30, timeMinutes: 25 },
          { workoutType: WorkoutTypes.BENCH_PRESS, reps: 40, timeMinutes: 25 },
        ]),
        new Milestone(MilestoneType.SILVER, "Cardio Elite", 30, [
          { workoutType: WorkoutTypes.RUNNING, reps: 70, timeMinutes: 45 },
          { workoutType: WorkoutTypes.SWIMMING, reps: 60, timeMinutes: 40 },
          { workoutType: WorkoutTypes.HIIT, reps: 35, timeMinutes: 30 },
        ]),
        new Milestone(MilestoneType.GOLD, "Sports Pro", 25, [
          { workoutType: WorkoutTypes.BASKETBALL, reps: 60, timeMinutes: 50 },
          { workoutType: WorkoutTypes.SOCCER, reps: 60, timeMinutes: 50 },
          { workoutType: WorkoutTypes.TENNIS, reps: 50, timeMinutes: 45 },
          { workoutType: WorkoutTypes.MARTIAL_ARTS, reps: 40, timeMinutes: 40 },
        ]),
        new Milestone(
          MilestoneType.PLATINUM,
          "Peak Performer",
          45,
          [],
          [
            {
              name: "Ultimate Strength",
              exercises: [
                { workoutType: WorkoutTypes.PULL_UPS, reps: 50 },
                { workoutType: WorkoutTypes.DEADLIFTS, reps: 50 },
                { workoutType: WorkoutTypes.BENCH_PRESS, reps: 60 },
                { workoutType: WorkoutTypes.SQUATS, reps: 120 },
              ],
              timeCapMinutes: 75,
            },
            {
              name: "Endurance Beast",
              exercises: [
                { workoutType: WorkoutTypes.RUNNING, reps: 100 },
                { workoutType: WorkoutTypes.SWIMMING, reps: 80 },
                { workoutType: WorkoutTypes.ROWING, reps: 80 },
              ],
              timeCapMinutes: 100,
            },
            {
              name: "Athletic Excellence",
              exercises: [
                { workoutType: WorkoutTypes.HIIT, reps: 50 },
                { workoutType: WorkoutTypes.JUMPING_ROPE, reps: 700 },
                { workoutType: WorkoutTypes.MARTIAL_ARTS, reps: 50 },
              ],
              timeCapMinutes: 80,
            },
            {
              name: "Functional Master",
              exercises: [
                { workoutType: WorkoutTypes.BASKETBALL, reps: 80 },
                { workoutType: WorkoutTypes.PULL_UPS, reps: 40 },
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 120 },
              ],
              timeCapMinutes: 85,
            },
          ],
        ),
        new Milestone(
          MilestoneType.DIAMOND,
          "Elite Athlete",
          60,
          [],
          [
            {
              name: "Advanced Elite Challenge",
              exercises: [
                { workoutType: WorkoutTypes.PULL_UPS, reps: 60 },
                { workoutType: WorkoutTypes.DEADLIFTS, reps: 60 },
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 150 },
                { workoutType: WorkoutTypes.SQUATS, reps: 150 },
              ],
              timeCapMinutes: 90,
            },
            {
              name: "Triathlon Simulation",
              exercises: [
                { workoutType: WorkoutTypes.SWIMMING, reps: 100 },
                { workoutType: WorkoutTypes.CYCLING, reps: 120 },
                { workoutType: WorkoutTypes.RUNNING, reps: 120 },
              ],
              timeCapMinutes: 120,
            },
            {
              name: "Warrior Test",
              exercises: [
                { workoutType: WorkoutTypes.MARTIAL_ARTS, reps: 60 },
                { workoutType: WorkoutTypes.HIIT, reps: 60 },
                { workoutType: WorkoutTypes.ROWING, reps: 100 },
              ],
              timeCapMinutes: 100,
            },
            {
              name: "Complete Dominance",
              exercises: [
                { workoutType: WorkoutTypes.BASKETBALL, reps: 100 },
                { workoutType: WorkoutTypes.TENNIS, reps: 80 },
                { workoutType: WorkoutTypes.YOGA, reps: 50 },
              ],
              timeCapMinutes: 110,
            },
          ],
        ),
      ]),

      // Tier 5: Master - Ultimate achievement
      new Tier(4, "Master", [
        new Milestone(MilestoneType.BRONZE, "Legend Strength", 35, [
          { workoutType: WorkoutTypes.PULL_UPS, reps: 50, timeMinutes: 20 },
          { workoutType: WorkoutTypes.DEADLIFTS, reps: 50, timeMinutes: 30 },
          { workoutType: WorkoutTypes.BENCH_PRESS, reps: 60, timeMinutes: 30 },
          { workoutType: WorkoutTypes.SQUATS, reps: 100, timeMinutes: 30 },
        ]),
        new Milestone(MilestoneType.SILVER, "Ironman Cardio", 40, [
          { workoutType: WorkoutTypes.RUNNING, reps: 100, timeMinutes: 60 },
          { workoutType: WorkoutTypes.SWIMMING, reps: 80, timeMinutes: 50 },
          { workoutType: WorkoutTypes.CYCLING, reps: 120, timeMinutes: 70 },
          { workoutType: WorkoutTypes.ROWING, reps: 100, timeMinutes: 60 },
        ]),
        new Milestone(MilestoneType.GOLD, "Complete Athlete", 35, [
          { workoutType: WorkoutTypes.HIIT, reps: 60, timeMinutes: 40 },
          { workoutType: WorkoutTypes.YOGA, reps: 50, timeMinutes: 45 },
          { workoutType: WorkoutTypes.MARTIAL_ARTS, reps: 60, timeMinutes: 50 },
        ]),
        new Milestone(
          MilestoneType.PLATINUM,
          "Unstoppable",
          55,
          [],
          [
            {
              name: "Master Strength Test",
              exercises: [
                { workoutType: WorkoutTypes.PULL_UPS, reps: 80 },
                { workoutType: WorkoutTypes.DEADLIFTS, reps: 80 },
                { workoutType: WorkoutTypes.BENCH_PRESS, reps: 100 },
                { workoutType: WorkoutTypes.SQUATS, reps: 200 },
              ],
              timeCapMinutes: 100,
            },
            {
              name: "Ironman Challenge",
              exercises: [
                { workoutType: WorkoutTypes.SWIMMING, reps: 150 },
                { workoutType: WorkoutTypes.CYCLING, reps: 180 },
                { workoutType: WorkoutTypes.RUNNING, reps: 150 },
              ],
              timeCapMinutes: 150,
            },
            {
              name: "Ultimate Warrior",
              exercises: [
                { workoutType: WorkoutTypes.MARTIAL_ARTS, reps: 80 },
                { workoutType: WorkoutTypes.HIIT, reps: 80 },
                { workoutType: WorkoutTypes.ROWING, reps: 120 },
                { workoutType: WorkoutTypes.JUMPING_ROPE, reps: 1000 },
              ],
              timeCapMinutes: 120,
            },
            {
              name: "Athletic Mastery",
              exercises: [
                { workoutType: WorkoutTypes.BASKETBALL, reps: 120 },
                { workoutType: WorkoutTypes.SOCCER, reps: 120 },
                { workoutType: WorkoutTypes.TENNIS, reps: 100 },
                { workoutType: WorkoutTypes.PULL_UPS, reps: 60 },
              ],
              timeCapMinutes: 130,
            },
            {
              name: "Complete Fitness",
              exercises: [
                { workoutType: WorkoutTypes.YOGA, reps: 60 },
                { workoutType: WorkoutTypes.PILATES, reps: 50 },
                { workoutType: WorkoutTypes.STRETCHING, reps: 40 },
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 150 },
              ],
              timeCapMinutes: 110,
            },
          ],
        ),
        new Milestone(
          MilestoneType.DIAMOND,
          "Supreme Master",
          75,
          [],
          [
            {
              name: "Legend of Legends",
              exercises: [
                { workoutType: WorkoutTypes.PULL_UPS, reps: 100 },
                { workoutType: WorkoutTypes.DEADLIFTS, reps: 100 },
                { workoutType: WorkoutTypes.PUSH_UPS, reps: 200 },
                { workoutType: WorkoutTypes.SQUATS, reps: 250 },
              ],
              timeCapMinutes: 120,
            },
            {
              name: "Ultra Endurance",
              exercises: [
                { workoutType: WorkoutTypes.RUNNING, reps: 200 },
                { workoutType: WorkoutTypes.SWIMMING, reps: 200 },
                { workoutType: WorkoutTypes.CYCLING, reps: 240 },
              ],
              timeCapMinutes: 180,
            },
            {
              name: "Supreme Warrior",
              exercises: [
                { workoutType: WorkoutTypes.MARTIAL_ARTS, reps: 100 },
                { workoutType: WorkoutTypes.HIIT, reps: 100 },
                { workoutType: WorkoutTypes.ROWING, reps: 150 },
                { workoutType: WorkoutTypes.BENCH_PRESS, reps: 100 },
              ],
              timeCapMinutes: 140,
            },
            {
              name: "Master of All",
              exercises: [
                { workoutType: WorkoutTypes.BASKETBALL, reps: 150 },
                { workoutType: WorkoutTypes.SOCCER, reps: 150 },
                { workoutType: WorkoutTypes.TENNIS, reps: 120 },
                { workoutType: WorkoutTypes.YOGA, reps: 70 },
              ],
              timeCapMinutes: 150,
            },
            {
              name: "Absolute Perfection",
              exercises: [
                { workoutType: WorkoutTypes.SWIMMING, reps: 180 },
                { workoutType: WorkoutTypes.PULL_UPS, reps: 80 },
                { workoutType: WorkoutTypes.JUMPING_ROPE, reps: 1500 },
                { workoutType: WorkoutTypes.HIKING, reps: 120 },
              ],
              timeCapMinutes: 160,
            },
            {
              name: "Ultimate Challenge",
              exercises: [
                { workoutType: WorkoutTypes.DEADLIFTS, reps: 120 },
                { workoutType: WorkoutTypes.BENCH_PRESS, reps: 120 },
                { workoutType: WorkoutTypes.SQUATS, reps: 300 },
                { workoutType: WorkoutTypes.HIIT, reps: 120 },
              ],
              timeCapMinutes: 150,
            },
          ],
        ),
      ]),
    ];
  }

  /**
   * Serialize to plain object
   */
  toJSON() {
    return {
      tiers: this._tiers.map((t) => t.toJSON()),
    };
  }

  /**
   * Create TierConfiguration from plain object
   */
  static fromJSON(data) {
    const config = new TierConfiguration();
    config._tiers = data.tiers.map((t) => Tier.fromJSON(t));
    return config;
  }
}
