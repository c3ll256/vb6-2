type PointMm = { x: number; y: number };
type SizeMm = { x: number; y: number };
type Side = 'top' | 'bottom';
type Orientation = 'south' | 'north';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      chip: any;
      footprint: any;
      hole: any;
      smtpad: any;
    }
  }
}

type HoleSpec = {
  id: string;
  at_mm: PointMm;
  diameter_mm: number;
  kind: 'npth';
};

type ContactPointSpec = {
  name: '1' | '2';
  at_mm: PointMm;
};

type SmdPadSpec = {
  name: '1' | '2';
  at_mm: PointMm;
  size_mm: SizeMm;
  shape: 'rect' | 'roundrect';
  cornerRadius_mm?: number;
};

type CompatiblePart = {
  lcscCode: string;
  manufacturer: string;
  mpn: string;
  evidenceUrl: string;
  notes?: string;
};

type SourceRef = {
  type: string;
  title: string;
  url: string;
};

type SocketCadModel = {
  objUrl: string;
  stepUrl: string;
  modelOriginPosition: {
    x: number;
    y: number;
    z: number;
  };
};

type SwitchProfile = {
  id: 'mx' | 'choc_v1' | 'choc_v2' | 'choc_v1v2';
  label: string;
  mechanicalSide: 'top';
  mechanicalHoles: readonly HoleSpec[];
  contactPins: readonly ContactPointSpec[];
  courtyard_mm: SizeMm;
};

type SocketProfile = {
  id: 'c41430893' | 'kailh_mx' | 'kailh_choc_v1';
  label: string;
  footprintFamily: 'mx_hotswap' | 'choc_v1_hotswap';
  side: 'bottom';
  supplierFootprint?: `jlcpcb:${string}`;
  supplierPartNumber?: string;
  cadModel?: SocketCadModel;
  compatibleSwitches: readonly SwitchProfile['id'][];
  contactTargets: readonly ContactPointSpec[];
  smdPads: readonly SmdPadSpec[];
  holes: readonly HoleSpec[];
  body_mm: SizeMm;
  compatibleParts: readonly CompatiblePart[];
  sources: readonly SourceRef[];
};

