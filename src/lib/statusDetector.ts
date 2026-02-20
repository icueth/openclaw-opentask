/**
 * Simple Status Detector
 * Checks status files every 10 seconds
 */

import fs from 'fs'
import path from 'path'
import { updateTaskStatus } from './taskQueue'
import { checkTaskStatusFromFile } from './taskRunner'
import { getTaskLog } from './taskLogger'

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
  // Method 1: Check log file (preferred - new log streaming system)
  const log = getTaskLog(task.id)
  
  if (log) {
    // Update current step from last log entry
    const lastLog = log.logs[log.logs.length - 1]
    if (lastLog && lastLog.message !== task.currentStep) {
      task.currentStep = lastLog.message
      console.log(`[StatusDetector] Task ${task.id}: ${lastLog.message}`)
    }
    
    // If completed or failed according to log
    if (log.status === 'completed') {
      console.log(`[StatusDetector] Task ${task.id} COMPLETED (from log)`)
      const resultDetail = log.result || 'Task completed successfully'
      const artifactsDetail = log.artifacts?.length 
        ? `Created ${log.artifacts.length} file(s): ${log.artifacts.join(', ')}`
        : ''
      const fullResult = artifactsDetail 
        ? `${resultDetail}\n\n${artifactsDetail}`
        : resultDetail
      
      updateTaskStatus(task.id, 'completed', resultDetail, {
        result: fullResult,
        artifacts: log.artifacts || []
      })
      return
    }
    
    if (log.status === 'failed') {
      console.log(`[StatusDetector] Task ${task.id} FAILED (from log)`)
      updateTaskStatus(task.id, 'failed', log.result || 'Task failed', {
        error: log.result || 'Task failed'
      })
      return
    }
    
    // Still processing - update progress from log count (rough estimate)
    if (log.logs.length > 0) {
      task.progress = Math.min(95, log.logs.length * 5) // Rough estimate, cap at 95% until complete
    }

    // FALLBACK: Check if task has been inactive for too long (5 minutes) with results
    const lastLogTime = new Date(lastLog.timestamp).getTime()
    const inactiveTime = Date.now() - lastLogTime
    const FIVE_MINUTES = 5 * 60 * 1000

    if (inactiveTime > FIVE_MINUTES && log.logs.length > 5) {
      // Task hasn't been updated for 5 minutes and has substantial logs
      // Check if there are artifacts/files created
      const project = (await import('./store')).store.getProjectById(task.projectId)
      if (project?.path && fs.existsSync(project.path)) {
        const taskStartTime = new Date(task.startedAt || task.createdAt).getTime()
        try {
          const files = fs.readdirSync(project.path)
          const newFiles = files.filter(f => {
            try {
              const stat = fs.statSync(path.join(project.path, f))
              return stat.mtime.getTime() > taskStartTime &&
                     (f.endsWith('.md') || f.endsWith('.js') || f.endsWith('.go') || f.endsWith('.ts') || f.endsWith('.json'))
            } catch (e) {
              return false
            }
          })

          if (newFiles.length > 0) {
            console.log(`[StatusDetector] Task ${task.id} INACTIVE with results - auto-completing`)
            const lastMessages = log.logs.slice(-3).map(l => l.message).join('; ')
            const resultSummary = `Task completed (auto-detected after inactivity)\n\nLast activities: ${lastMessages}\n\nCreated ${newFiles.length} file(s): ${newFiles.join(', ')}`

            updateTaskStatus(task.id, 'completed', 'Task completed (auto-detected)', {
              result: resultSummary,
              artifacts: newFiles
            })

            // Also update log file status
            const { updateTaskLogStatus } = await import('./taskLogger')
            updateTaskLogStatus(task.id, 'completed', resultSummary, newFiles)
            return
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }
  }
  
  // Method 2: Check old status file (backward compatibility)
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
      console.log(`[StatusDetector] Task ${task.id} COMPLETED (from status file)`)
      updateTaskStatus(task.id, 'completed', status.result || 'Task completed', {
        result: status.result || 'Task completed successfully',
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
            result: `Task completed successfully. Created files: ${newFiles.join(', ')}`,
            artifacts: newFiles
          })
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
}
