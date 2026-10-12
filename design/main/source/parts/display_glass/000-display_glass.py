# Placeholder active face. No UI image or operating-state claim.
W=param("display_glass_width",55.1948)
D=param("display_glass_depth",14.6972)
T=param("display_glass_thickness",0.25)
body=Box(W,D,T,align=(Align.CENTER,Align.CENTER,Align.MIN))
body.color=srgb("#102229")
publish("display_glass",body,"LCD active face",material="glass")
