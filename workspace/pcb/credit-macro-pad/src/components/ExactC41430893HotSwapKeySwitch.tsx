type PointMm = { x: number; y: number };
type Orientation = "south";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      chip: any;
      footprint: any;
      hole: any;
      smtpad: any;
    }
  }
}

export type ExactC41430893HotSwapKeySwitchProps = {
  name: string;
  switch: "mx";
  socket: "c41430893";
  orientation?: Orientation;
  pcbX?: number | string;
  pcbY?: number | string;
  pcbRotation?: number | string;
  connections?: Record<string, string>;
};

const mm = (value: number) => `${value}mm`;

const MX_MECHANICAL_HOLES = [
  { id: "center", x: 0, y: 0, diameter: 4 },
  { id: "peg_left", x: -5.08, y: 0, diameter: 1.75 },
  { id: "peg_right", x: 5.08, y: 0, diameter: 1.75 },
] as const;

// C41430893 page 1 labels this geometry "RECOMMENDED PCB LAYOUT". It is the
// physical board-land view for the intended bottom-side socket installation,
// not a native top-side footprint view. Keep it as immutable evidence data.
const C41430893_BOTTOM_BOARD_LAYOUT_SMD_PADS = [
  { name: "1", x: -6.72, y: 1.27, width: 2.5, height: 2.55 },
  { name: "2", x: 6.72, y: -1.27, width: 2.5, height: 2.55 },
] as const;

// Physical through-board MX contact-pin centers relative to the switch origin.
const MX_CONTACT_HOLES = [
  { name: "1", x: -3.81, y: -2.54, diameter: 3 },
  { name: "2", x: 2.54, y: -5.08, diameter: 3 },
] as const;

// Physical contact-hole targets in the same recommended bottom-board view.
const C41430893_BOTTOM_BOARD_LAYOUT_CONTACT_TARGETS = [
  { name: "1", x: -3.18, y: 1.27 },
  { name: "2", x: 3.17, y: -1.27 },
] as const;

// Author the actual custom footprint in native TOP-SIDE orientation as
// required by the Replicator chirality contract. This one evidence conversion
// is outside JSX; tscircuit then performs exactly one automatic X mirror when
// the socket chip is mounted on the bottom, reproducing the datasheet's
// physical bottom-board land view. No generated KiCad/preview coordinates are
// used here.
const C41430893_NATIVE_TOP_SMD_PADS = C41430893_BOTTOM_BOARD_LAYOUT_SMD_PADS.map(
  (pad) => ({ ...pad, x: -pad.x }),
);
const C41430893_NATIVE_TOP_CONTACT_TARGETS =
  C41430893_BOTTOM_BOARD_LAYOUT_CONTACT_TARGETS.map((hole) => ({
    ...hole,
    x: -hole.x,
  }));

const SOCKET_ORIGIN_OFFSET: PointMm = {
  x: MX_CONTACT_HOLES[0].x - C41430893_BOTTOM_BOARD_LAYOUT_CONTACT_TARGETS[0].x,
  y: MX_CONTACT_HOLES[0].y - C41430893_BOTTOM_BOARD_LAYOUT_CONTACT_TARGETS[0].y,
};

function numericMm(value: number | string | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === "number") return value;
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(?:mm)?$/i);
  if (!match) throw new Error(`Exact C41430893 placement requires a numeric mm value; received ${value}`);
  return Number(match[1]);
}

function numericDegrees(value: number | string | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === "number") return value;
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(?:deg)?$/i);
  if (!match) throw new Error(`Exact C41430893 placement requires a numeric rotation; received ${value}`);
  return Number(match[1]);
}

function rotate(point: PointMm, degrees: number): PointMm {
  if (degrees === 0) return point;
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function mechanicalFootprint() {
  return (
    <footprint>
      {MX_MECHANICAL_HOLES.map((hole) => (
        <hole
          key={`mx-${hole.id}`}
          name={hole.id}
          pcbX={mm(hole.x)}
          pcbY={mm(hole.y)}
          diameter={mm(hole.diameter)}
        />
      ))}
    </footprint>
  );
}

function socketFootprint() {
  return (
    <footprint>
      {C41430893_NATIVE_TOP_SMD_PADS.map((pad) => (
        <smtpad
          key={`c41430893-pad-${pad.name}`}
          pcbX={mm(pad.x)}
          pcbY={mm(pad.y)}
          layer="bottom"
          shape="rect"
          width={mm(pad.width)}
          height={mm(pad.height)}
          solderMaskMargin="0.05mm"
          portHints={[pad.name]}
        />
      ))}
      {C41430893_NATIVE_TOP_CONTACT_TARGETS.map((hole) => (
        <hole
          key={`c41430893-hole-${hole.name}`}
          name={`contact_${hole.name}_clearance`}
          pcbX={mm(hole.x)}
          pcbY={mm(hole.y)}
          diameter="3mm"
        />
      ))}
    </footprint>
  );
}

export function HotSwapKeySwitch(props: ExactC41430893HotSwapKeySwitchProps) {
  if (props.switch !== "mx" || props.socket !== "c41430893") {
    throw new Error("This project-local component is qualified only for MX + C41430893");
  }
  if ((props.orientation ?? "south") !== "south") {
    throw new Error("This project-local component is qualified only for south orientation");
  }

  const baseName = props.name.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  const mechanicalName = baseName.startsWith("SW_") ? baseName : `SW_${baseName}`;
  const socketName = baseName.startsWith("HS_") ? baseName : `HS_${baseName}`;
  const baseX = numericMm(props.pcbX);
  const baseY = numericMm(props.pcbY);
  const rotation = numericDegrees(props.pcbRotation);
  const rotatedOffset = rotate(SOCKET_ORIGIN_OFFSET, rotation);

  return (
    <>
      <chip
        name={mechanicalName}
        layer="top"
        pcbX={baseX}
        pcbY={baseY}
        pcbRotation={rotation}
        footprint={mechanicalFootprint()}
      />
      <chip
        name={socketName}
        layer="bottom"
        pcbX={baseX + rotatedOffset.x}
        pcbY={baseY + rotatedOffset.y}
        pcbRotation={rotation}
        footprint={socketFootprint()}
        supplierPartNumbers={{ jlcpcb: ["C41430893"] }}
        cadModel={{
          objUrl: "https://modules.easyeda.com/3dmodel/5c2d585f6c544fcf92e7ed163bda57d3",
          stepUrl: "https://modules.easyeda.com/qAxj6KHrDKw4blvCG8QJPs7Y/5c2d585f6c544fcf92e7ed163bda57d3",
          modelOriginPosition: { x: 0, y: 0, z: -0.0500024 },
        }}
        connections={props.connections ?? {}}
      />
    </>
  );
}