export const hotSwapKeySwitchTemplate = {
  id: 'hot_swap_key_switch',
  component: 'HotSwapKeySwitch',
  importPath: './lib/footprints/index',
  description:
    'Keyboard hot-swap switch footprint. The switch geometry is the installation constraint; the socket footprint is aligned to the switch contact-pin centers.',
  switches: {
    mx: {
      id: 'mx',
      label: 'Cherry MX-compatible PCB switch',
      mechanicalSide: 'top',
      mechanicalHoles: [
        {
          id: 'center',
          at_mm: { x: 0, y: 0 },
          diameter_mm: 4,
          kind: 'npth',
        },
        {
          id: 'peg_left',
          at_mm: { x: -5.08, y: 0 },
          diameter_mm: 1.75,
          kind: 'npth',
        },
        {
          id: 'peg_right',
          at_mm: { x: 5.08, y: 0 },
          diameter_mm: 1.75,
          kind: 'npth',
        },
      ],
      // kiswitch SW_Hotswap_Kailh_MX_1.00u places these at (-3.81, -2.54) and
      // (2.54, -5.08). That library is KiCad's Y-down frame; every coordinate
      // in this file is a physical top view with Y up, so the Y sign flips.
      contactPins: [
        {
          name: '1',
          at_mm: { x: -3.81, y: 2.54 },
        },
        {
          name: '2',
          at_mm: { x: 2.54, y: 5.08 },
        },
      ],
      courtyard_mm: { x: 14, y: 14 },
    },
    choc_v1: {
      id: 'choc_v1',
      label: 'Kailh Choc v1 PCB switch',
      mechanicalSide: 'top',
      // Choc v1 is retained by two pegs on the switch centre line. The contact
      // clearance holes belong to the socket, as they do for MX.
      mechanicalHoles: [
        {
          id: 'center',
          at_mm: { x: 0, y: 0 },
          diameter_mm: 3.45,
          kind: 'npth',
        },
        {
          id: 'peg_left',
          at_mm: { x: -5.5, y: 0 },
          diameter_mm: 1.9,
          kind: 'npth',
        },
        {
          id: 'peg_right',
          at_mm: { x: 5.5, y: 0 },
          diameter_mm: 1.9,
          kind: 'npth',
        },
      ],
      contactPins: [
        {
          name: '1',
          at_mm: { x: 0, y: 5.9 },
        },
        {
          name: '2',
          at_mm: { x: 5, y: 3.8 },
        },
      ],
      courtyard_mm: { x: 15, y: 15 },
    },
    choc_v2: {
      id: 'choc_v2',
      label: 'Kailh Choc v2 PCB switch',
      mechanicalSide: 'top',
      // v2 swaps the two centre-line pegs for one large centre bore and a
      // single off-centre peg; the contact pins are unchanged from v1.
      mechanicalHoles: [
        {
          id: 'center',
          at_mm: { x: 0, y: 0 },
          diameter_mm: 5.05,
          kind: 'npth',
        },
        {
          id: 'peg',
          at_mm: { x: -5, y: -5.15 },
          diameter_mm: 1.6,
          kind: 'npth',
        },
      ],
      contactPins: [
        {
          name: '1',
          at_mm: { x: 0, y: 5.9 },
        },
        {
          name: '2',
          at_mm: { x: 5, y: 3.8 },
        },
      ],
      courtyard_mm: { x: 15, y: 15 },
    },
    choc_v1v2: {
      id: 'choc_v1v2',
      label: 'Kailh Choc v1/v2 combined PCB switch',
      mechanicalSide: 'top',
      // Accepts either switch: the v2 centre bore plus both peg patterns.
      mechanicalHoles: [
        {
          id: 'center',
          at_mm: { x: 0, y: 0 },
          diameter_mm: 5.05,
          kind: 'npth',
        },
        {
          id: 'peg_left',
          at_mm: { x: -5.5, y: 0 },
          diameter_mm: 1.9,
          kind: 'npth',
        },
        {
          id: 'peg_right',
          at_mm: { x: 5.5, y: 0 },
          diameter_mm: 1.9,
          kind: 'npth',
        },
        {
          id: 'peg_v2',
          at_mm: { x: -5, y: -5.15 },
          diameter_mm: 1.6,
          kind: 'npth',
        },
      ],
      contactPins: [
        {
          name: '1',
          at_mm: { x: 0, y: 5.9 },
        },
        {
          name: '2',
          at_mm: { x: 5, y: 3.8 },
        },
      ],
      courtyard_mm: { x: 15, y: 15 },
    },
  },
  sockets: {
    c41430893: {
      id: 'c41430893',
      label: 'HanElectricity CPG151101S11-16 / C41430893 MX hot-swap socket',
      footprintFamily: 'mx_hotswap',
      side: 'bottom',
      supplierPartNumber: 'C41430893',
      // Keep the reviewed local copper/hole geometry below so the supplier
      // courtyard cannot collide with the overlapping MX installation holes.
      // The supplier model is intentionally bound independently: adding only
      // supplierPartNumbers preserves BOM identity but does not load 3D data.
      cadModel: {
        objUrl: 'https://modules.easyeda.com/3dmodel/5c2d585f6c544fcf92e7ed163bda57d3',
        stepUrl:
          'https://modules.easyeda.com/qAxj6KHrDKw4blvCG8QJPs7Y/5c2d585f6c544fcf92e7ed163bda57d3',
        // Extracted from the same C41430893 EasyEDA supplier footprint. Layer
        // mirroring and socket placement/rotation remain owned by the chip.
        modelOriginPosition: { x: 0, y: 0, z: -0.0500024 },
      },
      compatibleSwitches: ['mx'],
      // Socket-local, physical top view with Y up. Contact 1 sits 2.54mm below
      // contact 2 so that after alignment the pair lands on the MX contact pins
      // at (-3.81, 2.54) and (2.54, 5.08); the pad-to-contact spans of
      // -3.54/+3.55mm are the C41430893 supplier dimensions.
      contactTargets: [
        {
          name: '1',
          at_mm: { x: -3.18, y: -1.27 },
        },
        {
          name: '2',
          at_mm: { x: 3.17, y: 1.27 },
        },
      ],
      smdPads: [
        {
          name: '1',
          at_mm: { x: -6.72, y: -1.27 },
          size_mm: { x: 2.55, y: 2.5 },
          shape: 'roundrect',
          cornerRadius_mm: 0.25,
        },
        {
          name: '2',
          at_mm: { x: 6.72, y: 1.27 },
          size_mm: { x: 2.55, y: 2.5 },
          shape: 'roundrect',
          cornerRadius_mm: 0.25,
        },
      ],
      holes: [
        {
          id: 'contact_1_clearance',
          at_mm: { x: -3.18, y: -1.27 },
          diameter_mm: 3.05,
          kind: 'npth',
        },
        {
          id: 'contact_2_clearance',
          at_mm: { x: 3.17, y: 1.27 },
          diameter_mm: 3.05,
          kind: 'npth',
        },
      ],
      body_mm: { x: 15.5, y: 6.5 },
      compatibleParts: [
        {
          lcscCode: 'C41430893',
          manufacturer: 'HanElectricity',
          mpn: 'CPG151101S11-16',
          evidenceUrl:
            'https://datasheet.lcsc.com/datasheet/pdf/d953a8b0b623247f3341ebcfbaa2e88f.pdf?productCode=C41430893',
          notes:
            'C41430893 socket holes are aligned to Cherry MX contact-pin centers; supplier KiCad footprint name SMD_KEYBOARD-SW.',
        },
      ],
      sources: [
        {
          type: 'datasheet',
          title: 'HanElectricity CPG151101S11-16 (C41430893) recommended PCB layout',
          url: 'https://datasheet.lcsc.com/datasheet/pdf/d953a8b0b623247f3341ebcfbaa2e88f.pdf?productCode=C41430893',
        },
        {
          type: 'vendor_page',
          title: 'LCSC C41430893 HanElectricity CPG151101S11-16',
          url: 'https://item.szlcsc.com/43288200.html',
        },
      ],
    },
    kailh_mx: {
      id: 'kailh_mx',
      label: 'Kailh CPG151101S11 MX hot-swap socket',
      footprintFamily: 'mx_hotswap',
      side: 'bottom',
      compatibleSwitches: ['mx'],
      // Kailh's own geometry, taken from kiswitch SW_Hotswap_Kailh_MX_1.00u and
      // re-origined onto the pad centroid: the -3.275/+3.302mm pad-to-contact
      // spans there differ slightly from the C41430893 clone's.
      contactTargets: [
        {
          name: '1',
          at_mm: { x: -3.1885, y: -1.27 },
        },
        {
          name: '2',
          at_mm: { x: 3.1615, y: 1.27 },
        },
      ],
      smdPads: [
        {
          name: '1',
          at_mm: { x: -6.4635, y: -1.27 },
          size_mm: { x: 2.55, y: 2.5 },
          shape: 'roundrect',
          cornerRadius_mm: 0.25,
        },
        {
          name: '2',
          at_mm: { x: 6.4635, y: 1.27 },
          size_mm: { x: 2.55, y: 2.5 },
          shape: 'roundrect',
          cornerRadius_mm: 0.25,
        },
      ],
      holes: [
        {
          id: 'contact_1_clearance',
          at_mm: { x: -3.1885, y: -1.27 },
          diameter_mm: 3.05,
          kind: 'npth',
        },
        {
          id: 'contact_2_clearance',
          at_mm: { x: 3.1615, y: 1.27 },
          diameter_mm: 3.05,
          kind: 'npth',
        },
      ],
      body_mm: { x: 15.5, y: 6.5 },
      compatibleParts: [
        {
          lcscCode: 'C5184526',
          manufacturer: 'Kailh / Kaihua',
          mpn: 'CPG151101S11',
          evidenceUrl:
            'http://www.kailh.com/product/Ms/rcb/CPG151101S11-2%20Cream%20hot%20swap%20socket.pdf',
          notes: 'Primary Kailh MX hot-swap socket reference geometry.',
        },
      ],
      sources: [
        {
          type: 'datasheet',
          title: 'Kailh CPG151101S11 MX hot-swap socket datasheet',
          url: 'https://github.com/keyboardio/keyswitch_documentation/blob/master/datasheets/Kailh/CPG151101S11_MX_Socket.pdf',
        },
      ],
    },
    kailh_choc_v1: {
      id: 'kailh_choc_v1',
      label: 'Kailh CPG135001S30 Choc v1 hot-swap socket',
      footprintFamily: 'choc_v1_hotswap',
      side: 'bottom',
      compatibleSwitches: ['choc_v1', 'choc_v2', 'choc_v1v2'],
      // One socket serves all three Choc plate patterns: kiswitch places the
      // same pads and clearance holes in V1, V2 and V1V2, only the switch-side
      // centre bore and pegs differ. Origin is the switch centre, so alignment
      // resolves to a zero offset.
      contactTargets: [
        {
          name: '1',
          at_mm: { x: 0, y: 5.9 },
        },
        {
          name: '2',
          at_mm: { x: 5, y: 3.8 },
        },
      ],
      smdPads: [
        {
          name: '1',
          at_mm: { x: -3.5, y: 6 },
          size_mm: { x: 2.55, y: 2.5 },
          shape: 'roundrect',
          cornerRadius_mm: 0.25,
        },
        {
          name: '2',
          at_mm: { x: 8.5, y: 3.8 },
          size_mm: { x: 2.55, y: 2.5 },
          shape: 'roundrect',
          cornerRadius_mm: 0.25,
        },
      ],
      holes: [
        {
          id: 'contact_1_clearance',
          at_mm: { x: 0, y: 5.9 },
          diameter_mm: 3.05,
          kind: 'npth',
        },
        {
          id: 'contact_2_clearance',
          at_mm: { x: 5, y: 3.8 },
          diameter_mm: 3.05,
          kind: 'npth',
        },
      ],
      body_mm: { x: 17.5, y: 6.5 },
      compatibleParts: [
        {
          lcscCode: 'C965556',
          manufacturer: 'Kailh / Kaihua',
          mpn: 'CPG135001S30',
          evidenceUrl: 'https://cdn-shop.adafruit.com/product-files/5118/5118-Choc-Socket.pdf',
          notes: 'Primary Kailh Choc v1 hot-swap socket reference geometry.',
        },
      ],
      sources: [
        {
          type: 'datasheet',
          title: 'Kailh CPG135001S30 Choc v1 hot-swap socket product specification',
          url: 'https://cdn-shop.adafruit.com/product-files/5118/5118-Choc-Socket.pdf',
        },
      ],
    },
  },
  sourceRefs: [
    {
      type: 'datasheet',
      title:
        'Cherry MX Series keyswitch datasheet - Circuit Board Layouts for PCB mount with fixation pins',
      url: 'https://cdn.sparkfun.com/datasheets/Components/Switches/MX%20Series.pdf',
    },
    {
      type: 'reference_footprint',
      title:
        'kiswitch SW_Hotswap_Kailh_MX_1.00u — pin, peg, centre-bore and socket-pad coordinates, Y negated from KiCad Y-down into this file physical top view',
      url: 'https://github.com/kiswitch/kiswitch/blob/main/library/footprints/Switch_Keyboard_Hotswap_Kailh.pretty/SW_Hotswap_Kailh_MX_1.00u.kicad_mod',
    },
    {
      type: 'reference_footprint',
      title:
        'kiswitch SW_Hotswap_Kailh_Choc_V1/V2/V1V2_1.00u — the three Choc plate patterns behind the choc_v1, choc_v2 and choc_v1v2 switch profiles',
      url: 'https://github.com/kiswitch/kiswitch/tree/main/library/footprints/Switch_Keyboard_Hotswap_Kailh.pretty',
    },
  ],
  examples: [
    '<HotSwapKeySwitch name="KEY1" switch="mx" socket="c41430893" connections={{ "1": "net.ROW0", "2": "net.COL0" }} />',
    '<HotSwapKeySwitch name="KEY1" switch="choc_v1" socket="kailh_choc_v1" connections={{ "1": "net.ROW0", "2": "net.COL0" }} />',
    '<HotSwapKeySwitch name="KEY1" switch="choc_v1v2" socket="kailh_choc_v1" connections={{ "1": "net.ROW0", "2": "net.COL0" }} />',
  ],
} as const;

