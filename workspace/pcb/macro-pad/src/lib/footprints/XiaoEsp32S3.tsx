/**
 * Seeed Studio XIAO ESP32S3 module footprint (verified geometry).
 *
 * NATIVE ORIENTATION: standard datasheet top view, USB-C connector on the
 * +Y edge (board "up"), pin header running toward -Y. This matches the
 * classic XIAO family silhouette. Similar silhouettes on ESP32C3, RP2040,
 * nRF52840, or SAMD21 variants do not make this exact footprint/model binding
 * interchangeable with those boards.
 *
 * VERIFIED DIMENSIONS (Seeed Studio Wiki, "Getting Started with Seeed
 * Studio XIAO ESP32-S3 Series", fetched 2026-07-08):
 *   https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/
 * - Body: 21.0mm (Y, USB-to-tail length) x 17.8mm (X, width). Some
 *   secondary sources (Seeed product page, components101) list 17.5mm
 *   instead of 17.8mm for the width; 17.8mm from the primary wiki spec
 *   table is used here.
 * - Pin pitch: 2.54mm, 7 through-hole pins per side (14 pins total).
 * - Row separation (left-column to right-column center-to-center, X):
 *   15.24mm = 6 x 2.54mm. A previous hand-authored footprint incorrectly
 *   used 17.78mm for this spacing -- do not reuse that value.
 * - Hole/pad: Seeed does not publish an exact drill/pad dimension drawing;
 *   ~1.0mm drill / ~1.7mm annular pad matches widely used community KiCad
 *   footprints for the XIAO through-hole header and is used here.
 * - Pin-span-to-body-edge margin is likewise not separately published; this
 *   footprint centers the 15.24mm pin span within the 21.0mm body length
 *   (2.88mm margin at each end). This only affects silkscreen/outline
 *   spacing, not electrical correctness -- confirm visually against the
 *   auto-injected PCB previews if the exact split matters for your design.
 * - Direct hand-solder mounting uses the same 1.0mm registration hole plus a
 *   3.2mm x 1.7mm rectangular pad offset toward the carrier-board exterior.
 *   This leaves about 1.0mm of copper beyond the nominal XIAO body edge for
 *   iron access. It is a hand-solder-specific carrier treatment, not a vendor
 *   reflow land pattern.
 *
 * PIN MAP (standard top view, USB at top / +Y; verified against the Seeed
 * pin table on the same wiki page):
 * - Left column, top -> bottom: D0, D1, D2, D3, D4, D5, D6
 * - Right column, top -> bottom: 5V (VBUS), GND, 3V3, D10, D9, D8, D7
 * `pinN` portHints below are sequential footprint-local labels (left column
 * pin1..pin7 top-to-bottom, then right column pin8..pin14 top-to-bottom) --
 * they are a convenience alias, not a confirmed silkscreened pin number.
 * Prefer the functional names (D0..D10, 5V/VBUS, GND, 3V3/V3V3) in
 * `connections`.
 *
 * ROTATION USAGE:
 * - `pcbRotation={0}` on `layer="top"` keeps native orientation (USB facing
 *   +Y / "up"). Use `rotationForOpening()` from "../layout" (or an
 *   equivalent board-relative helper) to point the USB-C edge toward a
 *   specific board edge.
 * - WARNING: placing this footprint on `layer="bottom"` mirrors X, which
 *   flips the rotation sense (which way is "clockwise") relative to the TOP
 *   layer. A `pcbRotation` value that points the USB edge at a given board
 *   edge on top will NOT point the same direction on bottom. Always
 *   confirm orientation with the auto-injected PCB previews (inspect BOTH
 *   top and bottom renders) after placing a bottom-side XIAO -- do not
 *   assume the same rotation value transfers.
 */

import {
  cadModelProps,
  projectModelPath,
  requireBuiltinCoreBoardModel,
} from './BuiltinCoreBoardModels';

type PointMm = { x: number; y: number };
type Layer = 'top' | 'bottom';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      chip: any;
      courtyardrect: any;
      footprint: any;
      platedhole: any;
      silkscreenrect: any;
      silkscreencircle: any;
      silkscreentext: any;
    }
  }
}

const XIAO_BOARD_MODEL = requireBuiltinCoreBoardModel('seeed_xiao_esp32s3_v2');
const XIAO_USB_INTERFACE = XIAO_BOARD_MODEL.pcb.interfaces.find(
  (interfaceDefinition) => interfaceDefinition.id === 'usb_c',
);
if (!XIAO_USB_INTERFACE) {
  throw new Error(`builtin_core_board_interface_missing:${XIAO_BOARD_MODEL.id}:usb_c`);
}

