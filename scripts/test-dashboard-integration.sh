#!/bin/bash
# Test Dashboard with Coordinator + sessions_spawn

echo "=========================================="
echo "Test: Dashboard + Coordinator + sessions_spawn"
echo "=========================================="
echo ""

# Create a test task
echo "Creating test task via Dashboard API..."

TASK_DATA=$(cat <<EOF
{
  "title": "Test Coordinator Integration",
  "description": "Create a JavaScript function to calculate prime numbers",
  "agentId": "coder",
  "priority": "high"
}
EOF
)

# Create task via API
echo "POST /api/projects/a2/tasks"
curl -s -X POST http://localhost:3000/api/projects/a2/tasks \
  -H "Content-Type: application/json" \
  -d "$TASK_DATA" | jq . 2>/dev/null || echo "API response (raw):"

echo ""
echo "=========================================="
echo "Expected flow:"
echo "=========================================="
echo "1. Dashboard receives task creation request"
echo "2. Task added to queue"
echo "3. Task Runner calls: openclaw agent --agent coordinator"
echo "4. Coordinator uses sessions_spawn to create worker"
echo "5. Worker executes task and announces result"
echo ""
echo "Check task status at: http://localhost:3000/projects/a2/tasks"
echo ""
