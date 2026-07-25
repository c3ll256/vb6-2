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
    y: 13.0,
    side: sides.smtAssembly,
    cableExits: "left" as const,
    rotationDeg: 90,
  },
};

// Intended mechanical centers: one straight, board-centered 19 mm row.
export const keyMechanicalCenters = row({ x: -28.5, y: -5.5 }, 19, 4);

// The temporary Cherry MX placement proxy is referenced from an electrical
// pad rather than the switch shaft center. Compensate its measured native
// origin offset so the visible/mechanical switch centers land on the intended
// row. Remove this compensation when the exact Choc V2 footprint replaces it.
export const keyProxyOriginCompensation = { x: 2.54, y: 2.99 };
export const keyCenters = keyMechanicalCenters.map((center) => ({
  x: center.x + keyProxyOriginCompensation.x,
  y: center.y + keyProxyOriginCompensation.y,
}));

export const xiao = {
  x: 31.0,
  // Right-side placement above the key contact holes; the USB shell reaches
  // the +X edge while the XIAO antenna end points toward board center.
  y: 9.0,
  side: sides.smtAssembly,
  usbFaces: "right" as const,
  rotationDeg: 270,
};

export const microphone = {
  // Top-right edge, outside the LCD envelope, with a direct acoustic cutout.
  x: 36.5,
  y: 21.0,
  side: sides.smtAssembly,
  acousticHoleDiameterMm: 0.5,
};

export const analog = {
  opamp: { x: 18.0, y: 19.0 },
  micDecoupling: { x: 33.0, y: 22.5 },
  opampDecoupling: { x: 14.5, y: 19.0 },
  biasRow: row({ x: 10.0, y: 16.2 }, 2.2, 4),
  gainRow: row({ x: 10.0, y: 13.9 }, 2.2, 4),
};

export const displaySupport = {
  resetRow: row({ x: -30.0, y: 19.0 }, 2.4, 2),
  backlightResistor: { x: -24.0, y: 19.0 },
};

export const debug = {
  // Deliberate service region on the back side, clear of the LCD and keys.
  points: row({ x: -6.0, y: 21.0 }, 3.0, 4),
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
