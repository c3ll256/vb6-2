# Move the external microphone opening from the bottom to the annotated front
# long wall, below the second key position. Restore the former bottom opening.
mic_outlet_x = param("microphone_outlet_x", CX - 9.5)
mic_outlet_y = param("microphone_outlet_y", CY - OUT_D / 2)
mic_outlet_z = param("microphone_outlet_z", -1.8)
mic_outlet_diameter = param("microphone_outlet_diameter", 2.0)
mic_outlet_length = param("microphone_outlet_length", 4.0)
mic_outlet_funnel_diameter = param("microphone_outlet_funnel_diameter", 3.0)
old_mic_restore_diameter = param("old_microphone_restore_diameter", 3.2)

# Restore the previous floor hole and remove its obsolete internal chimney.
old_mic_x, old_mic_y = CX + 36.5, CY + 22.5
old_floor_patch = Pos(old_mic_x, old_mic_y, Z0) * Cylinder(
    old_mic_restore_diameter / 2,
    FLOOR_T,
    align=(Align.CENTER, Align.CENTER, Align.MIN),
)
old_chimney_clear = Pos(old_mic_x, old_mic_y, FLOOR_Z) * Cylinder(
    MIC_CHIMNEY_D / 2 + 0.15,
    4.8,
    align=(Align.CENTER, Align.CENTER, Align.MIN),
)
base_shell = (base_shell + old_floor_patch) - old_chimney_clear

# Horizontal bore through the marked front long wall. The shallow exterior
# funnel makes the opening easy to locate without weakening the 1.4 mm wall.
side_bore = (
    Pos(mic_outlet_x, mic_outlet_y - 1.0, mic_outlet_z)
    * Rot(90, 0, 0)
    * Cylinder(
        mic_outlet_diameter / 2,
        mic_outlet_length,
        align=(Align.CENTER, Align.CENTER, Align.CENTER),
    )
)
side_funnel = (
    Pos(mic_outlet_x, mic_outlet_y - 0.35, mic_outlet_z)
    * Rot(90, 0, 0)
    * Cone(
        mic_outlet_funnel_diameter / 2,
        mic_outlet_diameter / 2,
        0.7,
        align=(Align.CENTER, Align.CENTER, Align.CENTER),
    )
)
base_shell = base_shell - side_bore - side_funnel

print(f"microphone outlet: ({mic_outlet_x}, {mic_outlet_y}, {mic_outlet_z}), diameter {mic_outlet_diameter} mm")
publish("base", base_shell, "Bottom shell")