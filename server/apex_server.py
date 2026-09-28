"""
APEX CONTROL - reference Flask server for the Windows PC.

OPTIONAL COMPONENT
------------------
This is a small, dependency-light reference implementation of the contract the
dashboard expects (see ../README.md -> "API contract"). It exists so the
frontend can be wired up end-to-end in minutes; replace it with whatever you
like as long as the routes and JSON shapes stay the same.

SECURITY MODEL
--------------
* The browser can only reach the predefined routes below.
* There is no endpoint that runs an arbitrary command. Apps are launched from a
  fixed whitelist (APP_REGISTRY) - ids sent by the dashboard map to entries in
  that table, nothing else is ever executed.
* All subprocess calls use argument lists, never shell strings.
* Optional shared-secret auth: set APEX_TOKEN and send `X-APEX-Token` from the
  dashboard (add the header in src/services/api.ts if you enable it).

RUN
---
    pip install -r requirements.txt
    python apex_server.py            # listens on 0.0.0.0:8080

Then point the dashboard at http://<this-pc-ip>:8080
"""

from __future__ import annotations

import os
import platform
import shutil
import subprocess
import time
from datetime import datetime
from typing import Any

from flask import Flask, jsonify, request

try:  # optional, gives real telemetry
    import psutil  # type: ignore
except Exception:  # pragma: no cover - psutil not installed
    psutil = None  # type: ignore

# ---------------------------------------------------------------------------
# configuration
# ---------------------------------------------------------------------------

HOST = os.environ.get("APEX_HOST", "0.0.0.0")
PORT = int(os.environ.get("APEX_PORT", "8080"))
TOKEN = os.environ.get("APEX_TOKEN", "")
VERSION = "1.0.0"

# Root folders the file browser is allowed to list.
FILE_ROOTS = [os.path.expanduser("~"), os.environ.get("SystemDrive", "C:") + "\\"]

BOOTED_AT = time.time()

# ---------------------------------------------------------------------------
# app registry - the ONLY executables the dashboard can start
# ---------------------------------------------------------------------------

