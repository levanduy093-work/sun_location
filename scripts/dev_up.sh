#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

RUNTIME_DIR="$repo_root/.run"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"

FLASK_HOST="${FLASK_HOST:-127.0.0.1}"
FLASK_PORT="${FLASK_PORT:-8000}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
CONDA_ENV="${CONDA_ENV:-solar-mirror}"

mkdir -p "$RUNTIME_DIR"

kill_stale_pid() {
  local pid_file=$1
  local name=$2

  if [[ ! -f "$pid_file" ]]; then
    return
  fi

  local pid
  pid="$(<"$pid_file")"

  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "Stopping stale $name (pid $pid)"
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
  fi

  rm -f "$pid_file"
}

terminate_child() {
  local pid=$1
  local name=$2
  local pid_file=$3

  if [[ -z "${pid}" ]]; then
    return
  fi

  if kill -0 "$pid" 2>/dev/null; then
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
  fi

  rm -f "$pid_file"
}

kill_stale_pid "$BACKEND_PID_FILE" "backend server"
kill_stale_pid "$FRONTEND_PID_FILE" "frontend server"

if command -v lsof >/dev/null 2>&1; then
  if lsof -i TCP:"$FLASK_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $FLASK_PORT is already in use. Stop the process using it or run scripts/dev_down.sh."
    exit 1
  fi
  if lsof -i TCP:"$FRONTEND_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $FRONTEND_PORT is already in use. Stop the process using it or run scripts/dev_down.sh."
    exit 1
  fi
fi

# Kiểm tra và kích hoạt conda environment
if ! command -v conda &> /dev/null; then
  echo "Error: conda command not found. Please install conda or activate it first."
  exit 1
fi

# Khởi tạo conda shell hook nếu chưa có
if [[ -z "${CONDA_SHLVL:-}" ]]; then
  # shellcheck source=/dev/null
  eval "$(conda shell.bash hook)"
fi

# Kiểm tra xem đã có conda environment nào đang active chưa
if [[ -n "${CONDA_DEFAULT_ENV:-}" ]]; then
  echo "Using existing conda environment: ${CONDA_DEFAULT_ENV}"
else
  # Nếu chưa có environment nào active, thử kích hoạt environment được chỉ định
  if conda env list | grep -q "^${CONDA_ENV} "; then
    echo "Activating conda environment: $CONDA_ENV"
    conda activate "$CONDA_ENV"
  else
    echo "Warning: Conda environment '$CONDA_ENV' not found."
    echo "Available environments:"
    conda env list
    echo ""
    echo "Please either:"
    echo "  1. Create the environment: conda env create -f environment.yml"
    echo "  2. Activate an existing conda environment before running this script"
    echo "  3. Set CONDA_ENV to an existing environment name"
    exit 1
  fi
fi

export FLASK_APP=backend.app
export FLASK_RUN_HOST="$FLASK_HOST"
export FLASK_RUN_PORT="$FLASK_PORT"

cleanup() {
  set +e
  terminate_child "${backend_pid:-}" "Flask backend" "$BACKEND_PID_FILE"
  backend_pid=""
  terminate_child "${frontend_pid:-}" "frontend web server" "$FRONTEND_PID_FILE"
  frontend_pid=""
  set -e
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

cd "$repo_root"
flask run --reload &
backend_pid=$!
echo "$backend_pid" >"$BACKEND_PID_FILE"

cd "$repo_root/frontend"
python -m http.server "$FRONTEND_PORT" --bind "$FRONTEND_HOST" &
frontend_pid=$!
echo "$frontend_pid" >"$FRONTEND_PID_FILE"
cd "$repo_root"

echo ""
echo "Backend running on http://$FLASK_HOST:$FLASK_PORT"
echo "Frontend available on http://$FRONTEND_HOST:$FRONTEND_PORT (serving frontend/)"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

wait "$backend_pid"
wait "$frontend_pid"


