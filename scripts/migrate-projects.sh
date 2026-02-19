#!/bin/bash
# Migrate old projects to dashboard/data/projects/

echo "🔄 Migrating projects to data/projects/..."
echo ""

DASHBOARD_DIR="/Users/icue/.openclaw/workspace-coder/dashboard"
DATA_DIR="$DASHBOARD_DIR/data"
OLD_PROJECTS_DIR="/Users/icue/.openclaw/workspace-coder/projects"
NEW_PROJECTS_DIR="$DATA_DIR/projects"

cd "$DASHBOARD_DIR"

# Ensure data/projects exists
mkdir -p "$NEW_PROJECTS_DIR"

# Backup projects.json
cp "$DATA_DIR/projects.json" "$DATA_DIR/projects.json.backup.$(date +%s)"

echo "Projects to migrate:"
echo ""

# Read projects and migrate
cat "$DATA_DIR/projects.json" | python3 << 'PYEOF'
import json
import os
import shutil

old_projects_dir = "/Users/icue/.openclaw/workspace-coder/projects"
new_projects_dir = "/Users/icue/.openclaw/workspace-coder/dashboard/data/projects"

data_dir = "/Users/icue/.openclaw/workspace-coder/dashboard/data"

with open(f"{data_dir}/projects.json", "r") as f:
    projects = json.load(f)

migrated = []
for project in projects:
    old_path = project.get("workspace") or project.get("path", "")
    
    # Check if this is an old-style path
    if ".openclaw/workspace" in old_path and "dashboard/data" not in old_path:
        project_id = project["id"]
        new_path = os.path.join(new_projects_dir, project_id)
        
        print(f"📝 {project_id}")
        print(f"   From: {old_path}")
        print(f"   To:   {new_path}")
        
        # Check if source exists
        if os.path.exists(old_path):
            # Move folder
            if os.path.exists(new_path):
                print(f"   ⚠️  Target exists, skipping move")
            else:
                shutil.move(old_path, new_path)
                print(f"   ✅ Moved")
        else:
            print(f"   ⚠️  Source not found, creating new folder")
            os.makedirs(new_path, exist_ok=True)
        
        # Update path in project
        project["workspace"] = new_path
        project["path"] = new_path
        migrated.append(project_id)
    else:
        # Already in new location
        migrated.append(project.get("id"))

# Save updated projects.json
with open(f"{data_dir}/projects.json", "w") as f:
    json.dump(projects, f, indent=2)

print("")
print(f"✅ Migrated {len(migrated)} projects")
print("")
print("Restart server to apply changes:")
print("  pkill -f 'npm run' && npm run dev")

PYEOF

echo ""
echo "📋 Summary:"
echo "   Old location: $OLD_PROJECTS_DIR"
echo "   New location: $NEW_PROJECTS_DIR"
echo ""
echo "✅ Migration complete!"