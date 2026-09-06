/**
 * Verified carrier-board footprints paired with pinned complete-board STEP assets.
 *
 * Native connector directions at pcbRotation=0:
 * - XIAO RP2040: USB-C +Y
 * - Raspberry Pi Pico R3: Micro-USB +Y
 * - Arduino Nano Rev3: Mini-USB -Y
 * - Raspberry Pi 4 Model B: USB-C / micro-HDMI +Y, GPIO header -Y
 */

import {
  cadModelProps,
  projectModelPath,
  requireBuiltinCoreBoardModel,
} from './BuiltinCoreBoardModels';

type Layer = 'top' | 'bottom';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      chip: any;
      courtyardrect: any;
      footprint: any;
      hole: any;
      platedhole: any;
      smtpad: any;
      silkscreencircle: any;
      silkscreenrect: any;
      silkscreentext: any;
    }
  }
}

const XIAO_RP2040_MODEL = requireBuiltinCoreBoardModel('seeed_xiao_rp2040_v26');
const PICO_R3_MODEL = requireBuiltinCoreBoardModel('raspberry_pi_pico_r3');
const ARDUINO_NANO_MODEL = requireBuiltinCoreBoardModel('arduino_nano_rev3');
const RASPBERRY_PI_4B_MODEL = requireBuiltinCoreBoardModel('raspberry_pi_4_model_b');

function mm(value: number): string {
  return `${value}mm`;
}

function modelAnchorPositionOffset(
  footprintBoundsCenterMm: { x: number; y: number },
  layer: Layer,
  pcbRotation: number | string,
) {
  const rotationDeg =
    typeof pcbRotation === 'number' ? pcbRotation : Number.parseFloat(pcbRotation);
  if (!Number.isFinite(rotationDeg)) {
    throw new Error(`development_board_rotation_invalid:${pcbRotation}`);
  }
  const nativeCenter = {
    x: layer === 'bottom' ? -footprintBoundsCenterMm.x : footprintBoundsCenterMm.x,
    y: footprintBoundsCenterMm.y,
  };
  const radians = (rotationDeg * Math.PI) / 180;
  const rotatedCenter = {
    x: nativeCenter.x * Math.cos(radians) - nativeCenter.y * Math.sin(radians),
    y: nativeCenter.x * Math.sin(radians) + nativeCenter.y * Math.cos(radians),
  };
  return { x: -rotatedCenter.x, y: -rotatedCenter.y, z: 0 };
}

type DevelopmentBoardProps = {
  name: string;
  layer?: Layer;
  pcbX?: number | string;
  pcbY?: number | string;
  pcbRotation?: number | string;
  connections?: Record<string, string>;
};

type PinDefinition = {
  number: number;
  aliases: string[];
};

function pinLabels(pins: PinDefinition[]): Record<string, string[]> {
  return Object.fromEntries(pins.map((pin) => [`pin${pin.number}`, pin.aliases]));
}

function requireInterface(model: typeof XIAO_RP2040_MODEL, interfaceId: string) {
  const interfaceDefinition = model.pcb.interfaces.find((item) => item.id === interfaceId);
  if (!interfaceDefinition) {
    throw new Error(`builtin_core_board_interface_missing:${model.id}:${interfaceId}`);
  }
  return interfaceDefinition;
}

const XIAO_RP2040_USB = requireInterface(XIAO_RP2040_MODEL, 'usb_c');
const PICO_R3_USB = requireInterface(PICO_R3_MODEL, 'micro_usb');
const ARDUINO_NANO_USB = requireInterface(ARDUINO_NANO_MODEL, 'mini_usb');
const RASPBERRY_PI_4B_USB = requireInterface(RASPBERRY_PI_4B_MODEL, 'usb_c');

