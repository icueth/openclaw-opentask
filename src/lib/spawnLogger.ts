/**
 * Spawn Logger - Shared logging utility for task spawning
 */

// Global spawn log for debugging
const spawnLog: Array<{
  timestamp: string
  taskId?: string
  stage: string
  message: string
  error?: string
  data?: any
}> = []

export function logSpawnEvent(stage: string, message: string, data?: any, taskId?: string, error?: string) {
  const entry = {
    timestamp: new Date().toISOString(),
    taskId,
    stage,
    message,
    error,
    data
  }
  spawnLog.push(entry)
  console.log(`[SpawnLog:${stage}] ${message}`, data || '', error || '')
  
  // Keep only last 100 entries
  if (spawnLog.length > 100) {
    spawnLog.shift()
  }
}

export function getSpawnLog(): typeof spawnLog {
  return [...spawnLog]
}

export function clearSpawnLog(): void {
  spawnLog.length = 0
}

export function getRecentSpawnLog(count: number = 20): typeof spawnLog {
  return spawnLog.slice(-count)
}
