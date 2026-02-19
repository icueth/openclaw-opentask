# Path Organization Summary

## Directory Structure

### Dashboard Data (Project/Task Data)
```
/Users/icue/.openclaw/workspace-coder/dashboard/data/
├── projects/              # Project workspaces
│   ├── project-a/
│   ├── project-b/
│   └── ...
├── task-contexts/         # Task session data
│   ├── task-xxx/
│   └── ...
├── projects.json          # Store
├── tasks.json             # Store
└── agents.json            # Store
```

### OpenClaw Core (Agent Workspaces)
```
/Users/icue/.openclaw/
├── workspace/             # Main agent (Omsin)
├── workspace-coder/       # Coder agent (Nova)
│   └── dashboard/         # Dashboard app
└── workspace-coordinator/ # Coordinator agent
```

## Path Configuration (`src/lib/paths.ts`)

| Variable | Purpose |
|----------|---------|
| `DASHBOARD_DATA_DIR` | Dashboard data root (env or ./data) |
| `DASHBOARD_PATHS.projects` | Project workspaces |
| `DASHBOARD_PATHS.taskContexts` | Task session data |
| `OPENCLAW_WORKSPACES` | Agent workspaces (separate) |

## Key Changes

1. **Dashboard projects** → Stored in `dashboard/data/projects/`
2. **Task contexts** → Stored in `dashboard/data/task-contexts/`
3. **OpenClaw workspaces** → Stay in `.openclaw/workspace*/`
4. **No mixing** of paths between Dashboard and OpenClaw Core

## API Endpoints

- `GET /api/admin/subagents` - List sub-agents
- `POST /api/admin/subagents` - Steer/kill sub-agents
- `POST /api/tasks-v2` - Create task (sessions_spawn style)
