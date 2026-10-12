# User-requested FPC tail placeholder. Straight visual stub only; final bend route is not verified.
# Ends beside the LCD left edge; J1's real body is already in the PCB STEP.
L=param("display_fpc_length",6.0)
W=param("display_fpc_width",4.0)
T=param("display_fpc_thickness",0.2)
body=Box(L,W,T,align=(Align.CENTER,Align.CENTER,Align.MIN))
body.color=srgb("#bd7e27")
publish("display_fpc",body,"FPC placeholder",material="nylon")
