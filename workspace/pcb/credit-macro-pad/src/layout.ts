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
  // and mates on the back with the dual-contact HC-FPC-05-09-8RLTAG; its cable
  // opening faces -X.
  fpc: {
    x: -35.0,
    y: 13.0,
    side: sides.smtAssembly,
    cableExits: "left" as const,
    rotationDeg: 90,
  },
};

// Exact MX hot-swap components use the switch shaft as their origin. The
// user-facing 1u keycap envelopes remain on a straight 19 mm row with 3.3 mm
// side and 4 mm bottom margins. The socket bodies escape into the open
// service-side routing channel rather than toward the bottom edge; that is the
// library's own orientation, because a Cherry MX contact pair already sits on
// the +Y side of the shaft.
const keyCenters = row({ x: -28.5, y: -12.0 }, 19, 4);

export const keyBank = {
  side: sides.user,
  pitchMm: 19,
  keycap: { widthMm: 18, heightMm: 18 },
  socketOrientation: "south" as const,
  keys: keyCenters.map((center, index) => ({
    id: `KEY${index + 1}`,
    net: `net.KEY${index + 1}`,
    legend: index === 0 ? "K1 MUTE" : `K${index + 1}`,
    center,
  })),
};

export const xiao = {
  x: 30.5,
  // Right-side placement above the key contact holes; the USB shell reaches
  // the +X edge while the XIAO antenna end points toward board center.
  y: 7.5,
  side: sides.smtAssembly,
  usbFaces: "right" as const,
  rotationDeg: 270,
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
  micDecoupling: { x: 32.5, y: 21.0 },
  opampDecoupling: { x: 15.5, y: 22.5 },
  xiaoDecoupling: { x: 26.0, y: 22.0 },
  micCoupling: { x: 27.5, y: 18.5 },
  biasRow: row({ x: 3.0, y: 18.0 }, 4.0, 3),
  gainRow: row({ x: 3.0, y: 12.5 }, 4.0, 3),
  // Keep the ADC RC pair left of the XIAO courtyard while preserving a short,
  // direct analog path between R8 and C7.
  outputRow: row({ x: 14.0, y: 12.5 }, 3.0, 2),
};

export const displaySupport = {
  // Keep the RESET pull-up and capacitor directly inside the FPC connector's
  // board-facing side. This gives J1 pins 7 (V3V3) and 3 (RESET_N) short,
  // uncrossed escapes before the display nets join the wider board routes.
  resetRow: [
    { x: -29.0, y: 13.75 },
    // Offset C3 slightly above its original row to open the local pour neck
    // while preserving the previously clean, short RESET_N escape from J1.
    { x: -25.0, y: 14.0 },
  ],
  backlightResistor: { x: -21.5, y: 20.0 },
};

export const debug = {
  // Stagger the service pads into two rows so the long TP reference labels do
  // not collide. Keep 5 mm horizontal pitch and preserve the same center-left
  // debug region, clear of the FPC connector, analog block, and key sockets.
  points: [
    { x: -15.0, y: 7.5 },
    { x: -10.0, y: 4.5 },
    { x: -5.0, y: 7.5 },
    { x: 0.0, y: 4.5 },
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