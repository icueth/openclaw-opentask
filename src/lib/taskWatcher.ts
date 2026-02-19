/**
 * Task Completion Watcher
 * ตรวจสอบ task completion ผ่านการดูไฟล์ใน project
 */

import fs from 'fs'
import path from 'path'
import { getTaskById, updateTaskStatus } from './taskQueue'

const WATCH_INTERVAL = 30000 // 30 seconds

export function startTaskWatcher(): void {
  console.log('[TaskWatcher] Starting file watcher for task completion...')
  
  setInterval(async () => {
    await checkTaskCompletion()
  }, WATCH_INTERVAL)
}

async function checkTaskCompletion(): Promise<void> {
  try {
    // Get all processing OR failed tasks (that might have actually completed)
    const { store } = await import('./store')
    const allTasks = store.getTasks()
    console.log(`[TaskWatcher] Checking ${allTasks.length} total tasks...`)
    
    const tasks = allTasks.filter(t => {
      // Check processing tasks
      if (t.status === 'processing') return true
      // Check failed tasks that were spawned by TaskMan/subagent (might be false failures)
      if (t.status === 'failed' && t.error?.includes('Process died') && t.assignedAgent?.includes('subagent')) {
        console.log(`[TaskWatcher] Found failed task ${t.id} with subagent, will check for files`)
        return true
      }
      return false
    })
    
    console.log(`[TaskWatcher] Found ${tasks.length} tasks to check (${tasks.filter(t => t.status === 'failed').length} failed)`)
    
    for (const task of tasks) {
      // Skip if no assigned agent (not spawned yet)
      if (!task.assignedAgent) continue
      
      // Check if task has been running for at least 30 seconds
      const startTime = new Date(task.startedAt || task.createdAt).getTime()
      const now = Date.now()
      const runningTime = now - startTime
      
      if (runningTime < 30000) continue // Skip if just started
      
      // Check project for new files
      const project = store.getProjectById(task.projectId)
      if (!project?.path || !fs.existsSync(project.path)) continue
      
      try {
        const files = fs.readdirSync(project.path)
        const jsFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.ts'))
        
        if (jsFiles.length > 0) {
          // Check if any file was modified after task started
          const recentFiles = jsFiles.filter(f => {
            try {
              const stat = fs.statSync(path.join(project.path, f))
              return stat.mtime.getTime() > startTime
            } catch (e) { return false }
          })
          
          if (recentFiles.length > 0) {
            // Task likely completed - update status
            if (task.status === 'failed') {
              console.log(`[TaskWatcher] Task ${task.id} was marked failed but files exist. Recovering to completed.`)
            }
            console.log(`[TaskWatcher] Task ${task.id} appears completed. Files: ${recentFiles.join(', ')}`)
            updateTaskStatus(task.id, 'completed', `Task completed. Created: ${recentFiles.join(', ')}`)
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
  } catch (e) {
    console.error('[TaskWatcher] Error:', e)
  }
}
