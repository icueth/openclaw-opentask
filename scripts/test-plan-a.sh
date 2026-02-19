#!/bin/bash
# Run All Tests for Plan A

echo "=========================================="
echo "Testing Plan A: sessions_spawn"
echo "=========================================="
echo ""

# Test Method 1
echo "═══════════════════════════════════════════════════"
echo "METHOD 1: Agent Coordinator (Pure OpenClaw)"
echo "═══════════════════════════════════════════════════"
echo ""
./scripts/test-method1-coordinator.sh
echo ""

# Test Method 2
echo "═══════════════════════════════════════════════════"
echo "METHOD 2: WebSocket Gateway"
echo "═══════════════════════════════════════════════════"
echo ""
node scripts/test-method2-websocket.js
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Method 1: Requires manual testing via OpenClaw CLI/WebChat"
echo "Method 2: WebSocket requires authentication and proper protocol"
echo ""
echo "ปัญหาที่พบ:"
echo "- sessions_spawn เป็น Tool (ไม่มี HTTP/CLI interface)"
echo "- ใช้ได้เฉพาะใน OpenClaw agent session เท่านั้น"
echo "- Dashboard (Next.js) ไม่ใช่ OpenClaw agent"
echo ""
echo "ทางเลือกที่เหลือ:"
echo "1. ใช้แผน B (CLI spawn) ที่ทดสอบแล้ว"
echo "2. รอ OpenClaw Core เพิ่ม HTTP API สำหรับ sessions_spawn"
echo "3. รัน Dashboard ภายใต้ OpenClaw agent (ไม่ practical)"
echo ""
