# FH6 Hub

Windows tray relay for the FH6 telemetry dashboard.

What it does:

- listens for Forza telemetry on UDP port `5300`
- broadcasts telemetry to connected mobile clients over WebSocket on port `8765`
- shows a QR code for `time4ttack://pair?host=...&port=8765`
- supports tray control and Windows autostart

Run from the repository root:

```powershell
Set-Location fh6-hub
.\.venv\Scripts\python.exe main.py
```

Notes:

- QR pairing is the primary entry path.
- mDNS discovery is best-effort; if a service name conflict happens, the hub still continues running.
- If UDP port `5300` is already taken by another process, the hub cannot receive telemetry until that process exits.

## Build Windows Installer

The repo now includes a repeatable Windows packaging flow:

1. `build_windows_installer.ps1` freezes the hub into a tray EXE with PyInstaller.
2. If Inno Setup is installed, the script also compiles `installer/Time4ttackFH6Hub.iss` into a distributable installer.
3. The installer launches the tray app after installation.

Run it from the hub folder:

```powershell
Set-Location fh6-hub
.\build_windows_installer.ps1
```

If Inno Setup is missing, you still get the packaged app bundle under `out/windows-installer/hub/Time4ttack-FH6-Hub`.

## Installer Startup Modes

The installer provides two startup behaviors:

1. Start hub at Windows sign-in.
2. Start watcher at sign-in and auto-launch hub only when Forza Horizon process is running.

The watcher executable is `Time4ttack-FH6-Watcher.exe` and is included in the packaged bundle.

## Prepare Release Artifacts

Use this command to build and stage a publish-ready release tree:

```powershell
Set-Location fh6-hub
.\prepare_release.ps1 -Version 0.1.0
```

Release output is created under `release/windows/<version>/` with bundle zip, installer (if available), checksums, and release notes template.
