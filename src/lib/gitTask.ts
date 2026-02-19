/**
 * Git Task Helper - Client-side utilities for git operations UI
 * 
 * NOTE: Server-side functions are in the API route to avoid importing
 * Node.js modules in client components.
 */

import { Task } from '@/types/task'

/**
 * Check if a task should show the git push button
 */
export function shouldShowGitPushButton(task: Task): boolean {
  // Show for completed tasks
  if (task.status === 'completed') {
    return true
  }
  
  // Show if task has artifacts (files created)
  if (task.artifacts && task.artifacts.length > 0) {
    return true
  }
  
  return false
}

/**
 * Get display list of files from artifacts
 */
export function getArtifactFileList(task: Task): string[] {
  if (!task.artifacts || task.artifacts.length === 0) {
    return []
  }
  
  // Extract just the filenames from full paths
  return task.artifacts.map(path => {
    const parts = path.split('/')
    return parts[parts.length - 1] || path
  })
}