APP_REGISTRY: dict[str, dict[str, Any]] = {
    "chrome": {"name": "Chrome", "exe": r"C:\Program Files\Google\Chrome\Application\chrome.exe", "args": []},
    "edge": {"name": "Edge", "exe": r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", "args": []},
    "vscode": {"name": "VS Code", "exe": os.path.expanduser(r"~\AppData\Local\Programs\Microsoft VS Code\Code.exe"), "args": []},
    "terminal": {"name": "Windows Terminal", "exe": "wt.exe", "args": []},
    "discord": {"name": "Discord", "exe": os.path.expanduser(r"~\AppData\Local\Discord\Update.exe"), "args": ["--processStart", "Discord.exe"]},
    "spotify": {"name": "Spotify", "exe": os.path.expanduser(r"~\AppData\Roaming\Spotify\Spotify.exe"), "args": []},
    "steam": {"name": "Steam", "exe": r"C:\Program Files (x86)\Steam\steam.exe", "args": []},
    "games": {"name": "Games", "exe": "explorer.exe", "args": ["shell:AppsFolder"]},
    "files": {"name": "File Explorer", "exe": "explorer.exe", "args": []},
    "youtube": {"name": "YouTube", "exe": "cmd.exe", "args": ["/c", "start", "https://www.youtube.com"]},
    "notion": {"name": "Notion", "exe": "cmd.exe", "args": ["/c", "start", "https://www.notion.so"]},
    "whatsapp": {"name": "WhatsApp", "exe": "cmd.exe", "args": ["/c", "start", "https://web.whatsapp.com"]},
    "obs": {"name": "OBS Studio", "exe": r"C:\Program Files\obs-studio\bin\64bit\obs64.exe", "args": []},
    "vlc": {"name": "VLC", "exe": r"C:\Program Files\VideoLAN\VLC\vlc.exe", "args": []},
    "taskmgr": {"name": "Task Manager", "exe": "taskmgr.exe", "args": []},
    "notepad": {"name": "Notepad", "exe": "notepad.exe", "args": []},
    "calculator": {"name": "Calculator", "exe": "calc.exe", "args": []},
}

RECENT_APPS: list[dict[str, Any]] = []

# Placeholder media session. A production build would read the Windows SMTC
# session (winsdk.windows.media.control) instead of this dictionary.
MEDIA: dict[str, Any] = {
    "title": "Neon Horizon",
    "artist": "Synthwave Collective",
    "album": "Night Drive",
    "positionSec": 88,
    "durationSec": 214,
    "isPlaying": True,
    "volume": 70,
    "muted": False,
    "source": "spotify",
}

app = Flask(__name__)


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def ok(data: Any, status: int = 200):
    return jsonify({"ok": True, "data": data}), status


def fail(message: str, status: int = 400):
    return jsonify({"ok": False, "error": message}), status


def authorized() -> bool:
    if not TOKEN:
        return True
    return request.headers.get("X-APEX-Token", "") == TOKEN


def run_command(exe: str, args: list[str] | None = None) -> None:
    """Launch a process without a shell (fixed argv, never user input)."""
    if not shutil.which(exe) and not os.path.exists(exe):
        raise FileNotFoundError(exe)
    subprocess.Popen([exe, *(args or [])], close_fds=True)


def uptime_seconds() -> int:
    if psutil is not None:
        return int(time.time() - psutil.boot_time())
    return int(time.time() - BOOTED_AT)


def system_stats() -> dict[str, Any]:
    if psutil is None:
        return {
            "cpu": {"model": platform.processor() or "Unknown CPU", "usage": 0, "cores": os.cpu_count() or 1,
                    "threads": os.cpu_count() or 1, "temperatureC": None, "clockGhz": None},
            "ram": {"totalGb": 16, "usedGb": 0, "usage": 0},
            "disks": [],
            "gpu": {"model": "Unknown GPU", "vramTotalGb": 0, "vramUsedGb": 0, "usage": None, "temperatureC": None},
            "network": {"downloadMbps": 0, "uploadMbps": 0, "adapter": "unknown"},
            "uptimeSec": uptime_seconds(),
            "latencyMs": 0,
        }

    memory = psutil.virtual_memory()
    disks = []
    for partition in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(partition.mountpoint)
        except Exception:
            continue
        disks.append({
            "name": partition.mountpoint.rstrip("\\"),
            "totalGb": round(usage.total / 1024 ** 3),
            "usedGb": round(usage.used / 1024 ** 3),
            "usage": round(usage.percent, 1),
        })

    net = psutil.net_io_counters()
    return {
        "cpu": {
            "model": platform.processor() or "Unknown CPU",
            "usage": round(psutil.cpu_percent(interval=None), 1),
            "cores": psutil.cpu_count(logical=False) or 1,
            "threads": psutil.cpu_count(logical=True) or 1,
            "temperatureC": None,
            "clockGhz": None,
        },
        "ram": {
            "totalGb": round(memory.total / 1024 ** 3, 1),
            "usedGb": round(memory.used / 1024 ** 3, 1),
            "usage": round(memory.percent, 1),
        },
        "disks": disks,
        "gpu": {"model": "Unknown GPU", "vramTotalGb": 0, "vramUsedGb": 0, "usage": None, "temperatureC": None},
        "network": {
            "downloadMbps": 0,
            "uploadMbps": 0,
            "adapter": "unknown",
            "bytesReceived": net.bytes_recv if net else 0,
            "bytesSent": net.bytes_sent if net else 0,
        },
        "uptimeSec": uptime_seconds(),
        "latencyMs": 0,
    }


def wifi_info() -> dict[str, Any]:
    return {"connected": True, "ssid": "unknown", "signal": 0, "band": "unknown", "ipAddress": local_ip(), "linkSpeedMbps": None}


def local_ip() -> str:
    import socket

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        sock.close()


# ---------------------------------------------------------------------------
# middleware
# ---------------------------------------------------------------------------


@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-APEX-Token"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.before_request
def guard():
    if request.method == "OPTIONS":
        return ok({})
    if not authorized():
        return fail("Unauthorised", 401)
    return None


# ---------------------------------------------------------------------------
# status + telemetry
# ---------------------------------------------------------------------------


@app.get("/api/status")
def status():
    return ok({
        "online": True,
        "hostname": platform.node(),
        "ipAddress": local_ip(),
        "os": f"{platform.system()} {platform.release()}",
        "serverVersion": VERSION,
        "uptimeSec": uptime_seconds(),
        "latencyMs": 0,
        "wifi": wifi_info(),
        "timestamp": int(time.time() * 1000),
    })


@app.get("/api/system/stats")
def stats():
    return ok(system_stats())


@app.get("/api/system/processes")
def processes():
    if psutil is None:
        return ok([])
    rows = []
    for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_info"]):
        try:
            rows.append({
                "pid": proc.info["pid"],
                "name": proc.info["name"],
                "cpu": round(proc.info["cpu_percent"] or 0, 1),
                "memoryMb": round((proc.info["memory_info"].rss if proc.info["memory_info"] else 0) / 1024 ** 2),
            })
        except Exception:
            continue
    return ok(sorted(rows, key=lambda row: row["cpu"], reverse=True)[:8])


# ---------------------------------------------------------------------------
# apps
# ---------------------------------------------------------------------------


@app.get("/api/apps")
def apps():
    return ok([{"id": key, "name": value["name"], "running": False} for key, value in APP_REGISTRY.items()])


@app.post("/api/apps/launch")
def launch_app():
    app_id = (request.get_json(silent=True) or {}).get("app", "")
    entry = APP_REGISTRY.get(app_id)
    if entry is None:
        return fail(f"Unknown app id: {app_id}", 404)
    try:
        run_command(entry["exe"], entry["args"])
    except FileNotFoundError:
        return fail(f"{entry['name']} is not installed on this PC", 424)
    except Exception as error:  # pragma: no cover
        return fail(str(error), 500)
    RECENT_APPS.insert(0, {"id": app_id, "at": int(time.time() * 1000)})
    del RECENT_APPS[8:]
    return ok({"ok": True, "app": app_id, "message": f"Launching {entry['name']}"})


@app.post("/api/apps/close")
def close_app():
    app_id = (request.get_json(silent=True) or {}).get("app", "")
    entry = APP_REGISTRY.get(app_id)
    if entry is None:
        return fail(f"Unknown app id: {app_id}", 404)
    if psutil is not None:
        target = os.path.basename(entry["exe"])
        for proc in psutil.process_iter(["name"]):
            if proc.info["name"] and proc.info["name"].lower() == target.lower():
                try:
                    proc.terminate()
                except Exception:
                    pass
    return ok({"ok": True, "app": app_id, "message": f"Closing {entry['name']}"})


@app.get("/api/apps/recent")
def recent_apps():
    return ok(RECENT_APPS)


# ---------------------------------------------------------------------------
# power actions (fixed argv only)
# ---------------------------------------------------------------------------

POWER_ACTIONS = {
    "lock": (["rundll32.exe", "user32.dll,LockWorkstation"], "Workstation locked"),
    "sleep": (["rundll32.exe", "powrprof.dll,SetSuspendSleep", "0,1,0"], "Entering sleep"),
    "restart": (["shutdown", "/r", "/t", "10", "/f"], "Restarting in 10 seconds"),
    "shutdown": (["shutdown", "/s", "/t", "10", "/f"], "Shutting down in 10 seconds"),
    "display-off": (["powershell", "-NoProfile", "-Command",
                     "(Add-Type '[DllImport(\"user32.dll\")]public static extern int SendMessage(int h,int m,int w,int l);' -Name A -PassThru)::SendMessage(-1,0x0112,0xF170,2)"],
                    "Display turned off"),
    "wake-on-lan": (["powershell", "-NoProfile", "-Command",
                     "Wake-On-LAN packet requires the target MAC"], "Magic packet queued"),
}


def power(action: str):
    command, message = POWER_ACTIONS[action]
    if action == "wake-on-lan":
        # Implement with a real magic packet to the target MAC here.
        return ok({"ok": True, "message": message})
    try:
        subprocess.Popen(command)
    except Exception as error:  # pragma: no cover
        return fail(str(error), 500)
    return ok({"ok": True, "message": message})


@app.post("/api/system/lock")
def lock():
    return power("lock")


@app.post("/api/system/sleep")
def sleep_pc():
    return power("sleep")


@app.post("/api/system/restart")
def restart():
    return power("restart")


@app.post("/api/system/shutdown")
def shutdown():
    return power("shutdown")


@app.post("/api/system/display-off")
def display_off():
    return power("display-off")


@app.post("/api/system/wake-on-lan")
def wake_on_lan():
    return power("wake-on-lan")


@app.post("/api/system/screenshot")
def screenshot():
    if psutil is None:
        return fail("psutil is required for screenshots", 501)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    folder = os.path.join(os.path.expanduser("~"), "Pictures", "APEX Screenshots")
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, f"screenshot-{stamp}.png")
    try:
        import mss  # type: ignore

        with mss.mss() as screen:
            screen.shot(output=path)
    except Exception:
        return fail("Install mss to enable screenshots", 501)
    return ok({"ok": True, "message": f"Screenshot saved to {path}"})


