# Stronger bevel on the overall outer underside perimeter; small opening bevels stay unchanged.
BASE_EDGE_CHAMFER = param("base_edge_chamfer", 0.18)
BASE_OUTER_EDGE_CHAMFER = param("base_outer_edge_chamfer", 0.38)
bottom_edges = list(base_shell.edges().group_by(Axis.Z)[0])
outer_limit_x = OUT_W/2 - OUT_R - 0.6
outer_limit_y = OUT_D/2 - OUT_R - 0.6
outer_bottom_edges = [e for e in bottom_edges if abs(e.center().X-CX) > outer_limit_x or abs(e.center().Y-CY) > outer_limit_y]
opening_bottom_edges = [e for e in bottom_edges if e not in outer_bottom_edges]
assert len(outer_bottom_edges) >= 4
base_shell = chamfer(outer_bottom_edges, BASE_OUTER_EDGE_CHAMFER)
if opening_bottom_edges:
    # Re-select remaining minimum-Z opening rims after the outer bevel changes topology.
    remaining_bottom = list(base_shell.edges().group_by(Axis.Z)[0])
    remaining_openings = [e for e in remaining_bottom if abs(e.center().X-CX) <= outer_limit_x and abs(e.center().Y-CY) <= outer_limit_y]
    if remaining_openings:
        base_shell = chamfer(remaining_openings, BASE_EDGE_CHAMFER)
print(f"base outer/opening chamfers: {BASE_OUTER_EDGE_CHAMFER}/{BASE_EDGE_CHAMFER} mm")
publish("base", base_shell, "Bottom shell")