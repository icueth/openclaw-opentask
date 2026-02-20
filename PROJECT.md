# OpenClaw Dashboard - Project Overview

A clean, task-focused dashboard for managing OpenClaw agents and projects.

## Current System Features

### 1. Project Management
- Create projects with isolated workspaces in `data/projects/`
- Each project gets:
  - `PROJECT.json` - Machine-readable config
  - `PROJECT.md` - Human-readable overview
  - `MEMORY.md` - Persistent project memory
  - `TASKS.md` - Task tracking (legacy format)
- GitHub integration - Clone repositories when creating projects
- Project listing with file browsing

### 2. Task Management
- Create tasks with title, description, priority
- **Auto-execution** via TaskMan agent - no manual queue processing
- Multi-agent support: Select 1-5 agents with thinking levels 1-5
- Task statuses: `created` → `pending` → `processing` → `completed`/`failed`
- Live log streaming from task execution
- Progress tracking via log files

### 3. Agent Management
- List all configured agents from `openclaw.json`
- Create new agents with template files (SOUL.md, AGENTS.md, etc.)
- Edit agent settings: model, thinking mode, skills
- Delete agents
- Agent workspace file editing

### 4. Git Integration
- Pull Git - Create tasks to pull latest code
- Commit/Push operations via settings
- GitHub OAuth authentication
- Repository cloning on project creation

### 5. Settings
- Git authentication (OAuth or PAT)
- Gateway connection status
- System configuration viewing

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Dashboard │────▶│   TaskMan    │────▶│   Worker    │
│   (Next.js) │     │   (Agent)    │     │  (Subagent) │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                    │
       │                    │                    ▼
       │                    │             Creates files
       │                    │                    │
       │                    ▼                    │
       │             Spawns via           ┌─────────────┐
       │             sessions_spawn       │   Project   │
       │                                  │   Files     │
       │                                  └─────────────┘
       │                                          │
       │                    ┌─────────────────────┘
       │                    │
       ▼                    ▼
┌─────────────────────────────────────────┐
│     Status Detector (Every 10s)         │
│  - Checks task log files                │
│  - Updates task status                  │
└─────────────────────────────────────────┘
```

## Data Storage

All data stored in `data/` directory:

```
data/
├── projects.json          # Project registry
├── tasks.json             # Task registry
├── projects/              # Project workspaces
│   └── {project-id}/
│       ├── PROJECT.json
│       ├── PROJECT.md
│       ├── MEMORY.md
│       └── ...
└── task-logs/             # Task execution logs
    └── {task-id}.json
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/store.ts` | Data persistence (JSON files) |
| `src/lib/taskQueue.ts` | Task creation and status management |
| `src/lib/taskRunner.ts` | Execute tasks via TaskMan |
| `src/lib/memory.ts` | Project memory read/write |
| `src/lib/taskLogger.ts` | Task log file management |
| `src/lib/statusDetector.ts` | Background status checking |

## Task Execution Flow

1. **Task Creation**
   - User creates task via POST `/api/projects/{id}/tasks`
   - Task saved to `tasks.json` with status `pending`
   - `taskQueue.createTask()` called immediately

2. **Task Execution**
   - Status set to `processing`
   - `taskRunner.executeTask()` spawns TaskMan
   - TaskMan receives message with task details
   - TaskMan spawns worker(s) via `sessions_spawn`

3. **Log Streaming**
   - Workers write to `data/task-logs/{taskId}.json`
   - UI polls for log updates
   - Real-time output displayed

4. **Status Detection**
   - `statusDetector` runs every 10s
   - Checks log files for status changes
   - Updates task status in `tasks.json`

## Multi-Agent Tasks

Tasks can spawn multiple agents with different thinking levels:

```typescript
// Example task configuration
{
  agentCount: 3,
  agentThinkingLevels: [5, 3, 2]
  // Agent 1: Level 5 (Maximum depth) - Lead/Coordination
  // Agent 2: Level 3 (Medium) - Implementation
  // Agent 3: Level 2 (Light) - Research/Testing
}
```

Thinking levels:
- 1: Quick - Fast responses, basic reasoning
- 2: Light - Standard reasoning
- 3: Medium - Balanced (default)
- 4: Deep - Thorough analysis
- 5: Maximum - Deep reasoning, detailed analysis

## API Endpoints

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks?projectId=x` - Filter by project
- `POST /api/projects/[id]/tasks` - Create task
- `GET /api/projects/[id]/tasks` - List project tasks

### Agents
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/agents/[id]` - Get agent
- `PUT /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]` - Delete agent

### System
- `GET /api/status` - Gateway status
- `GET /api/nodes` - List nodes
- `GET /api/sessions` - List sessions
- `GET /api/logs` - Read logs

### Settings
- `GET /api/settings/git-auth` - Get Git auth
- `POST /api/settings/git-auth` - Save Git auth
- `DELETE /api/settings/git-auth` - Clear Git auth

## Development

### Prerequisites
- Node.js 18+
- npm 9+
- OpenClaw gateway running

### Setup
```bash
cd /Users/icue/.openclaw/workspace-coder/dashboard
npm install
cp .env.example .env.local
# Edit .env.local with your GATEWAY_TOKEN
npm run dev
```

### Build
```bash
npm run build
npm start
```

## Removed Features (No Longer in System)

- ❌ Pipeline system - Removed for simplicity
- ❌ Worker Pool - Removed, now direct TaskMan spawn
- ❌ Add Worker button - Removed
- ❌ Complex queue processor - Now immediate execution
- ❌ CLI fallback spawn - Removed
- ❌ Zombie cleanup with 10min timeout - Simplified

## Future Enhancements

Potential improvements:
- WebSocket for real-time updates (replace polling)
- Task result viewer with syntax highlighting
- Project templates for common use cases
- Export/import for projects
- Agent performance metrics
- Multi-gateway support

---

*Last Updated: February 2026*
