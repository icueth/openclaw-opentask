# Path Organization

## Overview

The dashboard stores all data in a single `data/` directory, separate from OpenClaw Core workspaces.

## Directory Structure

```
dashboard/
├── data/                      # Dashboard data (this is the important part)
│   ├── projects/             # Project workspaces
│   │   └── {project-id}/
│   │       ├── PROJECT.json
│   │       ├── PROJECT.md
│   │       ├── MEMORY.md
│   │       └── ...
│   ├── projects.json         # Project registry
│   ├── tasks.json            # Task registry
│   └── task-logs/            # Task execution logs
│       └── {task-id}.json
├── src/                      # Source code
├── next.config.js
└── ...
```

## Data Storage

All dashboard data lives in `data/`:

| Path | Purpose |
|------|---------|
| `data/projects.json` | Project registry (JSON) |
| `data/tasks.json` | Task registry (JSON) |
| `data/projects/{id}/` | Individual project workspaces |
| `data/task-logs/{id}.json` | Task execution logs |

## Environment Variable

Override the default data location:

```bash
export DASHBOARD_DATA_DIR=/custom/path/to/data
```

## Code Usage

```typescript
import { store } from '@/lib/store'

// Projects are automatically stored in data/projects.json
const projects = store.getProjects()

// Project workspaces are in data/projects/{id}/
const projectPath = project.workspace
```

## Backup

Simply backup the entire `data/` directory:

```bash
cp -r data data-backup-$(date +%Y%m%d)
# or
zip -r backup.zip data/
```
