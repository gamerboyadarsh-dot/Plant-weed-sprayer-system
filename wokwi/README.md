# Wokwi Arduino Simulation — Precision Micro-Dosing Weed Sprayer

## Purpose

This Wokwi project simulates the **Arduino actuator controller** for the
Precision Micro-Dosing Weed Sprayer.

**IMPORTANT**: This validates command/timing logic ONLY.
It does NOT simulate pump fluid mechanics, herbicide dispensing,
or any physical spray behaviour.

---

## What the Simulation Does

1. Arduino listens on Serial (9600 baud) for commands from Raspberry Pi
2. Command format: `FIRE <duration_ms>`
3. Arduino parses the command, activates the virtual actuator (LED pin 13)
4. Arduino waits exactly `duration_ms` milliseconds
5. Arduino deactivates the actuator and prints status

---

## How to Run in Wokwi

1. Go to [https://wokwi.com](https://wokwi.com)
2. Click **New Project** → **Arduino Uno**
3. Paste the contents of `sketch.ino` into the editor
4. Paste the contents of `diagram.json` into the diagram tab
5. Click **Start Simulation**
6. Open the Serial Monitor
7. Type commands manually, e.g.:  `FIRE 120`

---

## Expected Serial Output

```
=== Precision Weed Sprayer — Arduino Actuator Sim ===
SIMULATION ONLY — validates timing logic, not fluid behaviour
Waiting for FIRE <ms> commands...
======================================================

----------------------------
Received: FIRE 120
Duration: 120 ms
ACTUATOR ON
ACTUATOR OFF
STATUS: OK
----------------------------
```

---

## Raspberry Pi → Arduino Protocol (Future Integration)

```
# Raspberry Pi (Python)
import serial
ser = serial.Serial('/dev/ttyUSB0', 9600)
ser.write(b'FIRE 120\n')

# Arduino responds
# ACTUATOR ON
# (waits 120 ms)
# ACTUATOR OFF
# STATUS: OK
```

**NOTE**: Physical Raspberry Pi ↔ Arduino serial communication
has NOT been tested. This is a software protocol specification.

---

## Tinkercad Alternative

If Wokwi is unavailable, the same sketch can be imported into
[Tinkercad Circuits](https://www.tinkercad.com) with a similar
LED-on-pin-13 circuit layout.

---

## Component List (for Wokwi simulation)

| Component | Purpose |
|-----------|---------|
| Arduino Uno | Actuator controller |
| LED (red) | Virtual actuator (represents pump/solenoid) |
| 220Ω Resistor | Current limiting |

> **Safety Note**: For physical testing, use only water or dyed water.
> No actual herbicides during development phase.
