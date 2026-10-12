# Custom dimensional reference; generic MX caps have no verified vendor STEP.
# 18 mm face envelope from product/constraints.json; not a certified purchased part.
W=param("keycap_1_width",18.0)
D=param("keycap_1_depth",18.0)
H=param("keycap_1_height",7.5)
TOP=param("keycap_1_top_inset",2.0)
WALL=param("keycap_1_wall_thickness",1.2)
R=param("keycap_1_corner_radius",1.0)
BOSS=param("keycap_1_socket_boss_radius",3.0)
CROSS=param("keycap_1_socket_cross_span",4.1)
SLOT=param("keycap_1_socket_arm_width",1.3)
DEPTH=param("keycap_1_socket_depth",5.5)
assert H>WALL and TOP<W/2 and TOP<D/2 and R>0
outer=loft([RectangleRounded(W,D,R),Pos(0,0,H)*RectangleRounded(W-2*TOP,D-2*TOP,R)])
inner=loft([Pos(0,0,-0.1)*RectangleRounded(W-2*WALL,D-2*WALL,R/2),Pos(0,0,H-WALL)*RectangleRounded(W-2*TOP-2*WALL,D-2*TOP-2*WALL,R/2)])
cap=outer-inner
cap=cap+Cylinder(BOSS,H-WALL+0.2,align=(Align.CENTER,Align.CENTER,Align.MIN))
socket=Box(CROSS,SLOT,DEPTH+0.1,align=(Align.CENTER,Align.CENTER,Align.MIN))+Box(SLOT,CROSS,DEPTH+0.1,align=(Align.CENTER,Align.CENTER,Align.MIN))
cap=cap-Pos(0,0,-0.1)*socket
assert len(cap.solids())==1
cap.color=Color(0.035,0.035,0.04)
publish("keycap_1",cap,"Keycap 1",material="abs")
