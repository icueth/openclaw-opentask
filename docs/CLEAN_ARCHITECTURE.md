# Clean Architecture - OpenTask

## Current System (Simplified)

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

## Flow

### 1. Create Task
```
POST /api/projects/{id}/tasks
- Creates task record (status: pending)
- Triggers TaskMan immediately
- Status becomes processing
```

### 2. TaskMan Spawns Worker
```
TaskMan receives [DASHBOARD] request
  ↓
Uses sessions_spawn to create worker(s)
  ↓
Worker gets context:
  - Task description
  - Project path
  - Instructions to write to log file
```

### 3. Worker Does Work
```
Worker:
1. Reads project memory (MEMORY.md)
2. Does the work
3. Writes logs to data/task-logs/{taskId}.json
4. Updates log.status when complete
```

### 4. Status Detector
```
Every 10 seconds:
1. Check data/task-logs/{taskId}.json
2. Read log.status field
3. Update tasks.json status if changed
```

## File Structure

```
data/
├── projects.json          # Project registry
├── tasks.json             # Task registry
├── task-logs/             # Task execution logs
│   └── {taskId}.json     # Individual task logs
└── projects/              # Project workspaces
    └── {projectId}/
        ├── PROJECT.json
        ├── PROJECT.md
        ├── MEMORY.md
        └── ...
```

## Log File Format

```json
{
  "taskId": "task-xxx",
  "projectId": "project-xxx",
  "title": "Task Title",
  "status": "completed",
  "logs": [
    {"timestamp": "...", "level": "info", "message": "..."}
  ],
  "result": "Summary",
  "artifacts": ["file1.md"]
}
```

## Multi-Agent Tasks

Tasks support spawning 1-5 agents with different thinking levels:

```
Agent 1: Level 5 (Maximum) - Lead/Coordination
Agent 2: Level 3 (Medium)  - Research/Analysis
Agent 3: Level 2 (Light)   - Implementation
...
```

Thinking levels:
- 1: Quick - Fast responses
- 2: Light - Standard reasoning  
- 3: Medium - Balanced
- 4: Deep - Thorough analysis
- 5: Maximum - Deep reasoning

## Key Components

| File | Purpose |
|------|---------|
| `src/lib/store.ts` | JSON file persistence |
| `src/lib/taskQueue.ts` | Task creation/status |
| `src/lib/taskRunner.ts` | Execute via TaskMan |
| `src/lib/taskLogger.ts` | Log file management |
| `src/lib/statusDetector.ts` | Background status checks |
| `src/lib/memory.ts` | Project memory read/write |

## Removed Components

- ❌ Task queue processor (async processing)
- ❌ CLI fallback spawn
- ❌ Zombie cleanup with 10min timeout
- ❌ Multiple progress tracking methods
- ❌ Complex context with many instructions
- ❌ Pipeline system
- ❌ Worker Pool

## Kept Components

- ✅ Simple API endpoints
- ✅ TaskMan as coordinator
- ✅ sessions_spawn for workers
- ✅ File-based log tracking
- ✅ Status detector polling