export const keySwitchFootprintFamilies = [
  {
    id: 'mx_hotswap',
    label: 'MX hot-swap socket',
    geometryStatus: 'community_verified',
    origin: 'switch_center',
    variants: ['default'],
    orientations: ['south', 'north'],
    mechanical: {
      side: 'top',
      variants: {
        default: {
          holes: hotSwapKeySwitchTemplate.switches.mx.mechanicalHoles,
          courtyard_mm: hotSwapKeySwitchTemplate.switches.mx.courtyard_mm,
        },
      },
    },
    socket: {
      side: 'bottom',
      smdPads: hotSwapKeySwitchTemplate.sockets.c41430893.smdPads,
      holes: hotSwapKeySwitchTemplate.sockets.c41430893.holes,
      body_mm: hotSwapKeySwitchTemplate.sockets.c41430893.body_mm,
    },
    compatibleParts: [
      ...hotSwapKeySwitchTemplate.sockets.c41430893.compatibleParts,
      ...hotSwapKeySwitchTemplate.sockets.kailh_mx.compatibleParts,
    ],
    sources: [
      ...hotSwapKeySwitchTemplate.sourceRefs,
      ...hotSwapKeySwitchTemplate.sockets.c41430893.sources,
      ...hotSwapKeySwitchTemplate.sockets.kailh_mx.sources,
    ],
  },
  {
    id: 'choc_v1_hotswap',
    label: 'Kailh Choc hot-swap socket',
    geometryStatus: 'community_verified',
    origin: 'switch_center',
    variants: ['choc_v1', 'choc_v2', 'choc_v1v2'],
    orientations: ['south', 'north'],
    mechanical: {
      side: 'top',
      variants: {
        choc_v1: {
          holes: hotSwapKeySwitchTemplate.switches.choc_v1.mechanicalHoles,
          courtyard_mm: hotSwapKeySwitchTemplate.switches.choc_v1.courtyard_mm,
        },
        choc_v2: {
          holes: hotSwapKeySwitchTemplate.switches.choc_v2.mechanicalHoles,
          courtyard_mm: hotSwapKeySwitchTemplate.switches.choc_v2.courtyard_mm,
        },
        choc_v1v2: {
          holes: hotSwapKeySwitchTemplate.switches.choc_v1v2.mechanicalHoles,
          courtyard_mm: hotSwapKeySwitchTemplate.switches.choc_v1v2.courtyard_mm,
        },
      },
    },
    socket: {
      side: 'bottom',
      smdPads: hotSwapKeySwitchTemplate.sockets.kailh_choc_v1.smdPads,
      holes: hotSwapKeySwitchTemplate.sockets.kailh_choc_v1.holes,
      body_mm: hotSwapKeySwitchTemplate.sockets.kailh_choc_v1.body_mm,
    },
    compatibleParts: hotSwapKeySwitchTemplate.sockets.kailh_choc_v1.compatibleParts,
    sources: hotSwapKeySwitchTemplate.sockets.kailh_choc_v1.sources,
  },
] as const;

