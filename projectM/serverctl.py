#!/usr/bin/env python3
"""
项目管理系统 — 服务管理工具
用法：
  python3 serverctl.py start     # 启动服务
  python3 serverctl.py stop      # 停止服务
  python3 serverctl.py restart   # 重启服务
  python3 serverctl.py status    # 查看状态
"""

import os
import sys
import time
import signal
import subprocess
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
SERVER_SCRIPT = PROJECT_DIR / "server.js"
PID_FILE = PROJECT_DIR / ".server.pid"
PORT = 3457


def get_pid():
    """从 PID 文件和端口占用两种方式获取进程 ID"""
    pids = set()

    # 1. PID 文件
    if PID_FILE.exists():
        try:
            pids.add(int(PID_FILE.read_text().strip()))
        except ValueError:
            pass

    # 2. 端口占用（lsof）
    try:
        result = subprocess.run(
            ["lsof", "-ti", f"tcp:{PORT}"],
            capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.strip().split("\n"):
            pid = line.strip()
            if pid:
                pids.add(int(pid))
    except Exception:
        pass

    return pids


def is_running(pid):
    """检查进程是否在运行且是 node 进程"""
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def start():
    """启动服务"""
    # 检查是否已运行
    running = [p for p in get_pid() if is_running(p)]
    if running:
        print(f"✅ 服务已在运行 (PID: {', '.join(map(str, running))})")
        print(f"   http://localhost:{PORT}")
        return

    print(f"🚀 启动服务...")
    try:
        proc = subprocess.Popen(
            ["node", str(SERVER_SCRIPT), str(PORT)],
            cwd=str(PROJECT_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        PID_FILE.write_text(str(proc.pid))

        # 等待启动
        for _ in range(10):
            time.sleep(0.5)
            if [p for p in get_pid() if is_running(p)]:
                print(f"✅ 服务已启动 (PID: {proc.pid})")
                print(f"   http://localhost:{PORT}")
                return

        print(f"⚠️  进程已创建但端口未响应，请手动检查")
    except FileNotFoundError:
        print("❌ 找不到 node 命令，请确保 Node.js 已安装")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        sys.exit(1)


def stop():
    """停止服务"""
    pids = [p for p in get_pid() if is_running(p)]
    if not pids:
        print("ℹ️  服务未运行")
        PID_FILE.unlink(missing_ok=True)
        return

    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)
            print(f"🛑 已发送停止信号 (PID: {pid})")
        except OSError:
            pass

    # 等待进程退出
    for _ in range(10):
        time.sleep(0.3)
        if not any(is_running(p) for p in pids):
            break

    # 强制杀掉残留
    remaining = [p for p in pids if is_running(p)]
    for pid in remaining:
        try:
            os.kill(pid, signal.SIGKILL)
            print(f"💀 强制终止 (PID: {pid})")
        except OSError:
            pass

    PID_FILE.unlink(missing_ok=True)
    print("✅ 服务已停止")


def restart():
    """重启服务"""
    stop()
    time.sleep(1)
    start()


def status():
    """查看服务状态"""
    running = [p for p in get_pid() if is_running(p)]
    if running:
        print(f"✅ 服务运行中")
        print(f"   PID: {', '.join(map(str, running))}")
        print(f"   地址: http://localhost:{PORT}")
    else:
        print("🔴 服务未运行")
        PID_FILE.unlink(missing_ok=True)


def open_browser():
    """打开浏览器"""
    import webbrowser
    webbrowser.open(f"http://localhost:{PORT}")
    print(f"🌐 已打开 http://localhost:{PORT}")


if __name__ == "__main__":
    os.chdir(str(PROJECT_DIR))

    commands = {
        "start":   start,
        "stop":    stop,
        "restart": restart,
        "status":  status,
        "open":    lambda: start() or time.sleep(1) or open_browser(),
    }

    if len(sys.argv) < 2:
        print(__doc__)
        print("可用命令: " + ", ".join(commands.keys()))
        sys.exit(0)

    cmd = sys.argv[1].lower()
    if cmd in commands:
        commands[cmd]()
    else:
        print(f"❌ 未知命令: {cmd}")
        print("可用命令: " + ", ".join(commands.keys()))
        sys.exit(1)
