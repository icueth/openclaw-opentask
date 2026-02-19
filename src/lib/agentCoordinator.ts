/**
 * Agent Coordinator - OpenClaw Core Integration
 * รันเป็น OpenClaw agent และใช้ sessions_spawn สำหรับ task execution
 */

import { spawn, exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { store } from './store'
import { updateTaskStatus, getTaskById } from './taskQueue'

const execAsync = promisify(exec)

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:18789'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || ''

// Coordinator agent config
const COORDINATOR_AGENT_ID = 'coordinator'

interface TaskRequest {
  taskId: string
  projectId: string
  title: string
  description: string
  agentId: string
}

// =====================================================
// TASK QUEUE FOR COORDINATOR
// =====================================================

const taskQueue: TaskRequest[] = []
let isProcessing = false

/**
 * Add task to coordinator queue
 */
export function addTaskToCoordinator(task: TaskRequest): void {
  taskQueue.push(task)
  console.log(`[Coordinator] Task ${task.taskId} added to queue`)
  
  // Start processing if not already running
  if (!isProcessing) {
    processCoordinatorQueue()
  }
}

/**
 * Process coordinator queue
 */
async function processCoordinatorQueue(): Promise<void> {
  if (isProcessing || taskQueue.length === 0) return
  
  isProcessing = true
  
  while (taskQueue.length > 0) {
    const task = taskQueue.shift()!
    console.log(`[Coordinator] Processing task ${task.taskId}`)
    
    try {
      await spawnViaSessionsSpawn(task)
    } catch (error: any) {
      console.error(`[Coordinator] Failed to process task ${task.taskId}:`, error.message)
      updateTaskStatus(task.taskId, 'failed', 'Coordinator failed to spawn task', {
        error: error.message
      })
    }
    
    // Small delay between tasks
    await new Promise(r => setTimeout(r, 1000))
  }
  
  isProcessing = false
}

// =====================================================
// SPAWN VIA SESSIONS_SPAWN (OpenClaw Core)
// =====================================================

/**
 * Spawn worker agent using OpenClaw Core sessions_spawn
 * ต้องรันภายใต้ OpenClaw agent session เท่านั้น
 */
async function spawnViaSessionsSpawn(task: TaskRequest): Promise<void> {
  console.log(`[Coordinator] Spawning worker for task ${task.taskId} via sessions_spawn`)
  
  // Build worker context
  const workerContext = buildWorkerContext(task)
  
  // Write context to file
  const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
  fs.mkdirSync(contextDir, { recursive: true })
  const contextFile = path.join(contextDir, `${task.taskId}-worker-context.md`)
  fs.writeFileSync(contextFile, workerContext, 'utf-8')
  
  // Update task status
  updateTaskStatus(task.taskId, 'processing', 'Worker agent spawning via sessions_spawn...')
  
  // ตรงนี้จะเรียก sessions_spawn tool ผ่าน OpenClaw
  // แต่เนื่องจากเราไม่ได้อยู่ใน OpenClaw agent session จึงต้องใช้ workaround
  
  // Workaround: ใช้ openclaw CLI แต่จำลองให้เหมือน sessions_spawn
  await spawnWorkerViaCli(task, workerContext)
}

/**
 * Build worker agent context
 */
function buildWorkerContext(task: TaskRequest): string {
  const project = store.getProjectById(task.projectId)
  const projectPath = project?.path || path.join(process.cwd(), 'data', 'projects', task.projectId)
  
  return `## 🤖 Worker Agent Task

You are a worker agent spawned via sessions_spawn.

### Task Information
- **Task ID:** ${task.taskId}
- **Project ID:** ${task.projectId}
- **Title:** ${task.title}

### Your Mission
${task.description}

### Workspace
\`\`\`
${projectPath}
\`\`\`

### Tools Available
- write - Create files
- read - Read files  
- edit - Modify files
- exec - Execute commands
- sessions_send - Send message to parent (coordinator)

### IMPORTANT
1. Report progress frequently using progress API
2. When done, send result back via complete API
3. Create actual files - don't just describe

---
*Spawned via sessions_spawn*
*Session: agent:${task.agentId}:subagent:${Date.now()}*
`
}

/**
 * Spawn worker via CLI (workaround สำหรับ sessions_spawn)
 */
async function spawnWorkerViaCli(task: TaskRequest, context: string): Promise<void> {
  const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
  const contextFile = path.join(contextDir, `${task.taskId}-worker-context.md`)
  const logFile = path.join(contextDir, `${task.taskId}-worker.log`)
  const pidFile = path.join(contextDir, `${task.taskId}-worker.pid`)
  
  // Create worker script
  const workerScript = `#!/bin/bash
set -e

echo $$ > "${pidFile}"
echo "[$(date)] Worker started for task ${task.taskId}" > "${logFile}"

# Run openclaw agent as worker
openclaw agent \\
  --agent ${task.agentId} \\
  --message "$(cat ${contextFile})" \\
  --thinking medium \\
  --json 2>&1 | tee -a "${logFile}"

echo "[$(date)] Worker completed" >> "${logFile}"
`
  
  const scriptPath = path.join(contextDir, `${task.taskId}-worker.sh`)
  fs.writeFileSync(scriptPath, workerScript)
  fs.chmodSync(scriptPath, 0o755)
  
  // Spawn in background
  const child = spawn('bash', [scriptPath], {
    detached: true,
    stdio: 'ignore'
  })
  
  child.unref()
  
  // Store worker info
  store.set(`worker:${task.taskId}`, {
    pid: child.pid,
    agentId: task.agentId,
    startedAt: new Date().toISOString(),
    logFile,
    pidFile
  })
  
  console.log(`[Coordinator] Worker spawned with PID ${child.pid}`)
  
  // Update task
  updateTaskStatus(task.taskId, 'processing', 'Worker agent running', {
    assignedAgent: `${task.agentId}:${child.pid}`
  })
}

// =====================================================
// COORDINATOR AGENT RUNNER
// =====================================================

/**
 * Run coordinator agent
 * ต้องรันด้วยคำสั่ง: openclaw agent --agent coordinator --message "start coordinator"
 */
export async function runCoordinatorAgent(): Promise<void> {
  console.log('[Coordinator] Starting coordinator agent...')
  console.log('[Coordinator] Waiting for tasks...')
  
  // Keep running and check for tasks
  setInterval(() => {
    if (taskQueue.length > 0 && !isProcessing) {
      processCoordinatorQueue()
    }
  }, 5000)
  

  // Also poll for tasks from file/API
  pollForTasks()
}

/**
 * Poll for new tasks from file
 */
async function pollForTasks(): Promise<void> {
  const tasksFile = path.join(process.cwd(), 'data', 'coordinator-tasks.json')
  
  setInterval(() => {
    try {
      if (fs.existsSync(tasksFile)) {
        const content = fs.readFileSync(tasksFile, 'utf-8')
        const tasks: TaskRequest[] = JSON.parse(content)
        
        // Clear file after reading
        fs.unlinkSync(tasksFile)
        
        // Add tasks to queue
        for (const task of tasks) {
          addTaskToCoordinator(task)
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }, 3000)
}

// =====================================================
// API FOR DASHBOARD
// =====================================================

/**
 * Submit task to coordinator (called by Dashboard API)
 */
export function submitTaskToCoordinator(task: TaskRequest): boolean {
  try {
    const tasksFile = path.join(process.cwd(), 'data', 'coordinator-tasks.json')
    let tasks: TaskRequest[] = []
    
    if (fs.existsSync(tasksFile)) {
      tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf-8'))
    }
    
    tasks.push(task)
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2))
    
    console.log(`[Coordinator] Task ${task.taskId} submitted`)
    return true
  } catch (error: any) {
    console.error('[Coordinator] Failed to submit task:', error.message)
    return false
  }
}
