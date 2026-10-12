# User-requested illustrative MX placeholder, not supplier manufacturing geometry.
# XY centers follow PCB source/layout.ts; dimensions below are disclosed visual defaults.
W=param("switch_2_width",13.8)
D=param("switch_2_depth",13.8)
BASE=param("switch_2_base_height",5.3)
UP=param("switch_2_upper_height",4.0)
INSET=param("switch_2_upper_inset",1.6)
CROSS=param("switch_2_stem_cross_span",4.0)
ARM=param("switch_2_stem_arm_width",1.2)
SH=param("switch_2_stem_height",7.0)
OVER=param("switch_2_stem_root_overlap",0.2)
lower=Box(W,D,BASE,align=(Align.CENTER,Align.CENTER,Align.MIN))
upper=loft([Pos(0,0,BASE)*Rectangle(W,D),Pos(0,0,BASE+UP)*Rectangle(W-2*INSET,D-2*INSET)])
stem=Box(CROSS,ARM,SH,align=(Align.CENTER,Align.CENTER,Align.MIN))+Box(ARM,CROSS,SH,align=(Align.CENTER,Align.CENTER,Align.MIN))
body=lower+upper+Pos(0,0,BASE+UP-OVER)*stem
assert len(body.solids())==1
body.color=srgb("#25272a")
publish("switch_2",body,"MX 2 placeholder",material="abs")
