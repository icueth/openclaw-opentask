/**
 * Clean Task Runner
 * Simple flow: TaskMan → sessions_spawn → Worker → Status File
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { updateTaskStatus } from './taskQueue'
import { readMemorySync, formatMemoryForPrompt } from './memory'

const execAsync = promisify(exec)

// Paths
const DATA_DIR = path.join(process.cwd(), 'data')
const TASK_STATUS_DIR = path.join(DATA_DIR, 'task-status')

// Ensure directories exist
fs.mkdirSync(TASK_STATUS_DIR, { recursive: true })

/**
 * Execute task - Simple flow through TaskMan
 */
export async function executeTask(taskId: string, projectId: string, title: string, description: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[TaskRunner] Executing task ${taskId}: ${title}`)
    
    // Build simple message for TaskMan
    const message = buildTaskManMessage(taskId, projectId, title, description)
    
    // Call TaskMan agent
    const { stdout, stderr } = await execAsync(
      `openclaw agent --agent taskman --message "${escapeShellArg(message)}" --thinking medium`,
      { timeout: 300000 } // 5 minute timeout
    )
    
    const response = stdout + stderr
    console.log(`[TaskRunner] TaskMan response: ${response.substring(0, 500)}`)
    
    // Check if TaskMan spawned worker successfully
    if (response.includes('subagent') || response.includes('sessions_spawn') || response.includes('Worker')) {
      updateTaskStatus(taskId, 'processing', 'Worker spawned', {
        taskmanResponse: response.substring(0, 1000)
      })
      return { success: true }
    }
    
    // If TaskMan completed immediately
    if (response.includes('completed') || response.includes('สำเร็จ')) {
      updateTaskStatus(taskId, 'completed', extractResult(response), {
        taskmanResponse: response.substring(0, 1000)
      })
      return { success: true }
    }
    
    return { success: false, error: 'TaskMan did not spawn worker' }
    
  } catch (error: any) {
    console.error(`[TaskRunner] Error:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Build simple message for TaskMan
 */
function buildTaskManMessage(taskId: string, projectId: string, title: string, description: string): string {
  const projectPath = path.join(process.env.HOME || '', '.openclaw', 'workspace-coder', 'projects', projectId)
  const statusFilePath = path.join(TASK_STATUS_DIR, `${taskId}-status.json`)
  
  return `[DASHBOARD]
Task: ${title}
Description: ${description || title}
Project: ${projectId}
Path: ${projectPath}

INSTRUCTIONS FOR WORKER:
1. Read ${projectPath}/MEMORY.md
2. Do the work
3. Write status to: ${statusFilePath}
4. Update MEMORY.md

Status file format (write this when done):
{"percentage":100,"status":"completed","message":"Done","result":"Summary...","artifacts":["filename"]}`
}

/**
 * Escape string for shell
 */
function escapeShellArg(arg: string): string {
  return arg.replace(/"/g, '\\"').replace(/\n/g, ' ').substring(0, 2000)
}

/**
 * Extract result from TaskMan response
 */
function extractResult(response: string): string {
  const resultMatch = response.match(/Result:\s*([\s\S]+?)(?=Stats:|$)/i) ||
                     response.match(/completed successfully\s*([\s\S]+?)(?=Stats:|$)/i)
  return resultMatch ? resultMatch[1].trim().substring(0, 500) : 'Task completed'
}

/**
 * Check task status from status file
 */
export function checkTaskStatusFromFile(taskId: string): { percentage: number; status: string; message: string; result?: string; artifacts?: string[] } | null {
  const statusFile = path.join(TASK_STATUS_DIR, `${taskId}-status.json`)
  
  if (!fs.existsSync(statusFile)) {
    return null
  }
  
  try {
    const content = fs.readFileSync(statusFile, 'utf-8')
    return JSON.parse(content)
  } catch (e) {
    return null
  }
}