export const XIAO_ESP32S3_METADATA = {
  id: 'xiao_esp32s3',
  component: 'XiaoEsp32S3',
  importPath: './lib/footprints/index',
  label: 'Seeed Studio XIAO ESP32S3',
  geometryStatus: 'datasheet_verified' as const,
  bodyMm: { x: 17.8, y: 21.0 },
  connectorEdge: XIAO_USB_INTERFACE.connectorEdge,
  pinPitchMm: 2.54,
  rowSeparationMm: 15.24,
  holeDiameterMm: 1.0,
  padOuterDiameterMm: 1.7,
  mountingVariants: {
    through_hole_header: {
      process: 'hand_solder_iron',
      capability: 'supported',
    },
    direct_castellated_hand_solder: {
      process: 'hand_solder_iron',
      capability: 'hand_solder_access_designed',
      rectPadMm: { x: 3.2, y: 1.7 },
      holeOffsetMm: 0.65,
      nominalExposedCopperMm: 0.97,
    },
    direct_castellated_reflow: {
      process: 'reflow',
      capability: 'unsupported_without_verified_land_pattern',
    },
  },
  cadModel: {
    id: XIAO_BOARD_MODEL.id,
    path: projectModelPath(XIAO_BOARD_MODEL),
    revision: XIAO_BOARD_MODEL.revision,
    sha256: XIAO_BOARD_MODEL.pcb.model.sha256,
    transform: XIAO_BOARD_MODEL.pcb.model.transform,
    interfaces: XIAO_BOARD_MODEL.pcb.interfaces,
  },
  sources: [
    {
      type: 'wiki',
      title: 'Getting Started with Seeed Studio XIAO ESP32-S3 Series',
      url: 'https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/',
    },
  ],
} as const;

const BODY_HALF_W_MM = XIAO_ESP32S3_METADATA.bodyMm.x / 2;
const BODY_HALF_H_MM = XIAO_ESP32S3_METADATA.bodyMm.y / 2;
const ROW_HALF_X_MM = XIAO_ESP32S3_METADATA.rowSeparationMm / 2;
const PIN_PITCH_MM = XIAO_ESP32S3_METADATA.pinPitchMm;
const PIN_SPAN_HALF_MM = 3 * PIN_PITCH_MM; // 3 gaps from center pin to end pin

// USB-C connector silkscreen stub: ~9mm wide body, protruding ~1.2mm beyond
// the top (+Y) board edge. This is an orientation marker, not a precise
// mechanical drawing of the connector shell.
const USB_STUB_WIDTH_MM = 9;
const USB_STUB_PROTRUSION_MM = 1.2;
const USB_STUB_INSET_MM = 1.8;
const COURTYARD_HEIGHT_MM = XIAO_ESP32S3_METADATA.bodyMm.y + USB_STUB_PROTRUSION_MM;
const COURTYARD_CENTER_Y_MM = USB_STUB_PROTRUSION_MM / 2;

type PinRow = {
  name: string;
  portHints: string[];
  y_mm: number;
};

function leftColumnPins(): PinRow[] {
  const names = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6'];
  return names.map((name, index) => ({
    name,
    portHints: [name, `pin${index + 1}`],
    y_mm: PIN_SPAN_HALF_MM - index * PIN_PITCH_MM,
  }));
}

function rightColumnPins(): PinRow[] {
  const rows: Array<{ names: string[] }> = [
    { names: ['5V', 'VBUS'] },
    { names: ['GND'] },
    { names: ['3V3', 'V3V3'] },
    { names: ['D10'] },
    { names: ['D9'] },
    { names: ['D8'] },
    { names: ['D7'] },
  ];
  return rows.map((row, index) => ({
    name: row.names[0],
    portHints: [...row.names, `pin${index + 8}`],
    y_mm: PIN_SPAN_HALF_MM - index * PIN_PITCH_MM,
  }));
}

function mm(value: number): string {
  return `${value}mm`;
}

export type XiaoEsp32S3Mounting = 'through_hole_header' | 'direct_castellated_hand_solder';

function renderPin(pin: PinRow, x_mm: number, key: string, mounting: XiaoEsp32S3Mounting) {
  if (mounting === 'direct_castellated_hand_solder') {
    const side = x_mm < 0 ? -1 : 1;
    const holeOffsetMm =
      -side * XIAO_ESP32S3_METADATA.mountingVariants.direct_castellated_hand_solder.holeOffsetMm;
    const padCenterX = x_mm - holeOffsetMm;
    return (
      <platedhole
        key={key}
        name={pin.name}
        shape="circular_hole_with_rect_pad"
        holeDiameter={mm(XIAO_ESP32S3_METADATA.holeDiameterMm)}
        rectPadWidth={mm(
          XIAO_ESP32S3_METADATA.mountingVariants.direct_castellated_hand_solder.rectPadMm.x,
        )}
        rectPadHeight={mm(
          XIAO_ESP32S3_METADATA.mountingVariants.direct_castellated_hand_solder.rectPadMm.y,
        )}
        rectBorderRadius="0.25mm"
        holeOffsetX={mm(holeOffsetMm)}
        holeOffsetY="0mm"
        solderMaskMargin="0.08mm"
        pcbX={mm(padCenterX)}
        pcbY={mm(pin.y_mm)}
        portHints={pin.portHints}
      />
    );
  }
  return (
    <platedhole
      key={key}
      name={pin.name}
      shape="circle"
      holeDiameter={mm(XIAO_ESP32S3_METADATA.holeDiameterMm)}
      outerDiameter={mm(XIAO_ESP32S3_METADATA.padOuterDiameterMm)}
      pcbX={mm(x_mm)}
      pcbY={mm(pin.y_mm)}
      portHints={pin.portHints}
    />
  );
}

