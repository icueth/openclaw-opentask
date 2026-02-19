#!/bin/bash
# Test Daemon Agent Pattern
# ทดสอบการส่ง task ไปยัง daemon

echo "=========================================="
echo "Test: Daemon Agent Pattern"
echo "=========================================="

# 1. ตรวจสอบว่า daemon รันอยู่
echo ""
echo "Step 1: Check daemon status..."
curl -s http://localhost:3000/api/daemon/status | jq .

# 2. ถ้าไม่รัน ให้เริ่มต้น
if [ ! -f "data/daemon.pid" ]; then
    echo ""
    echo "Daemon not running. Starting..."
    ./scripts/start-daemon.sh
    sleep 3
fi

# 3. สร้าง test task
echo ""
echo "Step 2: Create test task..."
TEST_TASK=$(cat <<EOF
{
  "id": "test-task-$(date +%s)",
  "projectId": "a2",
  "title": "Test Daemon Task",
  "description": "Create a simple JavaScript function that adds two numbers",
  "agentId": "coder"
}
EOF
)

echo "Task: $TEST_TASK"

# 4. ส่ง task ไปยัง daemon
echo ""
echo "Step 3: Send task to daemon..."
curl -s -X POST http://localhost:3000/api/daemon/spawn \
  -H "Content-Type: application/json" \
  -d "$TEST_TASK" | jq .

# 5. รอและตรวจสอบสถานะ
echo ""
echo "Step 4: Monitor daemon status..."
for i in {1..5}; do
    sleep 2
    echo ""
    echo "Check $i:"
    curl -s http://localhost:3000/api/daemon/status | jq .
done

echo ""
echo "=========================================="
echo "Test complete. Check data/daemon.log for details"
echo "=========================================="
