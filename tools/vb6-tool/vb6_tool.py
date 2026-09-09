#!/usr/bin/env python3
"""vb6 Macro Pad Tool -- key mapping + hardware self-test for the
credit-card-size four-key macro pad.

Talks the "#V6" line protocol to firmware/code.py over the board's USB CDC.
Requires: python3 with tkinter, pyserial.

UI is drawn from tk primitives (not ttk) so the look is consistent instead of
inheriting whatever the Aqua theme does to comboboxes and frames.
"""

import glob
import json
import math
import queue
import statistics
import subprocess
import threading
import time
import traceback
import tkinter as tk
import tkinter.font as tkfont
from tkinter import filedialog, messagebox

import serial

APP = "vb6 Macro Pad"
BAUD = 115200
KEY_NAMES = ("K1", "K2", "K3", "K4")


# ------------------------------------------------------------------ appearance

def _is_dark():
    try:
        r = subprocess.run(["defaults", "read", "-g", "AppleInterfaceStyle"],
                           capture_output=True, text=True, timeout=2)
        return r.stdout.strip() == "Dark"
    except Exception:
        return False


LIGHT = dict(
    bg="#f4f5f7", card="#ffffff", raised="#fbfbfd", border="#e2e5ea",
    text="#1b1f26", muted="#6d7480", faint="#9aa1ac",
    accent="#2f6df6", accent_text="#ffffff", accent_soft="#e8f0ff",
    ok="#12a150", warn="#c2740a", bad="#e5484d",
    track="#e8eaee", shadow="#eceef2",
)
DARK = dict(
    bg="#15171c", card="#1e2128", raised="#242833", border="#2f3540",
    text="#e7e9ec", muted="#98a0ac", faint="#6d7684",
    accent="#4c8dff", accent_text="#ffffff", accent_soft="#20304d",
    ok="#30c76a", warn="#f0a83c", bad="#ff6369",
    track="#2b303a", shadow="#191c22",
)
PAL = DARK if _is_dark() else LIGHT


def _pick(cands, default):
    fams = set(tkfont.families())
    for c in cands:
        if c in fams:
            return c
    return default


FONT_UI = None      # filled in after Tk() exists
FONT_MONO = None


def F(size=13, weight="normal"):
    return (FONT_UI, size, weight)


def M(size=11):
    return (FONT_MONO, size)


def round_rect(c, x1, y1, x2, y2, r, **kw):
    r = min(r, (x2 - x1) / 2, (y2 - y1) / 2)
    pts = [x1 + r, y1, x2 - r, y1, x2, y1, x2, y1 + r, x2, y2 - r, x2, y2,
           x2 - r, y2, x1 + r, y2, x1, y2, x1, y2 - r, x1, y1 + r, x1, y1]
    return c.create_polygon(pts, smooth=True, **kw)


# ------------------------------------------------------------------ HID tables

KEYSYM_HID = {}
for _i, _c in enumerate("abcdefghijklmnopqrstuvwxyz"):
    KEYSYM_HID[_c] = 0x04 + _i
for _i, _c in enumerate("1234567890"):
    KEYSYM_HID[_c] = 0x1E + _i
KEYSYM_HID.update({
    "Return": 0x28, "Escape": 0x29, "BackSpace": 0x2A, "Tab": 0x2B,
    "space": 0x2C, "minus": 0x2D, "equal": 0x2E, "bracketleft": 0x2F,
    "bracketright": 0x30, "backslash": 0x31, "semicolon": 0x33,
    "apostrophe": 0x34, "grave": 0x35, "comma": 0x36, "period": 0x37,
    "slash": 0x38, "Home": 0x4A, "Prior": 0x4B, "Delete": 0x4C,
    "End": 0x4D, "Next": 0x4E, "Right": 0x4F, "Left": 0x50,
    "Down": 0x51, "Up": 0x52, "Insert": 0x49,
})
for _i in range(1, 13):
    KEYSYM_HID["F%d" % _i] = 0x3A + _i - 1

HID_NAME = {v: k for k, v in KEYSYM_HID.items()}
PRETTY = {"Return": "↩", "space": "Space", "Escape": "Esc", "BackSpace": "⌫",
          "Delete": "⌦", "Tab": "⇥", "Left": "←", "Right": "→", "Up": "↑",
          "Down": "↓", "minus": "-", "equal": "=", "comma": ",",
          "period": ".", "slash": "/", "semicolon": ";", "grave": "`",
          "apostrophe": "'", "backslash": "\\", "bracketleft": "[",
          "bracketright": "]"}

MOD_CTRL, MOD_SHIFT, MOD_ALT, MOD_GUI = 0x01, 0x02, 0x04, 0x08
MOD_LABEL = ((MOD_CTRL, "⌃"), (MOD_ALT, "⌥"), (MOD_SHIFT, "⇧"), (MOD_GUI, "⌘"))

CONSUMER = [
    ("静音 Mute", 0x00E2), ("音量 +", 0x00E9), ("音量 -", 0x00EA),
    ("播放 / 暂停", 0x00CD), ("下一曲", 0x00B5), ("上一曲", 0x00B6),
    ("亮度 +", 0x006F), ("亮度 -", 0x0070),
]
CONSUMER_NAME = {c: n for n, c in CONSUMER}

TYPES = (("组合键", "key"), ("文本", "text"), ("媒体键", "consumer"))
TYPE_LABEL = {v: k for k, v in TYPES}


