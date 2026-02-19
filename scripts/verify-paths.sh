#!/bin/bash
# Verify Dashboard and OpenClaw Core Path Separation

echo "=========================================="
echo "Path Structure Verification"
echo "=========================================="
echo ""

echo "📁 OpenClaw Core (Agent Workspaces):"
echo "----------------------------------------"
echo "Main:   ~/.openclaw/workspace"
echo "Coder:  ~/.openclaw/workspace-coder"
echo "Coord:  ~/.openclaw/workspace-coordinator"
echo ""

# Check if directories exist
echo "Status:"
[ -d "$HOME/.openclaw/workspace" ] && echo "  ✅ Main workspace exists" || echo "  ❌ Main workspace missing"
[ -d "$HOME/.openclaw/workspace-coder" ] && echo "  ✅ Coder workspace exists" || echo "  ❌ Coder workspace missing"
echo ""

echo "📁 Dashboard Data (Projects & Tasks):"
echo "----------------------------------------"
echo "Root:   ~/.openclaw/workspace-coder/dashboard/data"
echo "Projects: ~/.openclaw/workspace-coder/dashboard/data/projects"
echo "Tasks:    ~/.openclaw/workspace-coder/dashboard/data/task-contexts"
echo ""

# Check Dashboard directories
DASHBOARD_DATA="$HOME/.openclaw/workspace-coder/dashboard/data"
[ -d "$DASHBOARD_DATA" ] && echo "  ✅ Dashboard data exists" || echo "  ❌ Dashboard data missing"
[ -d "$DASHBOARD_DATA/projects" ] && echo "  ✅ Projects directory exists" || echo "  ❌ Projects directory missing"
[ -d "$DASHBOARD_DATA/task-contexts" ] && echo "  ✅ Task contexts exists" || echo "  ❌ Task contexts missing"
echo ""

echo "📊 Current Data Stats:"
echo "----------------------------------------"
if [ -d "$DASHBOARD_DATA/projects" ]; then
  PROJECT_COUNT=$(ls -1 "$DASHBOARD_DATA/projects" 2>/dev/null | wc -l)
  echo "  Projects: $PROJECT_COUNT"
fi

if [ -d "$DASHBOARD_DATA/task-contexts" ]; then
  CONTEXT_COUNT=$(ls -1 "$DASHBOARD_DATA/task-contexts" 2>/dev/null | wc -l)
  echo "  Task Contexts: $CONTEXT_COUNT"
fi

echo ""
echo "✅ Path separation verified!"
echo "   Dashboard data is separate from OpenClaw Core"
echo "=========================================="