const XIAO_RP2040_HEADER_PINS: PinDefinition[] = [
  { number: 1, aliases: ['GPIO26', 'A0', 'D0'] },
  { number: 2, aliases: ['GPIO27', 'A1', 'D1'] },
  { number: 3, aliases: ['GPIO28', 'A2', 'D2'] },
  { number: 4, aliases: ['GPIO29', 'A3', 'D3'] },
  { number: 5, aliases: ['GPIO6', 'D4', 'SDA'] },
  { number: 6, aliases: ['GPIO7', 'D5', 'SCL'] },
  { number: 7, aliases: ['GPIO0', 'D6', 'TX'] },
  { number: 8, aliases: ['GPIO1', 'D7', 'RX', 'CSN'] },
  { number: 9, aliases: ['GPIO2', 'D8', 'SCK'] },
  { number: 10, aliases: ['GPIO4', 'D9', 'MISO'] },
  { number: 11, aliases: ['GPIO3', 'D10', 'MOSI'] },
  { number: 12, aliases: ['3V3'] },
  { number: 13, aliases: ['GND'] },
  { number: 14, aliases: ['VBUS', '5V'] },
];

const XIAO_RP2040_SMD_ONLY_PINS: PinDefinition[] = [
  { number: 15, aliases: ['BAT'] },
  { number: 16, aliases: ['GND_BAT'] },
  { number: 17, aliases: ['SWDIO'] },
  { number: 18, aliases: ['SWDCLK'] },
  { number: 19, aliases: ['RST'] },
  { number: 20, aliases: ['GND_DEBUG'] },
];

// tscircuit anchors a CAD model at the copper/hole bounds center. The official
// asymmetric SMD pad set has this center relative to the XIAO board origin.
const XIAO_RP2040_SMD_BOUNDS_CENTER_MM = { x: 0.0825, y: -0.331 };

export type XiaoRp2040Mounting = 'through_hole_header' | 'direct_smd';

function xiaoRp2040SidePad(pin: PinDefinition, mounting: XiaoRp2040Mounting, layer: Layer) {
  const isLeft = pin.number <= 7;
  const rowIndex = isLeft ? pin.number - 1 : pin.number - 8;
  const y = isLeft ? 7.62 - rowIndex * 2.54 : -7.62 + rowIndex * 2.54;
  const hints = [`pin${pin.number}`, ...pin.aliases];

  if (mounting === 'direct_smd') {
    return (
      <smtpad
        key={`xiao-rp2040-${pin.number}`}
        name={pin.aliases[0]}
        shape="rect"
        width="2.75mm"
        height="2mm"
        cornerRadius="0.5mm"
        solderMaskMargin="0.0508mm"
        layer={layer}
        pcbX={mm(isLeft ? -8 : 8.165)}
        pcbY={mm(y)}
        portHints={hints}
      />
    );
  }

  const padCenterX = isLeft ? -8.455 : 8.455;
  const holeCenterX = isLeft ? -7.62 : 7.62;
  return (
    <platedhole
      key={`xiao-rp2040-${pin.number}`}
      name={pin.aliases[0]}
      shape="circular_hole_with_rect_pad"
      holeDiameter="0.889mm"
      rectPadWidth="2.432mm"
      rectPadHeight="1.524mm"
      rectBorderRadius="0.1524mm"
      holeOffsetX={mm(holeCenterX - padCenterX)}
      pcbX={mm(padCenterX)}
      pcbY={mm(y)}
      portHints={hints}
    />
  );
}

function xiaoRp2040SmdOnlyPad(pin: PinDefinition, layer: Layer) {
  const geometry = {
    15: { x: -1.088, y: -8.64, shape: 'rect', width: 1.1, height: 2.5 },
    16: { x: 1.452, y: -8.64, shape: 'rect', width: 1.1, height: 2.5 },
    17: { x: -1.088, y: 8.378, shape: 'circle', radius: 0.85 },
    18: { x: 1.452, y: 8.378, shape: 'circle', radius: 0.85 },
    19: { x: -1.088, y: 5.838, shape: 'circle', radius: 0.85 },
    20: { x: 1.452, y: 5.838, shape: 'circle', radius: 0.85 },
  } as const;
  const pad = geometry[pin.number as keyof typeof geometry];
  const commonProps = {
    key: `xiao-rp2040-${pin.number}`,
    name: pin.aliases[0],
    layer,
    pcbX: mm(pad.x),
    pcbY: mm(pad.y),
    portHints: [`pin${pin.number}`, ...pin.aliases],
  };
  if (pad.shape === 'circle') {
    return <smtpad {...commonProps} shape="circle" radius={mm(pad.radius)} />;
  }
  return (
    <smtpad
      {...commonProps}
      shape="rect"
      width={mm(pad.width)}
      height={mm(pad.height)}
      cornerRadius="0.275mm"
    />
  );
}

