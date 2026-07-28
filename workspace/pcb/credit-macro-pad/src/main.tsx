import {
  analog,
  board,
  debug,
  display,
  displaySupport,
  keyCenters,
  microphone,
  sides,
  xiao,
} from "./layout";
import {
  boardPropsFromRules,
  groundPourPropsFromRules,
  keepoutPropsFromRules,
  netPropsFor,
  pcbRules,
} from "./lib/replicator-pcb";
import { XiaoEsp32S3 } from "./lib/footprints/index";
import { HotSwapKeySwitch } from "./components/ExactC41430893HotSwapKeySwitch";
import {
  ExactSFV8R2STE1HLFFootprint,
  SFV8R_2STE1HLF_CAD_MODEL,
} from "./components/ExactSFV8R2STE1HLF";

const smtSide = sides.smtAssembly;
// Explicit 50 µm mask relief is retained on every project-owned SMT land.
const SMT_MASK_MARGIN = "0.05mm";

// Explicit production footprints keep the land geometry stable while adding
// the positive mask expansion required by the fabricator.  The 0402 geometry
// matches the already-qualified local C3/C5 lands.  The 1206 geometry follows
// the UniOhm C17946 datasheet page 5 recommendation: A=2.0, B=1.1, C=1.6,
// D=4.2 mm, giving 1.1 x 1.6 mm lands on 3.1 mm centers.
const Footprint0402 = () => (
  <footprint>
    <smtpad portHints={["pin1"]} pcbX={-0.51} pcbY={0} width="0.54mm" height="0.64mm" shape="rect" solderMaskMargin={SMT_MASK_MARGIN} />
    <smtpad portHints={["pin2"]} pcbX={0.51} pcbY={0} width="0.54mm" height="0.64mm" shape="rect" solderMaskMargin={SMT_MASK_MARGIN} />
  </footprint>
);

const Footprint1206C17946 = () => (
  <footprint>
    <smtpad portHints={["pin1"]} pcbX={-1.55} pcbY={0} width="1.1mm" height="1.6mm" shape="rect" solderMaskMargin={SMT_MASK_MARGIN} />
    <smtpad portHints={["pin2"]} pcbX={1.55} pcbY={0} width="1.1mm" height="1.6mm" shape="rect" solderMaskMargin={SMT_MASK_MARGIN} />
  </footprint>
);

// Verified bottom-side transform for the bundled XIAO ESP32S3 v2 model.
// The library model/footprint defines USB at local +Y.  With tscircuit's
// bottom-side mirror followed by 270 degrees of board rotation, the final USB
// connector center lies at board +X, matching the right-edge opening intent.
const XIAO_BOTTOM_USB_RIGHT_ROTATION_DEG = 270;

const PcbRuleElements = () => (
  <>
    {Object.keys(pcbRules.nets).map((netName) => (
      <net key={netName} name={netName} {...netPropsFor(netName)} />
    ))}
    {groundPourPropsFromRules().map((pour) => (
      <copperpour key={pour.name} {...pour} />
    ))}
    {keepoutPropsFromRules().map((keepout) => (
      <keepout key={keepout.name} {...keepout} />
    ))}
  </>
);

const R0402 = ({
  name,
  value,
  lcsc,
  x,
  y,
  a,
  b,
}: {
  name: string;
  value: string;
  lcsc: string;
  x: number;
  y: number;
  a: string;
  b: string;
}) => (
  <resistor
    name={name}
    resistance={value}
    footprint={<Footprint0402 />}
    supplierPartNumbers={{ jlcpcb: [lcsc] }}
    layer={smtSide}
    pcbX={x}
    pcbY={y}
    connections={{ pin1: a, pin2: b }}
  />
);

const C0402 = ({
  name,
  value,
  lcsc,
  x,
  y,
  a,
  b,
}: {
  name: string;
  value: string;
  lcsc: string;
  x: number;
  y: number;
  a: string;
  b: string;
}) => (
  <capacitor
    name={name}
    capacitance={value}
    footprint={<Footprint0402 />}
    supplierPartNumbers={{ jlcpcb: [lcsc] }}
    layer={smtSide}
    pcbX={x}
    pcbY={y}
    connections={{ pin1: a, pin2: b }}
  />
);

