/** Sliding-door geometry shared with the CRM quote engine (lib/atelier/sliding-doors.ts there). */

/** Doors overlap so no gap shows between them (CRM setting doorOverlapMm, default 30). */
export const DOOR_OVERLAP_MM = 30;
/** Conservative widest door panel: usable width of a 2070 mm sheet (2 × 10 mm trim). The CRM checks the
 *  real material and answers with a plain-Romanian error if a door still does not fit. */
export const MAX_DOOR_WIDTH_MM = 2050;
/** Narrowest door we offer when the customer picks a count by hand. */
const MIN_DOOR_WIDTH_MM = 450;

/** Same rule as the CRM: one door per started metre, at least two. */
export function autoDoorCount(widthMm: number): number {
  return Math.max(2, Math.ceil(widthMm / 1000));
}

export function doorWidthMm(widthMm: number, count: number): number {
  return (widthMm + DOOR_OVERLAP_MM * (count - 1)) / count;
}

/** Door counts offered in the selector: only those whose doors fit the sheet. The current manual choice stays
 *  listed even if it no longer fits (e.g. after widening) so the CRM error explains it instead of a silent reset. */
export function doorCountOptions(widthMm: number, selected?: number): number[] {
  return [2, 3, 4, 5, 6].filter(
    (n) =>
      n === selected ||
      ((n === 2 || widthMm / n >= MIN_DOOR_WIDTH_MM) && doorWidthMm(widthMm, n) <= MAX_DOOR_WIDTH_MM),
  );
}
