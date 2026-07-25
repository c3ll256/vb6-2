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
  // The seller confirmed a front-contact tail. It wraps around the left edge
  // and mates on the back with a top-contact connector whose opening faces -X.
  fpc: {
    x: -36.0,
    y: 10.0,
    side: sides.smtAssembly,
    cableExits: "left" as const,
    rotationDeg: 90,
  },
};

// Exact MX hot-swap component uses the switch shaft as its origin. Set one
// straight, board-centered 19 mm row low on the board to use the lower area
// while preserving a nominal 5 mm key-envelope margin at the bottom edge.
export const keyCenters = row({ x: -28.5, y: -12.5 }, 19, 4);

export const xiao = {
  x: 30.2,
  // Right-side placement above the key contact holes; the USB shell reaches
  // the +X edge while the XIAO antenna end points toward board center.
  y: 9.0,
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
  // Aligned microphone block immediately left of MIC1. The 3.2 mm horizontal
  // and 4.5 mm vertical channels leave routing access to the SOT-23-5 pins.
  opamp: { x: 10.0, y: 20.5 },
  // Direct top-edge fan-outs: C1/R11 leave MIC1 pin 4 to the left, while C6
  // receives pin 1 on its left pad to the right of the microphone body.
  micDecoupling: { x: 34.0, y: 23.5 },
  micVddLink: { x: 30.0, y: 23.5 },
  micCoupling: { x: 39.25, y: 23.5 },
  micAcLink: { x: 39.25, y: 22.0 },
  // Local microphone-ground join; keeps MIC1/C1 return copper in the top-right
  // block before joining the global GND tree outside the XIAO PTH rows.
  micGroundLink: { x: 37.0, y: 20.0 },
  opampDecoupling: { x: 6.5, y: 20.5 },
  biasRow: row({ x: 3.0, y: 16.0 }, 3.2, 4),
  gainRow: row({ x: 3.0, y: 11.5 }, 3.2, 4),
};

export const displaySupport = {
  // Pull-up and reset capacitor sit below the fine-pitch J1 fan-out. A local
  // zero-ohm link and decoupler isolate the J1 pin-7 escape from the global rail.
  resetRow: row({ x: -30.5, y: 16.5 }, 3.2, 2),
  vddLink: { x: -30.5, y: 13.2 },
  // R10 is aligned with the pin-2 fan-out lane but remains outside J1's body.
  groundLink: { x: -30.5, y: 11.25 },
  lcdDecoupling: { x: -27.2, y: 13.2 },
  backlightResistor: { x: -24.0, y: 19.0 },
};

export const debug = {
  // Deliberate service region on the back side, clear of the LCD and keys.
  points: row({ x: -6.0, y: 20.5 }, 3.0, 4),
  // Routing-driven GND service point: keeps the KEY4-to-XIAO return path to
  // the right of the XIAO through-hole rows instead of crossing those holes.
  groundPoint: { x: 39.5, y: -5.5 },
  micPoint: { x: 18.0, y: 14.0 },
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