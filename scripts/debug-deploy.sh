#!/bin/bash
# Debug script for deployment issues

echo "=== OpenClaw Dashboard Debug ==="
echo ""

echo "1. Current directory:"
pwd

echo ""
echo "2. Dashboard folder exists?"
ls -la dashboard/ 2>/dev/null || echo "❌ dashboard/ not found"

echo ""
echo "3. Data folder contents:"
ls -la dashboard/data/ 2>/dev/null || echo "❌ dashboard/data/ not found"

echo ""
echo "4. Projects.json exists?"
if [ -f "dashboard/data/projects.json" ]; then
    echo "✅ projects.json found"
    echo "   Size: $(stat -f%z dashboard/data/projects.json 2>/dev/null || stat -c%s dashboard/data/projects.json 2>/dev/null) bytes"
    echo "   Projects:"
    cat dashboard/data/projects.json | grep '"id"' | head -10
else
    echo "❌ projects.json NOT FOUND"
fi

echo ""
echo "5. Environment variables:"
echo "   DASHBOARD_DATA_DIR=${DASHBOARD_DATA_DIR:-'(not set)'}"
echo "   NODE_ENV=${NODE_ENV:-'(not set)'}"

echo ""
echo "=== Debug Complete ==="

echo ""
echo "📝 Copy คำสั่งนี้ไปรันบนเครื่องใหม่:"
echo ""
echo "cd /path/to/dashboard && cat data/projects.json | head -20"