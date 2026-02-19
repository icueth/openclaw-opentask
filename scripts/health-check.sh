#!/bin/bash
# Dashboard System Health Check & Fix Script
# Run this when tasks are stuck in "processing" but agents not running

echo "🔧 OpenClaw Dashboard Health Check"
echo "=================================="
echo ""

cd /Users/icue/.openclaw/workspace-coder/dashboard/data

# Check for stuck processing tasks
echo "1. Checking for stuck processing tasks..."
STUCK_COUNT=$(cat tasks.json | jq '[.[] | select(.status == "processing")] | length')
echo "   Found: $STUCK_COUNT tasks in 'processing' status"

if [ "$STUCK_COUNT" -gt 0 ]; then
  echo ""
  echo "2. Checking if processes are actually running..."
  
  cat tasks.json | jq -r '.[] | select(.status == "processing") | .id' | while read task; do
    pid_file="./task-contexts/${task}.pid"
    if [ -f "$pid_file" ]; then
      pid=$(cat "$pid_file")
      if ps -p $pid > /dev/null 2>&1; then
        echo "   ✓ $task: PID $pid RUNNING"
      else
        echo "   ✗ $task: PID $pid DEAD (will fix)"
      fi
    else
      echo "   ✗ $task: No PID file (will fix)"
    fi
  done
  
  echo ""
  read -p "Fix stuck tasks? (y/n): " CONFIRM
  if [ "$CONFIRM" = "y" ]; then
    node /tmp/fix-all-stuck.js 2>/dev/null || cat > /tmp/fix-stuck-temp.js << 'EOF'
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf-8'));
let fixed = 0;
tasks.forEach(t => {
  if (t.status === 'processing') {
    const pidFile = `/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/${t.id}.pid`;
    let isDead = false;
    if (fs.existsSync(pidFile)) {
      const pid = fs.readFileSync(pidFile, 'utf-8').trim();
      try { process.kill(parseInt(pid), 0); } catch (e) { isDead = true; }
    } else { isDead = true; }
    if (isDead) {
      t.status = 'failed';
      t.error = 'Process terminated unexpectedly';
      t.statusHistory = t.statusHistory || [];
      t.statusHistory.push({ status: 'failed', timestamp: new Date().toISOString(), message: 'Auto-fixed by health check' });
      fixed++;
      console.log(`   Fixed: ${t.id}`);
    }
  }
});
fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));
console.log(`\n✅ Fixed ${fixed} stuck tasks`);
EOF
    node /tmp/fix-stuck-temp.js
    
    echo ""
    echo "3. Restarting server..."
    pkill -f "npm run dev" 2>/dev/null
    sleep 2
    cd /Users/icue/.openclaw/workspace-coder/dashboard
    npm run dev > /tmp/dashboard.log 2>&1 &
    sleep 3
    echo "   ✓ Server restarted"
  fi
else
  echo "   ✓ No stuck tasks found"
fi

echo ""
echo "4. Queue Status:"
curl -s http://localhost:3000/api/admin/queue 2>/dev/null | jq '.status' || echo "   API not available"

echo ""
echo "=================================="
echo "✅ Health check complete!"