type SwitchId = keyof typeof hotSwapKeySwitchTemplate.switches;
type SocketId = keyof typeof hotSwapKeySwitchTemplate.sockets;

type CommonProps = {
  name: string;
  orientation?: Orientation;
  pcbX?: number | string;
  pcbY?: number | string;
  pcbRotation?: number | string;
  connections?: Record<string, string>;
};

export type HotSwapKeySwitchProps = CommonProps &
  (
    | {
        switch: 'mx';
        socket: 'c41430893' | 'kailh_mx';
      }
    | {
        switch: 'choc_v1' | 'choc_v2' | 'choc_v1v2';
        socket: 'kailh_choc_v1';
      }
  );

export type KeySwitchProps = CommonProps & {
  family: 'mx_hotswap' | 'choc_v1_hotswap';
  variant?: 'default' | 'choc_v1' | 'choc_v2' | 'choc_v1v2';
  socketOrientation?: Orientation;
};

function mm(value: number): string {
  return `${value}mm`;
}

function rotatePoint(point: PointMm, orientation: Orientation): PointMm {
  if (orientation === 'south') return point;
  return { x: -point.x, y: -point.y };
}

function toLayerLocalPoint(point: PointMm, layer: Side): PointMm {
  // tscircuit mirrors footprint-local X when a chip is placed on the bottom
  // layer. Library coordinates are physical top-view coordinates, so
  // pre-compensate X here to preserve the reviewed geometry after export.
  //
  // Both primitive kinds get the same treatment, and the round trip is a net
  // identity: measured against the 2026-07-29 mechanical_integration release,
  // every bottom-side pad and hole came out of the Gerber and drill files at
  // exactly the coordinates written here.
  return layer === 'bottom' ? { x: -point.x, y: point.y } : point;
}

