#!/bin/bash
# Test Coordinator with sessions_spawn

echo "=========================================="
echo "Test: Coordinator + sessions_spawn"
echo "=========================================="
echo ""

# ส่งคำสั่งให้ Coordinator ใช้ sessions_spawn
echo "Sending task to Coordinator..."
echo ""

MESSAGE=$(cat <<'EOF'
[DASHBOARD] Task Request
ID: test-spawn-$(date +%s)
Project: a2
Title: Create factorial function
Description: Create a JavaScript function to calculate factorial using iterative approach. Save to factorial-test.js
Agent: coder

Please use sessions_spawn to create a worker agent for this task.
EOF
)

echo "Command:"
echo "openclaw agent --agent coordinator -m '$MESSAGE' --thinking medium"
echo ""

# รัน coordinator
openclaw agent --agent coordinator -m "$MESSAGE" --thinking medium 2>&1

echo ""
echo "=========================================="
echo "Test complete"
echo "=========================================="
