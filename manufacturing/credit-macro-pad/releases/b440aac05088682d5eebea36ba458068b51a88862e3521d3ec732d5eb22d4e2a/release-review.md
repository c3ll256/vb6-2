<!-- replicator:review
design: credit-macro-pad
candidate: 2a516644e7934ddf179edd468633e45d9ede4deeb1021abf301e763c24bef8e9
build: c0f55fdf412348769e10891f826e1d4d01bc2ecf8e6ec9992cb73be9562f9338
candidateManifestSha256: 40cf41325e21e93559e1f84661e8959221364c1150ba11fb1c416bfdc67c3090
reviewedAt: 2026-08-05T14:08:43.391Z
reviewer: subagent:pcb-release-review (fallback)
-->

# PCB Release Review

Summary: No release-blocking defect is supported by the frozen candidate. The routed via geometry creates a fabrication-yield concern and contradicts the declared routing policy.

P1: `pcb.measure` reports 26 routed vias, all with 0.4 mm pads and 0.3 mm drills, leaving only a 0.05 mm nominal radial annulus. The manufacturing configuration explicitly reserves this minimum geometry for the single J1 GND dogbone and states that autorouted net classes retain ordinary 0.6/0.3 mm vias. Applying the minimum-annulus geometry to the other 25 vias reduces drill-registration margin and contradicts that policy.

Deferred: Enclosure integration must establish the USB-C cutout and plug envelope around U1’s reported 0.775 mm right-edge overhang, the display-tail bend path to bottom-side J1, the microphone acoustic path, and the selected keycap’s installed stack height. Assembled enclosure CAD using the verified module, display, and selected keycap geometry would answer these questions.
