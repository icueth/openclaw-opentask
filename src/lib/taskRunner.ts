/**
 * Task Runner - OpenClaw Core Native
 * Uses sessions_spawn for sub-agents with proper announce handling
 */

import fs from 'fs'
import path from 'path'
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

// Gateway configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:18789'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || ''

// Default workspace
const DEFAULT_WORKSPACE_PATH = path.join(process.env.HOME || '', '.openclaw', 'workspace-coder')

interface AgentConfig {
  id: string
  name: string
  model?: string
  thinking?: string
  workspace: string
  agentDir: string
}

// =====================================================
// PROGRESS TRACKING
// =====================================================

const PROGRESS_DIR = path.join(process.cwd(), 'data', 'task-contexts')

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

export function readTaskProgressFile(taskId: string): { percentage: number; message: string; timestamp: number } | null {
  try {
    const progressFile = path.join(PROGRESS_DIR, `${taskId}.progress`)
    if (!fs.existsSync(progressFile)) return null
    return JSON.parse(fs.readFileSync(progressFile, 'utf-8'))
  } catch (e) {
    return null
  }
}

// =====================================================
// AGENT CONFIGURATION
// =====================================================

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

// =====================================================
// CONTEXT BUILDER
// =====================================================

function buildTaskContext(task: any, agentConfig: AgentConfig, project: any): string {
  const projectPath = project?.path || path.join(DEFAULT_WORKSPACE_PATH, 'projects', task.projectId)
  
  // Read project memory
  const projectMemory = readMemorySync(task.projectId)
  const formattedMemory = formatMemoryForPrompt(projectMemory)
  
  let context = `## 🤖 Your Agent Identity
- **ID:** ${agentConfig.id}
- **Name:** ${agentConfig.name}
- **Model:** ${agentConfig.model || 'default'}

## 🛠️ YOUR TOOLS AND WORKSPACE

### Available Tools
You have access to these tools:
- **write** - Create new files
- **read** - Read file contents
- **edit** - Modify existing files
- **exec** - Execute shell commands

### Workspace Location
**Your current working directory is:** 
\`\`\`
${projectPath}
\`\`\`

### How to Use Tools

#### Creating Files
Use the write tool with the full path:
\`\`\`
write: {"file_path": "${projectPath}/filename.md", "content": "# Your content here"}
\`\`\`

## 📁 Project Context
- **Project ID:** ${task.projectId}
- **Project Path:** ${projectPath}

## ✅ YOUR TASK

${task.description || task.title}

### Requirements
1. **DO THE ACTUAL WORK** - Don't just say you'll do it
2. **Create/modify files** using the write/edit tools
3. **Work in the project directory:** ${projectPath}
4. **Save all outputs** to files in that directory
5. **Report completion** when done

## 📊 PROGRESS TRACKING (CRITICAL - DO THIS!)

You MUST report progress every 20%:

**Usage:**
\`\`\`
exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/progress -H 'Content-Type: application/json' -d '{"percentage": 20, "message": "📝 Working..."}'"}
\`\`\`

**Progress checkpoints:**
- **20%** - Started, analyzing requirements
- **40%** - Created first files
- **60%** - Main implementation
- **80%** - Testing, finalizing
- **100%** - Completed

## 📤 Task Completion

When done, call complete API:
\`\`\`
exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/complete -H 'Content-Type: application/json' -d '{"result": "Summary of work done", "artifacts": ["filename.js"]}'"}
\`\`\`

## 📚 PROJECT MEMORY

${formattedMemory || 'No previous memory recorded.'}

---
*Task: ${task.id}*
*Started: ${new Date().toISOString()}*
`

  return context
}

// =====================================================
// SESSIONS SPAWN - OpenClaw Core Native
// =====================================================

/**
 * Spawn sub-agent using OpenClaw Core sessions_spawn
 * This uses the gateway API directly
 */
