#!/bin/bash
# Background Sub-Agent Spawn Wrapper
# This script spawns agent in background and exits immediately

TASK_ID="task-1771490362579-822srbkuh"
CONTEXT_FILE="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771490362579-822srbkuh-context.md"
PROMPT_FILE="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771490362579-822srbkuh-prompt.txt"
PROGRESS_HELPER="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771490362579-822srbkuh-progress.js"
LOG_FILE="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771490362579-822srbkuh.log"
PID_FILE="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771490362579-822srbkuh.pid"

# Log start
echo "=== Sub-Agent Spawn Wrapper ===" > "$LOG_FILE"
echo "Task: $TASK_ID" >> "$LOG_FILE"
echo "Agent: coder" >> "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "PID File: $PID_FILE" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to report progress
report_progress() {
  node "$PROGRESS_HELPER" "$1" "$2" >> "$LOG_FILE" 2>&1
}

# Report initial progress
report_progress 10 "🚀 Agent initializing..."

# Create a background script that runs the agent
AGENT_SCRIPT="/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771490362579-822srbkuh-agent.sh"
cat > "$AGENT_SCRIPT" << 'AGENT_EOF'
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
AGENT_EOF

chmod +x "$AGENT_SCRIPT"

# Run agent script in background using nohup
nohup "$AGENT_SCRIPT" > /dev/null 2>&1 &
AGENT_PID=$!

# Save PID
echo $AGENT_PID > "$PID_FILE"

# Log PID
echo "Agent PID: $AGENT_PID" >> "$LOG_FILE"
echo "Wrapper exiting, agent running in background..." >> "$LOG_FILE"

# Exit immediately - parent process ends here
exit 0
