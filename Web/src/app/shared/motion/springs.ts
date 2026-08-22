/**
 * Canonical spring presets and gesture-physics helpers for the `motion`
 * library, translated from Apple's WWDC "Designing Fluid Interfaces"
 * damping/response model.
 *
 * Reach for these instead of CSS transitions for anything the user can
 * drag, throw, or interrupt mid-motion (sheets, modals, reorderable rows).
 * CSS transitions can't be smoothly re-targeted from a live in-flight
 * value, which is exactly what makes a grabbed, still-animating element
 * feel broken. Plain hover/press feedback should still use the
 * `--duration-*` / `--ease-*` CSS tokens in styles.css - springs are for
 * gesture-driven motion specifically.
 *
 * `motion`'s `spring` type takes `bounce` (0 = no overshoot, higher =
 * springier) and `duration` (seconds), which map directly to Apple's
 * damping/response pair: damping 1.0 -> bounce 0, damping ~0.8 -> a
 * light bounce.
 */

import type { AnimationOptions } from 'motion';

/** Default UI motion: repositioning, opening/closing, no overshoot. Use
 *  for anything that just appears/moves on its own (menus, panels fading
 *  or sliding in) rather than being carried by the user's gesture. */
export const springStandard: AnimationOptions = {
  type: 'spring',
  bounce: 0,
  duration: 0.4,
};

/** Snappier variant of the standard spring for small, frequent UI
 *  changes (toggles, row expand/collapse) where 0.4s reads as sluggish. */
export const springSnappy: AnimationOptions = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};

/** Momentum spring: use only when the motion is the direct continuation
 *  of a user gesture that carried velocity (a flick, a drag release). A
 *  little overshoot reads as physical follow-through; using it on
 *  something that just faded in (no preceding gesture) feels wrong. */
export const springMomentum: AnimationOptions = {
  type: 'spring',
  bounce: 0.2,
  duration: 0.4,
};

/** Drawer/sheet open-close - Apple's shipped values for this exact
 *  interaction (damping ~0.8, response 0.3). */
export const springSheet: AnimationOptions = {
  type: 'spring',
  bounce: 0.2,
  duration: 0.3,
};

/**
 * Projects where a flick/drag would naturally come to rest, given the
 * release velocity - so a thrown sheet or carousel settles on the target
 * *in the direction the gesture was already going*, not just the nearest
 * point to where the finger happened to lift.
 *
 * Uses the same exponential-decay form Apple ships (not the
 * v^2/(2*decel) textbook formula, which produces a different, less
 * natural curve).
 *
 * @param releaseVelocity px/s at the moment of release.
 * @param decelerationRate ~0.998 for normal scroll feel, ~0.99 for snappier.
 */
export function projectMomentum(releaseVelocity: number, decelerationRate = 0.998): number {
  return ((releaseVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Rubber-band resistance for dragging past a boundary (a sheet dragged
 * above its fully-open position, a carousel past its last item). Applies
 * progressively increasing resistance rather than a hard stop, so the
 * boundary reads as "responsive, but there's nothing more here" instead
 * of "frozen."
 *
 * @param overshoot px dragged past the boundary (always >= 0).
 * @param dimension the relevant viewport/container dimension (height for
 *   a vertical sheet, width for a horizontal carousel).
 * @param constant resistance strength; 0.55 matches iOS's feel, lower =
 *   stiffer, higher = looser.
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
