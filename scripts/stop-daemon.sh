#!/bin/bash
# Stop Daemon Agent

echo "Stopping Daemon Agent..."

PID_FILE="data/daemon.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "No PID file found. Daemon may not be running."
    exit 1
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "Stopping daemon (PID: $PID)..."
    kill "$PID"
    
    # รอให้หยุด
    sleep 2
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Force killing..."
        kill -9 "$PID"
    fi
    
    rm "$PID_FILE"
    echo "Daemon stopped"
else
    echo "Daemon not running (removing stale PID file)"
    rm "$PID_FILE"
fi
