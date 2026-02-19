#!/bin/bash
# Fix for dashboard in Documents folder
# Run this on the TARGET machine

echo "🔧 Checking dashboard location..."
echo ""

# Check where dashboard actually is
if [ -d "Documents/dashboard" ]; then
    echo "✅ Found Documents/dashboard"
    cd Documents/dashboard
elif [ -d "dashboard" ]; then
    echo "✅ Found dashboard in current directory"
    cd dashboard
else
    echo "❌ dashboard folder not found"
    exit 1
fi

echo "Current directory: $(pwd)"
echo ""

# Set data dir explicitly
export DASHBOARD_DATA_DIR="$(pwd)/data"

echo "Setting DASHBOARD_DATA_DIR=$DASHBOARD_DATA_DIR"
echo ""

# Verify data exists
if [ -f "$DASHBOARD_DATA_DIR/projects.json" ]; then
    echo "✅ Data found!"
    echo "   Projects: $(cat $DASHBOARD_DATA_DIR/projects.json | grep '"id":' | wc -l)"
else
    echo "❌ Data not found at $DASHBOARD_DATA_DIR"
    exit 1
fi

echo ""
echo "🚀 Starting server with correct data directory..."
echo ""
npm run dev