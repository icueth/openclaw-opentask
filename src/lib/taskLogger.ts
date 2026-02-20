/**
 * Task Logger - Real-time log streaming
 * Worker append logs → file → API → Frontend
 */

import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const TASK_LOGS_DIR = path.join(DATA_DIR, 'task-logs')

// Ensure directory exists
fs.mkdirSync(TASK_LOGS_DIR, { recursive: true })

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  metadata?: any
}

export interface TaskLog {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  logs: LogEntry[]
  result?: string
  artifacts?: string[]
  startedAt?: string
  completedAt?: string
}

function getLogFilePath(taskId: string): string {
  return path.join(TASK_LOGS_DIR, `${taskId}.json`)
}

/**
 * Initialize log file for a task
 */
export function initTaskLog(taskId: string, projectId: string, title: string): TaskLog {
  const log: TaskLog = {
    taskId,
    status: 'pending',
    logs: [{
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Task started: ${title}`,
      metadata: { projectId, title }
    }],
    startedAt: new Date().toISOString()
  }
  
  fs.writeFileSync(getLogFilePath(taskId), JSON.stringify(log, null, 2))
  return log
}

/**
 * Append log entry to task log
 */
export function appendTaskLog(
  taskId: string, 
  level: LogEntry['level'], 
  message: string, 
  metadata?: any
): void {
  const logPath = getLogFilePath(taskId)
  
  let log: TaskLog
  if (fs.existsSync(logPath)) {
    log = JSON.parse(fs.readFileSync(logPath, 'utf-8'))
  } else {
    log = { taskId, status: 'processing', logs: [] }
  }
  
  log.logs.push({
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata
  })
  
  // Keep last 1000 logs to prevent file bloat
  if (log.logs.length > 1000) {
    log.logs = log.logs.slice(-1000)
  }
  
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2))
}

/**
 * Update task status and add log
 */
export function updateTaskLogStatus(
  taskId: string, 
  status: TaskLog['status'], 
  result?: string,
  artifacts?: string[]
): void {
  const logPath = getLogFilePath(taskId)
  
  let log: TaskLog
  if (fs.existsSync(logPath)) {
    log = JSON.parse(fs.readFileSync(logPath, 'utf-8'))
  } else {
    log = { taskId, status, logs: [] }
  }
  
  log.status = status
  if (result) log.result = result
  if (artifacts) log.artifacts = artifacts
  
  if (status === 'completed' || status === 'failed') {
    log.completedAt = new Date().toISOString()
  }
  
  // Add status change log
  const level = status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info'
  log.logs.push({
    timestamp: new Date().toISOString(),
    level,
    message: status === 'completed' ? `✅ Task completed${result ? ': ' + result : ''}` : 
             status === 'failed' ? `❌ Task failed${result ? ': ' + result : ''}` :
             `Status: ${status}`
  })
  
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2))
}

/**
 * Get task log
 */
export function getTaskLog(taskId: string): TaskLog | null {
  const logPath = getLogFilePath(taskId)
  
  if (!fs.existsSync(logPath)) {
    return null
  }
  
  try {
    return JSON.parse(fs.readFileSync(logPath, 'utf-8'))
  } catch (e) {
    return null
  }
}

/**
 * Get logs with offset (for streaming)
 */
export function getTaskLogsFromOffset(taskId: string, offset: number = 0): { logs: LogEntry[], total: number } {
  const log = getTaskLog(taskId)
  
  if (!log) {
    return { logs: [], total: 0 }
  }
  
  return {
    logs: log.logs.slice(offset),
    total: log.logs.length
  }
}

/**
 * Get last N logs
 */
export function getLastTaskLogs(taskId: string, n: number = 50): LogEntry[] {
  const log = getTaskLog(taskId)
  if (!log) return []
  return log.logs.slice(-n)
}
