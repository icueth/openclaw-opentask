# OpenClaw Dashboard Architecture

## Overview

The OpenClaw Dashboard (OpenTask) uses a simplified architecture focused on reliability and ease of use. Tasks are executed immediately via the TaskMan agent with file-based status tracking.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Dashboard (Next.js)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Projects  │  │    Tasks    │  │    Agents   │  │    Settings     │ │
│  │    Pages    │  │    Pages    │  │    Pages    │  │     Pages       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         └─────────────────┴─────────────────┴─────────────────┘         │
│                                    │                                    │
│                           API Routes                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  /projects  │  │   /tasks    │  │   /agents   │  │   /settings     │ │
│  │    REST     │  │    REST     │  │    REST     │  │    REST         │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         └─────────────────┴─────────────────┴─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Core Libraries                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │    store    │  │  taskQueue  │  │  taskRunner │  │     memory      │ │
│  │   (JSON)    │  │   (Queue)   │  │  (Spawn)    │  │   (Markdown)    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         TaskMan Integration                            │
│                                                                          │
│    Dashboard ──exec──▶ TaskMan Agent ──sessions_spawn──▶ Worker(s)      │
│                              │                              │           │
│                              │                              ▼           │
│                              │                     ┌─────────────────┐   │
│                              │                     │  Sub-agent(s)   │   │
│                              │                     │   (1-5 agents)  │   │
│                              │                     └─────────────────┘   │
│                              │                              │           │
│                              ▼                              ▼           │
│                     ┌─────────────────┐            ┌─────────────────┐   │
│                     │   Log Files     │◀───────────│   Task Output   │   │
│                     │  (JSON format)  │            │   (Artifacts)   │   │
│                     └─────────────────┘            └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Frontend (Next.js 14 App Router)

**Pages:**
- `/` - Dashboard home with stats and overview
- `/projects` - Project list and management
- `/projects/[id]` - Project detail view
- `/projects/[id]/tasks` - Task board for project
- `/agents` - Agent management
- `/settings` - System settings

**Components:**
- `GlassCard` - Glassmorphism UI container
- `TaskBoard` - Kanban-style task display
- `TaskCard` - Individual task display
- `NeonButton` - Styled button components

### 2. API Layer (Route Handlers)

RESTful API endpoints for CRUD operations on projects, tasks, and agents.

**Key endpoints:**
- `GET/POST /api/projects` - Project CRUD
- `GET/POST /api/projects/[id]/tasks` - Task CRUD
- `GET/POST /api/agents` - Agent CRUD
- `GET /api/status` - Gateway status

### 3. Core Libraries

#### Store (`src/lib/store.ts`)
File-based JSON persistence:
- `projects.json` - Project definitions
- `tasks.json` - Task records
- `spawns.json` - Spawn records (legacy)

#### Task Queue (`src/lib/taskQueue.ts`)
Simple task management:
- Create task
- Update status
- Delete task
- Get by project

#### Task Runner (`src/lib/taskRunner.ts`)
Executes tasks via TaskMan:
- Builds message for TaskMan
- Spawns TaskMan via `openclaw agent` CLI
- Handles multi-agent configuration
- Returns success/failure

#### Task Logger (`src/lib/taskLogger.ts`)
Manages task log files:
- `initTaskLog()` - Create log file
- `appendTaskLog()` - Add log entry
- `getTaskLog()` - Read log contents
- `updateTaskLogStatus()` - Update status

#### Memory (`src/lib/memory.ts`)
Project memory management:
- `readMemorySync()` - Read MEMORY.md
- `logTaskToMemory()` - Append task completion
- `formatMemoryForPrompt()` - Format for AI consumption

#### Status Detector (`src/lib/statusDetector.ts`)
Background status checking:
- Polls task log files every 10s
- Updates task status based on log content
- Runs independently of task execution

## Data Flow

### Task Creation & Execution

```
User → POST /api/projects/[id]/tasks
           │
           ▼
    taskQueue.createTask()
           │
           ├──▶ Save to tasks.json (status: pending)
           │
           ├──▶ Status: processing
           │
           └──▶ taskRunner.executeTask()
                      │
                      ├──▶ Build TaskMan message
                      │
                      ├──▶ Exec: openclaw agent --agent taskman
                      │
                      └──▶ TaskMan spawns workers
                                 │
                                 ├──▶ sessions_spawn
                                 │
                                 └──▶ Workers write to log files
```

