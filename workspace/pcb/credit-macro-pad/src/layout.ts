export const board = {
  // Nominal outline is inset by 0.20 mm in each dimension from the mechanical
  // maximum, providing ±0.10 mm routing tolerance without exceeding it.
  widthMm: 81.4,
  heightMm: 49.78,
  width: "81.4mm",
  height: "49.78mm",
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
    // Inset 8.8 mm from the left board edge so all eight 0.5 mm-pitch pads
    // have a manufacturable fan-out corridor while the latch still opens
    // toward the wrapped display tail at the left edge.
    x: -32.0,
    y: 13.0,
    side: sides.smtAssembly,
    cableExits: "left" as const,
    rotationDeg: 90,
  },
};

// Exact MX hot-swap component uses the switch shaft as its origin. Keep one
// straight, board-centered 19 mm row low on the board while preserving a
// nominal 3 mm minimum keycap-envelope margin. With the qualified 18 mm cap
// envelope this layout provides 3.20 mm nominally at both side edges and
// 3.89 mm nominally below (3.10/3.79 mm worst case after 0.10 mm routing tolerance).
export const keyCenters = row({ x: -28.5, y: -12.0 }, 19, 4);

export const xiao = {
  x: 30.5,
  // Right-side placement above the key contact holes; the USB shell reaches
  // the +X edge. This XIAO revision uses its onboard U.FL interface for an
  // external antenna, so the carrier does not need a PCB-antenna tail keepout.
  y: 7.5,
  side: sides.smtAssembly,
  usbFaces: "right" as const,
  rotationDeg: 270,
};

export const microphone = {
  // Top-right edge, as close as practical to the board edge while retaining
  // the microphone body inside the outline. The exact C481302/ZTS6216
  // datasheet identifies a top port, so its aperture faces away from the PCB
  // on the bottom assembly side and no carrier-board drill is required.
  x: 36.5,
  y: 22.5,
  side: sides.smtAssembly,
};

export const analog = {
  // Airy, functional signal chain across the upper-middle service region.
  // The microphone-side parts remain at the right, while the bias and gain
  // networks use two aligned rows with 4 mm pitch instead of a dense cluster.
  opamp: { x: 20.0, y: 20.5 },
  micDecoupling: { x: 32.5, y: 21.0 },
  // Place the 100 nF bypass directly above U2 pin 5. This leaves a short local
  // supply connection and opens one unobstructed top-edge corridor back to the
  // left-side VDD3V3 branch (R3/R9/TP_3V3).
  opampDecoupling: { x: 19.5, y: 23.0 },
  xiaoDecoupling: { x: 26.0, y: 22.0 },
  micCoupling: { x: 27.5, y: 18.5 },
  biasRow: row({ x: 3.0, y: 18.0 }, 4.0, 3),
  gainRow: row({ x: 3.0, y: 12.5 }, 4.0, 3),
  // Keep the ADC RC pair left of the XIAO courtyard while preserving a short,
  // direct analog path between R8 and C7.
  outputRow: row({ x: 14.0, y: 12.5 }, 3.0, 2),
};

export const displaySupport = {
  // Left-side display support parts are separated from the FPC body and from
  // one another so the block reads clearly during assembly.
  resetRow: row({ x: -30.0, y: 20.0 }, 4.0, 2),
  // C4 is the dedicated LCD_VDD bypass.  Its left land sits beside J1 pin 7,
  // beyond the connector courtyard and below the latch/ground-escape region.
  vddDecoupling: { x: -26.5, y: 17.0 },
  backlightResistor: { x: -21.5, y: 20.0 },
};

export const debug = {
  // Deliberate service points in the open center-left region. TP_GND is raised
  // to y=18 mm so its PTH annulus lands directly on the source-routed top-layer
  // ground trunk; the other three points remain in the original service row.
  points: [
    { x: -15.0, y: 6.0 },
    { x: -10.0, y: 6.0 },
    { x: -5.0, y: 18.0 },
    { x: 0.0, y: 6.0 },
  ],
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