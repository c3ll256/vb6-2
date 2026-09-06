# Thin-wall base with closed FPC side, capsule USB-C port, and four positive snap lugs.
CX = param("base_center_x", 100.8)
CY = param("base_center_y", -100.0)
OUT_W = param("base_width", 85.6)
OUT_D = param("base_depth", 53.98)
OUT_R = param("base_corner_radius", 6.5)
Z0 = param("base_bottom_z", -7.5)
SPLIT_Z = param("base_split_z", 2.2)
FLOOR_T = param("base_floor_thickness", 0.5)
WALL = param("base_wall_thickness", 0.5)
BOARD_RELIEF_W = param("board_relief_width", 82.10)
BOARD_RELIEF_D = param("board_relief_depth", 50.48)
USB_CAPSULE_W = param("usb_capsule_width", 9.5)
USB_CAPSULE_H = param("usb_capsule_height", 3.8)
USB_CAPSULE_DEPTH = param("usb_capsule_depth", 3.0)
USB_CENTER_Y = param("usb_center_y", CY + 7.5)
USB_CENTER_Z = param("usb_center_z", -2.5)
SUPPORT_THICKNESS = param("pcb_support_thickness", 1.5)
MIC_BORE_D = param("microphone_bore_diameter", 2.0)
MIC_CHIMNEY_D = param("microphone_chimney_diameter", 4.8)
TONGUE_T = param("lid_tongue_thickness", 1.1)
TONGUE_SIDE_INSET = param("lid_tongue_side_inset", 0.3)
SNAP_WIDTH = param("base_snap_width", 8.0)
SNAP_DEPTH = param("base_snap_depth", 0.45)
SNAP_HEIGHT = param("base_snap_height", 0.65)
SNAP_X_OFFSET = param("base_snap_x_offset", 21.0)
FLOOR_Z = Z0 + FLOOR_T

outer = extrude(Pos(CX,CY,Z0)*RectangleRounded(OUT_W,OUT_D,OUT_R), amount=SPLIT_Z-Z0)
inner = extrude(Pos(CX,CY,FLOOR_Z)*RectangleRounded(OUT_W-2*WALL,OUT_D-2*WALL,OUT_R-WALL), amount=SPLIT_Z-FLOOR_Z+0.2)
base_shell = outer-inner

board_relief = extrude(Pos(CX,CY,0.20)*RectangleRounded(BOARD_RELIEF_W,BOARD_RELIEF_D,3.25), amount=1.70)
base_shell = base_shell-board_relief

# True USB-C stadium cutout on the +X wall: central bar plus semicircular ends.
usb_r = USB_CAPSULE_H/2
usb_straight = USB_CAPSULE_W-USB_CAPSULE_H
usb_x = CX + OUT_W/2
usb_cut = Pos(usb_x,USB_CENTER_Y,USB_CENTER_Z)*Box(USB_CAPSULE_DEPTH,usb_straight,USB_CAPSULE_H)
for end_y in (USB_CENTER_Y-usb_straight/2,USB_CENTER_Y+usb_straight/2):
    usb_cut = usb_cut + Pos(usb_x,end_y,USB_CENTER_Z)*Rot(0,90,0)*Cylinder(usb_r,USB_CAPSULE_DEPTH,align=(Align.CENTER,Align.CENTER,Align.CENTER))
base_shell = base_shell-usb_cut

support_zc=(FLOOR_Z+0.50)/2
support_h=0.50-FLOOR_Z
supports=[(75.0,-124.20,10.0,SUPPORT_THICKNESS),(100.8,-124.20,12.0,SUPPORT_THICKNESS),(126.5,-124.20,10.0,SUPPORT_THICKNESS),(76.0,-75.80,10.0,SUPPORT_THICKNESS),(60.75,-107.0,SUPPORT_THICKNESS,10.0),(140.85,-115.0,SUPPORT_THICKNESS,10.0)]
for sx,sy,sw,sd in supports:
    base_shell=base_shell+Pos(sx,sy,support_zc)*Box(sw,sd,support_h)

mic_x,mic_y=CX+36.5,CY+22.5
mic_outer=Pos(mic_x,mic_y,FLOOR_Z)*Cylinder(MIC_CHIMNEY_D/2,4.70,align=(Align.CENTER,Align.CENTER,Align.MIN))
mic_bore=Pos(mic_x,mic_y,Z0-0.1)*Cylinder(MIC_BORE_D/2,7.0,align=(Align.CENTER,Align.CENTER,Align.MIN))
mic_entry=Pos(mic_x,mic_y,Z0-0.01)*Cone(1.5,MIC_BORE_D/2,0.5,align=(Align.CENTER,Align.CENTER,Align.MIN))
base_shell=(base_shell+mic_outer)-mic_bore-mic_entry

# Continuous tongue: no FPC-side notch. Cable bends inside the enclosure volume.
tongue_outer_w = OUT_W - 2*TONGUE_SIDE_INSET
tongue_outer_d = OUT_D - 2*TONGUE_SIDE_INSET
tongue_outer_r = OUT_R - TONGUE_SIDE_INSET
tongue_inner_w = tongue_outer_w - 2*TONGUE_T
tongue_inner_d = tongue_outer_d - 2*TONGUE_T
tongue_inner_r = tongue_outer_r - TONGUE_T
tongue_outer=extrude(Pos(CX,CY,SPLIT_Z)*RectangleRounded(tongue_outer_w,tongue_outer_d,tongue_outer_r),amount=1.5)
tongue_inner=extrude(Pos(CX,CY,SPLIT_Z-0.05)*RectangleRounded(tongue_inner_w,tongue_inner_d,tongue_inner_r),amount=1.60)
tongue=tongue_outer-tongue_inner
base_shell=base_shell+tongue

# Four visible snap lugs on the long sides, paired symmetrically.
snap_z = SPLIT_Z + 0.82
snap_y = tongue_outer_d/2
for sx in (CX-SNAP_X_OFFSET,CX+SNAP_X_OFFSET):
    base_shell = base_shell + Pos(sx,CY-snap_y,snap_z)*Box(SNAP_WIDTH,SNAP_DEPTH,SNAP_HEIGHT)
    base_shell = base_shell + Pos(sx,CY+snap_y,snap_z)*Box(SNAP_WIDTH,SNAP_DEPTH,SNAP_HEIGHT)

side_overlap=(tongue_outer_w-(OUT_W-2*WALL))/2
assert side_overlap >= 0.19
assert abs(base_shell.bounding_box().size.X-OUT_W)<0.02
assert abs(base_shell.bounding_box().size.Y-OUT_D)<0.02
assert abs(base_shell.bounding_box().min.Z-Z0)<0.02
print(f"base wall/floor: {WALL}/{FLOOR_T} mm; USB capsule {USB_CAPSULE_W} x {USB_CAPSULE_H} mm; four snap lugs")
publish("base",base_shell,"Bottom shell")