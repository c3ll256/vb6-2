# Stronger bevel on the overall outer top perimeter; display/key opening bevels stay unchanged.
LID_EDGE_CHAMFER = param("lid_edge_chamfer", 0.18)
LID_OUTER_EDGE_CHAMFER = param("lid_outer_edge_chamfer", 0.38)
top_edges = list(lid.edges().group_by(Axis.Z)[-1])
outer_limit_x = OUT_W/2 - OUT_R - 0.6
outer_limit_y = OUT_D/2 - OUT_R - 0.6
outer_top_edges = [e for e in top_edges if abs(e.center().X-CX) > outer_limit_x or abs(e.center().Y-CY) > outer_limit_y]
assert len(outer_top_edges) >= 4
lid = chamfer(outer_top_edges, LID_OUTER_EDGE_CHAMFER)
# Re-select only central display/key rims after the outer bevel changes topology.
remaining_top = list(lid.edges().group_by(Axis.Z)[-1])
opening_top_edges = [e for e in remaining_top if abs(e.center().X-CX) <= outer_limit_x and abs(e.center().Y-CY) <= outer_limit_y]
if opening_top_edges:
    lid = chamfer(opening_top_edges, LID_EDGE_CHAMFER)
print(f"lid outer/opening chamfers: {LID_OUTER_EDGE_CHAMFER}/{LID_EDGE_CHAMFER} mm")
publish("lid", lid, "Upper shell")