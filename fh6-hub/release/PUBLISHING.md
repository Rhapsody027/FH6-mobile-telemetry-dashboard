# FH6 Hub Windows Publishing Guide

## 1. Prerequisites

- Windows 11 build machine
- Python environment resolved by `uv`
- Inno Setup installed (for installer output)
- Clean working tree for the release commit/tag

## 2. Build Artifacts

From `fh6-hub/`:

```powershell
.\prepare_release.ps1 -Version 0.1.0
```

Expected output under `release/windows/0.1.0/`:

- `bundle/Time4ttack-FH6-Hub/`
- `bundle/Time4ttack-FH6-Hub-0.1.0-bundle.zip`
- `installer/Time4ttack-FH6-Hub-0.1.0-Setup.exe` (if Inno Setup is available)
- `SHA256SUMS.txt`
- `RELEASE_NOTES.md`

## 3. Release QA Gate

Required checks before tagging:

1. Fresh install of Setup EXE on a clean Windows user profile.
2. Desktop/start-menu shortcut exists and launches tray icon.
3. Startup mode test A: "Start hub when Windows signs in" works after reboot/sign-out.
4. Startup mode test B: "Start only when Forza Horizon is running" launches hub when game process appears.
5. QR pairing works from iOS app to hub WebSocket.
6. Uninstall removes app folder, Run registry values, and running hub/watcher processes.
7. `SHA256SUMS.txt` matches uploaded files.

## 4. Release Packaging Policy

- Primary artifact: installer EXE.
- Fallback artifact: bundle ZIP.
- Always publish checksum file.
- Binaries are uploaded to GitHub Releases, never committed: `release/windows/` and `out/` are git-ignored.
- Keep release notes with known issues and rollback notes.

## 5. Suggested Versioning

- Use `MAJOR.MINOR.PATCH`.
- Patch: bugfix only.
- Minor: new installer/runtime features.
- Major: protocol or pairing flow breaking changes.

## 6. Go-Live Checklist

1. Freeze code changes except release blockers.
2. Run QA gate.
3. Create git tag (`fh6-hub-vX.Y.Z`).
4. Upload installer, bundle ZIP, checksums, and release notes.
5. Announce release channel and rollback artifact.