const ThroughHoleTestPoint = ({
  name,
  x,
  y,
  net,
}: {
  name: string;
  x: number;
  y: number;
  net: string;
}) => (
  <chip
    name={name}
    displayName={`${name} plated probe point`}
    pcbX={x}
    pcbY={y}
    pinLabels={{ pin1: name }}
    connections={{ pin1: net }}
    footprint={
      <footprint>
        <platedhole
          portHints={["pin1"]}
          shape="circle"
          outerDiameter="1.2mm"
          holeDiameter="0.6mm"
          solderMaskMargin="0.05mm"
        />
        <silkscreencircle pcbX={0} pcbY={0} radius="0.85mm" strokeWidth="0.15mm" />
        <silkscreentext text={name.replace("TP_", "")} pcbX={0} pcbY={1.45} fontSize="0.65mm" />
      </footprint>
    }
  />
);

const DisplayEnvelope = () => (
  <chip
    name="DS1"
    displayName="LT225C7-C08-03 LCD (mechanical envelope)"
    manufacturerPartNumber="LT225C7-C08-03"
    layer={display.side}
    pcbX={display.center.x}
    pcbY={display.center.y}
    footprint={
      <footprint>
        <silkscreenrect
          pcbX={0}
          pcbY={0}
          width={`${display.body.widthMm}mm`}
          height={`${display.body.heightMm}mm`}
          strokeWidth="0.15mm"
        />
        <silkscreenrect
          pcbX={0}
          pcbY={0}
          width={`${display.active.widthMm}mm`}
          height={`${display.active.heightMm}mm`}
          strokeWidth="0.15mm"
        />
        <silkscreentext text="LCD / FRONT-CONTACT FPC WRAPS LEFT TO BACK" pcbX={0} pcbY={0} fontSize="0.8mm" />
        {/* DS1 is a top-side mechanical envelope intentionally stacked above
            the bottom-side castellated XIAO region. Its exact body and active
            outlines remain visible; a KiCad courtyard would incorrectly treat
            the carrier's registration holes as same-side component intrusion. */}
      </footprint>
    }
  />
);

const KeySwitch = ({ name, index }: { name: string; index: number }) => {
  const p = keyCenters[index];
  return (
    <HotSwapKeySwitch
      name={`KEY${index + 1}`}
      switch="mx"
      socket="c41430893"
      orientation="south"
      pcbX={p.x}
      pcbY={p.y}
      connections={{ "1": `net.KEY${index + 1}`, "2": "net.GROUND" }}
    />
  );
};

