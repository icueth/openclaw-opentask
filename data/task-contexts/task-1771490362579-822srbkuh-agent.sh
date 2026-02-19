#!/bin/bash
TASK_ID="task-1771490362579-822srbkuh"
LOG_FILE="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771490362579-822srbkuh.log"
PROGRESS_HELPER="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771490362579-822srbkuh-progress.js"
PROMPT_FILE="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771490362579-822srbkuh-prompt.txt"

# Function to report progress
report_progress() {
  node "$PROGRESS_HELPER" "$1" "$2" >> "$LOG_FILE" 2>&1
}

# Report start
report_progress 15 "📖 Reading task context..."

# Run agent and capture output
openclaw agent \
  --agent coder \
  --message "$(cat $PROMPT_FILE)" \
  --thinking medium \
  --timeout 1800 \
  --json >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  report_progress 100 "✅ Task completed successfully"
  echo "" >> "$LOG_FILE"
  echo "=== Task Completed ===" >> "$LOG_FILE"
else
  report_progress 0 "❌ Task failed with exit code $EXIT_CODE"
  echo "" >> "$LOG_FILE"
  echo "=== Task Failed ===" >> "$LOG_FILE"
fi

exit $EXIT_CODE
