/**
 * Clean Task Runner
 * Simple flow: TaskMan → sessions_spawn → Worker → Status File
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { updateTaskStatus } from './taskQueue'
import { initTaskLog, appendTaskLog, updateTaskLogStatus, getTaskLog } from './taskLogger'
import { readMemorySync, formatMemoryForPrompt } from './memory'

const execAsync = promisify(exec)

// Paths
const DATA_DIR = path.join(process.cwd(), 'data')
const TASK_STATUS_DIR = path.join(DATA_DIR, 'task-status')

// Ensure directories exist
fs.mkdirSync(TASK_STATUS_DIR, { recursive: true })

interface ExecuteOptions {
  agentCount?: number
  agentThinkingLevels?: number[]
}

/**
 * Execute task - Simple flow through TaskMan
 */
export async function executeTask(taskId: string, projectId: string, title: string, description: string, options?: ExecuteOptions): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[TaskRunner] Executing task ${taskId}: ${title}`, options)

    // Initialize log file for streaming
    initTaskLog(taskId, projectId, title)

    // Build message for TaskMan with multi-agent configuration
    const message = buildTaskManMessage(taskId, projectId, title, description, options)

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
      appendTaskLog(taskId, 'info', 'Worker spawned by TaskMan', { taskmanResponse: response.substring(0, 500) })
      return { success: true }
    }

    // If TaskMan completed immediately
    if (response.includes('completed') || response.includes('สำเร็จ')) {
      const result = extractResult(response)
      updateTaskStatus(taskId, 'completed', result, {
        taskmanResponse: response.substring(0, 1000),
        result: result
      })
      updateTaskLogStatus(taskId, 'completed', result)
      return { success: true }
    }

    return { success: false, error: 'TaskMan did not spawn worker' }

  } catch (error: any) {
    console.error(`[TaskRunner] Error:`, error.message)
    appendTaskLog(taskId, 'error', `Task execution failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * Build message for TaskMan with multi-agent support
 */
function buildTaskManMessage(taskId: string, projectId: string, title: string, description: string, options?: ExecuteOptions): string {
  const projectPath = path.join(process.env.HOME || '', '.openclaw', 'workspace-coder', 'projects', projectId)
  const logFilePath = path.join(DATA_DIR, 'task-logs', `${taskId}.json`)
  const agentCount = options?.agentCount || 1
  const thinkingLevels = options?.agentThinkingLevels || [3]

  // Build thinking level description
  const thinkingLevelDesc = (level: number) => {
    const desc = ['Quick', 'Light', 'Medium', 'Deep', 'Maximum']
    return desc[level - 1] || 'Medium'
  }

  let agentConfigSection = ''
  if (agentCount > 1) {
    agentConfigSection = `MULTI-AGENT CONFIGURATION:
- Total Agents: ${agentCount}
- Thinking Levels: ${thinkingLevels.map((l, i) => `Agent ${i + 1}: Level ${l} (${thinkingLevelDesc(l)})`).join(', ')}

AS TASKMAN, YOU MUST:
1. Analyze the task and break it into sub-tasks
2. Assign specific ROLES to each agent:
   - Agent 1 (Level ${thinkingLevels[0]}): PRIMARY / LEAD - Overall coordination and main implementation
   - Agent 2 (Level ${thinkingLevels[1] || 3}): RESEARCH / ANALYSIS - Gather info, analyze requirements
   - Agent 3 (Level ${thinkingLevels[2] || 3}): IMPLEMENTATION / CODING - Write code, create files
   - Agent 4 (Level ${thinkingLevels[3] || 3}): REVIEW / TESTING - Check quality, test, fix bugs
   - Agent 5 (Level ${thinkingLevels[4] || 3}): DOCUMENTATION / INTEGRATION - Write docs, integrate parts
3. Spawn ${agentCount} agents using sessions_spawn with appropriate thinking levels
4. Coordinate between agents - they should report progress to you
5. Merge all results and mark task complete when all agents finish

AGENT THINKING LEVELS GUIDE:
- Level 1 (Quick): Fast responses, basic reasoning - for simple tasks
- Level 2 (Light): Standard reasoning - for straightforward implementation
- Level 3 (Medium): Balanced depth and speed - for most tasks
- Level 4 (Deep): Thorough analysis - for complex problems
- Level 5 (Maximum): Deep reasoning, detailed analysis - for critical/complex tasks`
  } else {
    agentConfigSection = `SINGLE AGENT CONFIGURATION:
- Thinking Level: ${thinkingLevels[0]} (${thinkingLevelDesc(thinkingLevels[0])})
- Spawn 1 agent with thinking level ${thinkingLevels[0]}`
  }

  return `[DASHBOARD]
Task: ${title}
Description: ${description || title}
Project: ${projectId}
Path: ${projectPath}
Task ID: ${taskId}
${agentConfigSection}

INSTRUCTIONS FOR WORKER(S):
1. Read ${projectPath}/MEMORY.md
2. Do the work - WRITE LOGS REGULARLY using the log function below
3. Update MEMORY.md when done
4. Mark task complete by updating the log file

LOGGING INSTRUCTIONS (IMPORTANT):
Write logs to: ${logFilePath}

Use this function to log your progress (append to the "logs" array):

function log(level, message) {
  const fs = require('fs');
  const logPath = '${logFilePath}';
  const log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  log.logs.push({
    timestamp: new Date().toISOString(),
    level: level, // 'info', 'warn', 'error', 'success'
    message: message
  });
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
}

// Call this regularly while working:
log('info', 'Starting task...');
log('info', 'Reading MEMORY.md');
log('info', 'Working on step 1...');

// When done, update status and result:
log('success', 'Task completed');
const fs = require('fs');
const logPath = '${logFilePath}';
const log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
log.status = 'completed';
log.result = 'Summary of what was done';
log.artifacts = ['filename1.md', 'filename2.js']; // files created
fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

IMPORTANT FOR TASKMAN (MULTI-AGENT):
- YOU are responsible for marking the task COMPLETE when ALL agents finish
- Wait for all agents to report completion
- Then update log.status = 'completed' with combined results from all agents
- List ALL artifacts created by ALL agents in log.artifacts array

DO NOT use the old status file format. Use log file only.`
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
