# vb6 Macro Pad Tool

信用卡尺寸四键宏键盘的 macOS 上位机：**配置按键映射** + **检测按键和麦克风好坏**。

由设备端固件（`firmware/code.py`，跑在 CircuitPython 上）和 macOS GUI（`vb6_tool.py`，
Tkinter）两部分组成，通过板子的 USB CDC 串口通信。

## 能做什么

- **按键映射**：四个键各自可配成组合键（录制快捷键，如 `⌘C`）、文本宏（最多 64 个 ASCII
  字符）或媒体键（静音 / 音量 / 播放控制）。写进芯片的 8KB NVM，掉电保留。
- **真 HID 输出**：设备以标准 USB HID 键盘身份枚举，映射的按键会真的发送给 macOS，
  无需驱动。出厂默认 K1 = Consumer Mute（PRD 指定的麦克风静音键）。
- **按键自检**：四个键的实时按下指示、累计计数、以及**触点抖动测量**（统计首次下降沿后
  25ms 窗口内的原始边沿数和稳定时间）。
- **麦克风自检**：实时电平表，加一套"测底噪 → 测发声 → 算 SNR"的引导流程，并按自由场
  平方反比把近讲 SNR 外推到 PRD 要求的 30–60cm 距离，给出是否满足验收标准第 6 条的判断。

## 前提

板子上要跑 CircuitPython（本项目验证过的是 10.3.0，Seeed XIAO ESP32-S3 Sense 板级镜像；
纯 XIAO ESP32S3 官方没发布稳定版镜像，Sense 镜像在同一颗芯片上通用）。

Mac 侧需要 `pyserial`：

```bash
pip3 install pyserial
```

## 使用

把固件拷到设备，然后起 GUI：

```bash
cp firmware/code.py /Volumes/CIRCUITPY/code.py && sync
```

```bash
python3 tools/vb6-tool/vb6_tool.py
```

在窗口里选串口（`/dev/cu.usbmodem*`）→ 点「连接」。标题栏出现 `uid=... fw=... HID=有`
就是握上手了。

**HID 输出默认是关闭的。** 勾选「启用」之前先确认焦点不在重要窗口里——一旦启用，按键
会真的往当前应用发送输入。

## 自测

```bash
python3 tools/vb6-tool/test_smoke.py
```

不需要接板子。它把设备会发的每一种消息塞进接收队列，走真实的 `_pump` 路径，并显式
捕获 Tk 回调里会被静默吞掉的异常（退出码 0 = PASS）。改完 GUI 先跑这个。

## 已知的坑

**RTS 软复位对这块板无效。** esptool 会照常打印 `Hard resetting via RTS pin`，但芯片
不会真的复位。换固件后必须**物理拔插一次 USB**，否则会误判成固件不启动。

重新进 ROM 下载模式只能靠 XIAO 模块上的 **B** 按钮（按住 B → 按一下 R → 松开 B）。
XIAO ESP32S3 没把 GPIO0 引到castellated 焊盘，板子上没有可短接的替代焊盘。

**Tk 会吞掉回调里的异常。** 一旦 `_pump` 抛异常且没被重新调度，串口消息就再也不会被
处理，界面上只会显示「设备没应答」——看起来像硬件问题，其实是上位机自己死了。现在
`_pump` 用 `finally` 保证一定重新调度，异常会打到 stderr 并显示在状态栏上。

固件里关掉了 CircuitPython 的 autoreload，所以往 `CIRCUITPY` 写文件不会自动重启程序；
需要重启时在 GUI 里断开重连，或者拔插 USB。

## 引脚

来自 `design/credit-macro-pad/source/main.tsx`：

| 信号 | XIAO 脚 | GPIO | 备注 |
|---|---|---|---|
| KEY1–KEY4 | D0–D3 | 1 / 2 / 3 / 4 | 另一端接 GND，无外部上拉，靠内部上拉，低电平有效 |
| MIC_ADC | D8 | 7 | ADC1_CH6，TLV9061 约 101 倍增益，VBIAS = 3V3/2 |
| LCD_MOSI / SCK | D4 / D5 | 5 / 6 | 本工具未使用 |
| LCD_CS_N / D_C | D6 / D7 | 43 / 44 | 本工具未使用；这两脚是 UART0 TX/RX |

## 串口协议

行协议，设备侧每行以 `#V6 ` 开头，上位机丢弃所有不带该前缀的行（这样 REPL 横幅和
traceback 不会污染数据流）。

主机 → 设备：

| 命令 | 作用 |
|---|---|
| `PING` | 存活探测，回 `PONG` |
| `INFO` | 返回固件版本、UID、HID 可用性、NVM 大小 |
| `GETCFG` | 返回当前配置 |
| `SETCFG <json>` | 设置运行时配置 |
| `SAVE` | 把当前配置写进 NVM |
| `ARM 0\|1` | 开关 HID 输出 |
| `MODE live\|bounce` | 切换常规模式 / 抖动测量模式 |
| `BOUNCE <n>` | 等待并测量第 n 个键的触点抖动 |

设备 → 主机：`READY` `PONG` `INFO` `CFG` `EV`（按键事件）`TEL`（遥测，约 8Hz）
`BOUNCE` `OK` `ERR`。

配置 JSON：

```json
{"armed": false,
 "keys": [{"type": "consumer", "code": 226},
          {"type": "key", "mod": 8, "code": 6},
          {"type": "text", "text": "vb6"}]}
```

`mod` 是 HID 修饰键位（Ctrl 0x01 / Shift 0x02 / Alt 0x04 / Cmd 0x08），`code` 是 HID
usage id。`consumer` 的 `code` 是 Consumer Page(0x0C) usage，例如静音 = 0x00E2。

## 局限

设备**不是** USB 麦克风。CircuitPython 不支持 USB Audio Class，所以麦克风只能把电平
经串口传给上位机做检测，系统的声音输入里不会出现这台设备。PRD 要求的 UAC 麦克风需要
基于 ESP-IDF + TinyUSB 另写固件。
