#!/usr/bin/env node
/**
 * Daemon Agent - OpenClaw Task Coordinator
 * รันเป็น OpenClaw agent ตลอดเวลา คอยรับ task ผ่าน WebSocket
 * และใช้ subagents spawn สร้าง worker agents
 */

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

// Configuration
const DAEMON_STATE_FILE = path.join(process.cwd(), 'data', 'daemon-state.json')
const TASK_QUEUE_FILE = path.join(process.cwd(), 'data', 'daemon-queue.json')
const LOG_FILE = path.join(process.cwd(), 'data', 'daemon.log')

// Task queue
let taskQueue = []
let isProcessing = false
let activeWorkers = new Map()

// Logger
function log(level, message, data) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] [${level}] ${message}`
  console.log(logEntry)
  if (data) console.log('Data:', data)
  
  // Append to log file
  fs.appendFileSync(LOG_FILE, logEntry + '\n')
  if (data) fs.appendFileSync(LOG_FILE, 'Data: ' + JSON.stringify(data, null, 2) + '\n')
}

// Save daemon state
function saveState() {
  const state = {
    lastActive: new Date().toISOString(),
    queueLength: taskQueue.length,
    activeWorkers: Array.from(activeWorkers.keys())
  }
  fs.writeFileSync(DAEMON_STATE_FILE, JSON.stringify(state, null, 2))
}

// Load task queue
function loadQueue() {
  try {
    if (fs.existsSync(TASK_QUEUE_FILE)) {
      taskQueue = JSON.parse(fs.readFileSync(TASK_QUEUE_FILE, 'utf-8'))
      log('INFO', `Loaded ${taskQueue.length} tasks from queue`)
    }
  } catch (e) {
    log('ERROR', 'Failed to load queue', e.message)
    taskQueue = []
  }
}

// Save task queue
function saveQueue() {
  fs.writeFileSync(TASK_QUEUE_FILE, JSON.stringify(taskQueue, null, 2))
}

// Add task to queue
function addTask(task) {
  task.id = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  task.status = 'pending'
  task.createdAt = new Date().toISOString()
  
  taskQueue.push(task)
  saveQueue()
  
  log('INFO', `Task ${task.id} added to queue`, { title: task.title })
  
  // Start processing if not already running
  if (!isProcessing) {
    processQueue()
  }
  
  return task.id
}

// Process task queue
async function processQueue() {
  if (isProcessing || taskQueue.length === 0) return
  
  isProcessing = true
  log('INFO', 'Starting queue processing...')
  
  while (taskQueue.length > 0) {
    const task = taskQueue.shift()
    task.status = 'processing'
    task.startedAt = new Date().toISOString()
    saveQueue()
    
    log('INFO', `Processing task ${task.id}`, { title: task.title })
    
    try {
      await spawnWorker(task)
    } catch (error) {
      log('ERROR', `Failed to spawn worker for task ${task.id}`, error.message)
      task.status = 'failed'
      task.error = error.message
      task.completedAt = new Date().toISOString()
      saveQueue()
    }
    
    // Small delay between tasks
    await new Promise(r => setTimeout(r, 1000))
  }
  
  isProcessing = false
  log('INFO', 'Queue processing complete')
}

// Spawn worker using subagents (via CLI simulation)
async function spawnWorker(task) {
  log('INFO', `Spawning worker for task ${task.id}`)
  
  const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
  fs.mkdirSync(contextDir, { recursive: true })
  
  // Create worker context
  const workerContext = buildWorkerContext(task)
  const contextFile = path.join(contextDir, `${task.id}-worker-context.md`)
  fs.writeFileSync(contextFile, workerContext, 'utf-8')
  
  // Create progress helper
  const progressHelper = path.join(contextDir, `${task.id}-progress.js`)
  const progressScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const progressFile = path.join('${contextDir}', '${task.id}.progress');

function writeProgress(pct, msg) {
  fs.mkdirSync(path.dirname(progressFile), { recursive: true });
  fs.writeFileSync(progressFile, JSON.stringify({
    percentage: parseInt(pct),
    message: msg,
    timestamp: Date.now()
  }));
  console.log('[PROGRESS]', pct + '% - ' + msg);
}

const [,, pct, msg] = process.argv;
writeProgress(pct, msg);
`
  fs.writeFileSync(progressHelper, progressScript)
  fs.chmodSync(progressHelper, 0o755)
  
  // Create worker script
  const workerScript = path.join(contextDir, `${task.id}-worker.sh`)
  const logFile = path.join(contextDir, `${task.id}.log`)
  const pidFile = path.join(contextDir, `${task.id}.pid`)
  
  const scriptContent = `#!/bin/bash
set -e

echo $$ > "${pidFile}"
echo "[$(date)] Worker started for task ${task.id}" > "${logFile}"

# Report progress helper
report_progress() {
  node "${progressHelper}" "$1" "$2" 2>/dev/null || true
}

report_progress 10 "🚀 Worker initializing..."

# Run openclaw agent
openclaw agent \\
  --agent ${task.agentId} \\
  --message "$(cat ${contextFile})" \\
  --thinking medium \\
  --json 2>&1 | tee -a "${logFile}" || {
    echo "Worker exited with code $?" >> "${logFile}"
    exit 1
  }

report_progress 100 "✅ Task completed"
echo "[$(date)] Worker completed" >> "${logFile}"
`
  
  fs.writeFileSync(workerScript, scriptContent)
  fs.chmodSync(workerScript, 0o755)
  
  // Spawn worker
  const child = spawn('bash', [workerScript], {
    detached: true,
    stdio: 'ignore'
  })
  
  child.unref()
  
  // Track worker
  activeWorkers.set(task.id, {
    pid: child.pid,
    startedAt: new Date().toISOString()
  })
  
  log('INFO', `Worker spawned with PID ${child.pid} for task ${task.id}`)
  
  // Monitor worker
  monitorWorker(task.id, child.pid, pidFile)
  
  return child.pid
}