def action_label(a):
    t = a.get("type")
    if t == "key":
        code = a.get("code", 0)
        if not code:
            return "未设置"
        mods = "".join(s for bit, s in MOD_LABEL if a.get("mod", 0) & bit)
        base = HID_NAME.get(code, "?")
        return mods + PRETTY.get(base, base.upper())
    if t == "text":
        s = a.get("text", "")
        return ('"%s"' % s) if s else "空文本"
    if t == "consumer":
        return CONSUMER_NAME.get(a.get("code", 0),
                                 "0x%04X" % a.get("code", 0))
    return "无"


# ---------------------------------------------------------------- device link

class Link:
    """Background reader for the #V6 line protocol."""

    def __init__(self):
        self.ser = None
        self.rx = queue.Queue()
        self._stop = threading.Event()

    @staticmethod
    def ports():
        return sorted(glob.glob("/dev/cu.usbmodem*"))

    def connect(self, port):
        self.close()
        self.ser = serial.Serial(port, BAUD, timeout=0.2)
        self._stop = threading.Event()
        threading.Thread(target=self._reader, daemon=True).start()

    def _reader(self):
        buf = b""
        ser = self.ser
        while not self._stop.is_set():
            try:
                chunk = ser.read(4096)
            except Exception as e:
                if not self._stop.is_set():
                    self.rx.put(("_ERR", str(e)))
                return
            if not chunk:
                continue
            buf += chunk
            while b"\n" in buf:
                raw, buf = buf.split(b"\n", 1)
                line = raw.decode("utf-8", "replace").strip()
                if not line.startswith("#V6 "):
                    continue           # REPL noise -- not ours, drop it
                kind, _, rest = line[4:].partition(" ")
                obj = None
                if rest:
                    try:
                        obj = json.loads(rest)
                    except Exception:
                        obj = rest
                self.rx.put((kind, obj))

    def send(self, line):
        if not self.ser:
            return False
        try:
            self.ser.write((line + "\n").encode())
            return True
        except Exception:
            return False

    def close(self):
        self._stop.set()
        if self.ser:
            try:
                self.ser.close()
            except Exception:
                pass
        self.ser = None


# --------------------------------------------------------------- UI primitives

class Btn(tk.Canvas):
    """Flat rounded button."""

    def __init__(self, parent, text, command, kind="ghost", w=None, h=32,
                 bg=None):
        self.pal = PAL
        self.kind = kind
        self.text = text
        self.command = command
        self.enabled = True
        self._hover = False
        self.host_bg = bg or PAL["card"]
        f = F(12, "bold" if kind == "primary" else "normal")
        tmp = tkfont.Font(font=f)
        w = w or tmp.measure(text) + 34
        super().__init__(parent, width=w, height=h, highlightthickness=0,
                         bg=self.host_bg, cursor="pointinghand")
        self.cw, self.ch = w, h
        self.bind("<Button-1>", self._click)
        self.bind("<Enter>", lambda e: self._set_hover(True))
        self.bind("<Leave>", lambda e: self._set_hover(False))
        self._draw()

    def _colors(self):
        p = self.pal
        if not self.enabled:
            return p["track"], p["faint"], p["track"]
        if self.kind == "primary":
            return (p["accent"] if not self._hover else p["accent"]), \
                   p["accent_text"], p["accent"]
        if self.kind == "danger":
            return (p["card"] if not self._hover else "#fdecec"), \
                   p["bad"], p["border"]
        return (p["card"] if not self._hover else p["raised"]), \
               p["text"], p["border"]

    def _draw(self):
        self.delete("all")
        fill, fg, outline = self._colors()
        round_rect(self, 1, 1, self.cw - 1, self.ch - 1, 8,
                   fill=fill, outline=outline, width=1)
        self.create_text(self.cw / 2, self.ch / 2, text=self.text, fill=fg,
                         font=F(12, "bold" if self.kind == "primary"
                                else "normal"))

    def _set_hover(self, v):
        self._hover = v and self.enabled
        self._draw()

    def _click(self, _):
        if self.enabled and self.command:
            self.command()

    def config_state(self, on):
        self.enabled = on
        self._hover = False
        self._draw()


