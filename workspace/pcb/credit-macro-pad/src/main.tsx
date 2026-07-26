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
        D2: "net.KEY3",
        D3: "net.KEY4",
        D4: "net.LCD_MOSI",
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

    <cutout
      name="H_MIC_PORT"
      shape="circle"
      radius={`${microphone.acousticHoleDiameterMm / 2}mm`}
      pcbX={microphone.x}
      pcbY={microphone.y}
    />
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

    <C0402 name="C1" value="100nF" lcsc="C1525" x={analog.micDecoupling.x} y={analog.micDecoupling.y} a="net.V3V3" b="net.GND" />
    <C0402 name="C2" value="100nF" lcsc="C1525" x={analog.opampDecoupling.x} y={analog.opampDecoupling.y} a="net.V3V3" b="net.GND" />
    <C0402 name="C3" value="100nF" lcsc="C1525" x={displaySupport.resetRow[1].x} y={displaySupport.resetRow[1].y} a="net.LCD_RESET_N" b="net.GND" />
    <C0402 name="C4" value="100nF" lcsc="C1525" x={26.0} y={21.0} a="net.V3V3" b="net.GND" />
    <C0402 name="C5" value="1uF" lcsc="C52923" x={analog.biasRow[2].x} y={analog.biasRow[2].y} a="net.VBIAS" b="net.GND" />
    <C0402 name="C6" value="1uF" lcsc="C52923" x={analog.biasRow[3].x} y={analog.biasRow[3].y} a="net.MIC_RAW" b="net.MIC_AC" />
    <C0402 name="C7" value="10nF" lcsc="C15195" x={analog.gainRow[3].x} y={analog.gainRow[3].y} a="net.MIC_ADC" b="net.GND" />

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
    <R0402 name="R3" value="100k" lcsc="C25741" x={analog.biasRow[0].x} y={analog.biasRow[0].y} a="net.V3V3" b="net.VBIAS" />
    <R0402 name="R4" value="100k" lcsc="C25741" x={analog.biasRow[1].x} y={analog.biasRow[1].y} a="net.VBIAS" b="net.GND" />
    <R0402 name="R5" value="100k" lcsc="C25741" x={analog.gainRow[0].x} y={analog.gainRow[0].y} a="net.MIC_AC" b="net.VBIAS" />
    <R0402 name="R6" value="1k" lcsc="C11702" x={analog.gainRow[1].x} y={analog.gainRow[1].y} a="net.MIC_FB" b="net.VBIAS" />
    <R0402 name="R7" value="100k" lcsc="C25741" x={analog.gainRow[2].x} y={analog.gainRow[2].y} a="net.MIC_AMP" b="net.MIC_FB" />
    <R0402 name="R8" value="1k" lcsc="C11702" x={14.8} y={14.8} a="net.MIC_AMP" b="net.MIC_ADC" />

    <testpoint name="TP_VBUS" layer={smtSide} pcbX={debug.points[0].x} pcbY={debug.points[0].y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.VBUS" }} />
    <testpoint name="TP_3V3" layer={smtSide} pcbX={debug.points[1].x} pcbY={debug.points[1].y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.V3V3" }} />
    <testpoint name="TP_GND" layer={smtSide} pcbX={debug.points[2].x} pcbY={debug.points[2].y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.GND" }} />
    <testpoint name="TP_MIC" layer={smtSide} pcbX={debug.points[3].x} pcbY={debug.points[3].y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.MIC_ADC" }} />
  </board>
);