function xiaoRp2040Footprint(mounting: XiaoRp2040Mounting, layer: Layer) {
  return (
    <footprint>
      {XIAO_RP2040_HEADER_PINS.map((pin) => xiaoRp2040SidePad(pin, mounting, layer))}
      {mounting === 'direct_smd'
        ? XIAO_RP2040_SMD_ONLY_PINS.map((pin) => xiaoRp2040SmdOnlyPad(pin, layer))
        : null}
      <silkscreenrect
        pcbX="0mm"
        pcbY="0mm"
        width="17.5mm"
        height="21mm"
        filled={false}
        stroke="solid"
        strokeWidth="0.15mm"
      />
      <courtyardrect pcbX="0mm" pcbY="0.5mm" width="18.5mm" height="23mm" />
      <silkscreenrect
        pcbX="0mm"
        pcbY="10.35mm"
        width="8.94mm"
        height="2.3mm"
        filled={false}
        stroke="solid"
        strokeWidth="0.15mm"
      />
      <silkscreencircle pcbX="-7.62mm" pcbY="8.82mm" radius="0.3mm" isFilled={true} />
    </footprint>
  );
}

export const XIAO_RP2040_METADATA = {
  id: 'xiao_rp2040',
  component: 'XiaoRp2040',
  importPath: './lib/footprints/index',
  label: XIAO_RP2040_MODEL.pcb.sourceIdentity.displayName,
  bodyMm: { x: 17.5, y: 21 },
  connectorEdge: XIAO_RP2040_USB.connectorEdge,
  mountingVariants: ['through_hole_header', 'direct_smd'],
  cadModel: {
    id: XIAO_RP2040_MODEL.id,
    path: projectModelPath(XIAO_RP2040_MODEL),
    sourceVersion: XIAO_RP2040_MODEL.sourceVersion,
    sha256: XIAO_RP2040_MODEL.pcb.model.sha256,
  },
} as const;

export type XiaoRp2040Props = DevelopmentBoardProps & {
  mounting?: XiaoRp2040Mounting;
};

export function XiaoRp2040(props: XiaoRp2040Props) {
  const layer = props.layer ?? 'top';
  const mounting = props.mounting ?? 'through_hole_header';
  const pcbRotation = props.pcbRotation ?? 0;
  const pins =
    mounting === 'direct_smd'
      ? [...XIAO_RP2040_HEADER_PINS, ...XIAO_RP2040_SMD_ONLY_PINS]
      : XIAO_RP2040_HEADER_PINS;
  return (
    <chip
      name={props.name}
      displayName={XIAO_RP2040_MODEL.pcb.sourceIdentity.displayName}
      manufacturerPartNumber={XIAO_RP2040_MODEL.pcb.sourceIdentity.manufacturerPartNumber}
      layer={layer}
      pcbX={props.pcbX ?? 0}
      pcbY={props.pcbY ?? 0}
      pcbRotation={pcbRotation}
      pinLabels={pinLabels(pins)}
      footprint={xiaoRp2040Footprint(mounting, layer)}
      cadModel={{
        ...cadModelProps(XIAO_RP2040_MODEL),
        positionOffset: modelAnchorPositionOffset(
          mounting === 'direct_smd' ? XIAO_RP2040_SMD_BOUNDS_CENTER_MM : { x: 0, y: 0 },
          layer,
          pcbRotation,
        ),
      }}
      connections={props.connections ?? {}}
    />
  );
}

