/**
 * Simple Task Queue
 * No complex queue processor - just status management
 */

import { store } from './store'
import { executeTask } from './taskRunner'

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  status: 'created' | 'pending' | 'active' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  startedAt?: string
  completedAt?: string
  progress?: number
  currentStep?: string
  result?: string
  error?: string
  assignedAgent?: string
  // Compatibility with store.ts Task type
  agentId?: string
  statusHistory?: { status: Task['status']; timestamp: string; message?: string }[]
  artifacts?: string[]
  retryCount?: number
  maxRetries?: number
  timeoutMinutes?: number
  agentCount?: number
  agentThinkingLevels?: number[]
}

/**
 * Create new task and trigger execution immediately
 */
export async function createTask(projectId: string, data: { title: string; description?: string; priority?: string; agentCount?: number; agentThinkingLevels?: number[] }): Promise<Task> {
  const task: Task = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    title: data.title,
    description: data.description,
    status: 'pending',
    priority: (data.priority as any) || 'medium',
    agentCount: data.agentCount || 1,
    agentThinkingLevels: data.agentThinkingLevels || [3],
    createdAt: new Date().toISOString()
  }

  // Save to store
  const tasks = store.getTasks()
  tasks.push(task)
  store.writeTasks(tasks)

  // Execute immediately (no queue)
  task.status = 'processing'
  task.startedAt = new Date().toISOString()
  updateTaskStatus(task.id, 'processing', 'Starting task...')

  // Trigger execution in background with agent configuration
  executeTask(task.id, projectId, task.title, task.description || '', {
    agentCount: task.agentCount,
    agentThinkingLevels: task.agentThinkingLevels
  }).catch(err => {
    console.error(`[TaskQueue] Execution error:`, err)
    updateTaskStatus(task.id, 'failed', err.message)
  })

  return task
}

/**
 * Update task status
 */
export function updateTaskStatus(
  taskId: string, 
  status: Task['status'], 
  message?: string,
  metadata?: { artifacts?: string[]; error?: string; [key: string]: any }
): Task | null {
  const tasks = store.getTasks()
  const index = tasks.findIndex(t => t.id === taskId)
  
  if (index === -1) return null
  
  tasks[index] = {
    ...tasks[index],
    status,
    currentStep: message,
    ...(status === 'completed' && { completedAt: new Date().toISOString() }),
    ...(metadata?.artifacts && { assignedAgent: metadata.artifacts.join(', ') }),
    ...(metadata?.error && { error: metadata.error }),
    ...(metadata?.result && { result: metadata.result })
  }
  
  store.writeTasks(tasks)
  return tasks[index]
}

/**
 * Get task by ID
 */
export function getTaskById(taskId: string): Task | null {
  return store.getTasks().find(t => t.id === taskId) || null
}

/**
 * Get tasks by project
 */
export function getTasksByProject(projectId: string): Task[] {
  return store.getTasks().filter(t => t.projectId === projectId)
}

/**
 * Delete task
 */
export function deleteTask(taskId: string): boolean {
  const tasks = store.getTasks()
  const filtered = tasks.filter(t => t.id !== taskId)
  
  if (filtered.length === tasks.length) return false
  
  store.writeTasks(filtered)
  return true
}
