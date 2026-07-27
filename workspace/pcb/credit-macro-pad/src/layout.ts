export const board = {
  // Nominal routing profile is 0.20 mm inside each side of the product's
  // 81.6 x 49.98 mm maximum PCB envelope. This reserves ordinary routed-edge
  // tolerance instead of putting the nominal Edge.Cuts exactly at the maximum.
  widthMm: 81.2,
  heightMm: 49.58,
  width: "81.2mm",
  height: "49.58mm",
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
    x: -35.0,
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
  x: 30.5,
  // Right-side placement above the key contact holes; the USB shell reaches
  // the +X edge while the XIAO antenna end points toward board center.
  y: 7.5,
  side: sides.smtAssembly,
  usbFaces: "right" as const,
  rotationDeg: 270,
};

export const xiaoAntennaRelief = {
  // Interior slot below the XIAO's antenna end. It remains clear of the two
  // end-pad rows and the routed signal escape corridor while removing carrier
  // copper and FR-4 below the radiating center section.
  x: 20.5,
  y: 7.5,
  widthMm: 6.0,
  heightMm: 10.0,
};

export const microphone = {
  // Top-right edge, as close as practical to the board edge while retaining
  // the microphone body inside the outline. ZTS6216 is top-ported, so its
  // acoustic port faces away from the PCB and no board drill is required.
  x: 36.5,
  y: 22.5,
  side: sides.smtAssembly,
};

export const analog = {
  // Airy, functional signal chain across the upper-middle service region.
  // The microphone-side parts remain at the right, while the bias and gain
  // networks use two aligned rows with 4 mm pitch instead of a dense cluster.
  opamp: { x: 20.0, y: 20.5 },
  micDecoupling: { x: 33.0, y: 20.0 },
  opampDecoupling: { x: 15.5, y: 22.5 },
  xiaoDecoupling: { x: 26.0, y: 22.0 },
  // Rotate C6 to the right of MIC1. Its MIC_RAW pad approaches microphone pin
  // 1 from the board-edge side without crossing either microphone ground pad.
  micCoupling: { x: 39.3, y: 22.5 },
  biasRow: row({ x: 3.0, y: 18.0 }, 4.0, 3),
  gainRow: [{ x: 3.0, y: 12.5 }, { x: 7.0, y: 12.5 }, { x: 13.0, y: 17.0 }],
  // Keep the ADC RC pair left of the XIAO courtyard while preserving a short,
  // direct analog path between R8 and C7.
  outputRow: [{ x: 14.0, y: 12.5 }, { x: 17.0, y: 17.0 }],
};

export const displaySupport = {
  // Left-side display support parts are separated from the FPC body and from
  // one another so the block reads clearly during assembly.
  resetRow: row({ x: -30.0, y: 20.0 }, 4.0, 2),
  backlightResistor: { x: -21.5, y: 20.0 },
};

export const debug = {
  // Deliberate, widely spaced service row in the otherwise open center-left
  // region, clear of the FPC connector, analog block, and key sockets.
  points: row({ x: -15.0, y: 6.0 }, 5.0, 4),
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
