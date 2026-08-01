import argparse
import csv
import subprocess
import tempfile
import time
from pathlib import Path

DEFAULT_POLL_SECONDS = 3.0
WATCHER_LOCK_NAME = "time4ttack-fh6-watcher.lock"
GAME_PROCESS_NAMES = {"ForzaHorizon6.exe", "ForzaHorizon5.exe"}
HUB_PROCESS_NAME = "Time4ttack-FH6-Hub.exe"


def _list_processes() -> set[str]:
    result = subprocess.run(
        ["tasklist", "/FO", "CSV", "/NH"],
        capture_output=True,
        text=True,
        check=False,
        encoding="utf-8",
        errors="ignore",
    )
    if result.returncode != 0:
        return set()

    rows = csv.reader(line for line in result.stdout.splitlines() if line.strip())
    names: set[str] = set()
    for row in rows:
        if row:
            names.add(row[0].strip())
    return names


def _acquire_lock() -> tempfile._TemporaryFileWrapper:
    lock_path = Path(tempfile.gettempdir()) / WATCHER_LOCK_NAME
    file_handle = open(lock_path, "w", encoding="utf-8")
    try:
        import msvcrt

        msvcrt.locking(file_handle.fileno(), msvcrt.LK_NBLCK, 1)
    except OSError:
        file_handle.close()
        raise RuntimeError("FH6 watcher is already running.")

    return file_handle


def _start_hub(hub_exe_path: Path) -> None:
    subprocess.Popen(
        [str(hub_exe_path)],
        cwd=str(hub_exe_path.parent),
        creationflags=0x08000000,  # CREATE_NO_WINDOW
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--hub-exe",
        default=str(Path(__file__).resolve().parent / HUB_PROCESS_NAME),
        help="Absolute path to Time4ttack-FH6-Hub.exe",
    )
    parser.add_argument(
        "--poll-seconds",
        type=float,
        default=DEFAULT_POLL_SECONDS,
        help="Polling interval in seconds.",
    )
    args = parser.parse_args()

    hub_exe_path = Path(args.hub_exe).resolve()
    if not hub_exe_path.exists():
        raise SystemExit(f"Hub executable not found: {hub_exe_path}")

    if args.poll_seconds < 1:
        raise SystemExit("poll-seconds must be >= 1")

    lock_handle = _acquire_lock()
    lock_handle.write(str(hub_exe_path))
    lock_handle.flush()

    while True:
        running_processes = _list_processes()
        game_running = bool(running_processes & GAME_PROCESS_NAMES)
        hub_running = HUB_PROCESS_NAME in running_processes

        if game_running and not hub_running:
            _start_hub(hub_exe_path)

        time.sleep(args.poll_seconds)


if __name__ == "__main__":
    main()
