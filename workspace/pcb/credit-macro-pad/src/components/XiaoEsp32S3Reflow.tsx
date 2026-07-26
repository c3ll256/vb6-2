import {
  cadModelProps,
  requireBuiltinCoreBoardModel,
} from "../lib/footprints/BuiltinCoreBoardModels";

type Layer = "top" | "bottom";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      chip: any;
      footprint: any;
      smtpad: any;
      courtyardrect: any;
      silkscreenrect: any;
      silkscreencircle: any;
      silkscreentext: any;
    }
  }
}

const MODEL = requireBuiltinCoreBoardModel("seeed_xiao_esp32s3_v2");
const BODY_W = 17.8;
const BODY_H = 21.0;
const ROW_X = 7.62;
const PAD_CENTER_X = 8.27;
const PIN_PITCH = 2.54;
const PIN_Y0 = 7.62;

const LEFT = [
  { name: "D0", hints: ["D0", "pin1"] },
  { name: "D1", hints: ["D1", "pin2"] },
  { name: "D2", hints: ["D2", "pin3"] },
  { name: "D3", hints: ["D3", "pin4"] },
  { name: "D4", hints: ["D4", "pin5"] },
  { name: "D5", hints: ["D5", "pin6"] },
  { name: "D6", hints: ["D6", "pin7"] },
];
const RIGHT = [
  { name: "5V", hints: ["5V", "VBUS", "pin8"] },
  { name: "GND", hints: ["GND", "pin9"] },
  { name: "3V3", hints: ["3V3", "V3V3", "pin10"] },
  { name: "D10", hints: ["D10", "pin11"] },
  { name: "D9", hints: ["D9", "pin12"] },
  { name: "D8", hints: ["D8", "pin13"] },
  { name: "D7", hints: ["D7", "pin14"] },
];

const mm = (n: number) => `${n}mm`;

function ReflowFootprint() {
  return (
    <footprint>
      {LEFT.map((pin, index) => (
        <smtpad
          key={`left-${pin.name}`}
          name={pin.name}
          shape="rect"
          width="3.2mm"
          height="1.7mm"
          solderMaskMargin="0.08mm"
          pcbX={mm(-PAD_CENTER_X)}
          pcbY={mm(PIN_Y0 - index * PIN_PITCH)}
          portHints={pin.hints}
        />
      ))}
      {RIGHT.map((pin, index) => (
        <smtpad
          key={`right-${pin.name}`}
          name={pin.name}
          shape="rect"
          width="3.2mm"
          height="1.7mm"
          solderMaskMargin="0.08mm"
          pcbX={mm(PAD_CENTER_X)}
          pcbY={mm(PIN_Y0 - index * PIN_PITCH)}
          portHints={pin.hints}
        />
      ))}
      <silkscreenrect pcbX="0mm" pcbY="0mm" width={mm(BODY_W)} height={mm(BODY_H)} strokeWidth="0.15mm" />
      <courtyardrect pcbX="0mm" pcbY="0.6mm" width={mm(BODY_W)} height="22.2mm" />
      <silkscreenrect pcbX="0mm" pcbY="10.2mm" width="9mm" height="3mm" strokeWidth="0.15mm" />
      <silkscreencircle pcbX={mm(-ROW_X)} pcbY={mm(PIN_Y0 + 1.2)} radius="0.3mm" isFilled={true} />
      <silkscreentext text="1" pcbX={mm(-ROW_X + 1.6)} pcbY={mm(PIN_Y0 + 1.2)} fontSize="0.6mm" anchorAlignment="center" />
    </footprint>
  );
}

export type XiaoEsp32S3ReflowProps = {
  name: string;
  layer?: Layer;
  pcbX?: number | string;
  pcbY?: number | string;
  pcbRotation?: number | string;
  connections?: Record<string, string>;
};

/**
 * Exact XIAO ESP32S3 geometry with an SMT-only castellated carrier land pattern.
 * It preserves the verified 15.24 mm row spacing and 2.54 mm pitch from the
 * managed XIAO component. The 3.2 x 1.7 mm pads retain 0.97 mm of exposed
 * carrier copper beyond the module edge, but omit the registration drills so
 * the user-facing LCD can remain above a bottom-mounted reflow module.
 */
export function XiaoEsp32S3Reflow(props: XiaoEsp32S3ReflowProps) {
  return (
    <chip
      name={props.name}
      displayName={MODEL.pcb.sourceIdentity.displayName}
      manufacturerPartNumber={MODEL.pcb.sourceIdentity.manufacturerPartNumber}
      layer={props.layer ?? "top"}
      pcbX={props.pcbX ?? 0}
      pcbY={props.pcbY ?? 0}
      pcbRotation={props.pcbRotation ?? 0}
      footprint={<ReflowFootprint />}
      cadModel={cadModelProps(MODEL)}
      connections={props.connections ?? {}}
    />
  );
}
