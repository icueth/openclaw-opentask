#!/bin/bash
# Test Method 3: Direct Agent Communication via Session Injection
# ทดสอบการสื่อสารกับ Coordinator Agent โดยตรง

echo "=========================================="
echo "Test Method 3: Direct Agent Communication"
echo "=========================================="
echo ""

# หา session file ของ coordinator
echo "Step 1: Find coordinator session..."
COORD_SESSION=$(ls -t /Users/icue/.openclaw/agents/coordinator/sessions/*.jsonl 2>/dev/null | grep -v deleted | grep -v reset | head -1)

if [ -z "$COORD_SESSION" ]; then
    echo "❌ No active coordinator session found"
    echo ""
    echo "ต้องรัน coordinator agent ก่อน:"
    echo "  openclaw agent --agent coordinator --message 'Start coordinator'"
    echo ""
    exit 1
fi

echo "✅ Found session: $COORD_SESSION"
echo ""

# ทดสอบส่งข้อความผ่าน Gateway API
echo "Step 2: Test sending message to coordinator..."
echo ""

# สร้างข้อความที่จะส่ง
MESSAGE=$(cat <<EOF
[DASHBOARD] Task Request
ID: test-task-$(date +%s)
Project: a2
Title: Test coordinator communication
Description: This is a test to see if coordinator can receive messages
Agent: coder
EOF
)

echo "Message:"
echo "$MESSAGE"
echo ""

# ลองใช้ curl ส่งไปที่ Gateway (ถ้ามี API)
echo "Step 3: Try Gateway API..."

# Method A: sessions_send (ถ้ามี)
curl -s -X POST http://localhost:18789/api/sessions_send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer aa86ae060b0089c42b8a70c07ae4cd1653408cf109704387" \
  -d "{
    \"sessionKey\": \"agent:coordinator:main\",
    \"message\": \"$(echo "$MESSAGE" | sed 's/"/\\"/g' | tr '\n' ' ')\"
  }" 2>&1 | head -20

echo ""
echo "=========================================="
echo "Alternative: Manual Test"
echo "=========================================="
echo ""
echo "ให้ทดสอบแบบ manual:"
echo ""
echo "1. เปิด Terminal ใหม่"
echo "2. รัน:"
echo "   openclaw agent --agent coordinator"
echo ""
echo "3. จากนั้นใน Terminal อื่น รัน:"
echo "   openclaw send --agent coordinator --message '[DASHBOARD] Test message'"
echo ""
echo "4. ดูว่า coordinator ตอบสนองหรือไม่"
echo ""
