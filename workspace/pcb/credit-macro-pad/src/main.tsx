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
import { HotSwapKeySwitch, XiaoEsp32S3 } from "./lib/footprints/index";

const smtSide = sides.smtAssembly;

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
    {/* Source-owned so Freerouting sees this diagnosed analog-return bridge
        before routing; a one-pin footprint keeps its net identity explicit. */}
    <chip
      name="GND_STITCH_ANALOG_RAIL"
      displayName="Analog return stitching via"
      pcbX={17.2}
      pcbY={19.05}
      footprint={
        <footprint>
          <platedhole
            portHints={["1"]}
            pcbX={0}
            pcbY={0}
            shape="circle"
            outerDiameter="0.6mm"
            holeDiameter="0.3mm"
          />
        </footprint>
      }
      connections={{ "1": "net.GND" }}
    />
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
    footprint="0402"
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
    footprint="0402"
    supplierPartNumbers={{ jlcpcb: [lcsc] }}
    layer={smtSide}
    pcbX={x}
    pcbY={y}
    connections={{ pin1: a, pin2: b }}
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
        {/* DS1 is a non-populated top-side mechanical envelope. Its insulating
            display back intentionally overlaps the bottom-mounted XIAO region,
            so a KiCad courtyard would incorrectly forbid that cross-side stack. */}
      </footprint>
    }
  />
);

// ZILLTEK ZTS6216 native top-side land pattern, re-derived from datasheet
// pages 6-7. Body: 1.85 x 2.75 mm. Pads: 0.60 x 0.54 mm with centers
// x=+/-0.525 mm and y=+/-0.965 mm. The bottom acoustic port is not at the
// package center: it is 0.75 mm from the top edge, i.e. y=+0.625 mm here.
// Keep this definition in native top orientation; layer="bottom" owns mirror.
const MicrophoneFootprint = () => (
  <footprint>
    {/* Page 7 shows rounded 0.60 x 0.54 mm customer lands. The rounded
        corners are electrically important beside the Ø0.50 mm sound hole;
        sharp rectangles intrude into the acoustic opening at the inner
        corners even though the nominal centers and dimensions are correct. */}
    <smtpad name="1" portHints={["pin1"]} shape="rect" width="0.60mm" height="0.54mm" rectBorderRadius="0.10mm" pcbX="-0.525mm" pcbY="0.965mm" />
    <smtpad name="4" portHints={["pin4"]} shape="rect" width="0.60mm" height="0.54mm" rectBorderRadius="0.10mm" pcbX="0.525mm" pcbY="0.965mm" />
    <smtpad name="1_ESCAPE" portHints={["pin1"]} shape="rect" width="0.60mm" height="0.25mm" rectBorderRadius="0.08mm" pcbX="-0.95mm" pcbY="1.20mm" coveredWithSolderMask />
    <smtpad name="2" portHints={["pin2"]} shape="rect" width="0.60mm" height="0.54mm" rectBorderRadius="0.10mm" pcbX="-0.525mm" pcbY="-0.965mm" />
    <smtpad name="3" portHints={["pin3"]} shape="rect" width="0.60mm" height="0.54mm" rectBorderRadius="0.10mm" pcbX="0.525mm" pcbY="-0.965mm" />
    <cutout
      name="ACOUSTIC_PORT"
      shape="circle"
      radius={`${microphone.acousticHoleDiameterMm / 2}mm`}
      pcbX="0mm"
      pcbY="0.625mm"
    />
    <silkscreenrect pcbX="0mm" pcbY="0mm" width="1.85mm" height="2.75mm" strokeWidth="0.12mm" />
    <silkscreencircle pcbX="-0.76mm" pcbY="1.18mm" radius="0.13mm" fill="red" />
    <courtyardrect pcbX="0mm" pcbY="0mm" width="2.35mm" height="3.25mm" />
  </footprint>
);

const KeySwitch = ({ name, index }: { name: string; index: number }) => {
  const p = keyCenters[index];
  return (
    <HotSwapKeySwitch
      name={`KEY${index + 1}`}
      switch="mx"
      socket="c41430893"
      orientation={index === 2 ? "north" : "south"}
      pcbX={p.x}
      pcbY={p.y}
      connections={{ "1": `net.KEY${index + 1}`, "2": "net.GND" }}
    />
  );
};