function rotatePointDegrees(point: PointMm, degrees: number): PointMm {
  if (degrees === 0) return point;
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function rotationDegrees(value: number | string | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(?:deg)?$/i);
  return match ? Number(match[1]) : 0;
}

function numericMm(value: number | string | undefined): number | undefined {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(?:mm)?$/i);
  return match ? Number(match[1]) : undefined;
}

function addMm(value: number | string | undefined, deltaMm: number, axis: 'pcbX' | 'pcbY') {
  if (Math.abs(deltaMm) < 0.000001) return value ?? 0;
  const parsed = numericMm(value);
  if (parsed === undefined) {
    throw new Error(
      `HotSwapKeySwitch socket alignment requires numeric ${axis}; received ${String(value)}`,
    );
  }
  return parsed + deltaMm;
}

function renderHole(hole: HoleSpec, key: string) {
  return (
    <hole
      key={key}
      name={hole.id}
      pcbX={mm(hole.at_mm.x)}
      pcbY={mm(hole.at_mm.y)}
      diameter={mm(hole.diameter_mm)}
    />
  );
}

function renderSmdPad(pad: SmdPadSpec, layer: Side, key: string) {
  const cornerRadius =
    pad.shape === 'roundrect' && pad.cornerRadius_mm !== undefined
      ? { cornerRadius: mm(pad.cornerRadius_mm) }
      : {};
  return (
    <smtpad
      key={key}
      pcbX={mm(pad.at_mm.x)}
      pcbY={mm(pad.at_mm.y)}
      layer={layer}
      shape={pad.shape === 'roundrect' ? 'rect' : pad.shape}
      width={mm(pad.size_mm.x)}
      height={mm(pad.size_mm.y)}
      portHints={[pad.name]}
      {...cornerRadius}
    />
  );
}