const PICO_R3_PINS: PinDefinition[] = [
  { number: 1, aliases: ['GPIO0', 'GP0'] },
  { number: 2, aliases: ['GPIO1', 'GP1'] },
  { number: 3, aliases: ['GND_3'] },
  { number: 4, aliases: ['GPIO2', 'GP2'] },
  { number: 5, aliases: ['GPIO3', 'GP3'] },
  { number: 6, aliases: ['GPIO4', 'GP4'] },
  { number: 7, aliases: ['GPIO5', 'GP5'] },
  { number: 8, aliases: ['GND_8'] },
  { number: 9, aliases: ['GPIO6', 'GP6'] },
  { number: 10, aliases: ['GPIO7', 'GP7'] },
  { number: 11, aliases: ['GPIO8', 'GP8'] },
  { number: 12, aliases: ['GPIO9', 'GP9'] },
  { number: 13, aliases: ['GND_13'] },
  { number: 14, aliases: ['GPIO10', 'GP10'] },
  { number: 15, aliases: ['GPIO11', 'GP11'] },
  { number: 16, aliases: ['GPIO12', 'GP12'] },
  { number: 17, aliases: ['GPIO13', 'GP13'] },
  { number: 18, aliases: ['GND_18'] },
  { number: 19, aliases: ['GPIO14', 'GP14'] },
  { number: 20, aliases: ['GPIO15', 'GP15'] },
  { number: 21, aliases: ['GPIO16', 'GP16'] },
  { number: 22, aliases: ['GPIO17', 'GP17'] },
  { number: 23, aliases: ['GND_23'] },
  { number: 24, aliases: ['GPIO18', 'GP18'] },
  { number: 25, aliases: ['GPIO19', 'GP19'] },
  { number: 26, aliases: ['GPIO20', 'GP20'] },
  { number: 27, aliases: ['GPIO21', 'GP21'] },
  { number: 28, aliases: ['GND_28'] },
  { number: 29, aliases: ['GPIO22', 'GP22'] },
  { number: 30, aliases: ['RUN'] },
  { number: 31, aliases: ['GPIO26_ADC0', 'GPIO26', 'GP26', 'ADC0'] },
  { number: 32, aliases: ['GPIO27_ADC1', 'GPIO27', 'GP27', 'ADC1'] },
  { number: 33, aliases: ['AGND'] },
  { number: 34, aliases: ['GPIO28_ADC2', 'GPIO28', 'GP28', 'ADC2'] },
  { number: 35, aliases: ['ADC_VREF'] },
  { number: 36, aliases: ['3V3_OUT'] },
  { number: 37, aliases: ['3V3_EN'] },
  { number: 38, aliases: ['GND_38'] },
  { number: 39, aliases: ['VSYS'] },
  { number: 40, aliases: ['VBUS'] },
];

export type RaspberryPiPicoMounting =
  | 'through_hole_header'
  | 'direct_smd'
  | 'direct_smd_hand_solder';

const PICO_MOUNTING_VARIANTS: RaspberryPiPicoMounting[] = [
  'through_hole_header',
  'direct_smd',
  'direct_smd_hand_solder',
];

function picoR3PinPosition(pinNumber: number, padX: number) {
  const isLeft = pinNumber <= 20;
  return {
    x: isLeft ? -padX : padX,
    y: isLeft ? 24.13 - (pinNumber - 1) * 2.54 : -24.13 + (pinNumber - 21) * 2.54,
  };
}

function picoR3ThroughHolePad(pin: PinDefinition) {
  const position = picoR3PinPosition(pin.number, 8.89);
  const commonProps = {
    key: `pico-r3-tht-${pin.number}`,
    name: pin.aliases[0],
    holeDiameter: '1mm',
    pcbX: mm(position.x),
    pcbY: mm(position.y),
    portHints: [`pin${pin.number}`, ...pin.aliases],
  };
  if (pin.number === 1) {
    return (
      <platedhole
        {...commonProps}
        shape="circular_hole_with_rect_pad"
        rectPadWidth="1.6mm"
        rectPadHeight="1.6mm"
        rectBorderRadius="0.2mm"
      />
    );
  }
  return <platedhole {...commonProps} shape="circle" outerDiameter="1.6mm" />;
}