export default () => (
  <board
    width={board.width}
    height={board.height}
    thickness="1.5mm"
    center_x={0}
    center_y={0}
    {...boardPropsFromRules()}
  >
    <PcbRuleElements />

    {/* Source-owned fabrication callout carried into fabrication documentation. */}
    <fabricationnotetext
      text="2-layer FR-4, 1 oz copper, finished board 1.5 +/-0.1 mm"
      pcbX={-39}
      pcbY={-22.0}
      fontSize="0.65mm"
      anchorAlignment="bottom_left"
    />

    {/* User-facing side: LCD envelope plus removable MX switches. Bottom sockets
        use the exact C41430893 supplier footprint so chirality is owned once. */}
    <DisplayEnvelope />
    {["KEY1", "KEY2", "KEY3", "KEY4"].map((name, index) => (
      <KeySwitch key={name} name={name} index={index} />
    ))}

    {/* Back-side-only SMT assembly policy requested by the user. */}
    <XiaoEsp32S3
      name="U1"
      mounting="direct_castellated_hand_solder"
      layer={xiao.side}
      pcbX={xiao.x}
      pcbY={xiao.y}
      pcbRotation={XIAO_BOTTOM_USB_RIGHT_ROTATION_DEG}
      connections={{
        D0: "net.KEY1",
        // Swap the two fully firmware-selectable functions so their fan-outs
        // leave U1 without crossing at the bottom-side castellated row.
        D1: "net.LCD_SCK",
        D2: "net.KEY3",
        D3: "net.KEY4",
        D4: "net.LCD_MOSI",
        D5: "net.KEY2",
        D6: "net.LCD_CS_N",
        D7: "net.DISP_DC",
        D8: "net.MIC_ADC",
        D9: "net.SPARE_D9",
        D10: "net.SPARE_D10",
        VBUS: "net.VBUS",
        GND: "net.GROUND",
        V3V3: "net.VDD3V3",
      }}
    />

    {/* Exact supplier-footprint readback after bottom-side mirroring and 90°
        rotation: J1 pin 1 is the +Y end of the 8-pad row, pin 8 is the -Y end,
        and the top-contact cable opening faces the left/-X board edge. */}
    <chip
      name="J1"
      displayName="Amphenol SFV8R-2STE1HLF top-contact FPC"
      manufacturerPartNumber="SFV8R-2STE1HLF"
      supplierPartNumbers={{ jlcpcb: ["C2992524"] }}
      footprint={<ExactSFV8R2STE1HLFFootprint />}
      cadModel={SFV8R_2STE1HLF_CAD_MODEL}
      layer={smtSide}
      pcbX={display.fpc.x}
      pcbY={display.fpc.y}
      pcbRotation={display.fpc.rotationDeg}
      pinLabels={{
        pin1: "LEDA",
        pin2: "GND",
        pin3: "RESET_N",
        pin4: "D_C",
        pin5: "SDA_MOSI",
        pin6: "SCL",
        pin7: "VDD_3V3",
        pin8: "CS_N",
      }}
      connections={{
        pin1: "net.LCD_LEDA",
        pin2: "net.GROUND",
        pin3: "net.LCD_RESET_N",
        pin4: "net.DISP_DC",
        pin5: "net.LCD_MOSI",
        pin6: "net.LCD_SCK",
        pin7: "net.DISP_VDD",
        pin8: "net.LCD_CS_N",
      }}
    />

    {/* Fabrication feature, not a fitted part: an ordinary off-land GND via.
        The router owns the copper path from J1 pin 2 to this drill; no SMD-pad
        helper is used, so the assembly stencil contains no escape aperture. */}
    <chip
      name="J1_GND_ESCAPE"
      displayName="J1 pin-2 GND fabrication escape"
      layer={smtSide}
      pcbX={-34.45}
      pcbY={14.25}
      pinLabels={{ pin1: "GND" }}
      connections={{ pin1: "net.GROUND" }}

      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            connectsTo="net.GROUND"
            pcbX={0.55}
            pcbY={2.25}
            shape="circle"
            outerDiameter="0.6mm"
            holeDiameter="0.3mm"
          />
          <silkscreenline x1={-0.8} y1={-0.35} x2={0.8} y2={-0.35} strokeWidth="0.15mm" />
          <silkscreentext text="G" pcbX={0.5} pcbY={-0.7} fontSize="0.6mm" />
        </footprint>
      }
    />

    {/* Fabrication feature, not a fitted part: one source-owned GND stitching
        via ties the F.Cu and B.Cu ground pours together. The location is in the
        unobstructed lower inter-key corridor, more than 2 mm from routed
        signal copper and 2.89 mm from the board edge. */}
    <chip
      name="GND_STITCH"
      displayName="GND stitching via"
      layer={smtSide}
      pcbX={-3.4}
      pcbY={-22.0}
      pinLabels={{ pin1: "GND" }}
      connections={{ pin1: "net.GROUND" }}
      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            connectsTo="net.GROUND"
            pcbX={0}
            pcbY={0}
            shape="circle"
            outerDiameter="0.6mm"
            holeDiameter="0.3mm"
          />
        </footprint>
      }
    />

    {/* Ordinary off-land C3/C4 ground vias. Freerouting owns both copper
        connections; the via-only footprints cannot create paste apertures. */}
    <chip
      name="C3_GND_ESCAPE"
      displayName="C3 GND fabrication escape"
      layer={smtSide}
      pcbX={-26.51}
      pcbY={20.0}
      pinLabels={{ pin1: "GND" }}
      connections={{ pin1: "net.GROUND" }}
      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            connectsTo="net.GROUND"
            pcbX={1.09}
            pcbY={-0.2}
            shape="circle"
            outerDiameter="0.6mm"
            holeDiameter="0.3mm"
          />
        </footprint>
      }
    />

    <chip
      name="C4_GND_ESCAPE"
      displayName="C4 GND fabrication escape"
      layer={smtSide}
      pcbX={-25.99}
      pcbY={17.0}
      pinLabels={{ pin1: "GND" }}
      connections={{ pin1: "net.GROUND" }}
      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            connectsTo="net.GROUND"
            pcbX={-1.19}
            pcbY={1.0}
            shape="circle"
            outerDiameter="0.6mm"
            holeDiameter="0.3mm"
          />
        </footprint>
      }
    />

    {/* Ordinary off-land LCD_VDD via. Freerouting owns the short connection
        from J1 pin 7; no trace-like SMD helper or stencil aperture is emitted. */}
    <chip
      name="J1_VDD_ESCAPE"
      displayName="J1 pin-7 LCD_VDD fabrication escape"
      layer={smtSide}
      pcbX={-34.45}
      pcbY={11.75}
      pinLabels={{ pin1: "LCD_VDD" }}
      connections={{ pin1: "net.DISP_VDD" }}
      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            connectsTo="net.DISP_VDD"
            pcbX={0.55}
            pcbY={-2.25}
            shape="circle"
            outerDiameter="0.6mm"
            holeDiameter="0.3mm"
          />
          <silkscreenline x1={-0.8} y1={0.35} x2={0.8} y2={0.35} strokeWidth="0.15mm" />
          <silkscreentext text="V" pcbX={0.5} pcbY={0.7} fontSize="0.6mm" />
        </footprint>
      }
    />
    {/* C481302/ZTS6216 is top-ported per datasheet DS-1.4 pages 1 and 6.
        Both ground pads are bound explicitly; no carrier acoustic drill.
        MIC1 must be populated in the qualified primary SMT reflow process;
        the assembly note requires temporary port-protection film, post-reflow
        AOI, and an acoustic response test after cleaning-free assembly. */}
    <chip
      name="MIC1"
      displayName="ZILLTEK ZTS6216"
      manufacturerPartNumber="ZTS6216"
      supplierPartNumbers={{ jlcpcb: ["C481302"] }}
      footprint="jlcpcb:C481302"
      layer={smtSide}
      pcbX={microphone.x}
      pcbY={microphone.y}
      pinLabels={{ pin1: "OUT", pin2: "GND1", pin3: "GND2", pin4: "VDD" }}
      connections={{
        pin1: "net.MIC_RAW",
        pin2: "net.GROUND",
        pin3: "net.GROUND",
        pin4: "net.VDD3V3",
      }}
    />

    {/* MIC1 pin-3 uses an ordinary off-body GND via. Freerouting owns the
        copper neck; this source feature contributes no B.Paste aperture. */}
    <chip
      name="MIC1_GND_ESCAPE"
      displayName="MIC1 GND fabrication escape"
      layer={smtSide}
      pcbX={35.974982}
      pcbY={21.505019}
      pinLabels={{ pin1: "GND" }}
      connections={{ pin1: "net.GROUND" }}
      footprint={
        <footprint>
          <platedhole portHints={["pin1"]} connectsTo="net.GROUND" pcbX={0.974982} pcbY={-1.005019} shape="circle" outerDiameter="0.6mm" holeDiameter="0.3mm" />
        </footprint>
      }
    />

    <chip
      name="U2"
      displayName="TLV9061IDBVR"
      manufacturerPartNumber="TLV9061IDBVR"
      supplierPartNumbers={{ jlcpcb: ["C398358"] }}
      // Bind the exact JLC assembler-library footprint rather than a local
      // SOT-23 transcription.  The native supplier orientation identifies
      // pad 1, and the bottom-side 0-degree CPL rotation is therefore tied to
      // the same C398358 library geometry used by the assembler.
      footprint="jlcpcb:C398358"
      layer={smtSide}
      pcbX={analog.opamp.x}
      pcbY={analog.opamp.y}
      pcbRotation={0}
      pinLabels={{ pin1: "OUT", pin2: "VSS", pin3: "IN_P", pin4: "IN_N", pin5: "VDD" }}
      connections={{
        pin1: "net.MIC_AMP",
        pin2: "net.GROUND",
        pin3: "net.MIC_AC",
        pin4: "net.MIC_FB",
        pin5: "net.VDD3V3",
      }}
    />

    <C0402 name="C1" value="100nF" lcsc="C1525" x={analog.micDecoupling.x} y={analog.micDecoupling.y} a="net.VDD3V3" b="net.GROUND" />
    <C0402 name="C2" value="100nF" lcsc="C1525" x={analog.opampDecoupling.x} y={analog.opampDecoupling.y} a="net.VDD3V3" b="net.GROUND" />
    {/* C3 stays in the proven reset-routing position. Both lands are undrilled;
        any GND layer transition must use ordinary off-land copper and a
        0.6/0.3 mm via. */}
    <capacitor
      name="C3"
      capacitance="100nF"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      layer={smtSide}
      pcbX={displaySupport.resetRow[1].x}
      pcbY={displaySupport.resetRow[1].y}
      connections={{ pin1: "net.LCD_RESET_N", pin2: "net.GROUND" }}
      footprint={
        <footprint>
<smtpad portHints={["pin1"]} pcbX={-0.51} pcbY={0} width="0.54mm" height="0.64mm" shape="rect" solderMaskMargin={SMT_MASK_MARGIN} />
<smtpad portHints={["pin2"]} pcbX={0.51} pcbY={0} width="0.54mm" height="0.64mm" shape="rect" solderMaskMargin={SMT_MASK_MARGIN} />
          <silkscreenrect pcbX={0} pcbY={0} width="1.56mm" height="0.8mm" strokeWidth="0.12mm" />
          <silkscreencircle pcbX={-0.68} pcbY={0.55} radius="0.12mm" />
        </footprint>
      }
    />
    {/* Dedicated display-rail bypass: place directly beside J1 pin 7 so the
        high-frequency LCD_VDD current returns locally through J1 pin 2/GND. */}
    <C0402 name="C4" value="100nF" lcsc="C1525" x={displaySupport.vddDecoupling.x} y={displaySupport.vddDecoupling.y} a="net.GROUND" b="net.DISP_VDD" />
    {/* C5 lands are undrilled; any GND layer transition is ordinary off-land. */}
    <capacitor
      name="C5"
      capacitance="1uF"
      supplierPartNumbers={{ jlcpcb: ["C52923"] }}
      layer={smtSide}
      pcbX={analog.biasRow[2].x}
      pcbY={analog.biasRow[2].y}
      connections={{ pin1: "net.VBIAS", pin2: "net.GROUND" }}
      footprint={
        <footprint>
<smtpad portHints={["pin1"]} pcbX={-0.51} pcbY={0} width="0.54mm" height="0.64mm" shape="rect" solderMaskMargin={SMT_MASK_MARGIN} />
<smtpad portHints={["pin2"]} pcbX={0.51} pcbY={0} width="0.54mm" height="0.64mm" shape="rect" solderMaskMargin={SMT_MASK_MARGIN} />
          <silkscreenrect pcbX={0} pcbY={0} width="1.56mm" height="0.8mm" strokeWidth="0.12mm" />
          <silkscreencircle pcbX={-0.68} pcbY={0.55} radius="0.12mm" />
        </footprint>
      }
    />
    <C0402 name="C6" value="1uF" lcsc="C52923" x={analog.micCoupling.x} y={analog.micCoupling.y} a="net.MIC_RAW" b="net.MIC_AC" />
    <C0402 name="C7" value="10nF" lcsc="C15195" x={analog.outputRow[0].x} y={analog.outputRow[0].y} a="net.MIC_ADC" b="net.GROUND" />

    <R0402 name="R1" value="10k" lcsc="C25744" x={displaySupport.resetRow[0].x} y={displaySupport.resetRow[0].y} a="net.DISP_VDD" b="net.LCD_RESET_N" />
    {/* R9 is a Basic-library 0-ohm link that keeps the fine-pitch LCD supply
        on a local rail while preserving an explicit V3V3 source boundary.
        It remains in the open service region where its V3V3 land routes cleanly.
        J1 pin 7 reaches the router through the separate off-land fabrication
        escape declared beside the connector. */}
    <R0402 name="R9" value="0ohm" lcsc="C17168" x={-12.4} y={8.5} a="net.VDD3V3" b="net.DISP_VDD" />
    <resistor
      name="R2"
      resistance="27ohm"
      footprint={<Footprint1206C17946 />}
      supplierPartNumbers={{ jlcpcb: ["C17946"] }}
      layer={smtSide}
      pcbX={displaySupport.backlightResistor.x}
      pcbY={displaySupport.backlightResistor.y}
      connections={{ pin1: "net.VBUS", pin2: "net.LCD_LEDA" }}
    />
    <R0402 name="R3" value="100k" lcsc="C25741" x={analog.biasRow[0].x} y={analog.biasRow[0].y} a="net.VDD3V3" b="net.VBIAS" />
    {/* R4 retains the exact two-pad 0402 assembly land pattern.  Its GND
        transition is a separate ordinary off-land via so neither paste nor
        the component drill table can be confused with the resistor pads. */}
    <R0402 name="R4" value="100k" lcsc="C25741" x={analog.biasRow[1].x} y={analog.biasRow[1].y + 0.1} a="net.VBIAS" b="net.GROUND" />
    <chip
      name="R4_GND_VIA"
      displayName="R4 off-land GND transition"
      pcbX={5.5}
      pcbY={18.1}
      pinLabels={{ pin1: "GND" }}
      connections={{ pin1: "net.GROUND" }}
      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            connectsTo="net.GROUND"
            pcbX={0}
            pcbY={0}
            shape="circle"
            outerDiameter="0.6mm"
            holeDiameter="0.3mm"
          />
        </footprint>
      }
    />
    {/* C7 is a bottom-side shunt capacitor. This ordinary off-land via is one
        millimetre above pin 2, giving that small land an immediate bottom-side
        escape before the return changes to the top layer. */}
    <chip
      name="C7_GND_ESCAPE"
      displayName="C7 off-land GROUND transition"
      pcbX={13.49}
      pcbY={13.5}
      pinLabels={{ pin1: "GROUND" }}
      connections={{ pin1: "net.GROUND" }}
      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            connectsTo="net.GROUND"
            pcbX={0}
            pcbY={0}
            shape="circle"
            outerDiameter="0.6mm"
            holeDiameter="0.3mm"
          />
        </footprint>
      }
    />
    {/* Offset R5 below the R6/R7 gain row so MIC_AC can escape without
        crossing the dense row while preserving the proven analog partition. */}
    <R0402 name="R5" value="100k" lcsc="C25741" x={analog.gainRow[0].x} y={analog.gainRow[0].y - 1.5} a="net.MIC_AC" b="net.VBIAS" />
    <R0402 name="R6" value="1k" lcsc="C11702" x={analog.gainRow[1].x} y={analog.gainRow[1].y} a="net.MIC_FB" b="net.VBIAS" />
    <R0402 name="R7" value="100k" lcsc="C25741" x={analog.gainRow[2].x} y={analog.gainRow[2].y} a="net.MIC_AMP" b="net.MIC_FB" />
    <R0402 name="R8" value="1k" lcsc="C11702" x={analog.outputRow[1].x} y={analog.outputRow[1].y} a="net.MIC_AMP" b="net.MIC_ADC" />

    <ThroughHoleTestPoint name="TP_VBUS" x={debug.points[0].x} y={debug.points[0].y} net="net.VBUS" />
    <ThroughHoleTestPoint name="TP_3V3" x={debug.points[1].x} y={debug.points[1].y} net="net.VDD3V3" />
    <ThroughHoleTestPoint name="TP_GND" x={debug.points[2].x} y={debug.points[2].y} net="net.GROUND" />
    <ThroughHoleTestPoint name="TP_MIC" x={debug.points[3].x} y={debug.points[3].y} net="net.MIC_ADC" />
  </board>
);