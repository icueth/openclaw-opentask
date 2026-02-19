#!/bin/bash
set -e

echo $$ > "/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771507824025-egoc80b6f.pid"
echo "=== Task task-1771507824025-egoc80b6f Started ===" > "$LOG_FILE"
echo "Time: $(date)" >> "$LOG_FILE"

report_progress() {
  node "/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771507824025-egoc80b6f-progress.js" "$1" "$2" 2>/dev/null || true
}

report_progress 15 "📖 Reading task..."

openclaw agent \
  --agent taskman \
  --message "$(cat "/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771507824025-egoc80b6f-prompt.txt")" \
  --thinking medium \
  --json 2>&1 | tee -a "/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771507824025-egoc80b6f.log" || true

report_progress 100 "✅ Task completed"
