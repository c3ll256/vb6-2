# vb6 credit-macro-pad -- boot-time USB configuration.
#
# CircuitPython mounts CIRCUITPY as a USB mass-storage volume by default, so
# every unplug makes macOS complain that a disk was not ejected properly.
# For a finished macro pad the drive is not wanted, so it is hidden unless
# maintenance is explicitly requested.
#
# The drive appears when EITHER:
#   * any of the four keys is held while the board is plugged in, or
#   * the host asked for it (tool sends MAINT, which sets the NVM flag below;
#     this boot consumes the flag, so it is a one-shot).
#
# boot.py only runs on a hard reset. On this board RTS soft-reset does not
# work, so that means physically replugging USB.

import time

import digitalio
import microcontroller
import storage
import usb_audio

MAINT_FLAG = 0xA5          # sentinel value written by the MAINT command
KEY_PINS = (
    microcontroller.pin.GPIO1,
    microcontroller.pin.GPIO2,
    microcontroller.pin.GPIO3,
    microcontroller.pin.GPIO4,
)


def _flag_requested():
    """Read and clear the one-shot maintenance flag in the last NVM byte.

    The key mapping lives at the start of NVM (a few hundred bytes), so the
    last byte never collides with it.
    """
    nvm = microcontroller.nvm
    if nvm is None or len(nvm) < 1:
        return False
    idx = len(nvm) - 1
    if nvm[idx] != MAINT_FLAG:
        return False
    nvm[idx] = 0
    return True


def _key_held():
    pins = []
    for p in KEY_PINS:
        d = digitalio.DigitalInOut(p)
        d.direction = digitalio.Direction.INPUT
        d.pull = digitalio.Pull.UP
        pins.append(d)
    time.sleep(0.05)                     # let the pull-ups settle
    held = any(not d.value for d in pins)
    for d in pins:
        d.deinit()                       # code.py needs these pins for keypad
    return held


maintenance = False
try:
    maintenance = _flag_requested() or _key_held()
except Exception:
    maintenance = True                   # never lock the filesystem away

if not maintenance:
    storage.disable_usb_drive()

    # Enumerate as a USB Audio Class microphone so the host can pick the board
    # as a recording input. USB descriptors are frozen once boot.py finishes,
    # so this must happen here; calling enable() later raises "Cannot change
    # USB devices now". 16 kHz mono is what the ADC front end can usefully
    # carry.
    #
    # Deliberately skipped in maintenance mode: the audio class adds endpoints
    # on top of CDC and HID, and if that ever breaks enumeration the board
    # would take the serial console down with it. Holding a key while plugging
    # in then still yields a plain, recoverable device with the drive mounted.
    try:
        usb_audio.enable(microphone=True, sample_rate=16000, channel_count=1)
    except Exception:
        pass                   # keep booting even if the audio class is refused