function picoR3SmdPad(pin: PinDefinition, layer: Layer) {
  const position = picoR3PinPosition(pin.number, 9.69);
  // The pinned KiCad custom pin-1/GND lands share this 3.2 x 1.6 mm copper
  // envelope. A rounded rectangle preserves the functional carrier land while
  // avoiding the custom-pad parser path that drops those numbered ports.
  return (
    <smtpad
      key={`pico-r3-smd-${pin.number}`}
      name={pin.aliases[0]}
      shape="rect"
      width="3.2mm"
      height="1.6mm"
      cornerRadius="0.8mm"
      layer={layer}
      pcbX={mm(position.x)}
      pcbY={mm(position.y)}
      portHints={[`pin${pin.number}`, ...pin.aliases]}
    />
  );
}

const PICO_R3_USB_SUPPORTS = [
  { x: -2.725, y: 24, width: 1.1, height: 1.8, holeDiameter: 2.2 },
  { x: -2.425, y: 20.97, width: 1.05, height: 1.45, holeDiameter: 1.85 },
  { x: 2.425, y: 20.97, width: 1.05, height: 1.45, holeDiameter: 1.85 },
  { x: 2.725, y: 24, width: 1.1, height: 1.8, holeDiameter: 2.2 },
] as const;

function picoR3SmdUsbSupports(mounting: RaspberryPiPicoMounting, layer: Layer) {
  if (mounting === 'direct_smd_hand_solder') {
    return PICO_R3_USB_SUPPORTS.map((support, index) => (
      <hole
        key={`pico-r3-usb-support-hole-${index + 1}`}
        name={`USB_SUPPORT_${index + 1}`}
        diameter={mm(support.holeDiameter)}
        pcbX={mm(support.x)}
        pcbY={mm(support.y)}
      />
    ));
  }
  return PICO_R3_USB_SUPPORTS.map((support, index) => (
    <smtpad
      key={`pico-r3-usb-support-pad-${index + 1}`}
      name={`USB_SUPPORT_${index + 1}`}
      shape="pill"
      width={mm(support.width)}
      height={mm(support.height)}
      radius={mm(Math.min(support.width, support.height) / 2)}
      layer={layer}
      pcbX={mm(support.x)}
      pcbY={mm(support.y)}
    />
  ));
}

function picoR3Footprint(mounting: RaspberryPiPicoMounting, layer: Layer) {
  const isThroughHole = mounting === 'through_hole_header';
  return (
    <footprint>
      {isThroughHole
        ? PICO_R3_PINS.map(picoR3ThroughHolePad)
        : PICO_R3_PINS.map((pin) => picoR3SmdPad(pin, layer))}
      {isThroughHole ? null : picoR3SmdUsbSupports(mounting, layer)}
      <silkscreenrect
        pcbX="0mm"
        pcbY="0mm"
        width="21mm"
        height="51mm"
        filled={false}
        stroke="solid"
        strokeWidth="0.15mm"
      />
      <courtyardrect pcbX="0mm" pcbY="0mm" width="23.2mm" height="53mm" />
      <silkscreenrect
        pcbX="0mm"
        pcbY="25.65mm"
        width="8mm"
        height="2.3mm"
        filled={false}
        stroke="solid"
        strokeWidth="0.15mm"
      />
      <silkscreencircle
        pcbX={mm(isThroughHole ? -8.89 : -10.9)}
        pcbY="24.13mm"
        radius="0.35mm"
        isFilled={true}
      />
    </footprint>
  );
}

export const RASPBERRY_PI_PICO_R3_METADATA = {
  id: 'raspberry_pi_pico_r3',
  component: 'RaspberryPiPicoR3',
  importPath: './lib/footprints/index',
  label: PICO_R3_MODEL.pcb.sourceIdentity.displayName,
  bodyMm: { x: 21, y: 51 },
  connectorEdge: PICO_R3_USB.connectorEdge,
  mountingVariants: PICO_MOUNTING_VARIANTS,
  cadModel: {
    id: PICO_R3_MODEL.id,
    path: projectModelPath(PICO_R3_MODEL),
    sourceVersion: PICO_R3_MODEL.sourceVersion,
    sha256: PICO_R3_MODEL.pcb.model.sha256,
  },
} as const;

export type RaspberryPiPicoR3Props = DevelopmentBoardProps & {
  mounting?: RaspberryPiPicoMounting;
};

