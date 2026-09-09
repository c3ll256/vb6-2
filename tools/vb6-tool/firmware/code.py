# vb6 credit-macro-pad -- device firmware for the macOS companion tool.
#
# Talks a line protocol over the CircuitPython console CDC so no boot.py
# change (and therefore no physical replug) is needed to bring it up.
# Every line we emit is prefixed "#V6 "; the host ignores anything else,
# which keeps REPL banners and tracebacks from corrupting the stream.
#
# Pin map comes from design/credit-macro-pad/source/main.tsx:
#   K1..K4 = GPIO1/2/3/4, active low, internal pull-up (no external pull-ups)
#   MIC_ADC = GPIO7 (ADC1_CH6), TLV9061 ~101x, biased at VBIAS = 3V3/2

import json
import struct
import time

import array

import analogbufio
import audiocore
import digitalio
import keypad
import microcontroller
import supervisor
import usb_audio
import usb_cdc
import usb_hid

VERSION = "1.0.0"
NVM_MAGIC = b"V6C2"

KEY_PINS = (
    microcontroller.pin.GPIO1,
    microcontroller.pin.GPIO2,
    microcontroller.pin.GPIO3,
    microcontroller.pin.GPIO4,
)
MIC_PIN = microcontroller.pin.GPIO7

# Writing files over USB while this runs would otherwise reset us mid-session.
supervisor.runtime.autoreload = False

con = usb_cdc.console


def emit(kind, payload=None):
    if payload is None:
        con.write(("#V6 %s\n" % kind).encode())
    else:
        con.write(("#V6 %s %s\n" % (kind, json.dumps(payload))).encode())


# ---------------------------------------------------------------- HID plumbing

_kbd = None
_cc = None
for _d in usb_hid.devices:
    if _d.usage_page == 0x01 and _d.usage == 0x06:
        _kbd = _d
    elif _d.usage_page == 0x0C and _d.usage == 0x01:
        _cc = _d

_BLANK = bytes(8)

# US layout: char -> (needs_shift, hid_usage_id)
_ASCII = {}
for _i, _c in enumerate("abcdefghijklmnopqrstuvwxyz"):
    _ASCII[_c] = (0, 0x04 + _i)
    _ASCII[_c.upper()] = (1, 0x04 + _i)
for _i, _c in enumerate("1234567890"):
    _ASCII[_c] = (0, 0x1E + _i)
for _c, _s, _k in (
    (" ", 0, 0x2C), ("-", 0, 0x2D), ("=", 0, 0x2E), ("[", 0, 0x2F),
    ("]", 0, 0x30), ("\\", 0, 0x31), (";", 0, 0x33), ("'", 0, 0x34),
    ("`", 0, 0x35), (",", 0, 0x36), (".", 0, 0x37), ("/", 0, 0x38),
    ("!", 1, 0x1E), ("@", 1, 0x1F), ("#", 1, 0x20), ("$", 1, 0x21),
    ("%", 1, 0x22), ("^", 1, 0x23), ("&", 1, 0x24), ("*", 1, 0x25),
    ("(", 1, 0x26), (")", 1, 0x27), ("_", 1, 0x2D), ("+", 1, 0x2E),
    ("{", 1, 0x2F), ("}", 1, 0x30), ("|", 1, 0x31), (":", 1, 0x33),
    ('"', 1, 0x34), ("~", 1, 0x35), ("<", 1, 0x36), (">", 1, 0x37),
    ("?", 1, 0x38), ("\n", 0, 0x28), ("\t", 0, 0x2B),
):
    _ASCII[_c] = (_s, _k)


def hid_tap(mod, keycode):
    # A modifier with no keycode is a legitimate mapping (e.g. right Option on
    # its own), so only an entirely empty report is rejected.
    if _kbd is None or (mod == 0 and keycode == 0):
        return False
    _kbd.send_report(struct.pack("<BBBBBBBB", mod, 0, keycode, 0, 0, 0, 0, 0))
    time.sleep(0.008)
    _kbd.send_report(_BLANK)
    return True


def hid_text(s):
    if _kbd is None:
        return False
    for ch in s[:64]:
        ent = _ASCII.get(ch)
        if ent is None:
            continue
        hid_tap(0x02 if ent[0] else 0x00, ent[1])
        time.sleep(0.004)
    return True


def hid_consumer(code):
    if _cc is None or code == 0:
        return False
    _cc.send_report(struct.pack("<H", code))
    time.sleep(0.008)
    _cc.send_report(b"\x00\x00")
    return True


# ------------------------------------------------------------------- config io

