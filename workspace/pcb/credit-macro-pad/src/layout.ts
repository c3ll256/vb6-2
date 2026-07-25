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

// Exact MX hot-swap component uses the switch shaft as its origin. Set one
// straight, board-centered 19 mm row low on the board to use the lower area
// while preserving a nominal 5 mm key-envelope margin at the bottom edge.
export const keyCenters = row({ x: -28.5, y: -12.5 }, 19, 4);

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
  // Top-right edge, as close as practical to the board edge while retaining
  // the microphone body and acoustic cutout inside the outline.
  x: 36.5,
  y: 22.5,
  side: sides.smtAssembly,
  acousticHoleDiameterMm: 0.5,
};

export const analog = {
  // Routed signal-flow placement: microphone support at the top-right,
  // bias/feedback around U2, then ADC filtering toward the XIAO.
  // A slight upward shift joins U2's GND land to the already-stitched analog
  // return lobe while preserving the short U2-to-R7 signal path.
  opamp: { x: 10.0, y: 21.0 },
  micDecoupling: { x: 39.1, y: 21.5 },
  micCoupling: { x: 33.9, y: 21.5 },
  opampDecoupling: { x: 7.0, y: 22.0 },
  biasDividerRow: row({ x: 2.5, y: 19.0 }, 2.5, 2),
  biasFilter: { x: 5.0, y: 16.5 },
  inputAndGainRow: row({ x: 7.5, y: 16.5 }, 2.5, 2),
  feedback: { x: 14.0, y: 20.5 },
  adcFilterRow: row({ x: 15.0, y: 16.5 }, 2.5, 2),
  railDecoupling: { x: 20.0, y: 21.5 },
};

export const displaySupport = {
  // Keep RESET support below J1 while the backlight resistor remains above it.
  // This makes adjacent FPC pins 1 and 3 fan out in opposite directions and
  // leaves a copper corridor from J1 pin 2 into the GND plane.
  resetRow: row({ x: -30.0, y: 10.0 }, 2.4, 2),
  backlightResistor: { x: -24.0, y: 19.0 },
};

export const debug = {
  // Deliberate service points on the back side. TP_3V3 sits beside R1/J1 so
  // it does not create a long branch across the top-edge power corridor.
  points: [
    { x: -6.0, y: 9.5 },
    { x: -30.0, y: 16.5 },
    { x: 0.0, y: 9.5 },
    { x: 3.0, y: 9.5 },
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
