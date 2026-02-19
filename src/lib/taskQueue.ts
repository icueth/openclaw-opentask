/**
 * Task Queue System - Core Queue Logic
 * Manages task lifecycle and auto-assignment
 */

import fs from 'fs'
import path from 'path'
import { store } from './store'

const DEFAULT_WORKSPACE_PATH = path.join(process.env.HOME || '', '.openclaw', 'workspace-coder')
const PROJECTS_PATH = path.join(DEFAULT_WORKSPACE_PATH, 'projects')

// Task Data Model
export interface ProgressUpdate {
  percentage: number
  message: string
  timestamp: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  agentId: string        // Which agent handles this task
  status: 'created' | 'pending' | 'active' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  startedAt?: string
  completedAt?: string
  assignedAgent?: string // Session key of spawned sub-agent
  result?: string
  error?: string
  artifacts?: string[]
  retryCount?: number
  maxRetries?: number
  timeoutMinutes?: number
  statusHistory: StatusChange[]
  progress?: number
  progressUpdates?: ProgressUpdate[]
  currentStep?: string
}

export interface StatusChange {
  status: Task['status']
  timestamp: string
  message?: string
}

// Queue Configuration
interface QueueConfig {
  maxConcurrentTasks: number
  defaultTimeoutMinutes: number
  maxRetries: number
  processingIntervalMs: number
}

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrentTasks: 3,
  defaultTimeoutMinutes: 30,
  maxRetries: 2,
  processingIntervalMs: 60000 // 1 minute
}

let queueConfig: QueueConfig = { ...DEFAULT_CONFIG }
let processingInterval: NodeJS.Timeout | null = null

// --- Task File Operations ---

const TASKS_FILE = path.join(process.cwd(), 'data', 'tasks.json')

function ensureTasksFile(): void {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2))
  }
}

function readTasks(): Task[] {
  ensureTasksFile()
  try {
    const content = fs.readFileSync(TASKS_FILE, 'utf-8')
    return JSON.parse(content) as Task[]
  } catch (error) {
    console.error('Error reading tasks:', error)
    return []
  }
}

function writeTasks(tasks: Task[]): void {
  ensureTasksFile()
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2))
}

// --- Task CRUD Operations ---

export function getAllTasks(): Task[] {
  return readTasks()
}

export function getTasksByProject(projectId: string): Task[] {
  const tasks = readTasks()
  return tasks.filter(t => t.projectId === projectId)
}

export function getTaskById(taskId: string): Task | undefined {
  const tasks = readTasks()
  return tasks.find(t => t.id === taskId)
}

/**
 * Create task instruction file for sub-agent
 */
function createTaskInstructionFile(task: Task): void {
  const taskInstructionsDir = path.join(process.cwd(), 'data', 'task-instructions')
  fs.mkdirSync(taskInstructionsDir, { recursive: true })
  
  // Get project from store to find its workspace
  const project = store.getProjectById(task.projectId)
  const projectPath = project?.workspace || project?.path || path.join(DEFAULT_WORKSPACE_PATH, 'projects', task.projectId)
  const workspacePath = project?.workspace ? path.dirname(path.dirname(project.workspace)) : DEFAULT_WORKSPACE_PATH
  
  const content = `# Task Instructions for ${task.id}

## Task Information
- **ID:** ${task.id}
- **Project ID:** ${task.projectId}
- **Title:** ${task.title}
- **Description:** ${task.description || 'N/A'}
- **Priority:** ${task.priority}
- **Created:** ${task.createdAt}

## Workspace Context
- **Workspace Path:** ${workspacePath}
- **Project Path:** ${projectPath}
- **Current Working Directory:** You are here: ${projectPath}

## Important Instructions
1. You MUST use your tools to do actual work
2. Create/modify files in the project directory: ${projectPath}
3. Use the write tool to create new files
4. Use the edit tool to modify existing files
5. When done, report completion via the API

## Available Tools
- write - Create files: write({ file_path: "${projectPath}/filename.md", content: "..." })
- read - Read files: read({ file_path: "${projectPath}/file.md" })
- edit - Edit files: edit({ file_path: "${projectPath}/file.md", old_string: "...", new_string: "..." })
- exec - Run commands: exec({ command: "cd ${projectPath} && ls -la" })

## Completion API
When done, POST to: http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/complete
Body: { "result": "What you did", "artifacts": ["path/to/files"] }

---
Task created at: ${new Date().toISOString()}
`
  
  const instructionFile = path.join(taskInstructionsDir, `${task.id}.md`)
  fs.writeFileSync(instructionFile, content, 'utf-8')
  console.log(`[TaskQueue] Created task instruction file: ${instructionFile}`)
}

