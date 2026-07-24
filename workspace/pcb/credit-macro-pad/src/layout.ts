export const board = {
  widthMm: 81.6,
  heightMm: 49.98,
  width: "81.6mm",
  height: "49.98mm",
};

export const sides = {
  user: "top" as const,
  smtAssembly: "bottom" as const,
};

export const display = {
  center: { x: 0, y: 13.0 },
  body: { widthMm: 62.5, heightMm: 17.9 },
  active: { widthMm: 55.2948, heightMm: 14.7972 },
  side: sides.user,
  // User-requested back-side-only SMT requires the FPC tail to wrap around the
  // +Y board edge to the bottom-side connector without a sharp fold.
  fpc: { x: 0, y: 21.7, side: sides.smtAssembly, cableExits: "up" as const },
};

export const keyCenters = row({ x: -28.5, y: -5.5 }, 19, 4);

export const xiao = {
  x: 0,
  // Slight intentional overhang puts the onboard USB-C shell on the -Y edge
  // and clears the through-hole key contacts above it.
  y: -16.3,
  side: sides.smtAssembly,
  usbFaces: "down" as const,
  rotationDeg: 180,
};

export const microphone = {
  x: -37.0,
  y: 17.0,
  side: sides.smtAssembly,
  acousticHoleDiameterMm: 0.5,
};

export const analog = {
  opamp: { x: -31.5, y: 15.0 },
  micDecoupling: { x: -36.0, y: 11.0 },
  opampDecoupling: { x: -26.5, y: 11.0 },
  biasRow: row({ x: -35.0, y: 9.8 }, 2.2, 4),
  gainRow: row({ x: -35.0, y: 7.5 }, 2.2, 4),
};

export const displaySupport = {
  resetRow: row({ x: 10.0, y: 19.0 }, 2.4, 2),
  backlightResistor: { x: 16.0, y: 19.0 },
};

export const debug = {
  // Deliberate service region on the back side, clear of the LCD and keys.
  points: row({ x: 24.0, y: 20.0 }, 3.0, 4),
};

export const OPENING_ROTATION_DEG = {
  up: 0,
  left: 90,
  down: 180,
  right: 270,
} as const;

export type OpeningDirection = keyof typeof OPENING_ROTATION_DEG;

export function rotationForOpening(
  nativeOpening: OpeningDirection,
  targetOpening: OpeningDirection,
): number {
  return (
    (OPENING_ROTATION_DEG[targetOpening] - OPENING_ROTATION_DEG[nativeOpening] + 360) % 360
  );
}

export type XY = { x: number; y: number };

export function row(from: XY, pitch: number, count: number): XY[] {
  return Array.from({ length: count }, (_, i) => ({
    x: from.x + i * pitch,
    y: from.y,
  }));
}

export function col(from: XY, pitch: number, count: number): XY[] {
  return Array.from({ length: count }, (_, i) => ({
    x: from.x,
    y: from.y + i * pitch,
  }));
}

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