// Build worker context
function buildWorkerContext(task) {
  const projectPath = path.join(process.cwd(), 'data', 'projects', task.projectId)
  const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
  const progressHelper = path.join(contextDir, `${task.id}-progress.js`)
  
  return `## 🤖 Worker Agent Task

**Task ID:** ${task.id}
**Title:** ${task.title}

### Mission
${task.description}

### Workspace
\`\`\`
${projectPath}
\`\`\`

### Progress Tracking
Report progress frequently:
\`\`\`
exec: {"command": "node ${progressHelper} 20 '📝 Working...'"}
\`\`\`

Checkpoints:
- 20% - Started
- 40% - Files created
- 60% - Implementation
- 80% - Testing
- 100% - Complete

### Completion
When done:
\`\`\`
exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/complete -H 'Content-Type: application/json' -d '{"result": "Summary", "artifacts": []}'"}
\`\`\`

---
*Daemon Task - ${new Date().toISOString()}*
`
}

// Monitor worker process
function monitorWorker(taskId, pid, pidFile) {
  const checkInterval = setInterval(() => {
    try {
      // Check if process still exists
      process.kill(pid, 0)
    } catch (e) {
      // Process ended
      clearInterval(checkInterval)
      activeWorkers.delete(taskId)
      
      log('INFO', `Worker for task ${taskId} has completed`)
      
      // Clean up (optional - keep files for debugging)
      // cleanupWorkerFiles(taskId)
    }
  }, 5000)
}

// Cleanup worker files
function cleanupWorkerFiles(taskId) {
  const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
  const files = [
    `${taskId}-worker-context.md`,
    `${taskId}-worker.sh`,
    `${taskId}-progress.js`,
    `${taskId}.pid`
  ]
  
  files.forEach(file => {
    try {
      const filepath = path.join(contextDir, file)
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  })
}

// Handle incoming messages (from WebSocket or file polling)
function handleMessage(message) {
  log('INFO', 'Received message', message)
  
  if (message.type === 'spawn_task' && message.task) {
    const taskId = addTask(message.task)
    return { success: true, taskId }
  }
  
  if (message.type === 'get_status') {
    return {
      queueLength: taskQueue.length,
      activeWorkers: activeWorkers.size,
      isProcessing
    }
  }
  
  return { success: false, error: 'Unknown message type' }
}

// Poll for messages from file (for testing without WebSocket)
function pollForMessages() {
  const messageFile = path.join(process.cwd(), 'data', 'daemon-messages.json')
  
  setInterval(() => {
    try {
      if (fs.existsSync(messageFile)) {
        const content = fs.readFileSync(messageFile, 'utf-8')
        const messages = JSON.parse(content)
        
        // Clear file after reading
        fs.unlinkSync(messageFile)
        
        // Process messages
        messages.forEach(msg => handleMessage(msg))
      }
    } catch (e) {
      // Ignore errors
    }
  }, 2000)
}

// Main loop
async function main() {
  log('INFO', '==========================================')
  log('INFO', 'Daemon Agent Started')
  log('INFO', '==========================================')
  
  // Ensure directories
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true })
  fs.mkdirSync(path.join(process.cwd(), 'data', 'task-contexts'), { recursive: true })
  
  // Load existing queue
  loadQueue()
  
  // Start polling for messages
  pollForMessages()
  
  // Save state periodically
  setInterval(saveState, 10000)
  
  log('INFO', 'Daemon is running and waiting for tasks...')
  
  // Keep process alive
  setInterval(() => {
    // Heartbeat
  }, 60000)
}

// Start
main().catch(error => {
  log('ERROR', 'Daemon crashed', error.message)
  process.exit(1)
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('INFO', 'Shutting down daemon...')
  saveState()
  process.exit(0)
})

process.on('SIGTERM', () => {
  log('INFO', 'Shutting down daemon...')
  saveState()
  process.exit(0)
})