export function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'statusHistory'>): Task {
  const tasks = readTasks()
  
  const now = new Date().toISOString()
  const task: Task = {
    ...taskData,
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'created',
    createdAt: now,
    statusHistory: [{ status: 'created', timestamp: now, message: 'Task created' }],
    retryCount: 0,
    maxRetries: taskData.maxRetries || queueConfig.maxRetries,
    timeoutMinutes: taskData.timeoutMinutes || queueConfig.defaultTimeoutMinutes
  }
  
  tasks.push(task)
  writeTasks(tasks)
  
  // Create task instruction file for sub-agent
  createTaskInstructionFile(task)
  
  console.log(`[TaskQueue] Created task ${task.id} for project ${task.projectId}`)
  return task
}

export function updateTask(taskId: string, updates: Partial<Task>): Task {
  const tasks = readTasks()
  const index = tasks.findIndex(t => t.id === taskId)
  
  if (index === -1) {
    throw new Error(`Task ${taskId} not found`)
  }
  
  tasks[index] = { ...tasks[index], ...updates }
  writeTasks(tasks)
  
  return tasks[index]
}

export function updateTaskStatus(
  taskId: string, 
  newStatus: Task['status'], 
  message?: string,
  additionalUpdates?: Partial<Task>
): Task {
  const tasks = readTasks()
  const index = tasks.findIndex(t => t.id === taskId)
  
  if (index === -1) {
    throw new Error(`Task ${taskId} not found`)
  }
  
  const task = tasks[index]
  const now = new Date().toISOString()
  
  // Build updates
  const updates: Partial<Task> = {
    status: newStatus,
    statusHistory: [
      ...task.statusHistory,
      { status: newStatus, timestamp: now, message }
    ],
    ...additionalUpdates
  }
  
  // Set timestamps based on status
  if (newStatus === 'processing' && !task.startedAt) {
    updates.startedAt = now
  }
  if ((newStatus === 'completed' || newStatus === 'failed' || newStatus === 'cancelled') && !task.completedAt) {
    updates.completedAt = now
  }
  
  tasks[index] = { ...task, ...updates }
  writeTasks(tasks)
  
  console.log(`[TaskQueue] Task ${taskId} status: ${task.status} → ${newStatus}${message ? ` (${message})` : ''}`)
  
  return tasks[index]
}

export function deleteTask(taskId: string): void {
  const tasks = readTasks()
  const index = tasks.findIndex(t => t.id === taskId)
  
  if (index === -1) {
    throw new Error(`Task ${taskId} not found`)
  }
  
  tasks.splice(index, 1)
  writeTasks(tasks)
}

// --- Queue Processing ---

export function getRunningTasksCount(): number {
  const tasks = readTasks()
  return tasks.filter(t => t.status === 'processing').length
}

/**
 * Check and cleanup zombie tasks (tasks marked as processing but process is dead)
 * This auto-heals the queue when agents crash or are killed
 * 
 * IMPORTANT: Also checks if task completed successfully before process died
 */