DEFAULT_CFG = {
    "armed": False,
    "keys": [
        {"type": "consumer", "code": 0x00E2, "label": "Mute"},
        {"type": "key", "mod": 0x08, "code": 0x06, "label": "Cmd+C"},
        {"type": "key", "mod": 0x08, "code": 0x19, "label": "Cmd+V"},
        {"type": "text", "text": "vb6", "label": "Type 'vb6'"},
    ],
}


def _sane(cfg):
    if not isinstance(cfg, dict):
        return json.loads(json.dumps(DEFAULT_CFG))
    keys = cfg.get("keys")
    if not isinstance(keys, list) or len(keys) != 4:
        cfg["keys"] = json.loads(json.dumps(DEFAULT_CFG["keys"]))
    cfg["armed"] = bool(cfg.get("armed", False))
    return cfg


def load_cfg():
    nvm = microcontroller.nvm
    if nvm is None or len(nvm) < 8 or bytes(nvm[0:4]) != NVM_MAGIC:
        return json.loads(json.dumps(DEFAULT_CFG))
    n = nvm[4] | (nvm[5] << 8)
    if n == 0 or n > len(nvm) - 6:
        return json.loads(json.dumps(DEFAULT_CFG))
    try:
        return _sane(json.loads(bytes(nvm[6:6 + n]).decode()))
    except Exception:
        return json.loads(json.dumps(DEFAULT_CFG))


def save_cfg(cfg):
    nvm = microcontroller.nvm
    if nvm is None:
        return False
    raw = json.dumps(_sane(cfg)).encode()
    if len(raw) > len(nvm) - 6:
        return False
    nvm[0:4] = NVM_MAGIC
    nvm[4] = len(raw) & 0xFF
    nvm[5] = (len(raw) >> 8) & 0xFF
    nvm[6:6 + len(raw)] = raw
    return True


def fire(idx, cfg):
    """Run key idx's mapped action. Returns a short description of what ran."""
    if not cfg.get("armed"):
        return "disarmed"
    try:
        a = cfg["keys"][idx]
    except Exception:
        return "unmapped"
    t = a.get("type")
    if t == "key":
        return "key" if hid_tap(a.get("mod", 0), a.get("code", 0)) else "nohid"
    if t == "consumer":
        return "consumer" if hid_consumer(a.get("code", 0)) else "nohid"
    if t == "text":
        return "text" if hid_text(a.get("text", "")) else "nohid"
    return "none"


# --------------------------------------------------------------------- sensors

# Audio path.
#
# The mic is analog (GPIO7), so samples come from the ADC over DMA rather than
# a Python read loop: analogbufio gives a fixed, jitter-free rate, which both
# the USB microphone and the self-test statistics need.
#
# usb_audio.usb_microphone is only present when boot.py called
# usb_audio.enable(); the firmware still runs (minus the USB mic) without it.
MIC_RATE = 16000
MIC_BLOCK = 512
MV = 3300.0 / 65535.0

mic_buf = array.array("H", bytes(MIC_BLOCK * 2))
mic_adc = analogbufio.BufferedIn(MIC_PIN, sample_rate=MIC_RATE)
mic_stream = None
usb_mic = getattr(usb_audio, "usb_microphone", None)
if usb_mic is not None:
    # The host streams straight out of mic_buf while the DMA keeps refilling
    # it, so the loop below doubles as the live audio pump.
    mic_stream = audiocore.RawSample(mic_buf, sample_rate=MIC_RATE)
    try:
        usb_mic.play(mic_stream, loop=True)
    except Exception:
        usb_mic = None

keys = keypad.Keys(KEY_PINS, value_when_pressed=False, pull=True,
                   interval=0.004, max_events=64)
raw = None  # digitalio pins, only while in bounce mode


def to_bounce_mode():
    global keys, raw
    if raw is not None:
        return
    if keys is not None:
        keys.deinit()
        keys = None
    raw = []
    for p in KEY_PINS:
        d = digitalio.DigitalInOut(p)
        d.direction = digitalio.Direction.INPUT
        d.pull = digitalio.Pull.UP
        raw.append(d)


def to_key_mode():
    global keys, raw
    if raw is not None:
        for d in raw:
            d.deinit()
        raw = None
    if keys is None:
        keys = keypad.Keys(KEY_PINS, value_when_pressed=False, pull=True,
                           interval=0.004, max_events=64)


