#!/bin/bash
# Fix paths in projects.json when deploying to new machine
# Run this on the TARGET machine after extracting the deployment package

echo "🔧 Fixing project paths for new machine..."
echo ""

# Detect current user's home directory
CURRENT_HOME="$HOME"
CURRENT_USER=$(whoami)

echo "Current user: $CURRENT_USER"
echo "Home directory: $CURRENT_HOME"
echo ""

# Detect old paths from projects.json
OLD_PATHS=$(cat dashboard/data/projects.json | grep -o '"workspace": "[^"]*"' | sed 's/.*: "//' | sed 's/"$//' | sort -u)

echo "Found paths in projects.json:"
echo "$OLD_PATHS"
echo ""

# Extract old username from first path
OLD_HOME=$(echo "$OLD_PATHS" | head -1 | sed 's/\/\.openclaw.*//')
OLD_USER=$(basename "$OLD_HOME")

echo "Old user: $OLD_USER"
echo "Old home: $OLD_HOME"
echo "New home: $CURRENT_HOME"
echo ""

if [ "$OLD_HOME" = "$CURRENT_HOME" ]; then
    echo "✅ Paths already correct! No changes needed."
    exit 0
fi

# Backup original
cp dashboard/data/projects.json dashboard/data/projects.json.backup
echo "📋 Backed up to projects.json.backup"
echo ""

# Replace paths in projects.json
echo "🔄 Replacing paths..."
sed -i.bak "s|$OLD_HOME|$CURRENT_HOME|g" dashboard/data/projects.json

# Also fix agent workspace paths if they exist
if [ -f "dashboard/data/agents.json" ]; then
    sed -i.bak "s|$OLD_HOME|$CURRENT_HOME|g" dashboard/data/agents.json
    echo "✅ Fixed agents.json"
fi

# Verify
echo ""
echo "✅ Done! New paths:"
cat dashboard/data/projects.json | grep '"workspace"' | head -5

echo ""
echo "🚀 Ready to start server:"
echo "   cd dashboard && npm install && npm run build && npm run start"