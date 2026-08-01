import asyncio
import ctypes
import tempfile
import traceback
from pathlib import Path

from main import main as hub_main


def _show_error_dialog(title: str, message: str) -> None:
    try:
        ctypes.windll.user32.MessageBoxW(0, message, title, 0x10)
    except Exception:
        pass


def _write_crash_log(error_text: str) -> Path:
    log_path = Path(tempfile.gettempdir()) / "time4ttack-fh6-hub-crash.log"
    log_path.write_text(error_text, encoding="utf-8")
    return log_path


def main() -> None:
    try:
        asyncio.run(hub_main())
    except RuntimeError as exc:
        message = f"{exc}"
        _write_crash_log(message)
        _show_error_dialog("Time4ttack FH6 Hub", message)
        raise SystemExit(1) from exc
    except KeyboardInterrupt:
        print("\n[Hub] 服務已手動關閉。")
    except Exception:
        error_text = traceback.format_exc()
        log_path = _write_crash_log(error_text)
        _show_error_dialog(
            "Time4ttack FH6 Hub",
            f"Hub 啟動失敗，詳細日誌已寫入:\n{log_path}",
        )
        raise SystemExit(1)


if __name__ == "__main__":
    main()
