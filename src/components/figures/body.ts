/** Body proportions and the resting pose shared by every portrait figure. */

export interface FigureBuild {
  upperArm: number;
  forearm: number;
  thigh: number;
  shin: number;
  /** Width multipliers for arms, legs and the torso; size of hands and boots. */
  armWidth: number;
  legWidth: number;
  torsoWidth: number;
  hand: number;
  foot: number;
  /** Torso height (default 1): shorter or longer from the hips to the shoulders. */
  torso?: number;
  /** Extra neck length (default 0) and neck width (default 1). */
  neck?: number;
  neckWidth?: number;
}

/** Body types. The head stays the same, so the builds read as different caricature styles. */
export const FIGURE_BUILDS = {
  /** Realistic-ish footballer proportions under a big head. */
  athletic: { upperArm: 60, forearm: 56, thigh: 104, shin: 88, armWidth: 1, legWidth: 1, torsoWidth: 1, hand: 1, foot: 1 },
  /** Long, thin limbs and big hands and feet, like the football-cartoon style. */
  lanky: { upperArm: 74, forearm: 68, thigh: 128, shin: 112, armWidth: 0.78, legWidth: 0.74, torsoWidth: 0.86, hand: 1.2, foot: 1.2 },
  /** Short and powerful: huge thighs, chunky arms, big boots. */
  stocky: { upperArm: 50, forearm: 46, thigh: 82, shin: 66, armWidth: 1.3, legWidth: 1.35, torsoWidth: 1.14, hand: 1.3, foot: 1.35 },
} satisfies Record<string, FigureBuild>;

export type FigureBuildName = keyof typeof FIGURE_BUILDS;

/** Every rotatable part of the rig. */
export type FigurePart =
  | 'leftArm' | 'rightArm' | 'leftForearm' | 'rightForearm'
  | 'leftLeg' | 'rightLeg' | 'leftShin' | 'rightShin' | 'torso' | 'chest' | 'head';

/** Relaxed standing pose: weight on the screen-left leg, the other knee soft, arms loose. */
export const FIGURE_REST: Record<FigurePart, number> = {
  torso: 2, chest: -3, head: 3,
  leftLeg: 2, leftShin: 0, rightLeg: -7, rightShin: 9,
  leftArm: 9, leftForearm: -10, rightArm: -11, rightForearm: 14,
};
