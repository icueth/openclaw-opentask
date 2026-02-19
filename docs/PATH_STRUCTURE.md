# Path Structure Documentation

## Overview

This document describes the file path organization for the OpenClaw Dashboard system, ensuring clear separation between **Dashboard Data** and **OpenClaw Core**.

---

## 📁 Directory Structure

### OpenClaw Core (Agent Workspaces)

These directories are managed by OpenClaw Core and contain agent workspaces, configs, and runtime data:

```
~/.openclaw/
├── workspace/                    # Agent: main (Omsin)
│   ├── SOUL.md
│   ├── MEMORY.md
│   └── ...
├── workspace-coder/              # Agent: coder (Nova)
│   ├── SOUL.md
│   ├── MEMORY.md
│   ├── dashboard/                # Dashboard Application
│   │   ├── data/                 # Dashboard Data (see below)
│   │   ├── src/
│   │   └── ...
│   └── ...
└── workspace-coordinator/        # Agent: coordinator
    ├── SOUL.md
    └── ...
```

**Rule**: Never store Dashboard project/task data in these directories!

---

### Dashboard Data (Projects & Tasks)

All Dashboard data is stored in a separate location, completely isolated from OpenClaw Core:

```
~/.openclaw/workspace-coder/dashboard/data/
├── projects/                     # Project workspaces
│   ├── project-1/
│   │   ├── PROJECT.md
│   │   ├── MEMORY.md
│   │   ├── PLAN.md
│   │   └── ... (project files)
│   ├── project-2/
│   └── ...
├── task-contexts/                # Task execution contexts
│   ├── task-xxx-yyy/
│   │   ├── TASK.txt
│   │   ├── progress.js
│   │   ├── complete.js
│   │   ├── run.sh
│   │   └── session.json
│   └── ...
├── projects.json                 # Project registry
├── tasks.json                    # Task registry
└── agents.json                   # Agent registry
```

**Rule**: All Dashboard operations must use these paths!

---

## 🔧 Path Configuration

### Environment Variable

```bash
# Optional: Override default location
export DASHBOARD_DATA_DIR=/custom/path/to/dashboard/data
```

Default: `~/.openclaw/workspace-coder/dashboard/data`

### Code Usage

```typescript
import { DASHBOARD_PATHS, getProjectWorkspace, getTaskContextPath } from '@/lib/paths'

// Get project workspace
const projectPath = getProjectWorkspace('project-1')
// Result: ~/.openclaw/workspace-coder/dashboard/data/projects/project-1

// Get task context path
const taskPath = getTaskContextPath('task-xxx-yyy')
// Result: ~/.openclaw/workspace-coder/dashboard/data/task-contexts/task-xxx-yyy

// Access store files
const projectsFile = DASHBOARD_PATHS.store.projects
// Result: ~/.openclaw/workspace-coder/dashboard/data/projects.json
```

---

## 📝 Data Flow

### Creating a Project

1. User creates project via Dashboard UI/API
2. Project stored in `DASHBOARD_PATHS.store.projects`
3. Project workspace created at `getProjectWorkspace(projectId)`
4. Files created in Dashboard data directory (NOT in OpenClaw Core)

### Running a Task

1. Task created in `DASHBOARD_PATHS.store.tasks`
2. Task context created at `getTaskContextPath(sessionKey)`
3. Agent spawned using isolated session
4. Progress and results saved to Dashboard data
5. Complete API updates Dashboard store

---

## 🔒 Security Rules

1. **Dashboard NEVER writes to**:
   - `~/.openclaw/workspace/`
   - `~/.openclaw/workspace-coder/` (except its own directory)
   - `~/.openclaw/workspace-coordinator/`

2. **Dashboard ONLY writes to**:
   - `~/.openclaw/workspace-coder/dashboard/data/`
   - Or `DASHBOARD_DATA_DIR` if set

3. **Path validation**:
   ```typescript
   import { isWithinDashboard } from '@/lib/paths'
   
   if (!isWithinDashboard(targetPath)) {
     throw new Error('Path outside Dashboard data directory')
   }
   ```

---

## 🔄 Migration Notes

If you have existing data in the wrong location:

```bash
# 1. Backup existing data
cp -r ~/.openclaw/workspace-coder/dashboard/data ~/backup-dashboard-data

# 2. Verify new structure
ls ~/.openclaw/workspace-coder/dashboard/data/projects
ls ~/.openclaw/workspace-coder/dashboard/data/task-contexts

# 3. Update environment if needed
export DASHBOARD_DATA_DIR=~/.openclaw/workspace-coder/dashboard/data
```

---

## ✅ Verification

Run the verification script:

```bash
./scripts/verify-paths.sh
```

Expected output:
```
✅ Main workspace exists
✅ Coder workspace exists
✅ Dashboard data exists
✅ Projects directory exists
✅ Task contexts exists
```

---

## 🎯 Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| OpenClaw Core | `~/.openclaw/workspace*` | Agent workspaces |
| Dashboard App | `~/.openclaw/workspace-coder/dashboard/` | Next.js app |
| Dashboard Data | `.../dashboard/data/` | Projects, tasks, stores |

**Key Principle**: Dashboard data is completely separate from OpenClaw Core workspaces!