### Status Detection

```
Status Detector (every 10s)
        │
        ├──▶ Read data/task-logs/{taskId}.json
        │
        ├──▶ Check log.status field
        │
        └──▶ Update tasks.json if changed
```

### Log Streaming

```
UI (TaskLogViewer)
        │
        ├──▶ Poll: GET /api/projects/[id]/tasks/[taskId]/logs
        │
        ├──▶ Server reads task-logs/{taskId}.json
        │
        └──▶ Return logs array
```

## File Structure

### Data Directory

```
data/
├── projects.json              # Project registry
├── tasks.json                 # Task registry
├── spawns.json                # Spawn records (legacy)
├── task-logs/                 # Task execution logs
│   └── {task-id}.json        # Individual task log
└── projects/                  # Project workspaces
    └── {project-id}/
        ├── PROJECT.json      # Project config
        ├── PROJECT.md        # Project documentation
        ├── MEMORY.md         # Project memory
        └── ...               # Project files
```

### Task Log Format

```json
{
  "taskId": "task-xxx-yyy",
  "projectId": "project-id",
  "title": "Task Title",
  "status": "completed",
  "logs": [
    {
      "timestamp": "2026-02-20T12:00:00Z",
      "level": "info",
      "message": "Starting task..."
    },
    {
      "timestamp": "2026-02-20T12:05:00Z",
      "level": "success",
      "message": "Task completed"
    }
  ],
  "result": "Summary of work done",
  "artifacts": ["file1.md", "file2.js"]
}
```

## Multi-Agent Task Execution

When creating a task with multiple agents:

```
┌─────────────────┐
│  Task Created   │
│  agentCount: 3  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│                   TaskMan Message                     │
│                                                       │
│  MULTI-AGENT CONFIGURATION:                          │
│  - Total Agents: 3                                   │
│  - Thinking Levels:                                  │
│    - Agent 1: Level 5 (Maximum) - PRIMARY/LEAD       │
│    - Agent 2: Level 3 (Medium) - RESEARCH            │
│    - Agent 3: Level 2 (Light) - IMPLEMENTATION       │
│                                                       │
│  AS TASKMAN, YOU MUST:                               │
│  1. Analyze the task and break it into sub-tasks     │
│  2. Spawn 3 agents using sessions_spawn              │
│  3. Coordinate between agents                        │
│  4. Merge all results and mark task complete         │
└──────────────────────────────────────────────────────┘
         │
         ▼
    TaskMan spawns agents via sessions_spawn
         │
         ├──▶ Agent 1 (Level 5) - Lead/Coordination
         ├──▶ Agent 2 (Level 3) - Research/Analysis
         └──▶ Agent 3 (Level 2) - Implementation
```

## Security Considerations

1. **Path Sanitization** - All paths validated to prevent directory traversal
2. **Input Validation** - Zod schemas on all API endpoints
3. **Rate Limiting** - Configurable rate limits on API routes
4. **Environment Variables** - Sensitive config in `.env.local`

## Performance

1. **File-based Storage** - No database required, simple and fast
2. **Polling** - UI polls every few seconds for updates
3. **Lazy Loading** - Components load data as needed
4. **Background Processing** - Status detection runs independently

## Deployment

### Single Machine
```
Dashboard runs on localhost:3456
  └── Data stored in ./data/
```

### With External Data Directory
```
DASHBOARD_DATA_DIR=/var/lib/dashboard/data
  └── Data stored outside app directory
```

### Docker
```yaml
volumes:
  - dashboard-data:/app/data
```

## Future Considerations

Potential improvements:
- **WebSocket** - Replace polling with WebSocket for real-time updates
- **Database** - SQLite or PostgreSQL for larger deployments
- **Queue** - Redis-backed queue for high-volume task processing
- **API Gateway** - Separate API service from frontend

---

*Architecture Version: 2.0*
*Last Updated: February 2026*
