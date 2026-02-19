# Task System Architecture v2

## Overview
Task system ใหม่ที่ออกแบบตาม OpenClaw best practices - Real-time, Isolated, Scalable

## Core Components

### 1. Real-time Updates (WebSocket)
```
Client ←→ WebSocket Server ←→ Task Events
         ├─ task:start
         ├─ task:progress
         ├─ task:tool:start
         ├─ task:tool:end
         ├─ task:complete
         └─ task:error
```

### 2. Session Isolation
- แต่ละ task มี workspace เป็นของตัวเอง
- Context isolation (ไม่เห็นกันระหว่าง tasks)
- Separate process สำหรับแต่ละ task

### 3. Queue System
```
┌─────────────────────────────────────────┐
│           Global Queue Manager          │
├─────────────────────────────────────────┤
│  Project A Queue  │  Project B Queue   │
│  ├─ Task 1 (high) │  ├─ Task 4        │
│  ├─ Task 2        │  └─ Task 5        │
│  └─ Task 3        │                    │
└─────────────────────────────────────────┘
              ↓
       Concurrency Control
       (maxConcurrent: 5)
```

### 4. Sub-task System
```
Task Parent
  ├─ Sub-task 1
  ├─ Sub-task 2
  └─ Sub-task 3
      
Parent track: progress/complete/fail ของทุก children
Auto-complete เมื่อ children ทั้งหมด done
```

### 5. Lifecycle Hooks
- onTaskCreate
- onTaskStart
- onTaskProgress
- onTaskComplete
- onTaskFail
- onTaskCancel

### 6. Smart Context
- Auto-read: PROJECT.md, MEMORY.md, SOUL.md
- Context compaction ก่อนส่ง model
- Auto-write สรุปกลับ MEMORY.md

### 7. Tool Policy
- Task type based permissions
- Sandbox filesystem
- Resource limits (CPU, Memory, Time)

## File Structure
```
src/lib/task-system/
├── core/
│   ├── TaskRunner.ts          # Core execution engine
│   ├── TaskQueue.ts           # Queue management
│   ├── TaskSession.ts         # Session isolation
│   └── TaskContext.ts         # Context management
├── realtime/
│   ├── WebSocketServer.ts     # WS server
│   └── EventEmitter.ts        # Event system
├── subtask/
│   ├── SubTaskManager.ts      # Child task management
│   └── TaskHierarchy.ts       # Parent-child tracking
├── hooks/
│   ├── LifecycleHooks.ts      # Hook system
│   └── WebhookManager.ts      # External notifications
├── context/
│   ├── ContextBuilder.ts      # Build task context
│   ├── ContextCompactor.ts    # Manage context size
│   └── MemoryManager.ts       # Auto memory read/write
├── policy/
│   ├── ToolPolicy.ts          # Permission system
│   ├── Sandbox.ts             # File isolation
│   └── ResourceLimiter.ts     # CPU/Memory limits
└── types/
    └── index.ts               # TypeScript types
```

## Implementation Plan
Phase 1: Core System (Queue + Session + Runner)
Phase 2: Real-time (WebSocket + Events)
Phase 3: Sub-tasks (Hierarchy + Tracking)
Phase 4: Smart Context (Memory + Compaction)
Phase 5: Tool Policy (Permissions + Sandbox)
