/**
 * Task Runner - OpenClaw Core with Coordinator Agent
 * Uses Coordinator Agent + sessions_spawn for true sub-agent spawning
 */

import { spawn, exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { store } from './store'
import { 
  updateTaskStatus, 
  getTaskById
} from './taskQueue'
import { 
  readMemorySync, 
  formatMemoryForPrompt
} from './memory'
import { logSpawnEvent } from './spawnLogger'

const execAsync = promisify(exec)

// Default workspace
const DEFAULT_WORKSPACE_PATH = path.join(process.env.HOME || '', '.openclaw', 'workspace-coder')

// System Settings
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'system-settings.json')
const TASKMAN_AGENT_ID = 'taskman'

function getSystemSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
    }
  } catch (e) {}
  return {
    gatewayToken: process.env.GATEWAY_TOKEN || '',
    gatewayPassword: '',
    taskModel: 'kimi-coding/kimi-for-coding',
    taskThinking: 'medium'
  }
}

// =====================================================
// PROGRESS TRACKING
// =====================================================

const PROGRESS_DIR = path.join(process.cwd(), 'data', 'task-contexts')

export function readTaskProgressFile(taskId: string): { percentage: number; message: string; timestamp: number } | null {
  try {
    const progressFile = path.join(PROGRESS_DIR, `${taskId}.progress`)
    if (!fs.existsSync(progressFile)) return null
    return JSON.parse(fs.readFileSync(progressFile, 'utf-8'))
  } catch (e) {
    return null
  }
}

