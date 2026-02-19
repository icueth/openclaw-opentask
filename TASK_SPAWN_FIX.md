# Task Spawning Debug - Fix Applied

## Problem Summary
Tasks were getting stuck in "processing" status because:
1. The task status was set to "processing" **BEFORE** the actual spawn was attempted
2. When the gateway was unavailable, the fallback only wrote a task file without actually spawning anything
3. There was no mechanism to spawn sub-agents when the gateway fails

## Root Cause
In `taskRunner.ts`, the original code:
```typescript
// Update task to processing
updateTask(taskId, { status: 'processing' })  // <- Status set BEFORE spawn

// Then try to spawn...
// If gateway fails, fall back to file (which doesn't spawn anything!)
return { success: true, sessionKey: `file-${task.id}` }  // <- Returns success but nothing runs!
```

## Fixes Applied

### 1. Fixed Status Update Timing (taskRunner.ts)
- **Moved status to "processing" AFTER successful spawn**
- Status now only changes to "processing" when we have confirmation the sub-agent is actually running
- If spawn fails, status is properly set to "failed" or "pending" (for retry)

### 2. Added Direct CLI Spawn Fallback (taskRunner.ts)
- Added `spawnViaCLI()` function that attempts to spawn via `openclaw` CLI command
- When gateway fails, it:
  1. Writes task context to a file
  2. Attempts to detect and use `openclaw` CLI
  3. Spawns the agent in background using shell commands
  4. Creates log files for debugging

### 3. Enhanced Logging Throughout
**API Route (`route.ts`):**
- Added logging when task is created and queue is processed
- Logs final status after processing

**Task Queue (`taskQueue.ts`):**
- Added detailed logging in `assignTask()`:
  - When task assignment starts
  - Current status before assignment
  - When spawn is called
  - Success/failure of spawn
  - Retry decisions

**Task Runner (`taskRunner.ts`):**
- Added logging for each gateway endpoint attempt
- Logs CLI spawn attempts
- Logs actual spawn command execution
- Better error messages

### 4. Improved Error Handling
- In `spawnForTask()`, check current task status before updating to "failed"
- Prevents race conditions where task might have already been updated by retry logic
- Proper error propagation with descriptive messages

## New Logging Output
When you create a task, you should now see:
```
[API] Task task-xxx created with status: pending, immediately processing queue...
[TaskQueue] Processing queue...
[TaskQueue] Found 1 pending, processing 1 (slots: 3)
[TaskQueue] Assigning task task-xxx...
[TaskQueue] Task task-xxx current status: pending
[TaskQueue] Calling taskRunner.spawnForTask(task-xxx)...
[TaskRunner] Spawning sub-agent for task task-xxx...
[TaskRunner] Trying endpoint: http://localhost:18789/api/sessions/spawn
[TaskRunner] All gateway endpoints failed, trying direct CLI spawn...
[TaskRunner] Attempting CLI spawn for task task-xxx...
[TaskRunner] Found openclaw CLI at: /usr/local/bin/openclaw
[TaskRunner] Spawning with command: (cat ... | openclaw run ...)
[TaskRunner] Spawn command executed, check log at: ...
[TaskQueue] spawnForTask succeeded for task-xxx: { success: true, sessionKey: "cli-task-xxx" }
[API] Queue processed for task task-xxx, current status: processing, assignedAgent: cli-task-xxx
```

## Files Modified
1. `/src/lib/taskRunner.ts` - Core spawn logic, added CLI fallback
2. `/src/lib/taskQueue.ts` - Added detailed logging in assignTask
3. `/src/app/api/projects/[id]/tasks/route.ts` - Added API logging
4. `/src/app/api/projects/[id]/tasks/[taskId]/start/route.ts` - Added logging

## Testing
To verify the fix:
1. Create a new task in the dashboard
2. Check server logs for the new debug output
3. Task should either:
   - Spawn successfully via gateway (if available)
   - Spawn via CLI (if openclaw CLI available)
   - Fail with clear error message (if neither available)
4. Task status should properly reflect actual spawn state

## Notes
- The CLI fallback requires the `openclaw` command to be in PATH
- If gateway AND CLI are unavailable, task will fail with descriptive error
- Task files are written to `data/task-contexts/` for debugging