export function RaspberryPiPicoR3(props: RaspberryPiPicoR3Props) {
  const mounting = props.mounting ?? 'through_hole_header';
  const layer = props.layer ?? 'top';
  return (
    <chip
      name={props.name}
      displayName={PICO_R3_MODEL.pcb.sourceIdentity.displayName}
      manufacturerPartNumber={PICO_R3_MODEL.pcb.sourceIdentity.manufacturerPartNumber}
      layer={layer}
      pcbX={props.pcbX ?? 0}
      pcbY={props.pcbY ?? 0}
      pcbRotation={props.pcbRotation ?? 0}
      pinLabels={pinLabels(PICO_R3_PINS)}
      footprint={picoR3Footprint(mounting, layer)}
      cadModel={cadModelProps(PICO_R3_MODEL)}
      connections={props.connections ?? {}}
    />
  );
}

const ARDUINO_NANO_PINS: PinDefinition[] = [
  { number: 1, aliases: ['D1', 'TX'] },
  { number: 2, aliases: ['D0', 'RX'] },
  { number: 3, aliases: ['RESET_3'] },
  { number: 4, aliases: ['GND_4'] },
  { number: 5, aliases: ['D2'] },
  { number: 6, aliases: ['D3'] },
  { number: 7, aliases: ['D4'] },
  { number: 8, aliases: ['D5'] },
  { number: 9, aliases: ['D6'] },
  { number: 10, aliases: ['D7'] },
  { number: 11, aliases: ['D8'] },
  { number: 12, aliases: ['D9'] },
  { number: 13, aliases: ['D10'] },
  { number: 14, aliases: ['D11'] },
  { number: 15, aliases: ['D12'] },
  { number: 16, aliases: ['D13'] },
  { number: 17, aliases: ['3V3'] },
  { number: 18, aliases: ['AREF'] },
  { number: 19, aliases: ['A0'] },
  { number: 20, aliases: ['A1'] },
  { number: 21, aliases: ['A2'] },
  { number: 22, aliases: ['A3'] },
  { number: 23, aliases: ['A4', 'SDA'] },
  { number: 24, aliases: ['A5', 'SCL'] },
  { number: 25, aliases: ['A6'] },
  { number: 26, aliases: ['A7'] },
  { number: 27, aliases: ['5V'] },
  { number: 28, aliases: ['RESET_28'] },
  { number: 29, aliases: ['GND_29'] },
  { number: 30, aliases: ['VIN'] },
];

export const ARDUINO_NANO_REV3_METADATA = {
  id: 'arduino_nano_rev3',
  component: 'ArduinoNanoRev3',
  importPath: './lib/footprints/index',
  label: ARDUINO_NANO_MODEL.pcb.sourceIdentity.displayName,
  bodyMm: { x: 18, y: 45 },
  connectorEdge: ARDUINO_NANO_USB.connectorEdge,
  cadModel: {
    id: ARDUINO_NANO_MODEL.id,
    path: projectModelPath(ARDUINO_NANO_MODEL),
    sourceVersion: ARDUINO_NANO_MODEL.sourceVersion,
    sha256: ARDUINO_NANO_MODEL.pcb.model.sha256,
  },
} as const;

export type ArduinoNanoRev3Props = DevelopmentBoardProps;

export function ArduinoNanoRev3(props: ArduinoNanoRev3Props) {
  return (
    <chip
      name={props.name}
      displayName={ARDUINO_NANO_MODEL.pcb.sourceIdentity.displayName}
      manufacturerPartNumber={ARDUINO_NANO_MODEL.pcb.sourceIdentity.manufacturerPartNumber}
      layer={props.layer ?? 'top'}
      pcbX={props.pcbX ?? 0}
      pcbY={props.pcbY ?? 0}
      pcbRotation={props.pcbRotation ?? 0}
      pinLabels={pinLabels(ARDUINO_NANO_PINS)}
      footprint="kicad:Module/Arduino_Nano"
      cadModel={cadModelProps(ARDUINO_NANO_MODEL)}
      connections={props.connections ?? {}}
    />
  );
}

