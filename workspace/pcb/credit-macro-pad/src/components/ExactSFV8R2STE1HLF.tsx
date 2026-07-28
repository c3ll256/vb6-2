// Exact native top-side land pattern for Amphenol SFV8R-2STE1HLF / LCSC C2992524.
// Datasheet pages 6-8 show an 8-position 0.50 mm-pitch signal row with
// 0.30 mm lands along the pitch axis and 1.40 mm land length perpendicular to
// the row. The active supplier import transposed those two dimensions, so this
// project-owned footprint corrects that proven converter defect while keeping
// supplier identity and the exact EasyEDA STEP model.

const SIGNAL_PAD_X_MM = [-1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75] as const;
const SMT_MASK_MARGIN = "0.05mm";

export const SFV8R_2STE1HLF_CAD_MODEL = {
  objUrl: "https://modules.easyeda.com/3dmodel/001b7ef6fb4a4e86ba674a72ebc1880c",
  stepUrl:
    "https://modules.easyeda.com/qAxj6KHrDKw4blvCG8QJPs7Y/001b7ef6fb4a4e86ba674a72ebc1880c",
  modelOriginPosition: { x: 0.0000127, y: -3.6350243, z: 0.05 },
};

export const ExactSFV8R2STE1HLFFootprint = () => (
  <footprint>
    {SIGNAL_PAD_X_MM.map((x, index) => (
      <smtpad
        key={`sfv8r-signal-${index + 1}`}
        portHints={[`pin${index + 1}`]}
        pcbX={`${x}mm`}
        pcbY="0.85mm"
        width="0.30mm"
        height="1.40mm"
        shape="rect"
        solderMaskMargin={SMT_MASK_MARGIN}
      />
    ))}

    {/* Datasheet/supplier retention lands. These are mechanical hold-downs,
        intentionally unnetted. Rectangular envelopes conservatively cover the
        exact supplier custom-pad extents without approaching the signal row. */}
    <smtpad pcbX="-3.61mm" pcbY="-0.56mm" width="2.30mm" height="2.65mm" shape="rect" solderMaskMargin={SMT_MASK_MARGIN} />
    <smtpad pcbX="3.61mm" pcbY="-0.56mm" width="2.30mm" height="2.65mm" shape="rect" solderMaskMargin={SMT_MASK_MARGIN} />

    {/* Reviewable body/opening and polarity marks in native top-side view.
        The cable opening is toward local +Y; board placement rotates that
        opening to the required left/-X edge. */}
    <silkscreenrect pcbX="0mm" pcbY="-1.05mm" width="9.50mm" height="2.60mm" strokeWidth="0.15mm" />
    <silkscreenline x1={-2.2} y1={1.75} x2={2.2} y2={1.75} strokeWidth="0.15mm" />
    <silkscreentext text="FPC" pcbX={0} pcbY={2.15} fontSize="0.7mm" />
    <silkscreencircle pcbX="-2.25mm" pcbY="1.75mm" radius="0.20mm" isFilled={true} />
    <courtyardrect pcbX="0mm" pcbY="-1.05mm" width="10.20mm" height="5.71mm" />
  </footprint>
);
