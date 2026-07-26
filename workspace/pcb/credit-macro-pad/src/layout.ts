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
  // Shifted left to keep the bottom-mounted XIAO's through-board hand-solder
  // access holes outside the top-side LCD body/courtyard.
  center: { x: -7.0, y: 13.0 },
  body: { widthMm: 62.5, heightMm: 17.9 },
  active: { widthMm: 55.2948, heightMm: 14.7972 },
  side: sides.user,
  // The seller confirmed a front-contact tail. It wraps around the left edge
  // and mates on the back with a top-contact connector whose opening faces -X.
  fpc: {
    x: -36.0,
    y: 13.0,
    side: sides.smtAssembly,
    cableExits: "left" as const,
    rotationDeg: 90,
  },
};

// Exact MX hot-swap component uses the switch shaft as its origin. Keep one
// straight, board-centered 19 mm row low on the board while preserving a
// nominal 4 mm keycap-envelope margin at the bottom edge.
export const keyCenters = row({ x: -28.5, y: -12.0 }, 19, 4);

export const xiao = {
  // Keep the USB receptacle at the right edge without letting the reflow
  // carrier body overhang the board outline.
  x: 29.5,
  // Right-side placement above the key contact holes; the USB opening remains
  // accessible at +X while the XIAO antenna end points toward board center.
  y: 10.0,
  side: sides.smtAssembly,
  usbFaces: "right" as const,
  rotationDeg: 270,
};

export const microphone = {
  // Top-right edge, as close as practical to the board edge while retaining
  // the microphone body and acoustic cutout inside the outline.
  x: 36.5,
  y: 22.5,
  side: sides.smtAssembly,
  acousticHoleDiameterMm: 0.5,
};

export const analog = {
  // Compact, aligned microphone block immediately left of MIC1.
  opamp: { x: 10.0, y: 20.5 },
  micDecoupling: { x: 32.5, y: 20.5 },
  opampDecoupling: { x: 6.5, y: 20.5 },
  biasRow: row({ x: 6.0, y: 17.5 }, 2.2, 4),
  gainRow: row({ x: 6.0, y: 14.8 }, 2.2, 4),
};

export const displaySupport = {
  resetRow: row({ x: -30.0, y: 19.0 }, 2.4, 2),
  backlightResistor: { x: -24.0, y: 19.0 },
};

export const debug = {
  // Deliberate service region on the back side, clear of the LCD and keys.
  points: row({ x: -6.0, y: 20.5 }, 3.0, 4),
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