class Segmented(tk.Canvas):
    """Segmented control; options is a list of labels."""

    def __init__(self, parent, options, command=None, h=30, seg_w=64,
                 bg=None):
        self.options = list(options)
        self.command = command
        self.idx = 0
        self.enabled = True
        self.host_bg = bg or PAL["card"]
        w = seg_w * len(options) + 4
        super().__init__(parent, width=w, height=h, highlightthickness=0,
                         bg=self.host_bg, cursor="pointinghand")
        self.cw, self.ch, self.sw = w, h, seg_w
        self.bind("<Button-1>", self._click)
        self._draw()

    def _draw(self):
        self.delete("all")
        p = self.pal = PAL
        round_rect(self, 0, 0, self.cw, self.ch, 8, fill=p["track"],
                   outline="")
        for i, label in enumerate(self.options):
            x1 = 2 + i * self.sw
            x2 = x1 + self.sw
            sel = (i == self.idx)
            if sel:
                round_rect(self, x1, 2, x2, self.ch - 2, 6,
                           fill=p["card"] if self.enabled else p["track"],
                           outline=p["border"], width=1)
            self.create_text((x1 + x2) / 2, self.ch / 2, text=label,
                             font=F(11, "bold" if sel else "normal"),
                             fill=(p["text"] if sel else p["muted"])
                             if self.enabled else p["faint"])

    def _click(self, ev):
        if not self.enabled:
            return
        i = int((ev.x - 2) // self.sw)
        if 0 <= i < len(self.options) and i != self.idx:
            self.idx = i
            self._draw()
            if self.command:
                self.command(i)

    def set(self, i):
        self.idx = max(0, min(i, len(self.options) - 1))
        self._draw()

    def get(self):
        return self.idx

    def config_state(self, on):
        self.enabled = on
        self._draw()


class Select(tk.Canvas):
    """Rounded trigger that pops a native menu."""

    def __init__(self, parent, values, command=None, w=180, h=30, bg=None):
        self.values = list(values)
        self.command = command
        self.value = self.values[0] if self.values else ""
        self.enabled = True
        self.host_bg = bg or PAL["card"]
        super().__init__(parent, width=w, height=h, highlightthickness=0,
                         bg=self.host_bg, cursor="pointinghand")
        self.cw, self.ch = w, h
        self.bind("<Button-1>", self._popup)
        self._draw()

    def _draw(self):
        self.delete("all")
        p = PAL
        round_rect(self, 1, 1, self.cw - 1, self.ch - 1, 8,
                   fill=p["card"] if self.enabled else p["track"],
                   outline=p["border"], width=1)
        self.create_text(12, self.ch / 2, text=self.value, anchor="w",
                         font=F(12),
                         fill=p["text"] if self.enabled else p["faint"])
        x = self.cw - 16
        y = self.ch / 2
        self.create_line(x - 4, y - 2, x, y + 2, x + 4, y - 2,
                         fill=p["muted"] if self.enabled else p["faint"],
                         width=1.6, capstyle="round", joinstyle="round")

    def _popup(self, ev):
        if not self.enabled or not self.values:
            return
        m = tk.Menu(self, tearoff=0)
        for v in self.values:
            m.add_command(label=v, command=lambda vv=v: self.set(vv, True))
        try:
            m.tk_popup(self.winfo_rootx(), self.winfo_rooty() + self.ch)
        finally:
            m.grab_release()

    def set(self, v, fire=False):
        self.value = v
        self._draw()
        if fire and self.command:
            self.command(v)

    def set_values(self, values):
        self.values = list(values)
        if self.value not in self.values:
            self.value = self.values[0] if self.values else ""
        self._draw()

    def get(self):
        return self.value

    def config_state(self, on):
        self.enabled = on
        self._draw()


class Toggle(tk.Canvas):
    def __init__(self, parent, command=None, bg=None):
        self.command = command
        self.on = False
        self.enabled = True
        super().__init__(parent, width=46, height=28, highlightthickness=0,
                         bg=bg or PAL["card"], cursor="pointinghand")
        self.bind("<Button-1>", self._click)
        self._draw()

    def _draw(self):
        self.delete("all")
        p = PAL
        fill = p["accent"] if self.on else p["track"]
        if not self.enabled:
            fill = p["track"]
        round_rect(self, 2, 4, 44, 24, 10, fill=fill, outline="")
        cx = 34 if self.on else 12
        self.create_oval(cx - 8, 6, cx + 8, 22, fill=p["card"],
                         outline=p["border"])

    def _click(self, _):
        if not self.enabled:
            return
        self.on = not self.on
        self._draw()
        if self.command:
            self.command(self.on)

    def set(self, v):
        self.on = bool(v)
        self._draw()

    def config_state(self, on):
        self.enabled = on
        self._draw()


class KeyTile(tk.Canvas):
    def __init__(self, parent, name, bg=None):
        self.name = name
        self.down = False
        super().__init__(parent, width=104, height=76, highlightthickness=0,
                         bg=bg or PAL["card"])
        self._draw()

    def _draw(self):
        self.delete("all")
        p = PAL
        fill = p["accent"] if self.down else p["raised"]
        outline = p["accent"] if self.down else p["border"]
        round_rect(self, 2, 2, 102, 74, 12, fill=fill, outline=outline,
                   width=1.5)
        self.create_text(52, 38, text=self.name, font=F(24, "bold"),
                         fill=p["accent_text"] if self.down else p["muted"])

    def set(self, down):
        if down != self.down:
            self.down = down
            self._draw()


class Meter(tk.Canvas):
    def __init__(self, parent, bg=None, h=34):
        super().__init__(parent, height=h, highlightthickness=0,
                         bg=bg or PAL["card"])
        self.ch = h
        self.frac = 0.0
        self.colour = PAL["accent"]
        self.bind("<Configure>", lambda e: self._draw())

    def set(self, frac, colour):
        self.frac = max(0.0, min(1.0, frac))
        self.colour = colour
        self._draw()

    def _draw(self):
        self.delete("all")
        p = PAL
        w = self.winfo_width() or 400
        h = self.ch
        round_rect(self, 0, 6, w, h - 6, 8, fill=p["track"], outline="")
        if self.frac > 0.01:
            round_rect(self, 0, 6, max(14, w * self.frac), h - 6, 8,
                       fill=self.colour, outline="")
        for db in (20, 40):                      # reference ticks
            x = w * db / 60.0
            self.create_line(x, 4, x, h - 4, fill=p["border"], width=1)


class StatusPill(tk.Canvas):
    def __init__(self, parent, bg=None):
        super().__init__(parent, width=420, height=30, highlightthickness=0,
                         bg=bg or PAL["card"])
        self.text = "未连接"
        self.tone = "muted"
        self._draw()

    def set(self, text, tone="muted"):
        self.text, self.tone = text, tone
        self._draw()

    def _draw(self):
        self.delete("all")
        p = PAL
        col = {"ok": p["ok"], "warn": p["warn"], "bad": p["bad"],
               "muted": p["faint"]}[self.tone]
        self.create_oval(4, 11, 12, 19, fill=col, outline="")
        self.create_text(20, 15, text=self.text, anchor="w", font=F(12),
                         fill=p["muted"] if self.tone == "muted" else p["text"])


def card(parent, title=None, pad=16):
    """A white panel with an optional title; returns the body frame."""
    outer = tk.Frame(parent, bg=PAL["border"])
    inner = tk.Frame(outer, bg=PAL["card"])
    inner.pack(fill="both", expand=True, padx=1, pady=1)
    if title:
        head = tk.Frame(inner, bg=PAL["card"])
        head.pack(fill="x", padx=pad, pady=(pad - 2, 0))
        tk.Label(head, text=title, font=F(13, "bold"), bg=PAL["card"],
                 fg=PAL["text"]).pack(side="left")
        outer.head = head
    body = tk.Frame(inner, bg=PAL["card"])
    body.pack(fill="both", expand=True, padx=pad, pady=pad)
    outer.body = body
    return outer


# ----------------------------------------------------------------------- app

class App:
    def __init__(self, root):
        self.root = root
        root.title(APP)
        root.geometry("1060x800")
        root.minsize(1000, 720)
        root.configure(bg=PAL["bg"])

        self.link = Link()
        self.cfg = None
        self.info = None
        self.widgets = []          # everything gated on connection

        self.counts = [0, 0, 0, 0]
        self.live = [False] * 4
        self.bounce = [None] * 4
        self.mic_floor = None
        self.mic_signal = None
        self.mic_samples = []
        self.mic_job = None
        self.bounce_seq = 0

        self._build_header()
        self._build_tabs()
        self._build_map()
        self._build_test()
        self.show_tab(0)

        self._gate(False)
        self.root.after(50, self._pump)
        self.refresh_ports()

    # -- header ----------------------------------------------------------
    def _build_header(self):
        h = tk.Frame(self.root, bg=PAL["card"], height=72)
        h.pack(fill="x")
        h.pack_propagate(False)
        line = tk.Frame(self.root, bg=PAL["border"], height=1)
        line.pack(fill="x")

        left = tk.Frame(h, bg=PAL["card"])
        left.pack(side="left", padx=20)
        tk.Label(left, text="vb6 Macro Pad", font=F(17, "bold"),
                 bg=PAL["card"], fg=PAL["text"]).pack(anchor="w")
        tk.Label(left, text="信用卡尺寸四键宏键盘 · 映射与自检",
                 font=F(11), bg=PAL["card"], fg=PAL["muted"]).pack(anchor="w")

        right = tk.Frame(h, bg=PAL["card"])
        right.pack(side="right", padx=20)
        self.port_sel = Select(right, [""], w=230)
        self.port_sel.pack(side="left", padx=(0, 8))
        Btn(right, "刷新", self.refresh_ports, w=56).pack(side="left")
        self.btn_conn = Btn(right, "连接", self.toggle_conn, kind="primary",
                            w=76)
        self.btn_conn.pack(side="left", padx=8)

        sb = tk.Frame(self.root, bg=PAL["bg"])
        sb.pack(fill="x", padx=20, pady=(10, 0))
        self.status = StatusPill(sb, bg=PAL["bg"])
        self.status.pack(side="left")

    def refresh_ports(self):
        ps = Link.ports() or ["(没找到串口)"]
        self.port_sel.set_values(ps)

    # -- tabs ------------------------------------------------------------
    def _build_tabs(self):
        bar = tk.Frame(self.root, bg=PAL["bg"])
        bar.pack(fill="x", padx=20, pady=(8, 0))
        self.tabs = Segmented(bar, ["按键映射", "硬件自检"],
                              command=self.show_tab, seg_w=110, h=34,
                              bg=PAL["bg"])
        self.tabs.pack(side="left")
        self.body = tk.Frame(self.root, bg=PAL["bg"])
        self.body.pack(fill="both", expand=True, padx=20, pady=14)
        self.page_map = tk.Frame(self.body, bg=PAL["bg"])
        self.page_test = tk.Frame(self.body, bg=PAL["bg"])

    def show_tab(self, i):
        self.tabs.set(i)
        self.page_map.pack_forget()
        self.page_test.pack_forget()
        (self.page_map if i == 0 else self.page_test).pack(
            fill="both", expand=True)

    # -- mapping page ----------------------------------------------------
    def _build_map(self):
        p = self.page_map

        arm = card(p, "HID 输出")
        arm.pack(fill="x")
        b = arm.body
        self.toggle = Toggle(b, command=self.on_arm)
        self.toggle.grid(row=0, column=0, rowspan=2, padx=(0, 14), sticky="w")
        self.arm_title = tk.Label(
            b, text="已关闭 — 按键不会发送到 macOS", font=F(13, "bold"),
            bg=PAL["card"], fg=PAL["text"])
        self.arm_title.grid(row=0, column=1, sticky="w")
        tk.Label(b, text="打开后按键会真的发送给当前聚焦的窗口，"
                         "开之前先确认焦点不在重要位置。",
                 font=F(11), bg=PAL["card"], fg=PAL["muted"]).grid(
            row=1, column=1, sticky="w")
        self.widgets.append(self.toggle)

        mp = card(p, "四个键的映射")
        mp.pack(fill="x", pady=(14, 0))
        g = mp.body
        for col, wt in ((0, 0), (1, 0), (2, 1), (3, 0)):
            g.columnconfigure(col, weight=wt)
        for col, txt in ((0, "键"), (1, "类型"), (2, "内容"), (3, "当前")):
            tk.Label(g, text=txt, font=F(11, "bold"), bg=PAL["card"],
                     fg=PAL["faint"]).grid(row=0, column=col, sticky="w",
                                           pady=(0, 8),
                                           padx=(0, 14) if col < 3 else 0)
        self.rows = []
        for i, name in enumerate(KEY_NAMES):
            self.rows.append(self._build_row(g, i, name))

        btns = tk.Frame(p, bg=PAL["bg"])
        btns.pack(fill="x", pady=14)
        for txt, cmd, kind in (("从设备读取", self.do_getcfg, "ghost"),
                               ("应用到设备", self.do_setcfg, "ghost"),
                               ("写入 NVM（掉电保留）", self.do_save, "primary"),
                               ("恢复默认", self.do_default, "ghost"),
                               ("维护模式…", self.do_maint, "ghost")):
            btn = Btn(btns, txt, cmd, kind=kind, h=34, bg=PAL["bg"])
            btn.pack(side="left", padx=(0, 10))
            self.widgets.append(btn)

        tk.Label(p, justify="left", bg=PAL["bg"], fg=PAL["muted"], font=F(11),
                 text=("K1 出厂默认是麦克风静音键（Consumer Mute），"
                       "这是 PRD 指定的默认映射；四个键都可改。\n"
                       "「应用到设备」只改运行时配置，断电就没了；"
                       "「写入 NVM」才会持久化到芯片的 8KB 非易失存储。")
                 ).pack(anchor="w")

    def _build_row(self, g, idx, name):
        r = idx + 1
        badge = tk.Canvas(g, width=42, height=42, highlightthickness=0,
                          bg=PAL["card"])
        round_rect(badge, 1, 1, 41, 41, 10, fill=PAL["accent_soft"],
                   outline="")
        badge.create_text(21, 21, text=name, font=F(14, "bold"),
                          fill=PAL["accent"])
        badge.grid(row=r, column=0, sticky="w", pady=6, padx=(0, 14))

        seg = Segmented(g, [t[0] for t in TYPES], seg_w=62, h=30)
        seg.grid(row=r, column=1, sticky="w", pady=6, padx=(0, 14))
        self.widgets.append(seg)

        holder = tk.Frame(g, bg=PAL["card"])
        holder.grid(row=r, column=2, sticky="ew", pady=6, padx=(0, 14))

        preview = tk.Label(g, text="—", font=M(12), bg=PAL["card"],
                           fg=PAL["ok"], anchor="e", width=16)
        preview.grid(row=r, column=3, sticky="e", pady=6)

        row = {"idx": idx, "seg": seg, "holder": holder, "preview": preview,
               "key": {"mod": 0, "code": 0}, "text": tk.StringVar(value=""),
               "consumer": CONSUMER[0][0], "keylabel": "未设置",
               "widgets": []}
        seg.command = lambda i, rw=row: self._render_row(rw)
        self._render_row(row)
        return row

    def _render_row(self, row):
        for w in row["widgets"]:
            try:
                self.widgets.remove(w)
            except ValueError:
                pass
        row["widgets"] = []
        for w in row["holder"].winfo_children():
            w.destroy()
        h = row["holder"]
        kind = TYPES[row["seg"].get()][1]

        if kind == "key":
            chip = tk.Canvas(h, width=132, height=30, highlightthickness=0,
                             bg=PAL["card"])
            round_rect(chip, 1, 1, 131, 29, 8, fill=PAL["raised"],
                       outline=PAL["border"], width=1)
            chip.create_text(66, 15, text=row["keylabel"], font=F(13, "bold"),
                             fill=PAL["text"])
            chip.pack(side="left", padx=(0, 8))
            row["chip"] = chip
            b = Btn(h, "录制快捷键", lambda r=row: self._capture(r), w=104)
            b.pack(side="left")
            row["widgets"].append(b)
            self.widgets.append(b)
        elif kind == "text":
            e = tk.Entry(h, textvariable=row["text"], font=F(13),
                         bg=PAL["raised"], fg=PAL["text"], relief="flat",
                         insertbackground=PAL["text"],
                         highlightthickness=1,
                         highlightbackground=PAL["border"],
                         highlightcolor=PAL["accent"])
            e.pack(side="left", ipady=5, fill="x", expand=True)
            row["widgets"].append(e)
            self.widgets.append(e)
            tk.Label(h, text="≤64 ASCII", font=F(10), bg=PAL["card"],
                     fg=PAL["faint"]).pack(side="left", padx=8)
        else:
            s = Select(h, [c[0] for c in CONSUMER], w=150)
            s.set(row["consumer"])
            s.command = lambda v, r=row: r.__setitem__("consumer", v)
            s.pack(side="left")
            row["select"] = s
            row["widgets"].append(s)
            self.widgets.append(s)

        self._update_preview(row)
        if self.link.ser:
            self._gate(True)

    def _update_preview(self, row):
        row["preview"].config(text=action_label(self._row_to_action(row)))

    def _capture(self, row):
        top = tk.Toplevel(self.root)
        top.title("录制快捷键")
        top.geometry("400x180")
        top.configure(bg=PAL["card"])
        top.transient(self.root)
        top.grab_set()
        tk.Label(top, text="按下你想要的组合键", font=F(15, "bold"),
                 bg=PAL["card"], fg=PAL["text"]).pack(pady=(30, 4))
        tk.Label(top, text="Esc 取消", font=F(11), bg=PAL["card"],
                 fg=PAL["muted"]).pack()
        shown = tk.Label(top, text="…", font=F(26, "bold"), bg=PAL["card"],
                         fg=PAL["accent"])
        shown.pack(pady=14)

        def on_key(ev):
            if ev.keysym == "Escape":
                top.destroy()
                return "break"
            code = KEYSYM_HID.get(ev.keysym) or \
                KEYSYM_HID.get(ev.keysym.lower())
            if code is None:
                return "break"
            mod = 0
            if ev.state & 0x1:
                mod |= MOD_SHIFT
            if ev.state & 0x4:
                mod |= MOD_CTRL
            if ev.state & 0x8:
                mod |= MOD_GUI
            if ev.state & 0x10:
                mod |= MOD_ALT
            row["key"] = {"mod": mod, "code": code}
            row["keylabel"] = action_label(
                {"type": "key", "mod": mod, "code": code})
            shown.config(text=row["keylabel"])
            self._render_row(row)
            top.after(260, top.destroy)
            return "break"

        top.bind("<KeyPress>", on_key)
        top.focus_force()

    def _row_to_action(self, row):
        kind = TYPES[row["seg"].get()][1]
        if kind == "key":
            a = {"type": "key", "mod": row["key"]["mod"],
                 "code": row["key"]["code"]}
        elif kind == "text":
            a = {"type": "text", "text": row["text"].get()[:64]}
        else:
            a = {"type": "consumer", "code": dict(CONSUMER)[row["consumer"]]}
        a["label"] = action_label(a)
        return a

    def _apply_cfg_to_ui(self, cfg):
        self.cfg = cfg
        armed = bool(cfg.get("armed"))
        self.toggle.set(armed)
        self.arm_title.config(
            text="已启用 — 按键会发送到 macOS" if armed
            else "已关闭 — 按键不会发送到 macOS",
            fg=PAL["warn"] if armed else PAL["text"])
        for i, row in enumerate(self.rows):
            try:
                a = cfg["keys"][i]
            except Exception:
                continue
            t = a.get("type", "key")
            row["seg"].set([x[1] for x in TYPES].index(t)
                           if t in [x[1] for x in TYPES] else 0)
            if t == "key":
                row["key"] = {"mod": a.get("mod", 0), "code": a.get("code", 0)}
                row["keylabel"] = action_label(a)
            elif t == "text":
                row["text"].set(a.get("text", ""))
            elif t == "consumer":
                row["consumer"] = CONSUMER_NAME.get(a.get("code", 0),
                                                    CONSUMER[0][0])
            self._render_row(row)
            self.map_labels[i].config(text=action_label(a))

    def _collect_cfg(self):
        return {"armed": bool(self.toggle.on),
                "keys": [self._row_to_action(r) for r in self.rows]}

    def on_arm(self, on):
        self.link.send("ARM %d" % (1 if on else 0))

    def do_getcfg(self):
        self.link.send("GETCFG")

    def do_setcfg(self):
        for r in self.rows:
            self._update_preview(r)
        self.link.send("SETCFG " + json.dumps(self._collect_cfg()))

    def do_save(self):
        self.do_setcfg()
        self.root.after(250, lambda: self.link.send("SAVE"))

    def do_default(self):
        self.link.send("SETCFG " + json.dumps({
            "armed": False,
            "keys": [
                {"type": "consumer", "code": 0x00E2},
                {"type": "key", "mod": MOD_GUI, "code": KEYSYM_HID["c"]},
                {"type": "key", "mod": MOD_GUI, "code": KEYSYM_HID["v"]},
                {"type": "text", "text": "vb6"},
            ]}))

    def do_maint(self):
        if not messagebox.askokcancel(
                APP,
                "设备平时不挂载 CIRCUITPY 磁盘，所以拔线不会再弹"
                "「磁盘未正常退出」。\n\n"
                "点确定后，下一次插入 USB 时磁盘会出现一次，"
                "方便更新固件；再下一次插入就又会隐藏。\n\n"
                "（也可以按住任意一个键再插 USB，效果一样。）"):
            return
        self.link.send("MAINT")
        self.log("已请求维护模式：拔掉再插上，CIRCUITPY 会出现一次。", "warn")
        self.show_tab(1)

    # -- test page -------------------------------------------------------
    def _build_test(self):
        p = self.page_test

        kb = card(p, "按键自检")
        kb.pack(fill="x")
        b = kb.body
        grid = tk.Frame(b, bg=PAL["card"])
        grid.pack(fill="x")
        self.tiles, self.count_labels = [], []
        self.map_labels, self.bounce_labels = [], []
        for i, name in enumerate(KEY_NAMES):
            col = tk.Frame(grid, bg=PAL["card"])
            col.pack(side="left", expand=True, fill="x")
            t = KeyTile(col, name)
            t.pack()
            self.tiles.append(t)
            m = tk.Label(col, text="—", font=M(11), bg=PAL["card"],
                         fg=PAL["ok"])
            m.pack(pady=(8, 0))
            self.map_labels.append(m)
            c = tk.Label(col, text="按下 0 次", font=F(11), bg=PAL["card"],
                         fg=PAL["text"])
            c.pack()
            self.count_labels.append(c)
            bl = tk.Label(col, text="抖动未测", font=F(10), bg=PAL["card"],
                          fg=PAL["faint"])
            bl.pack()
            self.bounce_labels.append(bl)

        row = tk.Frame(b, bg=PAL["card"])
        row.pack(fill="x", pady=(16, 0))
        for txt, cmd in (("抖动测试", self.start_bounce),
                         ("清零计数", self.reset_counts)):
            btn = Btn(row, txt, cmd, h=32)
            btn.pack(side="left", padx=(0, 10))
            self.widgets.append(btn)
        self.bounce_hint = tk.Label(row, text="", font=F(11), bg=PAL["card"],
                                    fg=PAL["warn"])
        self.bounce_hint.pack(side="left", padx=6)

        mb = card(p, "麦克风自检")
        mb.pack(fill="both", expand=True, pady=(14, 0))
        b2 = mb.body

        mrow = tk.Frame(b2, bg=PAL["card"])
        mrow.pack(fill="x")
        tk.Label(mrow, text="电平", font=F(11), bg=PAL["card"],
                 fg=PAL["muted"]).pack(side="left", padx=(0, 10))
        self.meter = Meter(mrow)
        self.meter.pack(side="left", fill="x", expand=True)
        self.meter_txt = tk.Label(mrow, text="—", font=M(12), width=24,
                                  anchor="e", bg=PAL["card"], fg=PAL["text"])
        self.meter_txt.pack(side="left", padx=(12, 0))

        brow = tk.Frame(b2, bg=PAL["card"])
        brow.pack(fill="x", pady=(14, 0))
        b3 = Btn(brow, "① 测底噪（安静 3 秒）",
                 lambda: self.start_mic("floor", 3), h=32)
        b3.pack(side="left", padx=(0, 10))
        b4 = Btn(brow, "② 测发声（说话 5 秒）",
                 lambda: self.start_mic("signal", 5), kind="primary", h=32)
        b4.pack(side="left", padx=(0, 10))
        b5 = Btn(brow, "导出报告…", self.export_report, h=32)
        b5.pack(side="left")
        self.widgets += [b3, b4, b5]
        self.mic_hint = tk.Label(brow, text="", font=F(11), bg=PAL["card"],
                                 fg=PAL["warn"])
        self.mic_hint.pack(side="left", padx=10)

        wrap = tk.Frame(b2, bg=PAL["border"])
        wrap.pack(fill="both", expand=True, pady=(14, 0))
        self.result = tk.Text(wrap, height=10, wrap="word", font=M(11),
                              relief="flat", bg=PAL["raised"], fg=PAL["text"],
                              padx=12, pady=10, highlightthickness=0)
        self.result.pack(fill="both", expand=True, padx=1, pady=1)
        for tag, col in (("ok", PAL["ok"]), ("warn", PAL["warn"]),
                         ("bad", PAL["bad"]), ("muted", PAL["muted"])):
            self.result.tag_config(tag, foreground=col)
        self.log("连接设备后开始自检。", "muted")
        self.result.config(state="disabled")

    def log(self, txt, tag=None):
        self.result.config(state="normal")
        self.result.insert("end", txt + "\n", tag or ())
        self.result.see("end")
        self.result.config(state="disabled")

    def reset_counts(self):
        self.counts = [0, 0, 0, 0]
        for i in range(4):
            self.count_labels[i].config(text="按下 0 次")

    def start_bounce(self):
        self.bounce_seq = 0
        self.link.send("MODE bounce")
        self.root.after(300, self._bounce_next)

    def _bounce_next(self):
        if self.bounce_seq >= 4:
            self.link.send("MODE live")
            self.bounce_hint.config(text="抖动测试完成", fg=PAL["ok"])
            return
        i = self.bounce_seq
        self.bounce_hint.config(text="请按一下 %s …" % KEY_NAMES[i],
                                fg=PAL["warn"])
        self.link.send("BOUNCE %d" % i)

    def start_mic(self, which, secs):
        if not self.link.ser:
            return
        self.mic_samples = []
        self.mic_job = (which, time.time() + secs)
        self.mic_hint.config(
            text=("保持安静…" if which == "floor" else "现在说话…")
            + " %d 秒" % secs)

    def _finish_mic(self):
        which, _ = self.mic_job
        self.mic_job = None
        self.mic_hint.config(text="")
        vals = [v for v in self.mic_samples if v is not None]
        if len(vals) < 4:
            self.log("采样太少，没测成，检查连接", "bad")
            return
        med = statistics.median(vals)
        peak = max(vals)
        if which == "floor":
            self.mic_floor = med
            self.log("底噪   中位 %6.2f mV   峰值 %7.2f mV   (%d 帧)"
                     % (med, peak, len(vals)))
        else:
            self.mic_signal = med
            self.log("发声   中位 %6.2f mV   峰值 %7.2f mV   (%d 帧)"
                     % (med, peak, len(vals)))
        if self.mic_floor and self.mic_signal:
            snr = 20 * math.log10(self.mic_signal / self.mic_floor)
            if snr >= 15:
                verdict, tag = "良好（近讲可用）", "ok"
            elif snr >= 8:
                verdict, tag = "偏低（勉强可用）", "warn"
            else:
                verdict, tag = "不合格", "bad"
            self.log("→ 近讲 SNR = %.1f dB   判定：%s" % (snr, verdict), tag)
            far = snr - 20 * math.log10(45 / 5.0)
            self.log("  外推到 45cm（PRD 要求 30–60cm）：SNR ≈ %.1f dB" % far,
                     "muted")
            if far < 6:
                self.log("  ⚠︎ 该距离下语音会被底噪淹没，"
                         "PRD 验收标准第 6 条有风险", "bad")

    def export_report(self):
        path = filedialog.asksaveasfilename(
            defaultextension=".txt", initialfile="vb6-selftest.txt",
            title="导出自检报告")
        if not path:
            return
        L = ["vb6 Macro Pad 自检报告", time.strftime("%Y-%m-%d %H:%M:%S"), ""]
        if self.info:
            L.append("设备: uid=%s fw=%s hid=%s nvm=%sB" % (
                self.info.get("uid"), self.info.get("version"),
                self.info.get("hid"), self.info.get("nvm")))
        L += ["", "按键:"]
        for i, n in enumerate(KEY_NAMES):
            b = self.bounce[i]
            L.append("  %s  按下 %d 次  %s  映射=%s" % (
                n, self.counts[i],
                ("抖动 %d 边沿 / 稳定 %d us" % (b["edges"], b["settle_us"]))
                if b else "抖动未测", self.map_labels[i].cget("text")))
        L += ["", "麦克风:",
              "  底噪中位 %s mV" % ("%.2f" % self.mic_floor
                                    if self.mic_floor else "未测"),
              "  发声中位 %s mV" % ("%.2f" % self.mic_signal
                                    if self.mic_signal else "未测")]
        if self.mic_floor and self.mic_signal:
            L.append("  近讲 SNR %.1f dB"
                     % (20 * math.log10(self.mic_signal / self.mic_floor)))
        L += ["", self.result.get("1.0", "end").rstrip()]
        with open(path, "w") as f:
            f.write("\n".join(L) + "\n")
        messagebox.showinfo(APP, "已导出到\n%s" % path)

    # -- connection ------------------------------------------------------
    def toggle_conn(self):
        if self.link.ser:
            self.link.close()
            self.btn_conn.text = "连接"
            self.btn_conn._draw()
            self.status.set("未连接", "muted")
            self.info = None
            self._gate(False)
            return
        port = self.port_sel.get()
        if not port or port.startswith("("):
            messagebox.showwarning(APP, "没有找到串口。板子插好了吗？")
            return
        try:
            self.link.connect(port)
        except Exception as e:
            messagebox.showerror(APP, "打开串口失败：\n%s" % e)
            return
        self.status.set("握手中…", "warn")
        self.btn_conn.text = "断开"
        self.btn_conn._draw()
        self.link.send("INFO")
        self.link.send("GETCFG")
        self.root.after(2500, self._check_handshake)

    def _check_handshake(self):
        if self.link.ser and self.info is None:
            self.status.set("串口通了但设备没应答 — 固件是 vb6 版本吗？", "bad")

    def _gate(self, on):
        for w in list(self.widgets):
            try:
                w.config_state(on)
            except AttributeError:
                try:
                    w.config(state="normal" if on else "disabled")
                except Exception:
                    pass
            except Exception:
                pass

    # -- event pump ------------------------------------------------------
    def _pump(self):
        # This loop must never die: if it stops rescheduling, the app goes
        # silent and looks exactly like an unresponsive device.
        try:
            while True:
                try:
                    kind, obj = self.link.rx.get_nowait()
                except queue.Empty:
                    break
                try:
                    self._handle(kind, obj)
                except Exception as e:
                    self.on_internal_error(e, "处理 %s 消息" % kind)
            if self.mic_job and time.time() >= self.mic_job[1]:
                self._finish_mic()
        except Exception as e:
            self.on_internal_error(e, "消息泵")
        finally:
            self.root.after(50, self._pump)

    def on_internal_error(self, exc, where):
        traceback.print_exc()
        msg = "%s 出错：%s: %s" % (where, type(exc).__name__, exc)
        try:
            self.status.set(msg[:90], "bad")
            self.log(msg, "bad")
        except Exception:
            pass

    def _handle(self, kind, obj):
        if kind == "_ERR":
            self.status.set("串口断开：%s" % obj, "bad")
            self._gate(False)
            return
        if kind in ("INFO", "READY"):
            if isinstance(obj, dict):
                self.info = obj
                self.status.set(
                    "已连接   uid %s   固件 %s   HID %s   NVM %s B" % (
                        obj.get("uid", "?"), obj.get("version", "?"),
                        "可用" if obj.get("hid") else "无",
                        obj.get("nvm", 0)), "ok")
                self._gate(True)
                self.link.send("GETCFG")
        elif kind == "CFG" and isinstance(obj, dict):
            self._apply_cfg_to_ui(obj)
        elif kind == "TEL" and isinstance(obj, dict):
            self._on_tel(obj)
        elif kind == "EV" and isinstance(obj, dict):
            self._on_ev(obj)
        elif kind == "BOUNCE" and isinstance(obj, dict):
            i = obj.get("k", 0)
            self.bounce[i] = obj
            bad = obj["edges"] > 6
            self.bounce_labels[i].config(
                text="抖动 %d 边沿 / %d µs" % (obj["edges"], obj["settle_us"]),
                fg=PAL["bad"] if bad else PAL["ok"])
            self.log("%s 抖动：%d 个边沿，%d µs 后稳定"
                     % (KEY_NAMES[i], obj["edges"], obj["settle_us"]),
                     "bad" if bad else "ok")
            self.bounce_seq = i + 1
            self.root.after(400, self._bounce_next)
        elif kind == "ERR":
            self.log("设备报错：%s" % obj, "bad")

    def _on_tel(self, t):
        mad = t.get("mad", 0.0)
        if self.mic_job:
            self.mic_samples.append(mad)
        db = 20 * math.log10(max(mad, 0.1))
        col = PAL["bad"] if mad > 400 else (
            PAL["ok"] if mad > 30 else PAL["accent"])
        self.meter.set(db / 60.0, col)
        self.meter_txt.config(text="%6.1f mV   DC %.3f V"
                              % (mad, t.get("dc", 0)))
        for i, ch in enumerate(t.get("keys", "....")[:4]):
            self._paint(i, ch == "D")

    def _on_ev(self, e):
        i = e.get("k", 0)
        if i > 3:
            return
        if e.get("d"):
            self.counts[i] += 1
            self.count_labels[i].config(text="按下 %d 次" % self.counts[i])
        self._paint(i, bool(e.get("d")))

    def _paint(self, i, down):
        if self.live[i] != down:
            self.live[i] = down
            self.tiles[i].set(down)


def main():
    global FONT_UI, FONT_MONO
    root = tk.Tk()
    app_ref = {}

    def on_tk_error(*exc):
        traceback.print_exception(*exc)
        a = app_ref.get("app")
        if a:
            a.on_internal_error(exc[1], "界面回调")

    root.report_callback_exception = on_tk_error
    FONT_UI = _pick(["SF Pro Text", "Helvetica Neue", "Helvetica"], "Helvetica")
    FONT_MONO = _pick(["SF Mono", "Menlo", "Monaco"], "Courier")
    app_ref["app"] = App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
