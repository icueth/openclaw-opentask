/**
 * Task Completion Detector - ตรวจสอบ task completion อย่างถูกต้อง
 * ใช้หลายวิธีเพื่อความแม่นยำ: check subagent, check files, check progress
 */

import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'
import { getTaskById, updateTaskStatus } from './taskQueue'
import { logSpawnEvent } from './spawnLogger'

const execAsync = promisify(exec)

const CHECK_INTERVAL = 10000 // Check every 10 seconds
const ZOMBIE_TIMEOUT = 180000 // 3 minutes before considering zombie

interface TaskStatusInfo {
  isRunning: boolean
  hasCompleted: boolean
  outputFiles: string[]
}

/**
 * Start the task completion detector
 */
export function startTaskCompletionDetector(): void {
  console.log('[TaskCompletion] Starting detector...')
  
  setInterval(async () => {
    await detectTaskCompletion()
  }, CHECK_INTERVAL)
}

/**
 * Main detection logic
 */
async function detectTaskCompletion(): Promise<void> {
  try {
    const { store } = await import('./store')
    const allTasks = store.getTasks()
    
    // Check all processing and failed tasks
    const tasksToCheck = allTasks.filter(t => 
      t.status === 'processing' || 
      (t.status === 'failed' && t.assignedAgent?.includes('subagent'))
    )
    
    for (const task of tasksToCheck) {
      const status = await checkTaskStatus(task)
      
      if (status.hasCompleted) {
        console.log(`[TaskCompletion] Task ${task.id} COMPLETED. Files: ${status.outputFiles.join(', ')}`)
        updateTaskStatus(task.id, 'completed', `Task completed successfully. Created: ${status.outputFiles.join(', ')}`)
      } else if (task.status === 'processing' && !status.isRunning) {
        // Task stopped but no completion detected - might be zombie
        const startTime = new Date(task.startedAt || task.createdAt).getTime()
        const elapsed = Date.now() - startTime
        
        if (elapsed > ZOMBIE_TIMEOUT) {
          // Check if files were created
          if (status.outputFiles.length > 0) {
            console.log(`[TaskCompletion] Task ${task.id} likely completed (has files). Marking as completed.`)
            updateTaskStatus(task.id, 'completed', `Task completed. Files: ${status.outputFiles.join(', ')}`)
          } else {
            console.log(`[TaskCompletion] Task ${task.id} is zombie with no files. Marking as failed.`)
            updateTaskStatus(task.id, 'failed', 'Task process ended without creating output files')
          }
        }
      }
    }
  } catch (e) {
    console.error('[TaskCompletion] Error:', e)
  }
}

/**
 * Check task status using multiple methods
 */
async function checkTaskStatus(task: any): Promise<TaskStatusInfo> {
  const result: TaskStatusInfo = {
    isRunning: false,
    hasCompleted: false,
    outputFiles: []
  }
  
  // Method 1: Check if process is still running (via PID file)
  const pidFile = path.join(process.cwd(), 'data', 'task-contexts', `${task.id}.pid`)
  if (fs.existsSync(pidFile)) {
    try {
      const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim())
      try {
        process.kill(pid, 0) // Check if process exists
        result.isRunning = true
        console.log(`[TaskCompletion] Task ${task.id} process ${pid} is running`)
      } catch (e) {
        // Process not running
        console.log(`[TaskCompletion] Task ${task.id} process ${pid} has stopped`)
      }
    } catch (e) {
      // Error reading PID
    }
  }
  
  // Method 2: Check for output files in project
  const project = (await import('./store')).store.getProjectById(task.projectId)
  if (project?.path && fs.existsSync(project.path)) {
    const taskStartTime = new Date(task.startedAt || task.createdAt).getTime()
    
    try {
      const files = fs.readdirSync(project.path)
      const codeFiles = files.filter(f => 
        f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.go') || 
        f.endsWith('.py') || f.endsWith('.java') || f.endsWith('.rs')
      )
      
      for (const file of codeFiles) {
        try {
          const stat = fs.statSync(path.join(project.path, file))
          // File created after task started
          if (stat.mtime.getTime() > taskStartTime) {
            result.outputFiles.push(file)
          }
        } catch (e) {
          // Ignore stat errors
        }
      }
      
      if (result.outputFiles.length > 0) {
        result.hasCompleted = true
      }
    } catch (e) {
      // Ignore read errors
    }
  }
  
  // Method 3: Check progress file for 100%
  const progressFile = path.join(process.cwd(), 'data', 'task-contexts', `${task.id}.progress`)
  if (fs.existsSync(progressFile)) {
    try {
      const progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'))
      if (progress.percentage === 100 || progress.message?.includes('completed')) {
        result.hasCompleted = true
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Method 4: Check log file for completion message
  const logFile = path.join(process.cwd(), 'data', 'task-contexts', `${task.id}.log`)
  if (fs.existsSync(logFile)) {
    try {
      const log = fs.readFileSync(logFile, 'utf-8')
      if (log.includes('completed') || log.includes('สำเร็จ') || log.includes('Task Complete')) {
        result.hasCompleted = true
      }
    } catch (e) {
      // Ignore read errors
    }
  }
  
  return result
}

// Backward compatibility
export const startTaskWatcher = startTaskCompletionDetector
