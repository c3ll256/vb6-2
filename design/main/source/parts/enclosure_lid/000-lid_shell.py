# Thin upper shell with closed FPC edge, no raised display land, and four snap pockets.
CX = param("lid_center_x", 100.8)
CY = param("lid_center_y", -100.0)
OUT_W = param("lid_width", 85.6)
OUT_D = param("lid_depth", 53.98)
OUT_R = param("lid_corner_radius", 6.5)
SPLIT_Z = param("lid_split_z", 2.2)
ROOF_BOTTOM = param("lid_roof_bottom_z", 7.8)
TOP_Z = param("lid_top_z", 8.3)
WALL = param("lid_wall_thickness", 0.5)
DISPLAY_Y_OFFSET = param("display_y_offset", 13.0)
DISPLAY_WINDOW_W = param("display_window_width", 55.70)
DISPLAY_WINDOW_D = param("display_window_depth", 15.20)
DISPLAY_SEAT_T = param("display_seat_thickness", 0.5)
KEY_CUT = param("key_cutout_size", 14.20)
KEY_COUNTERBORE = param("key_counterbore_size", 16.20)
KEY_PLATE_T = param("key_plate_thickness", 1.25)
KEY_X_OFFSET = param("key_opening_x_offset", 0.0)
PCB_STOP_BOTTOM = param("pcb_stop_bottom_z", 1.68)
PCB_STOP_THICKNESS = param("pcb_stop_thickness", 1.4)
TONGUE_SIDE_INSET = param("lid_tongue_side_inset", 0.3)
MATING_TONGUE_T = param("mating_tongue_thickness", 1.1)
GROOVE_CLEARANCE = param("lid_groove_clearance_per_side", 0.25)
SNAP_WIDTH = param("lid_snap_pocket_width", 8.4)
SNAP_DEPTH = param("lid_snap_pocket_depth", 0.65)
SNAP_HEIGHT = param("lid_snap_pocket_height", 0.85)
SNAP_X_OFFSET = param("lid_snap_x_offset", 21.0)

lid_outer = extrude(Pos(CX, CY, SPLIT_Z) * RectangleRounded(OUT_W, OUT_D, OUT_R), amount=TOP_Z-SPLIT_Z)
lid_cavity = extrude(Pos(CX, CY, SPLIT_Z-0.1) * RectangleRounded(OUT_W-2*WALL, OUT_D-2*WALL, OUT_R-WALL), amount=ROOF_BOTTOM-SPLIT_Z+0.1)
lid = lid_outer - lid_cavity

# Continuous tongue-and-groove interface with normal FDM clearance.
tongue_outer_w = OUT_W - 2*TONGUE_SIDE_INSET
tongue_outer_d = OUT_D - 2*TONGUE_SIDE_INSET
tongue_outer_r = OUT_R - TONGUE_SIDE_INSET
tongue_inner_w = tongue_outer_w - 2*MATING_TONGUE_T
tongue_inner_d = tongue_outer_d - 2*MATING_TONGUE_T
tongue_inner_r = tongue_outer_r - MATING_TONGUE_T
groove_outer_w = tongue_outer_w + 2*GROOVE_CLEARANCE
groove_outer_d = tongue_outer_d + 2*GROOVE_CLEARANCE
groove_outer_r = tongue_outer_r + GROOVE_CLEARANCE
groove_inner_w = tongue_inner_w - 2*GROOVE_CLEARANCE
groove_inner_d = tongue_inner_d - 2*GROOVE_CLEARANCE
groove_inner_r = tongue_inner_r - GROOVE_CLEARANCE
groove_outer = extrude(Pos(CX, CY, SPLIT_Z-0.1) * RectangleRounded(groove_outer_w, groove_outer_d, groove_outer_r), amount=1.75)
groove_inner = extrude(Pos(CX, CY, SPLIT_Z-0.2) * RectangleRounded(groove_inner_w, groove_inner_d, groove_inner_r), amount=1.95)
lid = lid - (groove_outer - groove_inner)

# Four pockets match the four base snap lugs.
snap_z = SPLIT_Z + 0.82
snap_y = tongue_outer_d/2
for sx in (CX-SNAP_X_OFFSET,CX+SNAP_X_OFFSET):
    lid = lid - Pos(sx,CY-snap_y,snap_z)*Box(SNAP_WIDTH,SNAP_DEPTH,SNAP_HEIGHT)
    lid = lid - Pos(sx,CY+snap_y,snap_z)*Box(SNAP_WIDTH,SNAP_DEPTH,SNAP_HEIGHT)

display_x, display_y = CX, CY + DISPLAY_Y_OFFSET
display_window = extrude(Pos(display_x, display_y, ROOF_BOTTOM-0.2) * RectangleRounded(DISPLAY_WINDOW_W, DISPLAY_WINDOW_D, 0.8), amount=TOP_Z-ROOF_BOTTOM+0.4)
lid = lid - display_window

for local_x in (-28.5, -9.5, 9.5, 28.5):
    key_x, key_y = CX + local_x + KEY_X_OFFSET, CY - 12.0
    key_cut = extrude(Pos(key_x, key_y, ROOF_BOTTOM-0.2) * RectangleRounded(KEY_CUT, KEY_CUT, 0.5), amount=TOP_Z-ROOF_BOTTOM+0.4)
    key_counterbore = extrude(Pos(key_x, key_y, ROOF_BOTTOM-0.1) * RectangleRounded(KEY_COUNTERBORE, KEY_COUNTERBORE, 0.8), amount=ROOF_BOTTOM-(TOP_Z-KEY_PLATE_T)+0.1)
    lid = lid - key_cut - key_counterbore

# The display rests directly on the 0.5 mm roof skin; no raised adhesive land.
# Its FPC bends through the internal cavity without cutting the enclosure edge.
stop_z0, stop_z1 = PCB_STOP_BOTTOM, ROOF_BOTTOM
stop_zc, stop_h = (stop_z0+stop_z1)/2, stop_z1-stop_z0
pcb_stops = [(61.30,-107.0,PCB_STOP_THICKNESS,6.0),(140.30,-115.0,PCB_STOP_THICKNESS,6.0),(100.8,-123.70,10.0,PCB_STOP_THICKNESS),(80.0,-76.30,8.0,PCB_STOP_THICKNESS)]
for sx, sy, sw, sd in pcb_stops:
    lid = lid + Pos(sx, sy, stop_zc) * Box(sw, sd, stop_h)

assert abs(lid.bounding_box().size.X-OUT_W) < 0.02
assert abs(lid.bounding_box().size.Y-OUT_D) < 0.02
assert abs(lid.bounding_box().max.Z-TOP_Z) < 0.02
assert lid.bounding_box().min.Z >= PCB_STOP_BOTTOM-0.02
print(f"lid roof/display seat: {TOP_Z-ROOF_BOTTOM}/{DISPLAY_SEAT_T} mm; four snap pockets; closed FPC edge")
publish("lid", lid, "Upper shell")