# OpenClaw OpenTask - Clean Task System

## Architecture (Simplified)

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
│  - Checks for new files in project      │
│  - Updates task status                  │
└─────────────────────────────────────────┘
```

## Flow

### 1. Create Task
```
POST /api/projects/{id}/tasks
- Creates task record (status: pending)
- Triggers TaskMan immediately
```

### 2. TaskMan Spawns Worker
```
TaskMan receives [DASHBOARD] request
  ↓
Uses sessions_spawn to create worker
  ↓
Worker gets simple context:
  - Task description
  - Project path
  - Instructions to write status file
```

### 3. Worker Does Work
```
Worker:
1. Reads project memory
2. Creates files
3. Writes status file: {taskId}-status.json
4. Updates project memory
```

### 4. Status Detector
```
Every 10 seconds:
1. Check {taskId}-status.json
2. If status=completed → mark task done
3. If no status file but files exist → check file timestamps
```

## File Structure

```
data/
├── projects/{projectId}/
│   ├── MEMORY.md
│   └── [created files]
└── task-status/
    └── {taskId}-status.json
```

## Status File Format

```json
{
  "percentage": 100,
  "status": "completed",
  "message": "Created story.md",
  "result": "Full summary here...",
  "artifacts": ["story.md"],
  "timestamp": "2026-02-20T02:00:00Z"
}
```

## Removed Components

- ❌ Task queue processor (async processing)
- ❌ CLI fallback spawn
- ❌ Zombie cleanup with 10min timeout
- ❌ Multiple progress tracking methods
- ❌ Complex context with many instructions

## Kept Components

- ✅ Simple API endpoints
- ✅ TaskMan as coordinator
- ✅ sessions_spawn for workers
- ✅ File-based status tracking
- ✅ Simple file detector
