"""端到端冒烟测试。

不接板子，把设备会发的每一种消息塞进接收队列，走真实的 _pump 路径，
并显式捕获 Tk 回调里会被静默吞掉的异常。

    python3 test_smoke.py     # 退出码 0 = PASS

存在的理由：一次批量改名把 _pump 里的 self._handle 改坏成了 self.chandle，
异常被 Tk 吞掉、消息泵停止重新调度，界面上只显示「设备没应答」。
直接调用 _handle 的测试发现不了这个 —— 必须走 _pump。
"""
import sys, time, traceback, tkinter as tk
sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
import vb6_tool as V

fails=[]
root=tk.Tk()
root.report_callback_exception=lambda *a: fails.append("".join(traceback.format_exception(*a)))
V.FONT_UI=V._pick(["SF Pro Text","Helvetica Neue","Helvetica"],"Helvetica")
V.FONT_MONO=V._pick(["SF Mono","Menlo","Monaco"],"Courier")
app=V.App(root); root.geometry("1060x800")

# 把设备真实会发的每一种消息塞进接收队列，让 _pump 自己去处理
for msg in [
    ("READY", {"version":"1.0.0","uid":"86EEF8B47587"}),
    ("INFO",  {"version":"1.0.0","uid":"86EEF8B47587","hid":True,
               "consumer":True,"nvm":8192,"mode":"live"}),
    ("CFG",   {"armed":False,"keys":[
                 {"type":"consumer","code":0x00E2},
                 {"type":"key","mod":8,"code":6},
                 {"type":"text","text":"hello-vb6"},
                 {"type":"key","mod":0,"code":0x3E}]}),
    ("TEL",   {"rate":2200,"mad":10.6,"n":220,"keys":"....","dc":1.652,"pp":74.0}),
    ("EV",    {"k":0,"d":1,"t":123,"act":"consumer"}),
    ("TEL",   {"rate":2200,"mad":92.4,"n":220,"keys":"D...","dc":1.651,"pp":840.0}),
    ("EV",    {"k":0,"d":0,"t":180,"act":"-"}),
    ("BOUNCE",{"k":0,"edges":9,"settle_us":2300}),
    ("ERR",   "some device error"),
]:
    app.link.rx.put(msg)

t=time.time()
while time.time()-t<2.5:
    root.update(); time.sleep(0.03)

print("Tk 回调异常:", len(fails))
for f in fails: print(f)
print()
print("info 已填充 :", app.info is not None)
print("状态栏      :", app.status.text)
print("映射预览    :", [r["preview"].cget("text") for r in app.rows])
print("K1 计数     :", app.count_labels[0].cget("text"))
print("K1 抖动     :", app.bounce_labels[0].cget("text"))
print("电平        :", app.meter_txt.cget("text"))
print("控件已解锁  :", all(getattr(w,"enabled",True) for w in app.widgets))
ok = not fails and app.info is not None and app.status.tone=="ok"
print()
print("RESULT:", "PASS" if ok else "FAIL")
root.destroy()
sys.exit(0 if ok else 1)
