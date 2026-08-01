# Time4ttack FH6

FH6 telemetry consists of two parts:

- `src/` and `ios/`: the mobile dashboard built with React, Vite, and Capacitor.
- `fh6-hub/`: the Windows tray hub that receives Forza UDP telemetry, relays it over WebSocket, and shows the pairing QR.

Current pairing flow:

1. Run the Windows hub on the PC.
2. Scan the QR shown by the hub on the phone.
3. The app opens a `time4ttack://pair` deep link and connects to the hub.

The mobile app is the dashboard. The hub is the always-on relay and tray entrypoint.