function xiaoEsp32S3Footprint(mounting: XiaoEsp32S3Mounting) {
  const leftPins = leftColumnPins();
  const rightPins = rightColumnPins();
  const topPinY = leftPins[0]?.y_mm ?? PIN_SPAN_HALF_MM;
  const pin1DotAt: PointMm = { x: -ROW_HALF_X_MM, y: topPinY + 1.2 };

  return (
    <footprint>
      {leftPins.map((pin, index) => renderPin(pin, -ROW_HALF_X_MM, `xiao-left-${index}`, mounting))}
      {rightPins.map((pin, index) =>
        renderPin(pin, ROW_HALF_X_MM, `xiao-right-${index}`, mounting),
      )}

      {/* Module body outline, matching the verified 17.8mm x 21.0mm silhouette. */}
      <silkscreenrect
        pcbX="0mm"
        pcbY="0mm"
        width={mm(XIAO_ESP32S3_METADATA.bodyMm.x)}
        height={mm(XIAO_ESP32S3_METADATA.bodyMm.y)}
        filled={false}
        stroke="solid"
        strokeWidth="0.15mm"
      />

      {/* Keep one closed, non-self-intersecting courtyard. Two overlapping
          rectangles (body + USB stub) produce malformed KiCad courtyards. */}
      <courtyardrect
        pcbX="0mm"
        pcbY={mm(COURTYARD_CENTER_Y_MM)}
        width={mm(XIAO_ESP32S3_METADATA.bodyMm.x)}
        height={mm(COURTYARD_HEIGHT_MM)}
      />

      {/* USB-C connector direction marker on the +Y (top) edge. */}
      <silkscreenrect
        pcbX="0mm"
        pcbY={mm(BODY_HALF_H_MM + (USB_STUB_PROTRUSION_MM - USB_STUB_INSET_MM) / 2)}
        width={mm(USB_STUB_WIDTH_MM)}
        height={mm(USB_STUB_PROTRUSION_MM + USB_STUB_INSET_MM)}
        filled={false}
        stroke="solid"
        strokeWidth="0.15mm"
      />

      {/* Pin-1 (D0) marker: dot near the top-left pad, "1" label toward board center. */}
      <silkscreencircle
        pcbX={mm(pin1DotAt.x)}
        pcbY={mm(pin1DotAt.y)}
        radius="0.3mm"
        isFilled={true}
      />
      <silkscreentext
        text="1"
        pcbX={mm(pin1DotAt.x + 1.6)}
        pcbY={mm(pin1DotAt.y)}
        fontSize="0.6mm"
        anchorAlignment="center"
      />
    </footprint>
  );
}

export type XiaoEsp32S3Props = {
  name: string;
  layer?: Layer;
  pcbX?: number | string;
  pcbY?: number | string;
  pcbRotation?: number | string;
  connections?: Record<string, string>;
  mounting?: XiaoEsp32S3Mounting;
};

export function XiaoEsp32S3(props: XiaoEsp32S3Props) {
  return (
    <chip
      name={props.name}
      displayName={XIAO_BOARD_MODEL.pcb.sourceIdentity.displayName}
      manufacturerPartNumber={XIAO_BOARD_MODEL.pcb.sourceIdentity.manufacturerPartNumber}
      layer={props.layer ?? 'top'}
      pcbX={props.pcbX ?? 0}
      pcbY={props.pcbY ?? 0}
      pcbRotation={props.pcbRotation ?? 0}
      footprint={xiaoEsp32S3Footprint(props.mounting ?? 'through_hole_header')}
      cadModel={cadModelProps(XIAO_BOARD_MODEL)}
      connections={props.connections ?? {}}
    />
  );
}

export function listXiaoFootprintTemplates() {
  return [
    {
      id: XIAO_ESP32S3_METADATA.id,
      component: XIAO_ESP32S3_METADATA.component,
      importPath: XIAO_ESP32S3_METADATA.importPath,
      description:
        'Seeed Studio XIAO ESP32S3 module footprint: verified 17.8x21.0mm body, official vendor STEP model, and explicit through-hole-header or direct-hand-solder mounting variants.',
      examples: [
        '<XiaoEsp32S3 name="U_XIAO" mounting="through_hole_header" layer="top" pcbX={0} pcbY={0} pcbRotation={0} connections={{ VBUS: "net.VBUS", GND: "net.GND", V3V3: "net.V3V3", D0: "net.KEY1" }} />',
        '<XiaoEsp32S3 name="U_XIAO" mounting="direct_castellated_hand_solder" layer="top" pcbX={0} pcbY={0} pcbRotation={0} connections={{ VBUS: "net.VBUS", GND: "net.GND", V3V3: "net.V3V3", D0: "net.KEY1" }} />',
      ],
    },
  ];
}