function sanitizeName(value: string): string {
  return value.replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
}

function assertCompatible(switchId: SwitchId, socketId: SocketId): void {
  const socket = hotSwapKeySwitchTemplate.sockets[socketId] as SocketProfile;
  if (!socket.compatibleSwitches.includes(switchId)) {
    throw new Error(
      `HotSwapKeySwitch socket ${socketId} is not compatible with switch ${switchId}`,
    );
  }
}

function contactMap(points: readonly ContactPointSpec[]): Map<string, PointMm> {
  return new Map(points.map((point) => [point.name, point.at_mm]));
}

function socketOriginOffset(input: {
  switchProfile: SwitchProfile;
  socketProfile: SocketProfile;
  orientation: Orientation;
}): PointMm {
  const switchContacts = contactMap(
    input.switchProfile.contactPins.map((point) => ({
      ...point,
      at_mm: rotatePoint(point.at_mm, input.orientation),
    })),
  );
  const socketTargets = input.socketProfile.contactTargets.map((point) => ({
    ...point,
    at_mm: rotatePoint(point.at_mm, input.orientation),
  }));
  const offsets = socketTargets.map((target) => {
    const switchContact = switchContacts.get(target.name);
    if (!switchContact) {
      throw new Error(
        `HotSwapKeySwitch ${input.switchProfile.id}/${input.socketProfile.id} missing switch contact ${target.name}`,
      );
    }
    // Alignment is calculated in physical top-view coordinates. Layer-local
    // mirroring is applied only when rendering the socket footprint.
    return {
      x: switchContact.x - target.at_mm.x,
      y: switchContact.y - target.at_mm.y,
    };
  });
  const first = offsets[0];
  if (!first) return { x: 0, y: 0 };
  for (const offset of offsets.slice(1)) {
    const error = Math.hypot(offset.x - first.x, offset.y - first.y);
    if (error > 0.01) {
      throw new Error(
        `HotSwapKeySwitch ${input.switchProfile.id}/${input.socketProfile.id} cannot align all switch contacts; error ${error.toFixed(
          3,
        )}mm`,
      );
    }
  }
  return first;
}

