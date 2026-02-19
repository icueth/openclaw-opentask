#!/bin/bash
# Setup TaskMan Agent for Dashboard
# Creates taskman agent in OpenClaw if not exists

echo "=========================================="
echo "Setup TaskMan Agent"
echo "=========================================="
echo ""

# Check if taskman agent exists
if grep -q '"id": "taskman"' ~/.openclaw/openclaw.json 2>/dev/null; then
    echo "✅ TaskMan agent already exists in config"
else
    echo "Creating TaskMan agent..."
    
    # Create agent directory
    mkdir -p ~/.openclaw/agents/taskman/agent
    
    # Create AGENTS.md
    cat > ~/.openclaw/agents/taskman/agent/AGENTS.md << 'EOF'
# TaskMan Agent

You are the TaskMan Agent - the dedicated task dispatcher for OpenClaw Dashboard.

## Your Role
Receive tasks from Dashboard and spawn worker agents using `sessions_spawn`.

## Instructions

When you receive a message starting with "[DASHBOARD]", treat it as a task request:

### Task Format
```
[DASHBOARD] Task Request
ID: {task-id}
Project: {project-id}
Title: {title}
Description: {description}
TargetAgent: {target-agent-id}
Model: {model-name}
Thinking: {thinking-level}
```

### Your Response

1. Acknowledge the request immediately
2. Use `sessions_spawn` to create a worker agent:
   - Task: The task description
   - AgentId: Use TargetAgent from the request
   - Model: Use Model from the request
   - Thinking: Use Thinking from the request
3. Report the worker session key back

### Example

**Input:**
```
[DASHBOARD] Task Request
ID: task-123
Project: a2
Title: Create factorial function
TargetAgent: coder
Model: kimi-coding/kimi-for-coding
Thinking: medium
```

**Your Action:**
```
sessions_spawn: {
  "task": "Create factorial function...",
  "agentId": "coder",
  "model": "kimi-coding/kimi-for-coding",
  "thinking": "medium"
}
```

## Worker Output

The worker agent will:
1. Execute the task
2. Create necessary files
3. Announce completion back to the parent session (you)
4. You should summarize and report back to Dashboard

## Notes

- Always use sessions_spawn for task execution
- The worker will have its own isolated session
- Results will be announced automatically via OpenClaw's announce mechanism
EOF
    
    # Create auth-profiles.json (copy from coder)
    cp ~/.openclaw/agents/coder/agent/auth-profiles.json ~/.openclaw/agents/taskman/agent/auth-profiles.json 2>/dev/null || echo "{}" > ~/.openclaw/agents/taskman/agent/auth-profiles.json
    
    # Add to openclaw.json
    echo "Adding taskman to openclaw.json..."
    
    # Backup
    cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak.$(date +%s)
    
    # Use node to modify JSON
    node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync(process.env.HOME + '/.openclaw/openclaw.json', 'utf-8'));

// Add taskman agent
const taskmanAgent = {
  id: 'taskman',
  name: 'TaskMan',
  workspace: process.env.HOME + '/.openclaw/workspace-taskman',
  agentDir: process.env.HOME + '/.openclaw/agents/taskman/agent',
  model: 'kimi-coding/kimi-for-coding'
};

// Check if exists
const exists = config.agents.list.find(a => a.id === 'taskman');
if (!exists) {
  config.agents.list.push(taskmanAgent);
  fs.writeFileSync(process.env.HOME + '/.openclaw/openclaw.json', JSON.stringify(config, null, 2));
  console.log('✅ TaskMan agent added to config');
} else {
  console.log('✅ TaskMan agent already in config');
}
"
    
    echo ""
    echo "✅ TaskMan agent created!"
fi

echo ""
echo "=========================================="
echo "TaskMan Agent Setup Complete"
echo "=========================================="
echo ""
echo "Agent ID: taskman"
echo "Workspace: ~/.openclaw/workspace-taskman"
echo "Agent Dir: ~/.openclaw/agents/taskman/agent"
echo ""
echo "To test:"
echo "  openclaw agent --agent taskman -m '[DASHBOARD] Test message'"
echo ""
