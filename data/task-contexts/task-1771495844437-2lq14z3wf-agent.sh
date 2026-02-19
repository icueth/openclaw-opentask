#!/bin/bash
set -e

TASK_ID="task-1771495844437-2lq14z3wf"
LOG_FILE="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771495844437-2lq14z3wf.log"
PID_FILE="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771495844437-2lq14z3wf.pid"
PROMPT_FILE="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771495844437-2lq14z3wf-prompt.txt"
PROGRESS_HELPER="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771495844437-2lq14z3wf-progress.js"

# Report progress helper
report_progress() {
  node "$PROGRESS_HELPER" "$1" "$2" 2>/dev/null || true
}

# Write PID
echo $$ > "$PID_FILE"

# Log start
echo "=== Task $TASK_ID Started ===" > "$LOG_FILE"
echo "PID: $$" >> "$LOG_FILE"
echo "Time: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

report_progress 15 "📖 Reading task context..."

# Run openclaw agent with the prompt
openclaw agent   --agent coder   --message "$(cat "$PROMPT_FILE")"   --thinking medium   --json 2>&1 | tee -a "$LOG_FILE" || {
    echo "Agent exited with code $?" >> "$LOG_FILE"
    exit 1
  }

report_progress 100 "✅ Task completed"
echo "=== Task Completed ===" >> "$LOG_FILE"