def mic_frame(ms=None):
    """Capture one DMA block and summarise it.

    Filling mic_buf is what feeds the USB microphone as well, so this is called
    continuously rather than only when telemetry is due.
    """
    mic_adc.readinto(mic_buf)
    n = len(mic_buf)
    total = 0
    lo = 65535
    hi = 0
    for v in mic_buf:
        total += v
        if v < lo:
            lo = v
        if v > hi:
            hi = v
    mean = total // n
    dev = 0
    for v in mic_buf:
        dev += v - mean if v > mean else mean - v
    return {
        "dc": round(mean * MV / 1000.0, 4),
        "mad": round((dev // n) * MV, 2),
        "pp": round((hi - lo) * MV, 1),
        "n": n,
        "rate": MIC_RATE,
        "usb": usb_mic is not None,
    }


def bounce_scan(idx, window_ms=25, timeout_ms=6000):
    """Count every raw transition inside window_ms after the first fall."""
    d = raw[idx]
    t0 = time.monotonic_ns()
    limit = t0 + timeout_ms * 1000000
    while d.value:
        if time.monotonic_ns() > limit:
            return None
    first = time.monotonic_ns()
    end = first + window_ms * 1000000
    prev = False
    edges = 1
    last_edge = first
    while time.monotonic_ns() < end:
        cur = d.value
        if cur != prev:
            edges += 1
            last_edge = time.monotonic_ns()
            prev = cur
    while not d.value:                       # wait for release
        if time.monotonic_ns() > limit:
            break
    return {"k": idx, "edges": edges,
            "settle_us": int((last_edge - first) / 1000)}


# ------------------------------------------------------------------- main loop

cfg = load_cfg()
mode = "live"
line = ""
live = [False, False, False, False]

emit("READY", {"version": VERSION, "uid": "".join(
    "%02X" % b for b in microcontroller.cpu.uid)})

next_tel = 0.0
while True:
    # ---- host commands
    if con.in_waiting:
        try:
            chunk = con.read(con.in_waiting).decode()
        except Exception:
            chunk = ""
        for ch in chunk:
            if ch not in ("\n", "\r"):
                if ch >= " ":            # drop stray control bytes (e.g. ^D)
                    line += ch
                continue
            cmd, _, arg = line.strip().partition(" ")
            line = ""
            if not cmd:
                pass
            elif cmd == "PING":
                emit("PONG")
            elif cmd == "INFO":
                emit("INFO", {
                    "version": VERSION,
                    "uid": "".join("%02X" % b for b in microcontroller.cpu.uid),
                    "hid": _kbd is not None,
                    "consumer": _cc is not None,
                    "nvm": 0 if microcontroller.nvm is None
                           else len(microcontroller.nvm),
                    "maint": bool(microcontroller.nvm is not None
                                  and microcontroller.nvm[
                                      len(microcontroller.nvm) - 1] == 0xA5),
                    "mode": mode,
                })
            elif cmd == "GETCFG":
                emit("CFG", cfg)
            elif cmd == "SETCFG":
                try:
                    cfg = _sane(json.loads(arg))
                    emit("OK", "SETCFG")
                    emit("CFG", cfg)
                except Exception as e:
                    emit("ERR", "SETCFG %s" % e)
            elif cmd == "SAVE":
                emit("OK" if save_cfg(cfg) else "ERR", "SAVE")
            elif cmd == "MAINT":
                nvm = microcontroller.nvm
                if nvm is None:
                    emit("ERR", "no nvm")
                else:
                    on = arg.strip() != "0"
                    nvm[len(nvm) - 1] = 0xA5 if on else 0
                    emit("OK", "MAINT %d" % (1 if on else 0))
            elif cmd == "ARM":
                cfg["armed"] = arg.strip() == "1"
                emit("CFG", cfg)
            elif cmd == "MODE":
                want = arg.strip() or "live"
                if want == "bounce":
                    to_bounce_mode()
                else:
                    to_key_mode()
                mode = want
                emit("OK", "MODE %s" % mode)
            elif cmd == "BOUNCE":
                if raw is None:
                    emit("ERR", "not in bounce mode")
                else:
                    try:
                        idx = int(arg)
                    except Exception:
                        idx = 0
                    r = bounce_scan(idx)
                    emit("BOUNCE", r) if r else emit("ERR", "bounce timeout")
            else:
                emit("ERR", "unknown %s" % cmd)

    # ---- key events (debounced, background-scanned)
    if keys is not None:
        ev = keys.events.get()
        while ev is not None:
            if ev.key_number < 4:
                live[ev.key_number] = ev.pressed
            act = fire(ev.key_number, cfg) if ev.pressed else "-"
            emit("EV", {"k": ev.key_number, "d": 1 if ev.pressed else 0,
                        "t": ev.timestamp, "act": act})
            ev = keys.events.get()

    # ---- telemetry
    now = time.monotonic()
    if mode != "bounce":
        f = mic_frame()
        if now < next_tel:
            continue                      # keep the audio flowing, stay quiet
        next_tel = now + 0.12
        if keys is not None:
            f["keys"] = "".join("D" if x else "." for x in live)
        emit("TEL", f)
