#!/bin/bash
# Test Method 1: Agent Coordinator (Pure OpenClaw)
# ทดสอบว่า Coordinator Agent ใช้ sessions_spawn ได้หรือไม่

echo "=========================================="
echo "Test Method 1: Agent Coordinator"
echo "=========================================="
echo ""

# ตรวจสอบว่ามี coordinator agent
echo "Step 1: Check coordinator agent config..."
if ! grep -q '"id": "coordinator"' ~/.openclaw/openclaw.json 2>/dev/null; then
    echo "❌ Coordinator agent not found in config"
    echo "Adding coordinator agent..."
    
    # สร้าง coordinator agent directory
    mkdir -p ~/.openclaw/agents/coordinator/agent
    
    # เพิ่ม AGENTS.md
    cat > ~/.openclaw/agents/coordinator/agent/AGENTS.md << 'EOF'
# Coordinator Agent

You are the Coordinator Agent. Use sessions_spawn to create worker agents.

When asked to spawn a task:
1. Use sessions_spawn tool
2. Pass the task description
3. Monitor via subagents tool
EOF
    
    echo "✅ Coordinator agent created"
fi

echo ""
echo "Step 2: Start Coordinator Agent..."
echo "รัน: openclaw agent --agent coordinator"
echo ""

# ทดสอบรัน coordinator ด้วยคำสั่ง spawn task
echo "Step 3: Send test task to coordinator..."
echo ""
echo "คำสั่งที่จะใช้:"
echo 'openclaw agent --agent coordinator --message "Spawn task: Create factorial function"'
echo ""
echo "หรือใช้ sessions_spawn โดยตรง:"
echo 'openclaw agent --agent coordinator --message "Use sessions_spawn to create worker for task: Create factorial function"'
echo ""

# สร้าง test script
TEST_SCRIPT=$(cat <<'EOF'
#!/usr/bin/env node
/**
 * Test sessions_spawn via Agent
 */

console.log('Test: Using sessions_spawn from Agent Coordinator')
console.log('')
console.log('This test will:')
console.log('1. Start coordinator agent')
console.log('2. Coordinator uses sessions_spawn tool')
console.log('3. Worker agent executes task')
console.log('4. Worker announces result back')
console.log('')
console.log('Expected result: Task completed with announce')
console.log('')

// Note: sessions_spawn only works inside OpenClaw agent session
// Cannot be called from outside (like this script)
console.log('⚠️  sessions_spawn can only be used INSIDE OpenClaw agent session')
console.log('')
console.log('To test manually:')
console.log('1. Start OpenClaw WebChat or CLI')
console.log('2. Use coordinator agent')
console.log('3. Ask to spawn task')
console.log('4. Check subagents list')
EOF
)

echo "$TEST_SCRIPT" > /tmp/test-sessions-spawn.js
echo "Script created: /tmp/test-sessions-spawn.js"
echo ""

# แสดงวิธีทดสอบ
echo "=========================================="
echo "วิธีทดสอบ (Manual):"
echo "=========================================="
echo ""
echo "1. เปิด WebChat หรือ Terminal"
echo "2. รัน:"
echo "   openclaw agent --agent coordinator"
echo ""
echo "3. พิมพ์ข้อความ:"
echo '   "Spawn a worker to create factorial function"'
echo ""
echo "4. Coordinator ควรจะ:"
echo "   - ใช้ sessions_spawn tool"
echo "   - สร้าง worker agent"
echo "   - Worker ทำงานและ announce กลับ"
echo ""
