#!/bin/bash
set -e

echo $$ > "/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/daemon-test-001.pid"
echo "[$(date)] Worker started for task daemon-test-001" > "/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/daemon-test-001.log"

# Report progress helper
report_progress() {
  node "/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/daemon-test-001-progress.js" "$1" "$2" 2>/dev/null || true
}

report_progress 10 "🚀 Worker initializing..."

# Run openclaw agent
openclaw agent \
  --agent coder \
  --message "$(cat /Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/daemon-test-001-worker-context.md)" \
  --thinking medium \
  --json 2>&1 | tee -a "/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/daemon-test-001.log" || {
    echo "Worker exited with code $?" >> "/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/daemon-test-001.log"
    exit 1
  }

report_progress 100 "✅ Task completed"
echo "[$(date)] Worker completed" >> "/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/daemon-test-001.log"
