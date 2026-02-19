#!/bin/bash
# Debug deployment - run on TARGET machine
echo "=== OpenClaw Dashboard Debug ==="
echo ""
echo "1. Current directory:"
pwd
echo ""
echo "2. Check data/projects.json:"
if [ -f "data/projects.json" ]; then
    echo "✅ File exists"
    echo "   Size: $(stat -f%z data/projects.json 2>/dev/null || stat -c%s data/projects.json 2>/dev/null) bytes"
    echo "   Projects found:"
    cat data/projects.json | grep '"id":' | wc -l
    echo ""
    echo "   First 3 projects:"
    cat data/projects.json | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f\"  - {p['id']}: {p.get('name','no name')}\") for p in d[:3]]" 2>/dev/null || cat data/projects.json | grep '"id"' | head -3
else
    echo "❌ data/projects.json NOT FOUND"
fi
echo ""
echo "3. Environment:"
echo "   DASHBOARD_DATA_DIR=${DASHBOARD_DATA_DIR:-'(not set - using default ./data)'}"
echo "   USER=$(whoami)"
echo "   HOME=$HOME"
echo ""
echo "4. Permissions:"
ls -la data/ 2>/dev/null | head -5
echo ""
echo "=== Send this output back for debugging ==="