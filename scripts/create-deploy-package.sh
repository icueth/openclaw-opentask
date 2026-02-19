#!/bin/bash
# Create deployment package with path-fixing for cross-machine deployment

OUTPUT="openclaw-dashboard-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

echo "📦 Creating deployment package: $OUTPUT"
echo ""

# Create temp directory
TMPDIR=$(mktemp -d)
DEPLOY_DIR="$TMPDIR/openclaw-dashboard"

# Copy essential files
mkdir -p "$DEPLOY_DIR"
cp -r dashboard/src "$DEPLOY_DIR/"
cp -r dashboard/data "$DEPLOY_DIR/"
cp dashboard/package*.json "$DEPLOY_DIR/"
cp dashboard/next.config.js "$DEPLOY_DIR/"
cp dashboard/tsconfig.json "$DEPLOY_DIR/"
cp dashboard/tailwind.config.js "$DEPLOY_DIR/"
cp dashboard/postcss.config.js "$DEPLOY_DIR/"
cp dashboard/next-env.d.ts "$DEPLOY_DIR/"
cp -r dashboard/scripts "$DEPLOY_DIR/"

# Create deploy instruction
cat > "$DEPLOY_DIR/DEPLOY_INSTRUCTIONS.txt" << 'EOF'
=== OpenClaw Dashboard Deployment ===

⚠️  IMPORTANT: ถ้าเครื่องใหม่มี username ต่างจากเครื่องเดิม
ต้องรัน script แก้ path ก่อน!

1. Extract this folder:
   tar -xzf openclaw-dashboard-deploy-*.tar.gz

2. Go to dashboard folder:
   cd openclaw-dashboard

3. ⚠️ FIX PATHS (ถ้า username ต่างกัน):
   bash scripts/fix-paths.sh

4. Install dependencies:
   npm install

5. Build:
   npm run build

6. Start server:
   npm run start

7. Open browser:
   http://localhost:3000

=== Why fix paths? ===
Project paths in data/projects.json เก็บเป็น absolute path เช่น:
  /Users/YOURNAME/.openclaw/workspace/...

ถ้าเครื่องใหม่มีชื่อ user ต่างกัน เช่น:
  /Users/FRIENDNAME/.openclaw/workspace/...
ต้องรัน fix-paths.sh เพื่อแก้ไข paths

=== Troubleshooting ===
If "Project not found" error:
1. Check data/projects.json exists
2. Run: bash scripts/fix-paths.sh
3. Check paths match current user

EOF

# Create tarball
cd "$TMPDIR"
tar -czf "/Users/icue/.openclaw/workspace-coder/$OUTPUT" openclaw-dashboard

# Cleanup
rm -rf "$TMPDIR"

echo "✅ Deployment package created: $OUTPUT"
echo ""
echo "📋 Contents:"
tar -tzf "/Users/icue/.openclaw/workspace-coder/$OUTPUT" | head -20
echo "..."
echo ""
echo "🚀 ขั้นตอน deploy ไปเครื่องใหม่:"
echo ""
echo "1. Copy ไฟล์:"
echo "   scp $OUTPUT user@new-machine:/path/to/destination/"
echo ""
echo "2. บนเครื่องใหม่:"
echo "   tar -xzf $OUTPUT"
echo "   cd openclaw-dashboard"
echo "   bash scripts/fix-paths.sh   # ⚠️ สำคัญ!"
echo "   npm install"
echo "   npm run build"
echo "   npm run start"
echo ""
echo "💡 fix-paths.sh จะแก้ไข paths ให้ตรงกับ user ปัจจุบัน"