export function cleanupZombieTasks(): number {
  const tasks = readTasks()
  const fs = require('fs')
  const path = require('path')
  let cleaned = 0

  tasks.forEach(task => {
    if (task.status === 'processing' || task.status === 'active') {
      // Skip pipeline tracking tasks - they don't have real processes
      if (task.title?.startsWith('🔄 [Pipeline]') && !task.description?.includes('Step ID:')) {
        // Check if pipeline was created recently (give it time to spawn child tasks)
        const taskAge = Date.now() - new Date(task.createdAt).getTime()
        if (taskAge < 30000) { // 30 seconds grace period
          console.log(`[Zombie Cleanup] Pipeline ${task.id} is new (${Math.round(taskAge/1000)}s), skipping cleanup`)
          return
        }
        
        // Check if any child tasks are still running
        const childTasks = tasks.filter(t =>
          t.description?.includes(`Parent Task: ${task.id}`) &&
          (t.status === 'processing' || t.status === 'active' || t.status === 'pending')
        )
        
        // Get completed child tasks to trigger pipeline advancement
        const completedChildTasks = tasks.filter(t =>
          t.description?.includes(`Parent Task: ${task.id}`) &&
          t.status === 'completed' &&
          t.description?.includes('Step ID:')
        )
        
        // Trigger pipeline advancement for completed child tasks
        if (completedChildTasks.length > 0) {
          console.log(`[Zombie Cleanup] Found ${completedChildTasks.length} completed child tasks for pipeline ${task.id}`)
          for (const childTask of completedChildTasks) {
            const stepMatch = childTask.description.match(/Step ID: ([a-zA-Z0-9-]+)/)
            if (stepMatch) {
              const stepId = stepMatch[1]
              console.log(`[Zombie Cleanup] Triggering pipeline advancement for step ${stepId}`)
              const { checkStepCompletion } = require('./pipelineRunner')
              checkStepCompletion(task.projectId, task.id, stepId).then((advanced: boolean) => {
                console.log(`[Zombie Cleanup] Pipeline advancement for step ${stepId}: ${advanced ? 'succeeded' : 'not ready'}`)
              }).catch((err: any) => {
                console.error(`[Zombie Cleanup] Pipeline advancement failed:`, err)
              })
            }
          }
        }
        
        // DO NOT mark pipeline parent tasks as completed here
        // Let checkStepCompletion handle that when all steps are truly done
        return // Skip normal zombie check for pipeline tracking tasks
      }

      const pidFile = path.join(process.cwd(), 'data', 'task-contexts', `${task.id}.pid`)
      let isDead = false

      if (fs.existsSync(pidFile)) {
        const pid = fs.readFileSync(pidFile, 'utf-8').trim()
        try {
          // Check if process exists (kill -0 doesn't kill, just checks)
          process.kill(parseInt(pid), 0)
        } catch (e) {
          isDead = true
        }
      } else {
        isDead = true // No PID file means process never started properly
      }

      if (isDead) {
        // CRITICAL: Check if task actually completed successfully
        // by looking at the progress file
        const progressFile = path.join(process.cwd(), 'data', 'task-contexts', `${task.id}.progress`)
        let completedSuccessfully = false

        if (fs.existsSync(progressFile)) {
          try {
            const progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'))
            if (progress.percentage === 100 || progress.message?.includes('completed') || progress.message?.includes('สำเร็จ')) {
              completedSuccessfully = true
              console.log(`[Zombie Cleanup] Task ${task.id} completed successfully before exit, marking as completed`)
              updateTaskStatus(task.id, 'completed', progress.message || 'Task completed successfully')
              
              // Trigger pipeline advancement if this is a pipeline step task
              if (task.description?.includes('Parent Task:') && task.description?.includes('Step ID:')) {
                const parentMatch = task.description.match(/Parent Task: ([a-zA-Z0-9-]+)/)
                const stepMatch = task.description.match(/Step ID: ([a-zA-Z0-9-]+)/)
                if (parentMatch && stepMatch) {
                  const parentTaskId = parentMatch[1]
                  const stepId = stepMatch[1]
                  console.log(`[Zombie Cleanup] Triggering pipeline advancement for parent ${parentTaskId}, step ${stepId}`)
                  // Import and call checkStepCompletion
                  const { checkStepCompletion } = require('./pipelineRunner')
                  checkStepCompletion(task.projectId, parentTaskId, stepId).catch((err: any) => {
                    console.error(`[Zombie Cleanup] Failed to advance pipeline:`, err)
                  })
                }
              }
            }
          } catch (e) {
            // Progress file invalid, treat as failed
          }
        }

        // For TaskMan-spawned tasks: check if worker is still running via subagent tracking
        if (!completedSuccessfully && task.assignedAgent?.includes('taskman')) {
          console.log(`[Zombie Cleanup] Task ${task.id} used TaskMan, checking worker status...`)
          // TaskMan exits after spawning worker, so we need to check worker log instead
          const logFile = path.join(process.cwd(), 'data', 'task-contexts', `${task.id}.log`)
          if (fs.existsSync(logFile)) {
            try {
              const log = fs.readFileSync(logFile, 'utf-8')
              if (log.includes('completed') || log.includes('สำเร็จ') || log.includes('Task completed')) {
                completedSuccessfully = true
                console.log(`[Zombie Cleanup] Task ${task.id} worker completed successfully`)
                updateTaskStatus(task.id, 'completed', 'Task completed via TaskMan worker')
              }
            } catch (e) {
              // Log file read error
            }
          }
        }

        if (!completedSuccessfully) {
          console.log(`[Zombie Cleanup] Task ${task.id} is dead, marking as failed`)
          updateTaskStatus(task.id, 'failed', 'Agent process terminated unexpectedly', {
            error: 'Process died or was killed'
          })
        }
        cleaned++
      }
    }
  })
  
  if (cleaned > 0) {
    console.log(`[Zombie Cleanup] Cleaned up ${cleaned} zombie tasks`)
  }
  
  return cleaned
}