@app.post("/api/system/empty-recycle-bin")
def empty_recycle_bin():
    try:
        subprocess.Popen(["powershell", "-NoProfile", "-Command", "Clear-RecycleBin", "-Force"])
    except Exception as error:  # pragma: no cover
        return fail(str(error), 500)
    return ok({"ok": True, "message": "Recycle Bin emptied"})


# ---------------------------------------------------------------------------
# media
# ---------------------------------------------------------------------------


@app.get("/api/media")
def media_state():
    return ok(MEDIA)


@app.get("/api/media/queue")
def media_queue():
    return ok({"index": 0, "items": [{"title": MEDIA["title"], "artist": MEDIA["artist"], "durationSec": MEDIA["durationSec"]}]})


@app.post("/api/media/play-pause")
def media_play_pause():
    MEDIA["isPlaying"] = not MEDIA["isPlaying"]
    return ok({"isPlaying": MEDIA["isPlaying"]})


@app.post("/api/media/previous")
def media_previous():
    MEDIA["positionSec"] = 0
    return ok({"positionSec": 0})


@app.post("/api/media/next")
def media_next():
    MEDIA["positionSec"] = 0
    return ok({"positionSec": 0})


@app.post("/api/media/volume")
def media_volume():
    payload = request.get_json(silent=True) or {}
    value = payload.get("value", payload.get("volume"))
    if value is None:
        return fail('Missing "value" in request body', 422)
    MEDIA["volume"] = max(0, min(100, int(value)))
    MEDIA["muted"] = MEDIA["volume"] == 0
    return ok({"volume": MEDIA["volume"], "muted": MEDIA["muted"]})


