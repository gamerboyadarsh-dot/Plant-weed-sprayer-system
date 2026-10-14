// sketch.ino
// ==========
// Wokwi / Arduino simulation for the Precision Micro-Dosing Weed Sprayer.
//
// PURPOSE:
//   This sketch validates the COMMAND PARSING and TIMING LOGIC only.
//   It does NOT simulate actual pump fluid mechanics.
//   The LED represents a virtual actuator (pump / solenoid valve).
//
// SERIAL PROTOCOL:
//   Raspberry Pi sends:  FIRE <duration_ms>\n
//   Arduino responds:    ACTUATOR ON → waits duration → ACTUATOR OFF
//
// IMPORTANT:
//   This is a SOFTWARE SIMULATION only.
//   No physical pump, solenoid, or herbicide is involved.
//   This validates serial communication and timing logic.
//
// Wokwi: https://wokwi.com
// For full simulation, paste this sketch into Wokwi with diagram.json.

const int ACTUATOR_PIN = 13;  // Built-in LED as virtual actuator

void setup() {
  Serial.begin(9600);
  pinMode(ACTUATOR_PIN, OUTPUT);
  digitalWrite(ACTUATOR_PIN, LOW);

  Serial.println("=== Precision Weed Sprayer — Arduino Actuator Sim ===");
  Serial.println("SIMULATION ONLY — validates timing logic, not fluid behaviour");
  Serial.println("Waiting for FIRE <ms> commands...");
  Serial.println("======================================================");
}

void loop() {
  // Wait for a serial command
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.startsWith("FIRE")) {
      // Parse: "FIRE <milliseconds>"
      int spaceIndex = cmd.indexOf(' ');
      if (spaceIndex != -1) {
        String msStr = cmd.substring(spaceIndex + 1);
        int duration_ms = msStr.toInt();

        if (duration_ms > 0 && duration_ms <= 500) {
          Serial.println("----------------------------");
          Serial.print("Received: ");
          Serial.println(cmd);
          Serial.print("Duration: ");
          Serial.print(duration_ms);
          Serial.println(" ms");

          // Activate virtual actuator
          Serial.println("ACTUATOR ON");
          digitalWrite(ACTUATOR_PIN, HIGH);

          delay(duration_ms);   // Wait for burst duration

          // Deactivate virtual actuator
          digitalWrite(ACTUATOR_PIN, LOW);
          Serial.println("ACTUATOR OFF");
          Serial.println("STATUS: OK");
          Serial.println("----------------------------");

        } else {
          Serial.println("ERROR: Invalid duration. Must be 1-500 ms.");
        }

      } else {
        Serial.println("ERROR: Malformed FIRE command. Expected: FIRE <ms>");
      }

    } else if (cmd.startsWith("SUPPRESS")) {
      Serial.println("SUPPRESS received — no actuator action.");

    } else if (cmd.length() > 0) {
      Serial.print("UNKNOWN command: ");
      Serial.println(cmd);
    }
  }
}
