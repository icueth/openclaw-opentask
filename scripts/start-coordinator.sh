#!/bin/bash
# Start Agent Coordinator
# รัน coordinator เป็น OpenClaw agent

echo "=========================================="
echo "Starting Agent Coordinator"
echo "=========================================="

# ตรวจสอบว่าอยู่ใน dashboard directory
if [ ! -f "package.json" ]; then
    echo "Error: Must run from dashboard directory"
    exit 1
fi

# สร้าง coordinator tasks file
mkdir -p data
echo "[]" > data/coordinator-tasks.json

echo ""
echo "Starting coordinator agent..."
echo "Gateway: ${GATEWAY_URL:-http://localhost:18789}"
echo ""
echo "รอรับ task จาก Dashboard..."
echo "กด Ctrl+C เพื่อหยุด"
echo ""

# รัน coordinator agent
# ต้องรันเป็น OpenClaw agent เท่านั้น
exec openclaw agent \
    --agent coordinator \
    --message "Start coordinator and process all pending tasks from data/coordinator-tasks.json" \
    --thinking medium \
    --loop \
    --interval 5000