@app.post("/api/media/mute")
def media_mute():
    payload = request.get_json(silent=True) or {}
    MEDIA["muted"] = bool(payload.get("muted", not MEDIA["muted"]))
    return ok({"muted": MEDIA["muted"]})


@app.post("/api/media/seek")
def media_seek():
    payload = request.get_json(silent=True) or {}
    value = payload.get("positionSec", payload.get("value"))
    if value is None:
        return fail('Missing "positionSec" in request body', 422)
    MEDIA["positionSec"] = max(0, min(MEDIA["durationSec"], int(value)))
    return ok({"positionSec": MEDIA["positionSec"]})


@app.post("/api/media/source")
def media_source():
    payload = request.get_json(silent=True) or {}
    source = payload.get("source")
    if not source:
        return fail('Missing "source" in request body', 422)
    MEDIA["source"] = source
    return ok({"source": source})


# ---------------------------------------------------------------------------
# files (read-only browsing, path restricted to FILE_ROOTS)
# ---------------------------------------------------------------------------


def safe_path(raw: str) -> str | None:
    candidate = os.path.abspath(os.path.expanduser(raw or "~"))
    for root in FILE_ROOTS:
        root_abs = os.path.abspath(root)
        if candidate == root_abs or candidate.startswith(root_abs + os.sep):
            return candidate
    return None


@app.get("/api/files")
def files():
    target = safe_path(request.args.get("path", "~"))
    if target is None or not os.path.isdir(target):
        return fail("Path not found", 404)
    nodes = []
    for name in sorted(os.listdir(target), key=lambda value: value.lower()):
        full = os.path.join(target, name)
        try:
            stat = os.stat(full)
        except OSError:
            continue
        nodes.append({
            "name": name,
            "path": full,
            "kind": "folder" if os.path.isdir(full) else "file",
            "sizeBytes": None if os.path.isdir(full) else stat.st_size,
            "modifiedAt": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
        })
    return ok({"path": target, "nodes": nodes})


@app.post("/api/files/open")
def files_open():
    target = safe_path((request.get_json(silent=True) or {}).get("path", ""))
    if target is None or not os.path.exists(target):
        return fail("Path not found", 404)
    try:
        os.startfile(target)  # type: ignore[attr-defined]  # noqa: S606 (windows only, user-chosen path)
    except Exception as error:
        return fail(str(error), 500)
    return ok({"ok": True, "path": target, "message": f"Opening {os.path.basename(target)}"})


@app.post("/api/files/download")
def files_download():
    target = safe_path((request.get_json(silent=True) or {}).get("path", ""))
    if target is None or not os.path.isfile(target):
        return fail("File not found", 404)
    return ok({"ok": True, "path": target, "message": f"Preparing {os.path.basename(target)}"})


# ---------------------------------------------------------------------------
# tools
# ---------------------------------------------------------------------------


@app.post("/api/tools/clipboard")
def tools_clipboard():
    text = (request.get_json(silent=True) or {}).get("text", "")
    try:
        subprocess.Popen(["powershell", "-NoProfile", "-Command", "Set-Clipboard", "-Value", text])
    except Exception as error:  # pragma: no cover
        return fail(str(error), 500)
    return ok({"ok": True, "length": len(text), "message": "Clipboard updated"})


@app.post("/api/tools/notify")
def tools_notify():
    payload = request.get_json(silent=True) or {}
    title = payload.get("title", "APEX CONTROL")
    message = payload.get("message", "")
    return ok({"ok": True, "title": title, "message": message, "delivered": True})


@app.errorhandler(404)
def not_found(_error):
    return fail("Unknown endpoint", 404)


if __name__ == "__main__":
    print(f"APEX CONTROL reference server listening on http://{HOST}:{PORT}")
    print(f"Token auth: {'enabled' if TOKEN else 'disabled'}")
    app.run(host=HOST, port=PORT, debug=False)
