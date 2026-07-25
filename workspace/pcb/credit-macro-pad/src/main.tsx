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
import { HotSwapKeySwitch } from "./components/HotSwapKeySwitch";
import { XiaoEsp32S3 } from "./components/XiaoEsp32S3";

const smtSide = sides.smtAssembly;

const passive0402Footprint = (kind: "resistor" | "capacitor") => (
  <footprint>
    <smtpad
      name="1"
      shape="rect"
      width="0.54mm"
      height="0.64mm"
      pcbX="-0.51mm"
      pcbY="0mm"
      layer={smtSide}
      portHints={["1", "pin1"]}
    />
    <smtpad
      name="2"
      shape="rect"
      width="0.54mm"
      height="0.64mm"
      pcbX="0.51mm"
      pcbY="0mm"
      layer={smtSide}
      portHints={["2", "pin2"]}
    />
    {kind === "capacitor" ? (
      <silkscreenpath
        strokeWidth="0.15mm"
        route={[
          { x: "0.51mm", y: "0.72mm" },
          { x: "-0.98mm", y: "0.72mm" },
          { x: "-0.98mm", y: "-0.72mm" },
          { x: "0.51mm", y: "-0.72mm" },
        ]}
      />
    ) : (
      <>
        <silkscreenline
          x1="-0.153641mm"
          y1="0.38mm"
          x2="0.153641mm"
          y2="0.38mm"
          strokeWidth="0.15mm"
        />
        <silkscreenline
          x1="-0.153641mm"
          y1="-0.38mm"
          x2="0.153641mm"
          y2="-0.38mm"
          strokeWidth="0.15mm"
        />
      </>
    )}
  </footprint>
);

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
  rotation = 0,
}: {
  name: string;
  value: string;
  lcsc: string;
  x: number;
  y: number;
  a: string;
  b: string;
  rotation?: number;
}) => (
  <resistor
    name={name}
    resistance={value}
    footprint={passive0402Footprint("resistor")}
    supplierPartNumbers={{ jlcpcb: [lcsc] }}
    layer={smtSide}
    pcbX={x}
    pcbY={y}
    pcbRotation={rotation}
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
    footprint={passive0402Footprint("capacitor")}
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
        D1: "net.SPARE_D1",
        D2: "net.SPARE_D2",
        D3: "net.KEY4",
        D4: "net.LCD_MOSI",
        D5: "net.LCD_SCK",
        D6: "net.LCD_CS_N",
        D7: "net.LCD_D_C",
        D8: "net.MIC_ADC",
        D9: "net.KEY2",
        D10: "net.KEY3",
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
        pin2: "net.LCD_GND",
        pin3: "net.LCD_RESET_N",
        pin4: "net.LCD_D_C",
        pin5: "net.LCD_MOSI",
        pin6: "net.LCD_SCK",
        pin7: "net.LCD_VDD",
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
        pin2: "net.MIC_GND",
        pin3: "net.MIC_GND",
        pin4: "net.MIC_VDD",
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

    <C0402 name="C1" value="100nF" lcsc="C1525" x={analog.micDecoupling.x} y={analog.micDecoupling.y} a="net.MIC_VDD" b="net.MIC_GND" />
    <C0402 name="C2" value="100nF" lcsc="C1525" x={analog.opampDecoupling.x} y={analog.opampDecoupling.y} a="net.V3V3" b="net.GND" />
    <C0402 name="C3" value="100nF" lcsc="C1525" x={displaySupport.resetRow[1].x} y={displaySupport.resetRow[1].y} a="net.LCD_RESET_N" b="net.GND" />
    <C0402 name="C4" value="100nF" lcsc="C1525" x={displaySupport.lcdDecoupling.x} y={displaySupport.lcdDecoupling.y} a="net.LCD_VDD" b="net.LCD_GND" />
    <C0402 name="C5" value="1uF" lcsc="C52923" x={analog.biasRow[2].x} y={analog.biasRow[2].y} a="net.VBIAS" b="net.GND" />
    <C0402 name="C6" value="1uF" lcsc="C52923" x={analog.micCoupling.x} y={analog.micCoupling.y} a="net.MIC_AC_LOCAL" b="net.MIC_RAW" />
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
    <R0402 name="R8" value="1k" lcsc="C11702" x={16.0} y={11.5} a="net.MIC_AMP" b="net.MIC_ADC" />
    <R0402 name="R9" value="0ohm" lcsc="C17168" x={displaySupport.vddLink.x} y={displaySupport.vddLink.y} a="net.V3V3" b="net.LCD_VDD" />
    <R0402 name="R10" value="0ohm" lcsc="C17168" x={displaySupport.groundLink.x} y={displaySupport.groundLink.y} a="net.GND" b="net.LCD_GND" />
    <R0402 name="R11" value="0ohm" lcsc="C17168" x={analog.micVddLink.x} y={analog.micVddLink.y} a="net.V3V3" b="net.MIC_VDD" />
    <R0402 name="R12" value="0ohm" lcsc="C17168" x={analog.micAcLink.x} y={analog.micAcLink.y} a="net.MIC_AC_LOCAL" b="net.MIC_AC" />
    <R0402 name="R13" value="0ohm" lcsc="C17168" x={analog.micGroundLink.x} y={analog.micGroundLink.y} a="net.MIC_GND" b="net.GND" />
    <testpoint name="TP_VBUS" layer={smtSide} pcbX={debug.points[0].x} pcbY={debug.points[0].y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.VBUS" }} />
    <testpoint name="TP_3V3" layer={smtSide} pcbX={debug.points[1].x} pcbY={debug.points[1].y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.V3V3" }} />
    <testpoint name="TP_GND" layer={smtSide} pcbX={debug.groundPoint.x} pcbY={debug.groundPoint.y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.GND" }} />
    <testpoint name="TP_MIC" layer={smtSide} pcbX={debug.micPoint.x} pcbY={debug.micPoint.y} footprintVariant="pad" padShape="circle" padDiameter="1.2mm" connections={{ pin1: "net.MIC_ADC" }} />
  </board>
);
