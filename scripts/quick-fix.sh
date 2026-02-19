#!/bin/bash
# QUICK FIX: Run this on the TARGET machine if projects show "not found"
# This fixes the absolute path issue when usernames differ

echo "🔧 Quick Path Fix for OpenClaw Dashboard"
echo ""

# Get current user's home
CURRENT_HOME="$HOME"

echo "Current home: $CURRENT_HOME"
echo ""

# Check if in dashboard directory
if [ ! -f "data/projects.json" ]; then
    echo "❌ Error: data/projects.json not found!"
    echo "   Make sure you're in the dashboard directory"
    exit 1
fi

# Backup
cp data/projects.json data/projects.json.backup.$(date +%s)

# Detect old username from projects.json
OLD_USER=$(cat data/projects.json | grep -o '"workspace": "[^"]*"' | head -1 | sed 's/.*: "//' | sed 's/"$//' | cut -d'/' -f3)

echo "Old username in data: $OLD_USER"
echo "Current username: $(whoami)"
echo ""

if [ "$OLD_USER" = "$(whoami)" ]; then
    echo "✅ Usernames match! No fix needed."
    exit 0
fi

# Replace paths
echo "🔄 Fixing paths..."
sed -i.bak "s|/Users/$OLD_USER/|/Users/$(whoami)/|g" data/projects.json

# Verify
echo ""
echo "✅ Done! Checking new paths:"
grep '"workspace"' data/projects.json | head -3

echo ""
echo "🚀 Restart server to apply changes:"
echo "   pkill -f 'npm run'"
echo "   npm run start"