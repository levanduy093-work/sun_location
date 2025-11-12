#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

RUNTIME_DIR="$repo_root/.run"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"

terminate_from_pidfile() {
  local pid_file=$1
  local name=$2

  if [[ ! -f "$pid_file" ]]; then
    echo "No tracked $name process."
    return
  fi

  local pid
  pid="$(<"$pid_file")"

  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "Stopping $name (pid $pid)"
    kill "$pid" 2>/dev/null || true
    for _ in {1..10}; do
      if kill -0 "$pid" 2>/dev/null; then
        sleep 0.3
      else
        break
      fi
    done
    if kill -0 "$pid" 2>/dev/null; then
      echo "$name did not terminate; forcing kill"
      kill -9 "$pid" 2>/dev/null || true
    fi
  else
    if [[ -n "$pid" ]]; then
      echo "$name pid file existed, but process $pid is not running."
    else
      echo "$name pid file is empty."
    fi
  fi

  rm -f "$pid_file"
}

terminate_from_pidfile "$BACKEND_PID_FILE" "Flask backend"
terminate_from_pidfile "$FRONTEND_PID_FILE" "frontend web server"

if [[ -d "$RUNTIME_DIR" ]] && [[ -z "$(ls -A "$RUNTIME_DIR")" ]]; then
  rmdir "$RUNTIME_DIR"
fi

echo "All tracked development processes have been stopped."