function writeTaskProgressFile(taskId: string, percentage: number, message: string): void {
  try {
    fs.mkdirSync(PROGRESS_DIR, { recursive: true })
    const progressFile = path.join(PROGRESS_DIR, `${taskId}.progress`)
    fs.writeFileSync(progressFile, JSON.stringify({
      percentage,
      message,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.error('Failed to write progress file:', e)
  }
}

// =====================================================
// SPAWN VIA COORDINATOR AGENT (sessions_spawn)
// =====================================================

/**
 * Spawn worker via TaskMan Agent using sessions_spawn
 * This uses the actual OpenClaw sessions_spawn tool
 */
async function spawnViaTaskMan(
  task: any,
  fullContext: string
): Promise<{ success: boolean; sessionKey?: string; error?: string }> {
  
  logSpawnEvent('TASKMAN_SPAWN', `Spawning via taskman for task ${task.id}`, { agentId: task.agentId })
  
  try {
    // Build taskman message with [DASHBOARD] prefix
    const taskmanMessage = buildTaskManMessage(task, fullContext)
    
    // Write message to temp file (to avoid shell escaping issues)
    const messageFile = path.join(PROGRESS_DIR, `${task.id}-message.txt`)
    fs.mkdirSync(PROGRESS_DIR, { recursive: true })
    fs.writeFileSync(messageFile, taskmanMessage, 'utf-8')
    
    // Initial progress
    writeTaskProgressFile(task.id, 15, '📡 Sending to Coordinator...')
    
    // Call openclaw agent taskman
    const { stdout, stderr } = await execAsync(
      `openclaw agent --agent ${TASKMAN_AGENT_ID} -m "$(cat ${messageFile})" --thinking medium`,
      { timeout: 60000 } // 60 second timeout for taskman response
    )
    
    // Parse response
    const response = stdout + stderr
    logSpawnEvent('COORDINATOR_RESPONSE', 'Coordinator response', { response: response.substring(0, 500) })
    
    // Check if sessions_spawn was successful
    if (response.includes('sessions_spawn') || response.includes('Worker agent spawned') || response.includes('subagent')) {
      writeTaskProgressFile(task.id, 20, '🚀 Worker spawned via sessions_spawn')
      
      // Extract session key if available
      const sessionMatch = response.match(/subagent:([a-f0-9-]+)/)
      const sessionKey = sessionMatch ? `agent:coordinator:subagent:${sessionMatch[1]}` : undefined
      
      return {
        success: true,
        sessionKey
      }
    }
    
    // If coordinator couldn't spawn, return the response for debugging
    return {
      success: false,
      error: `Coordinator response: ${response.substring(0, 200)}`
    }
    
  } catch (error: any) {
    logSpawnEvent('COORDINATOR_SPAWN', `Failed to spawn via coordinator`, undefined, undefined, error.message)
    
    // If timeout or error, fallback to CLI
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        error: 'Coordinator timeout, will fallback to CLI'
      }
    }
    
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Build message for TaskMan Agent
 */
function buildTaskManMessage(task: any, context: string): string {
  const settings = getSystemSettings()
  
  return `[DASHBOARD] Task Request
ID: ${task.id}
Project: ${task.projectId}
Title: ${task.title}
Description: ${task.description || task.title}
TargetAgent: ${task.agentId || 'coder'}
Model: ${settings.taskModel}
Thinking: ${settings.taskThinking}

Please use sessions_spawn to create a worker agent for this task.
The worker should use the specified Model and Thinking level.

Task Context:
${context.substring(0, 1000)}`
}

// =====================================================
// FALLBACK: CLI SPAWN
// =====================================================

/**
 * Fallback: Spawn agent directly via CLI
 */
async function spawnViaCli(
  task: any,
  agentConfig: any,
  fullContext: string
): Promise<{ success: boolean; pid?: number; error?: string }> {
  
  logSpawnEvent('CLI_SPAWN', `Direct CLI spawn for task ${task.id}`, { agentId: agentConfig.id })
  
  try {
    // Write context to file
    const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
    fs.mkdirSync(contextDir, { recursive: true })
    
    const contextFile = path.join(contextDir, `${task.id}-context.md`)
    fs.writeFileSync(contextFile, fullContext, 'utf-8')
    
    const promptFile = path.join(contextDir, `${task.id}-prompt.txt`)
    fs.writeFileSync(promptFile, fullContext, 'utf-8')
    
    // Write progress helper
    const progressFile = path.join(contextDir, `${task.id}.progress`)
    const progressHelperPath = path.join(contextDir, `${task.id}-progress.js`)
    const progressHelperScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const progressFile = '${progressFile}';

function writeProgress(pct, msg) {
  try {
    fs.mkdirSync(path.dirname(progressFile), { recursive: true });
    fs.writeFileSync(progressFile, JSON.stringify({
      percentage: parseInt(pct),
      message: msg,
      timestamp: Date.now()
    }));
    console.log('[PROGRESS]', pct + '% - ' + msg);
  } catch (e) {
    console.error('[PROGRESS ERROR]', e.message);
  }
}

const [,, pct, msg] = process.argv;
writeProgress(pct, msg);
`
    fs.writeFileSync(progressHelperPath, progressHelperScript)
    fs.chmodSync(progressHelperPath, 0o755)
    
    writeTaskProgressFile(task.id, 10, '🚀 Spawning via CLI...')
    
    // Create worker script
    const agentScriptPath = path.join(contextDir, `${task.id}-agent.sh`)
    const logFile = path.join(contextDir, `${task.id}.log`)
    const pidFile = path.join(contextDir, `${task.id}.pid`)
    
    const agentScript = `#!/bin/bash
set -e

echo $$ > "${pidFile}"
echo "=== Task ${task.id} Started ===" > "$LOG_FILE"
echo "Time: $(date)" >> "$LOG_FILE"

report_progress() {
  node "${progressHelperPath}" "$1" "$2" 2>/dev/null || true
}

report_progress 15 "📖 Reading task..."

openclaw agent \\
  --agent ${agentConfig.id} \\
  --message "$(cat "${promptFile}")" \\
  --thinking ${agentConfig.thinking || 'medium'} \\
  --json 2>&1 | tee -a "${logFile}" || true

report_progress 100 "✅ Task completed"
`
    
    fs.writeFileSync(agentScriptPath, agentScript)
    fs.chmodSync(agentScriptPath, 0o755)
    
    // Spawn in background
    const child = spawn('bash', [agentScriptPath], {
      detached: true,
      stdio: 'ignore'
    })
    
    child.unref()
    
    logSpawnEvent('CLI_SPAWN', `Spawned with PID ${child.pid}`, { pid: child.pid })
    
    store.set(`subagent:${task.id}`, {
      pid: child.pid,
      agentId: agentConfig.id,
      startedAt: new Date().toISOString(),
      status: 'running',
      logFile,
      pidFile
    })
    
    return { success: true, pid: child.pid }
    
  } catch (error: any) {
    logSpawnEvent('CLI_SPAWN', `Failed`, undefined, undefined, error.message)
    return { success: false, error: error.message }
  }
}

// =====================================================
// TASK EXECUTION
// =====================================================

interface AgentConfig {
  id: string
  name: string
  model?: string
  thinking?: string
  workspace: string
  agentDir: string
}

function getAgentConfig(agentId: string): AgentConfig | null {
  try {
    const configPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json')
    if (!fs.existsSync(configPath)) return null
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const agent = config.agents?.list?.find((a: any) => a.id === agentId)
    
    if (!agent) return null
    
    return {
      id: agent.id,
      name: agent.name,
      model: agent.model,
      workspace: agent.workspace,
      agentDir: agent.agentDir
    }
  } catch (error) {
    console.error('Failed to get agent config:', error)
    return null
  }
}

function buildTaskContext(task: any, agentConfig: AgentConfig, project: any): string {
  const projectPath = project?.path || path.join(DEFAULT_WORKSPACE_PATH, 'projects', task.projectId)
  const projectMemory = readMemorySync(task.projectId)
  const formattedMemory = formatMemoryForPrompt(projectMemory)
  
  return `## Task: ${task.title}

### Instructions
${task.description || 'Complete this task'}

### Workspace
${projectPath}

### Tools
- write - Create files
- read - Read files
- edit - Edit files
- exec - Execute commands

### Progress
Report progress at 20%, 40%, 60%, 80%, 100%

### Completion
When done, call complete API with result and artifacts.

### Memory
${formattedMemory || 'No previous memory'}

---
Task: ${task.id}
Started: ${new Date().toISOString()}
`
}

export async function executeTask(taskId: string): Promise<{ success: boolean; error?: string; method?: 'taskman' | 'cli' }> {
  const task = getTaskById(taskId)
  if (!task) {
    return { success: false, error: 'Task not found' }
  }
  
  logSpawnEvent('TASK_EXECUTE', `Starting: ${taskId}`, { title: task.title })
  
  const project = store.getProjectById(task.projectId)
  
  // Build context with taskman workspace
  const taskManWorkspace = path.join(process.env.HOME || '', '.openclaw', 'workspace-taskman')
  const fullContext = buildTaskContext(task, { 
    id: TASKMAN_AGENT_ID,
    name: 'TaskMan',
    workspace: taskManWorkspace,
    agentDir: path.join(process.env.HOME || '', '.openclaw', 'agents', 'taskman', 'agent')
  }, project)
  
  // Try TaskMan first (sessions_spawn)
  updateTaskStatus(taskId, 'processing', 'Contacting TaskMan...')
  const taskManResult = await spawnViaTaskMan(task, fullContext)
  
  if (taskManResult.success) {
    updateTaskStatus(taskId, 'processing', 'Worker spawned via TaskMan', {
      assignedAgent: taskManResult.sessionKey
    })
    return { success: true, method: 'taskman' }
  }
  
  // Fallback to CLI - use the original agent from task
  console.log(`[TaskRunner] TaskMan failed: ${taskManResult.error}, falling back to CLI`)
  
  const agentConfig = getAgentConfig(task.agentId || 'coder')
  if (!agentConfig) {
    updateTaskStatus(taskId, 'failed', 'Agent not found')
    return { success: false, error: 'Agent not found' }
  }
  
  const cliResult = await spawnViaCli(task, agentConfig, fullContext)
  
  if (cliResult.success) {
    updateTaskStatus(taskId, 'processing', 'Worker spawned via CLI', {
      assignedAgent: `${agentConfig.id}:${cliResult.pid}`
    })
    return { success: true, method: 'cli' }
  }
  
  updateTaskStatus(taskId, 'failed', 'Failed to spawn worker', {
    error: cliResult.error
  })
  
  return { success: false, error: cliResult.error }
}

// Entry point for task queue
export async function spawnForTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  const result = await executeTask(taskId)
  return { success: result.success, error: result.error }
}