function mechanicalFootprint(switchProfile: SwitchProfile, orientation: Orientation) {
  return (
    <footprint>
      {switchProfile.mechanicalHoles.map((hole) =>
        renderHole(
          {
            ...hole,
            at_mm: rotatePoint(hole.at_mm, orientation),
          },
          `${switchProfile.id}-mech-${hole.id}`,
        ),
      )}
    </footprint>
  );
}

function socketFootprint(socketProfile: SocketProfile, orientation: Orientation) {
  if (socketProfile.supplierFootprint) {
    return socketProfile.supplierFootprint;
  }
  return (
    <footprint>
      {socketProfile.smdPads.map((pad) =>
        renderSmdPad(
          {
            ...pad,
            at_mm: toLayerLocalPoint(rotatePoint(pad.at_mm, orientation), socketProfile.side),
          },
          socketProfile.side,
          `${socketProfile.id}-socket-${pad.name}`,
        ),
      )}
      {socketProfile.holes.map((hole) =>
        renderHole(
          {
            ...hole,
            at_mm: toLayerLocalPoint(rotatePoint(hole.at_mm, orientation), socketProfile.side),
          },
          `${socketProfile.id}-socket-${hole.id}`,
        ),
      )}
    </footprint>
  );
}

function socketRotation(
  socketProfile: SocketProfile,
  orientation: Orientation,
  pcbRotation: number | string | undefined,
) {
  const baseRotation = rotationDegrees(pcbRotation);
  if (!socketProfile.supplierFootprint) {
    return pcbRotation ?? 0;
  }
  return baseRotation + (orientation === 'north' ? 180 : 0);
}

function socketSupplierProps(socketProfile: SocketProfile) {
  return socketProfile.supplierPartNumber
    ? { supplierPartNumbers: { jlcpcb: [socketProfile.supplierPartNumber] } }
    : {};
}