async function spawnViaSessionsSpawn(
  task: any,
  agentConfig: AgentConfig,
  fullContext: string
): Promise<{ success: boolean; runId?: string; sessionKey?: string; error?: string }> {
  
  logSpawnEvent('SESSIONS_SPAWN', `Spawning sub-agent for task ${task.id}`, { agentId: agentConfig.id })
  
  try {
    // Write context to file for reference
    const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
    fs.mkdirSync(contextDir, { recursive: true })
    const contextFile = path.join(contextDir, `${task.id}-context.md`)
    fs.writeFileSync(contextFile, fullContext, 'utf-8')
    
    // Write initial progress
    writeTaskProgressFile(task.id, 10, '🚀 Sub-agent spawning...')
    
    // Call gateway sessions_spawn endpoint
    const response = await fetch(`${GATEWAY_URL}/api/sessions_spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GATEWAY_TOKEN ? { 'Authorization': `Bearer ${GATEWAY_TOKEN}` } : {})
      },
      body: JSON.stringify({
        task: fullContext,
        agentId: agentConfig.id,
        model: agentConfig.model,
        thinking: agentConfig.thinking || 'medium',
        runTimeoutSeconds: (task.timeoutMinutes || 30) * 60,
        cleanup: 'keep'
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gateway error: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    
    logSpawnEvent('SESSIONS_SPAWN', `Sub-agent spawned successfully`, { 
      runId: result.runId, 
      sessionKey: result.childSessionKey 
    })
    
    // Store sub-agent info
    store.set(`subagent:${task.id}`, {
      runId: result.runId,
      sessionKey: result.childSessionKey,
      agentId: agentConfig.id,
      startedAt: new Date().toISOString(),
      status: 'running'
    })
    
    // Update task with assigned agent
    updateTaskStatus(task.id, 'processing', 'Sub-agent spawned and processing', {
      assignedAgent: result.childSessionKey
    })
    
    writeTaskProgressFile(task.id, 15, '📖 Sub-agent reading task...')
    
    return {
      success: true,
      runId: result.runId,
      sessionKey: result.childSessionKey
    }
    
  } catch (error: any) {
    logSpawnEvent('SESSIONS_SPAWN', `Failed to spawn sub-agent`, undefined, undefined, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// =====================================================
// TASK EXECUTION
// =====================================================

/**
 * Execute a task using OpenClaw Core sessions_spawn
 */
export async function executeTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  const task = getTaskById(taskId)
  if (!task) {
    return { success: false, error: 'Task not found' }
  }
  
  logSpawnEvent('TASK_EXECUTE', `Starting task execution: ${taskId}`, { title: task.title })
  
  // Get agent config
  const agentConfig = getAgentConfig(task.agentId)
  if (!agentConfig) {
    updateTaskStatus(taskId, 'failed', 'Agent configuration not found', {
      error: `Agent ${task.agentId} not found in config`
    })
    return { success: false, error: 'Agent not found' }
  }
  
  // Get project info
  const project = store.getProjectById(task.projectId)
  
  // Build context
  const fullContext = buildTaskContext(task, agentConfig, project)
  
  // Spawn sub-agent
  const spawnResult = await spawnViaSessionsSpawn(task, agentConfig, fullContext)
  
  if (!spawnResult.success) {
    updateTaskStatus(taskId, 'failed', 'Failed to spawn sub-agent', {
      error: spawnResult.error
    })
    return { success: false, error: spawnResult.error }
  }
  
  // The sub-agent is now running
  // It will report progress via the API
  // When complete, it should call the complete API
  // Or we can poll for status
  
  return { success: true }
}

// =====================================================
// TASK STATUS CHECK
// =====================================================

/**
 * Check sub-agent status via OpenClaw Core
 */
export async function checkSubAgentStatus(taskId: string): Promise<{
  status: 'running' | 'completed' | 'failed' | 'unknown'
  result?: string
  error?: string
}> {
  const subagentInfo = store.get(`subagent:${taskId}`) as any
  
  if (!subagentInfo) {
    return { status: 'unknown' }
  }
  
  try {
    // Get session history to check status
    const response = await fetch(
      `${GATEWAY_URL}/api/sessions_history?sessionKey=${encodeURIComponent(subagentInfo.sessionKey)}&limit=1`,
      {
        headers: GATEWAY_TOKEN ? { 'Authorization': `Bearer ${GATEWAY_TOKEN}` } : {}
      }
    )
    
    if (!response.ok) {
      return { status: 'unknown', error: 'Failed to check status' }
    }
    
    const history = await response.json()
    
    // Check last message for completion
    const lastMessage = history[history.length - 1]
    if (lastMessage) {
      // Check if it's a completion message
      if (lastMessage.content?.includes('Task completed') || 
          lastMessage.content?.includes('completed successfully')) {
        return { status: 'completed', result: lastMessage.content }
      }
      if (lastMessage.content?.includes('failed') || 
          lastMessage.content?.includes('error')) {
        return { status: 'failed', error: lastMessage.content }
      }
    }
    
    return { status: 'running' }
    
  } catch (error: any) {
    return { status: 'unknown', error: error.message }
  }
}

// =====================================================
// CANCEL TASK
// =====================================================

/**
 * Cancel a running task
 */
export async function cancelTask(taskId: string): Promise<boolean> {
  const subagentInfo = store.get(`subagent:${taskId}`) as any
  
  if (!subagentInfo?.runId) {
    return false
  }
  
  try {
    // Use subagents tool to kill the run
    const response = await fetch(`${GATEWAY_URL}/api/subagents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GATEWAY_TOKEN ? { 'Authorization': `Bearer ${GATEWAY_TOKEN}` } : {})
      },
      body: JSON.stringify({
        action: 'kill',
        target: subagentInfo.runId
      })
    })
    
    if (response.ok) {
      updateTaskStatus(taskId, 'cancelled', 'Task cancelled by user')
      return true
    }
    
    return false
  } catch (error) {
    console.error('Failed to cancel task:', error)
    return false
  }
}

// =====================================================
// SPAWN FOR TASK - Main entry point for task queue
// =====================================================

/**
 * Spawn a sub-agent for a task (main entry point used by taskQueue)
 * This is the function that taskQueue calls to execute a task
 */
export async function spawnForTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  return executeTask(taskId)
}

// =====================================================
// EXPORTS
// =====================================================

export {
  getAgentConfig,
  buildTaskContext,
  writeTaskProgressFile
}