const RASPBERRY_PI_4B_PINS: PinDefinition[] = [
  { number: 1, aliases: ['3V3_1'] },
  { number: 2, aliases: ['5V_2'] },
  { number: 3, aliases: ['GPIO2', 'SDA1'] },
  { number: 4, aliases: ['5V_4'] },
  { number: 5, aliases: ['GPIO3', 'SCL1'] },
  { number: 6, aliases: ['GND_6'] },
  { number: 7, aliases: ['GPIO4', 'GPCLK0'] },
  { number: 8, aliases: ['GPIO14', 'TXD0'] },
  { number: 9, aliases: ['GND_9'] },
  { number: 10, aliases: ['GPIO15', 'RXD0'] },
  { number: 11, aliases: ['GPIO17'] },
  { number: 12, aliases: ['GPIO18', 'PWM0'] },
  { number: 13, aliases: ['GPIO27'] },
  { number: 14, aliases: ['GND_14'] },
  { number: 15, aliases: ['GPIO22'] },
  { number: 16, aliases: ['GPIO23'] },
  { number: 17, aliases: ['3V3_17'] },
  { number: 18, aliases: ['GPIO24'] },
  { number: 19, aliases: ['GPIO10', 'MOSI'] },
  { number: 20, aliases: ['GND_20'] },
  { number: 21, aliases: ['GPIO9', 'MISO'] },
  { number: 22, aliases: ['GPIO25'] },
  { number: 23, aliases: ['GPIO11', 'SCLK'] },
  { number: 24, aliases: ['GPIO8', 'CE0'] },
  { number: 25, aliases: ['GND_25'] },
  { number: 26, aliases: ['GPIO7', 'CE1'] },
  { number: 27, aliases: ['GPIO0', 'ID_SD'] },
  { number: 28, aliases: ['GPIO1', 'ID_SC'] },
  { number: 29, aliases: ['GPIO5'] },
  { number: 30, aliases: ['GND_30'] },
  { number: 31, aliases: ['GPIO6'] },
  { number: 32, aliases: ['GPIO12', 'PWM0_32'] },
  { number: 33, aliases: ['GPIO13', 'PWM1'] },
  { number: 34, aliases: ['GND_34'] },
  { number: 35, aliases: ['GPIO19', 'PCM_FS'] },
  { number: 36, aliases: ['GPIO16'] },
  { number: 37, aliases: ['GPIO26'] },
  { number: 38, aliases: ['GPIO20', 'PCM_DIN'] },
  { number: 39, aliases: ['GND_39'] },
  { number: 40, aliases: ['GPIO21', 'PCM_DOUT'] },
];

// The Pi mounting holes and GPIO header are intentionally asymmetric within
// the 85 x 56 mm outline, so their aggregate bounds are not the board center.
const RASPBERRY_PI_4B_FOOTPRINT_BOUNDS_CENTER_MM = { x: -10, y: -0.385 };

function raspberryPi4ModelBFootprint() {
  const holes = [
    { x: -39, y: 24.5 },
    { x: 19, y: 24.5 },
    { x: -39, y: -24.5 },
    { x: 19, y: -24.5 },
  ];
  const headerPins = RASPBERRY_PI_4B_PINS.map((pin) => {
    const column = Math.floor((pin.number - 1) / 2);
    const x = -34.13 + column * 2.54;
    const y = pin.number % 2 === 1 ? -25.77 : -23.23;
    return { pin, x, y };
  });

  return (
    <footprint>
      {holes.map((hole, index) => (
        <hole
          key={`raspberry-pi-4b-hole-${index + 1}`}
          name={`MH${index + 1}`}
          diameter="2.7mm"
          pcbX={mm(hole.x)}
          pcbY={mm(hole.y)}
        />
      ))}
      {headerPins.map(({ pin, x, y }) => (
        <platedhole
          key={`raspberry-pi-4b-gpio-${pin.number}`}
          name={pin.aliases[0]}
          shape="circle"
          holeDiameter="1mm"
          outerDiameter="1.7mm"
          pcbX={mm(x)}
          pcbY={mm(y)}
          portHints={[`pin${pin.number}`, ...pin.aliases]}
        />
      ))}
      <silkscreenrect
        pcbX="0mm"
        pcbY="0mm"
        width="85mm"
        height="56mm"
        filled={false}
        stroke="solid"
        strokeWidth="0.15mm"
      />
      <courtyardrect pcbX="0mm" pcbY="0mm" width="86mm" height="57mm" />
      <silkscreentext
        text="GPIO"
        pcbX="-10mm"
        pcbY="-20.5mm"
        fontSize="1mm"
        anchorAlignment="center"
      />
      <silkscreencircle pcbX="-34.13mm" pcbY="-27.1mm" radius="0.4mm" isFilled={true} />
    </footprint>
  );
}