export function getPendingTasks(): Task[] {
  const tasks = readTasks()
  return tasks
    .filter(t => t.status === 'pending' || t.status === 'active')
    .sort((a, b) => {
      // Priority order: urgent > high > medium > low
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // Then by createdAt (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
}

export function getTasksByStatus(status: Task['status'][]): Task[] {
  const tasks = readTasks()
  return tasks.filter(t => status.includes(t.status))
}

export async function processQueue(): Promise<void> {
  console.log('[Queue] Processing queue...')
  
  // Auto-heal: cleanup zombie tasks first
  cleanupZombieTasks()
  
  const runningCount = getRunningTasksCount()
  const availableSlots = queueConfig.maxConcurrentTasks - runningCount
  
  if (availableSlots <= 0) {
    console.log(`[Queue] Max concurrency reached (${runningCount}/${queueConfig.maxConcurrentTasks})`)
    return
  }
  
  // Get pending tasks including 'created' status
  const tasks = readTasks()
  const pendingTasks = tasks
    .filter(t => {
      // Skip pipeline tracking tasks (parent tasks, not step tasks)
      if (t.title?.startsWith('🔄 [Pipeline]') && !t.description?.includes('Step ID:')) {
        console.log(`[Queue] Skipping pipeline parent task ${t.id}`)
        return false
      }
      return t.status === 'pending' || t.status === 'active' || t.status === 'created'
    })
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  
  console.log(`[Queue] Found ${pendingTasks.length} pending tasks, ${runningCount} running`)
  
  const tasksToProcess = pendingTasks.slice(0, availableSlots)
  
  for (const task of tasksToProcess) {
    console.log(`[Queue] Processing task ${task.id} (${task.status})...`)
    try {
      // Move from created/pending to active, then spawn
      if (task.status === 'created' || task.status === 'pending') {
        updateTaskStatus(task.id, 'active', 'Task assigned to queue processor')
      }
      await assignTask(task.id)
      console.log(`[Queue] ✓ Task ${task.id} assigned successfully`)
    } catch (error: any) {
      console.error(`[Queue] ✗ Failed to assign task ${task.id}:`, error.message)
    }
  }
  
  console.log('[Queue] Queue processing complete')
}

// Import dynamically to avoid circular dependency
async function getSpawnForTask() {
  const { spawnForTask } = await import('./taskRunner')
  return spawnForTask
}

export async function assignTask(taskId: string): Promise<void> {
  console.log(`[Queue] Assigning task ${taskId}...`)
  
  const task = getTaskById(taskId)
  if (!task) {
    console.error(`[Queue] Task ${taskId} not found`)
    throw new Error(`Task ${taskId} not found`)
  }
  
  console.log(`[Queue] Task ${taskId} current status: ${task.status}, agentId: ${task.agentId}`)
  
  if (task.status !== 'pending' && task.status !== 'active' && task.status !== 'created') {
    console.error(`[Queue] Task ${taskId} cannot be assigned (status: ${task.status})`)
    throw new Error(`Task ${taskId} cannot be assigned (status: ${task.status})`)
  }
  
  // Update to active
  updateTaskStatus(taskId, 'active', 'Task assigned to queue processor')
  console.log(`[Queue] Task ${taskId} status updated to active`)
  
  // Spawn sub-agent via taskRunner
  try {
    console.log(`[Queue] Spawning for task ${taskId}...`)
    const spawnForTask = await getSpawnForTask()
    console.log(`[Queue] Calling spawnForTask(${taskId})...`)
    const result = await spawnForTask(taskId)
    console.log(`[Queue] Spawn result for ${taskId}:`, result)
  } catch (error: any) {
    console.error(`[Queue] Failed to spawn for task ${taskId}:`, error.message)
    
    // Get fresh task state (may have been updated by spawnForTask error handling)
    const currentTask = getTaskById(taskId)
    
    // Check if we should retry
    const retryCount = currentTask?.retryCount || 0
    const maxRetries = currentTask?.maxRetries || queueConfig.maxRetries
    
    if (retryCount < maxRetries) {
      // Put back to pending for retry
      console.log(`[TaskQueue] Retrying task ${taskId} (${retryCount + 1}/${maxRetries + 1})`)
      updateTaskStatus(taskId, 'pending', `Spawn failed, will retry (${retryCount + 1}/${maxRetries + 1})`, {
        retryCount: retryCount + 1,
        error: `Spawn failed: ${error.message}`
      })
    } else {
      // Mark as failed after max retries
      console.log(`[TaskQueue] Task ${taskId} failed after ${maxRetries + 1} attempts`)
      updateTaskStatus(taskId, 'failed', `Failed after ${maxRetries + 1} attempts: ${error.message}`, {
        error: error.message
      })
    }
  }
}

export function onTaskComplete(taskId: string, result: string, artifacts?: string[]): void {
  updateTaskStatus(taskId, 'completed', 'Task completed successfully', {
    result,
    artifacts: artifacts || []
  })
  console.log(`[TaskQueue] Task ${taskId} completed`)
}

export function onTaskError(taskId: string, error: string): void {
  const task = getTaskById(taskId)
  if (!task) return
  
  const retryCount = task.retryCount || 0
  const maxRetries = task.maxRetries || queueConfig.maxRetries
  
  if (retryCount < maxRetries) {
    // Retry
    updateTask(taskId, {
      retryCount: retryCount + 1,
      error: `Attempt ${retryCount + 1}/${maxRetries + 1} failed: ${error}`
    })
    updateTaskStatus(taskId, 'pending', `Retrying (${retryCount + 1}/${maxRetries + 1})`)
  } else {
    // Mark as failed
    updateTaskStatus(taskId, 'failed', `Failed after ${maxRetries + 1} attempts`, {
      error
    })
  }
  
  console.log(`[TaskQueue] Task ${taskId} error: ${error}`)
}

export function cancelTask(taskId: string): void {
  const task = getTaskById(taskId)
  if (!task) {
    throw new Error(`Task ${taskId} not found`)
  }
  
  if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
    throw new Error(`Cannot cancel task with status ${task.status}`)
  }
  
  updateTaskStatus(taskId, 'cancelled', 'Task cancelled by user')
}

export function startTask(taskId: string): void {
  const task = getTaskById(taskId)
  if (!task) {
    throw new Error(`Task ${taskId} not found`)
  }
  
  if (task.status !== 'created') {
    throw new Error(`Cannot start task with status ${task.status}`)
  }
  
  updateTaskStatus(taskId, 'pending', 'Task queued for processing')
}

// --- Background Processing ---

export function startQueueProcessor(): void {
  if (processingInterval) {
    console.log('[TaskQueue] Processor already running')
    return
  }
  
  console.log('[TaskQueue] Starting queue processor...')
  
  // Process immediately on start
  processQueue().catch(console.error)
  
  // Then on interval
  processingInterval = setInterval(() => {
    processQueue().catch(console.error)
  }, queueConfig.processingIntervalMs)
}

export function stopQueueProcessor(): void {
  if (processingInterval) {
    clearInterval(processingInterval)
    processingInterval = null
    console.log('[TaskQueue] Stopped queue processor')
  }
}

export function isQueueProcessorRunning(): boolean {
  return processingInterval !== null
}

export function configureQueue(config: Partial<QueueConfig>): void {
  queueConfig = { ...queueConfig, ...config }
  console.log('[TaskQueue] Configuration updated:', queueConfig)
}

export function getQueueConfig(): QueueConfig {
  return { ...queueConfig }
}

// --- Timeout Check ---

export function checkTimeouts(): void {
  const tasks = readTasks()
  const now = new Date().getTime()
  
  for (const task of tasks) {
    if (task.status === 'processing' && task.startedAt) {
      const startedTime = new Date(task.startedAt).getTime()
      const timeoutMs = (task.timeoutMinutes || queueConfig.defaultTimeoutMinutes) * 60 * 1000
      
      if (now - startedTime > timeoutMs) {
        console.log(`[TaskQueue] Task ${task.id} timed out after ${task.timeoutMinutes} minutes`)
        onTaskError(task.id, `Task timed out after ${task.timeoutMinutes} minutes`)
      }
    }
  }
}

// --- Export Queue API ---

export const taskQueue = {
  // Task CRUD
  getAllTasks,
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  
  // Queue operations
  getRunningTasksCount,
  getPendingTasks,
  getTasksByStatus,
  processQueue,
  assignTask,
  
  // Status callbacks
  onTaskComplete,
  onTaskError,
  
  // Control
  startTask,
  cancelTask,
  
  // Background processing
  startQueueProcessor,
  stopQueueProcessor,
  isQueueProcessorRunning,
  configureQueue,
  getQueueConfig,
  checkTimeouts,
  
  // Auto-healing
  cleanupZombieTasks
}

export default taskQueue

// Auto-start queue processor when module loads (server-side only)
if (typeof window === 'undefined') {
  // Server-side only
  setTimeout(() => {
    console.log('[TaskQueue] Auto-starting queue processor...')
    startQueueProcessor()
  }, 5000) // Wait 5s for server to fully start
}