export default () => (
  <board
    width={board.width}
    height={board.height}
    center_x={0}
    center_y={0}
    {...boardPropsFromRules()}
  >
    <PcbRuleElements />

    {/* User-facing side: LCD envelope plus removable MX hot-swap switches. */}
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
      pcbRotation={xiao.rotationDeg}
      connections={{
        D0: "net.KEY1",
        D1: "net.KEY2",
        D4: "net.KEY3",
        D3: "net.KEY4",
        D2: "net.LCD_MOSI",
        D5: "net.LCD_SCK",
        D6: "net.LCD_CS_N",
        D7: "net.LCD_D_C",
        D8: "net.MIC_ADC",
        D9: "net.SPARE_D9",
        D10: "net.SPARE_D10",
        VBUS: "net.VBUS",
        GND: "net.GND",
        V3V3: "net.V3V3",
      }}
    />

    <chip
      name="J1"
      displayName="Amphenol SFV8R-2STE1HLF top-contact FPC"
      manufacturerPartNumber="SFV8R-2STE1HLF"
      supplierPartNumbers={{ jlcpcb: ["C2992524"] }}
      footprint="jlcpcb:C2992524"
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
        pin2: "net.GND",
        pin3: "net.LCD_RESET_N",
        pin4: "net.LCD_D_C",
        pin5: "net.LCD_MOSI",
        pin6: "net.LCD_SCK",
        pin7: "net.V3V3",
        pin8: "net.LCD_CS_N",
      }}
    />

    {/* J1 uses 0.5 mm pitch and its GND land is trapped between pins 1 and 3.
        This soldermask-covered, same-net copper tongue overlaps only pin 2 and
        forces adjacent fanout away until the bottom GND pour can merge into it. */}
    <chip
      name="J1_GND_ESCAPE"
      displayName="J1 pin 2 buried GND escape copper"
      layer={smtSide}
      pcbX={-34.1}
      pcbY={14.250112}
      footprint={
        <footprint>
          <smtpad
            portHints={["1"]}
            pcbX={0}
            pcbY={0}
            layer="bottom"
            shape="rect"
            width="4.8mm"
            height="0.2mm"
            coveredWithSolderMask
          />
          <platedhole
            portHints={["1"]}
            pcbX={-2.6}
            pcbY={0}
            shape="circle"
            outerDiameter="0.6mm"
            holeDiameter="0.3mm"
          />
        </footprint>
      }
      connections={{ "1": "net.GND" }}
    />

    <chip
      name="MIC1"
      displayName="ZILLTEK ZTS6216"
      manufacturerPartNumber="ZTS6216"
      supplierPartNumbers={{ jlcpcb: ["C481302"] }}
      footprint={<MicrophoneFootprint />}
      layer={smtSide}
      pcbX={microphone.x}
      pcbY={microphone.y}
      pcbRotation={180}
      pinLabels={{ pin1: "OUT", pin2: "GND1", pin3: "GND2", pin4: "VDD" }}
      connections={{
        pin1: "net.MIC_RAW",
        pin2: "net.GND",
        pin3: "net.GND",
        pin4: "net.V3V3",
      }}
    />

    <chip
      name="U2"
      displayName="TLV9061IDBVR"
      manufacturerPartNumber="TLV9061IDBVR"
      supplierPartNumbers={{ jlcpcb: ["C398358"] }}
      footprint="jlcpcb:C398358"
      layer={smtSide}
      pcbX={analog.opamp.x}
      pcbY={analog.opamp.y}
      pinLabels={{ pin1: "OUT", pin2: "VSS", pin3: "IN_P", pin4: "IN_N", pin5: "VDD" }}
      connections={{
        pin1: "net.MIC_AMP",
        pin2: "net.GND",
        pin3: "net.MIC_AC",
        pin4: "net.MIC_FB",
        pin5: "net.V3V3",
      }}
    />

    {/* Same-net buried escape for U2 pin 2. The source-owned plated via is
        present before Freerouting, so surrounding analog routes avoid it. */}
    <chip
      name="U2_GND_ESCAPE"
      displayName="U2 pin 2 buried GND escape copper"
      layer={smtSide}
      pcbX={10.0}
      pcbY={19.25}
      footprint={
        <footprint>
          <smtpad
            portHints={["1"]}
            pcbX={0}
            pcbY={0}
            layer="bottom"
            shape="rect"
            width="0.2mm"
            height="1.9mm"
            coveredWithSolderMask
          />
          <platedhole
            portHints={["1"]}
            pcbX={0}
            pcbY={-0.75}
            shape="circle"
            outerDiameter="0.6mm"
            holeDiameter="0.3mm"
          />
        </footprint>
      }
      connections={{ "1": "net.GND" }}
    />

    <C0402 name="C1" value="100nF" lcsc="C1525" x={analog.micDecoupling.x} y={analog.micDecoupling.y} a="net.GND" b="net.V3V3" />
    <C0402 name="C2" value="100nF" lcsc="C1525" x={analog.opampDecoupling.x} y={analog.opampDecoupling.y} a="net.V3V3" b="net.GND" />
    <C0402 name="C3" value="100nF" lcsc="C1525" x={displaySupport.resetRow[1].x} y={displaySupport.resetRow[1].y} a="net.LCD_RESET_N" b="net.GND" />
    <C0402 name="C4" value="100nF" lcsc="C1525" x={analog.railDecoupling.x} y={analog.railDecoupling.y} a="net.V3V3" b="net.GND" />
    <C0402 name="C5" value="1uF" lcsc="C52923" x={analog.biasFilter.x} y={analog.biasFilter.y} a="net.VBIAS" b="net.GND" />
    <C0402 name="C6" value="1uF" lcsc="C52923" x={analog.micCoupling.x} y={analog.micCoupling.y} a="net.MIC_RAW" b="net.MIC_AC" />
    <C0402 name="C7" value="10nF" lcsc="C15195" x={analog.adcFilterRow[1].x} y={analog.adcFilterRow[1].y} a="net.MIC_ADC" b="net.GND" />

    <R0402 name="R1" value="10k" lcsc="C25744" x={displaySupport.resetRow[0].x} y={displaySupport.resetRow[0].y} a="net.V3V3" b="net.LCD_RESET_N" />
    <resistor
      name="R2"
      resistance="27ohm"
      footprint="1206"
      layer={smtSide}
      pcbX={displaySupport.backlightResistor.x}
      pcbY={displaySupport.backlightResistor.y}
      connections={{ pin1: "net.VBUS", pin2: "net.LCD_LEDA" }}
    />
    <R0402 name="R3" value="100k" lcsc="C25741" x={analog.biasDividerRow[0].x} y={analog.biasDividerRow[0].y} a="net.V3V3" b="net.VBIAS" />
    <R0402 name="R4" value="100k" lcsc="C25741" x={analog.biasDividerRow[1].x} y={analog.biasDividerRow[1].y} a="net.VBIAS" b="net.GND" />
    <R0402 name="R5" value="100k" lcsc="C25741" x={analog.inputAndGainRow[0].x} y={analog.inputAndGainRow[0].y} a="net.MIC_AC" b="net.VBIAS" />
    <R0402 name="R6" value="1k" lcsc="C11702" x={analog.inputAndGainRow[1].x} y={analog.inputAndGainRow[1].y} a="net.MIC_FB" b="net.VBIAS" />
    <R0402 name="R7" value="100k" lcsc="C25741" x={analog.feedback.x} y={analog.feedback.y} a="net.MIC_AMP" b="net.MIC_FB" />
    <R0402 name="R8" value="1k" lcsc="C11702" x={analog.adcFilterRow[0].x} y={analog.adcFilterRow[0].y} a="net.MIC_AMP" b="net.MIC_ADC" />

    <testpoint name="TP_VBUS" layer={smtSide} pcbX={debug.points[0].x} pcbY={debug.points[0].y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.VBUS" }} />
    <testpoint name="TP_3V3" layer={smtSide} pcbX={debug.points[1].x} pcbY={debug.points[1].y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.V3V3" }} />
    <testpoint name="TP_GND" layer={smtSide} pcbX={debug.points[2].x} pcbY={debug.points[2].y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.GND" }} />
    <testpoint name="TP_MIC" layer={smtSide} pcbX={debug.points[3].x} pcbY={debug.points[3].y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.MIC_ADC" }} />

  </board>
);