function socketCadModelProps(socketProfile: SocketProfile, orientation: Orientation) {
  if (!socketProfile.cadModel) return {};
  return {
    cadModel: {
      ...socketProfile.cadModel,
      // Local footprint primitives are rotated directly for north-facing
      // sockets, while the independently bound model needs the same offset.
      // The chip layer still owns the automatic bottom-side flip.
      pcbRotationOffset: orientation === 'north' ? 180 : 0,
    },
  };
}

export function HotSwapKeySwitch(props: HotSwapKeySwitchProps) {
  assertCompatible(props.switch, props.socket);
  const switchProfile = hotSwapKeySwitchTemplate.switches[props.switch] as SwitchProfile;
  const socketProfile = hotSwapKeySwitchTemplate.sockets[props.socket] as SocketProfile;
  const orientation = props.orientation ?? 'south';
  const baseName = sanitizeName(props.name);
  const mechanicalName = baseName.startsWith('SW_') ? baseName : `SW_${baseName}`;
  const socketName = baseName.startsWith('HS_') ? baseName : `HS_${baseName}`;
  const sharedPlacement = {
    pcbX: props.pcbX ?? 0,
    pcbY: props.pcbY ?? 0,
    pcbRotation: props.pcbRotation ?? 0,
  };
  const offset = rotatePointDegrees(
    socketOriginOffset({ switchProfile, socketProfile, orientation }),
    rotationDegrees(props.pcbRotation),
  );
  const socketPlacement = {
    pcbX: addMm(props.pcbX, offset.x, 'pcbX'),
    pcbY: addMm(props.pcbY, offset.y, 'pcbY'),
    pcbRotation: socketRotation(socketProfile, orientation, props.pcbRotation),
  };

  return (
    <>
      <chip
        name={mechanicalName}
        layer={switchProfile.mechanicalSide}
        {...sharedPlacement}
        footprint={mechanicalFootprint(switchProfile, orientation)}
      />
      <chip
        name={socketName}
        layer={socketProfile.side}
        {...socketPlacement}
        footprint={socketFootprint(socketProfile, orientation)}
        {...socketSupplierProps(socketProfile)}
        {...socketCadModelProps(socketProfile, orientation)}
        connections={props.connections ?? {}}
      />
    </>
  );
}

export function KeySwitch(props: KeySwitchProps) {
  const nextProps: HotSwapKeySwitchProps =
    props.family === 'mx_hotswap'
      ? {
          ...props,
          switch: 'mx',
          socket: 'c41430893',
          orientation: props.socketOrientation ?? props.orientation,
        }
      : {
          ...props,
          // The Choc variant names the plate pattern the switch needs; the
          // socket is the same part in every case.
          switch: props.variant === 'default' || props.variant === undefined
            ? 'choc_v1'
            : props.variant,
          socket: 'kailh_choc_v1',
          orientation: props.socketOrientation ?? props.orientation,
        };
  return <HotSwapKeySwitch {...nextProps} />;
}

export function listFootprintTemplates() {
  return [
    {
      id: hotSwapKeySwitchTemplate.id,
      component: hotSwapKeySwitchTemplate.component,
      importPath: hotSwapKeySwitchTemplate.importPath,
      description: hotSwapKeySwitchTemplate.description,
      examples: hotSwapKeySwitchTemplate.examples,
      combinations: Object.values(hotSwapKeySwitchTemplate.sockets).flatMap((socket) =>
        socket.compatibleSwitches.map((switchId) => ({
          switch: switchId,
          socket: socket.id,
          footprintFamily: socket.footprintFamily,
          compatibleParts: socket.compatibleParts.map((part) => ({
            lcscCode: part.lcscCode,
            manufacturer: part.manufacturer,
            mpn: part.mpn,
          })),
        })),
      ),
    },
  ];
}
