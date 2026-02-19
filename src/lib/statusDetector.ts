/**
 * Simple Status Detector
 * Checks status files every 10 seconds
 */

import fs from 'fs'
import path from 'path'
import { updateTaskStatus } from './taskQueue'
import { checkTaskStatusFromFile } from './taskRunner'

const CHECK_INTERVAL = 10000 // 10 seconds

/**
 * Start the detector
 */
export function startStatusDetector(): void {
  console.log('[StatusDetector] Starting...')
  
  setInterval(async () => {
    await checkAllTasks()
  }, CHECK_INTERVAL)
}

/**
 * Check all tasks
 */
async function checkAllTasks(): Promise<void> {
  try {
    const { store } = await import('./store')
    const tasks = store.getTasks().filter(t => t.status === 'processing' || t.status === 'pending')
    
    for (const task of tasks) {
      await checkTask(task)
    }
  } catch (e) {
    console.error('[StatusDetector] Error:', e)
  }
}

/**
 * Check single task
 */
async function checkTask(task: any): Promise<void> {
  // Method 1: Check status file (preferred)
  const status = checkTaskStatusFromFile(task.id)
  
  if (status) {
    // Update progress
    if (status.percentage !== task.progress) {
      task.progress = status.percentage
      task.currentStep = status.message
      console.log(`[StatusDetector] Task ${task.id}: ${status.percentage}% - ${status.message}`)
    }
    
    // If completed
    if (status.status === 'completed' || status.percentage === 100) {
      console.log(`[StatusDetector] Task ${task.id} COMPLETED`)
      updateTaskStatus(task.id, 'completed', status.result || 'Task completed', {
        artifacts: status.artifacts || []
      })
      return
    }
  }
  
  // Method 2: Check for files in project (fallback)
  const project = (await import('./store')).store.getProjectById(task.projectId)
  if (project?.path && fs.existsSync(project.path)) {
    const taskStartTime = new Date(task.startedAt || task.createdAt).getTime()
    
    try {
      const files = fs.readdirSync(project.path)
      const newFiles = files.filter(f => {
        try {
          const stat = fs.statSync(path.join(project.path, f))
          return stat.mtime.getTime() > taskStartTime && 
                 (f.endsWith('.md') || f.endsWith('.js') || f.endsWith('.go') || f.endsWith('.ts'))
        } catch (e) {
          return false
        }
      })
      
      if (newFiles.length > 0) {
        console.log(`[StatusDetector] Task ${task.id} has files: ${newFiles.join(', ')}`)
        
        // Wait a bit more to ensure work is complete
        const elapsed = Date.now() - taskStartTime
        if (elapsed > 60000) { // 1 minute grace period
          console.log(`[StatusDetector] Task ${task.id} marking as completed`)
          updateTaskStatus(task.id, 'completed', `Task completed. Created: ${newFiles.join(', ')}`, {
            artifacts: newFiles
          })
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
}
