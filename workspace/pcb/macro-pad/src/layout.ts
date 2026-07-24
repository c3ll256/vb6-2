export const board = {
  width: "110mm",
  height: "72mm",
};

export const placement = {
  origin: { x: 0, y: 0 },
};

export const OPENING_ROTATION_DEG = {
  up: 0,
  left: 90,
  down: 180,
  right: 270,
} as const;

export type OpeningDirection = keyof typeof OPENING_ROTATION_DEG;

/** Rotation (deg) to apply when a footprint's native opening differs from the target opening. */
export function rotationForOpening(
  nativeOpening: OpeningDirection,
  targetOpening: OpeningDirection,
): number {
  return (
    (OPENING_ROTATION_DEG[targetOpening] - OPENING_ROTATION_DEG[nativeOpening] + 360) % 360
  );
}

// Placement helpers return plain coordinate data for source-owned layout intent.
// Choose grouping and pitch from current mechanical and electrical evidence.

export type XY = { x: number; y: number };

/** N points in a horizontal row starting at from, spaced pitch mm apart (+X). */
export function row(from: XY, pitch: number, count: number): XY[] {
  return Array.from({ length: count }, (_, i) => ({
    x: from.x + i * pitch,
    y: from.y,
  }));
}

/** N points in a vertical column starting at from, spaced pitch mm apart (+Y). */
export function col(from: XY, pitch: number, count: number): XY[] {
  return Array.from({ length: count }, (_, i) => ({
    x: from.x,
    y: from.y + i * pitch,
  }));
}

/** rows x cols points starting at from with independent x/y pitches, row-major. */
export function grid(
  from: XY,
  pitchX: number,
  pitchY: number,
  cols: number,
  rows: number,
): XY[] {
  return Array.from({ length: rows * cols }, (_, i) => ({
    x: from.x + (i % cols) * pitchX,
    y: from.y + Math.floor(i / cols) * pitchY,
  }));
}
