#!/bin/bash
# Start Daemon Agent
# รันเป็น background service

echo "=========================================="
echo "Starting Daemon Agent"
echo "=========================================="

# ตรวจสอบ directory
if [ ! -f "package.json" ]; then
    echo "Error: Must run from dashboard directory"
    exit 1
fi

# สร้าง data directory
mkdir -p data

# ตรวจสอบว่า daemon รันอยู่แล้วหรือไม่
PID_FILE="data/daemon.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Daemon is already running (PID: $PID)"
        echo "Use './scripts/stop-daemon.sh' to stop first"
        exit 1
    else
        echo "Removing stale PID file"
        rm "$PID_FILE"
    fi
fi

# รัน daemon ใน background
echo "Starting daemon..."
node scripts/daemon-agent.js &
DAEMON_PID=$!

# บันทึก PID
echo $DAEMON_PID > "$PID_FILE"

echo ""
echo "Daemon started with PID: $DAEMON_PID"
echo "Log file: data/daemon.log"
echo "State file: data/daemon-state.json"
echo ""
echo "Commands:"
echo "  ./scripts/stop-daemon.sh  - Stop daemon"
echo "  tail -f data/daemon.log   - View logs"
echo ""
echo "Dashboard API:"
echo "  POST /api/projects/{id}/tasks/{taskId}/daemon-spawn"
echo ""