export const RASPBERRY_PI_4_MODEL_B_METADATA = {
  id: 'raspberry_pi_4_model_b',
  component: 'RaspberryPi4ModelB',
  importPath: './lib/footprints/index',
  label: RASPBERRY_PI_4B_MODEL.pcb.sourceIdentity.displayName,
  bodyMm: { x: 85, y: 56 },
  connectorEdge: RASPBERRY_PI_4B_USB.connectorEdge,
  mountingHoleDiameterMm: 2.7,
  cadModel: {
    id: RASPBERRY_PI_4B_MODEL.id,
    path: projectModelPath(RASPBERRY_PI_4B_MODEL),
    sourceVersion: RASPBERRY_PI_4B_MODEL.sourceVersion,
    sha256: RASPBERRY_PI_4B_MODEL.pcb.model.sha256,
  },
} as const;

export type RaspberryPi4ModelBProps = DevelopmentBoardProps;

export function RaspberryPi4ModelB(props: RaspberryPi4ModelBProps) {
  const layer = props.layer ?? 'top';
  const pcbRotation = props.pcbRotation ?? 0;
  return (
    <chip
      name={props.name}
      displayName={RASPBERRY_PI_4B_MODEL.pcb.sourceIdentity.displayName}
      manufacturerPartNumber={RASPBERRY_PI_4B_MODEL.pcb.sourceIdentity.manufacturerPartNumber}
      layer={layer}
      pcbX={props.pcbX ?? 0}
      pcbY={props.pcbY ?? 0}
      pcbRotation={pcbRotation}
      pinLabels={pinLabels(RASPBERRY_PI_4B_PINS)}
      footprint={raspberryPi4ModelBFootprint()}
      cadModel={{
        ...cadModelProps(RASPBERRY_PI_4B_MODEL),
        positionOffset: modelAnchorPositionOffset(
          RASPBERRY_PI_4B_FOOTPRINT_BOUNDS_CENTER_MM,
          layer,
          pcbRotation,
        ),
      }}
      connections={props.connections ?? {}}
    />
  );
}

export function listDevelopmentBoardFootprintTemplates() {
  return [
    {
      id: XIAO_RP2040_METADATA.id,
      component: XIAO_RP2040_METADATA.component,
      importPath: XIAO_RP2040_METADATA.importPath,
      description:
        'Seeed Studio XIAO RP2040 with the official 14-pin DIP or 20-pad SMD carrier geometry and complete vendor STEP model.',
    },
    {
      id: RASPBERRY_PI_PICO_R3_METADATA.id,
      component: RASPBERRY_PI_PICO_R3_METADATA.component,
      importPath: RASPBERRY_PI_PICO_R3_METADATA.importPath,
      description:
        'Raspberry Pi Pico R3 with local THT/SMD carrier footprints derived from pinned official KiCad geometry, verified 40-pin labels, and the official Raspberry Pi STEP model.',
    },
    {
      id: ARDUINO_NANO_REV3_METADATA.id,
      component: ARDUINO_NANO_REV3_METADATA.component,
      importPath: ARDUINO_NANO_REV3_METADATA.importPath,
      description:
        'Arduino Nano Rev3 with the KiCad Arduino_Nano footprint, verified 30-pin labels, and a pinned CC BY 3.0 complete-board STEP model.',
    },
    {
      id: RASPBERRY_PI_4_MODEL_B_METADATA.id,
      component: RASPBERRY_PI_4_MODEL_B_METADATA.component,
      importPath: RASPBERRY_PI_4_MODEL_B_METADATA.importPath,
      description:
        'Raspberry Pi 4 Model B carrier footprint with official mechanical hole/header coordinates and a pinned CC BY 3.0 complete-board STEP model.',
    },
  ];
}
