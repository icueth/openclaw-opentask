/**
 * Task Runner - OpenClaw Core Native
 * Uses openclaw CLI for sub-agents with proper progress tracking
 */

import { spawn } from 'child_process'
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
import { submitTaskToCoordinator } from './agentCoordinator'

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
  const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
  const progressHelperPath = path.join(contextDir, `${task.id}-progress.js`)
  
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

⚠️ **YOU MUST REPORT PROGRESS FREQUENTLY** ⚠️

Use this command to report progress:
\`\`\`
exec: {"command": "node ${progressHelperPath} 20 '📝 กำลังวิเคราะห์ requirements'"}
\`\`\`

Change the percentage (20, 40, 60, 80, 100) and message as you work:
- **20%** - เริ่มต้น, วิเคราะห์ requirements
- **40%** - สร้างไฟล์แรก, setup project  
- **60%** - ทำงานหลัก, implement features
- **80%** - แก้ไข, finalize, test
- **100%** - เสร็จสมบูรณ์

**REPORT PROGRESS AFTER EVERY SIGNIFICANT STEP!**

## 📤 Task Completion

When done, call complete API:
\`\`\`
exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/complete -H 'Content-Type: application/json' -d '{"result": "สรุปงานที่ทำ: 1. สร้างไฟล์อะไรบ้าง 2. ทำอะไรไปบ้าง 3. ผลลัพธ์เป็นอย่างไร", "artifacts": ["filename.js"]}'"}
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
// SPAWN SUB-AGENT VIA CLI
// =====================================================

/**
 * Spawn sub-agent using OpenClaw CLI
 * This uses the openclaw command directly
 */
async function spawnViaCli(
  task: any,
  agentConfig: AgentConfig,
  fullContext: string
): Promise<{ success: boolean; pid?: number; error?: string }> {
  
  logSpawnEvent('CLI_SPAWN', `Spawning sub-agent for task ${task.id}`, { agentId: agentConfig.id })
  
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
if (pct && msg) {
  writeProgress(pct, msg);
} else {
  console.log('Usage: node progress.js <percentage> <message>');
}
`
    fs.writeFileSync(progressHelperPath, progressHelperScript)
    fs.chmodSync(progressHelperPath, 0o755)
    
    // Write initial progress
    writeTaskProgressFile(task.id, 10, '🚀 Sub-agent starting...')
    
    // Create background script
    const agentScriptPath = path.join(contextDir, `${task.id}-agent.sh`)
    const logFile = path.join(contextDir, `${task.id}.log`)
    const pidFile = path.join(contextDir, `${task.id}.pid`)
    
    const agentScript = `#!/bin/bash
set -e

TASK_ID="${task.id}"
LOG_FILE="${logFile}"
PID_FILE="${pidFile}"
PROMPT_FILE="${promptFile}"
PROGRESS_HELPER="${progressHelperPath}"

# Report progress helper
report_progress() {
  node "$PROGRESS_HELPER" "$1" "$2" 2>/dev/null || true
}

# Write PID
echo $$ > "$PID_FILE"

# Log start
echo "=== Task $TASK_ID Started ===" > "$LOG_FILE"
echo "PID: $$" >> "$LOG_FILE"
echo "Time: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

report_progress 15 "📖 Reading task context..."

# Run openclaw agent with the prompt
openclaw agent \
  --agent ${agentConfig.id} \
  --message "$(cat "$PROMPT_FILE")" \
  --thinking ${agentConfig.thinking || 'medium'} \
  --json 2>&1 | tee -a "$LOG_FILE" || {
    echo "Agent exited with code $?" >> "$LOG_FILE"
    exit 1
  }

report_progress 100 "✅ Task completed"
echo "=== Task Completed ===" >> "$LOG_FILE"
`
    
    fs.writeFileSync(agentScriptPath, agentScript)
    fs.chmodSync(agentScriptPath, 0o755)
    
    // Spawn the agent in background
    const child = spawn('bash', [agentScriptPath], {
      detached: true,
      stdio: 'ignore'
    })
    
    child.unref()
    
    logSpawnEvent('CLI_SPAWN', `Sub-agent spawned with PID ${child.pid}`, { pid: child.pid })
    
    // Store info
    store.set(`subagent:${task.id}`, {
      pid: child.pid,
      agentId: agentConfig.id,
      startedAt: new Date().toISOString(),
      status: 'running',
      logFile,
      pidFile
    })
    
    // Update task status
    updateTaskStatus(task.id, 'processing', 'Sub-agent spawned and processing', {
      assignedAgent: `${agentConfig.id}:${child.pid}`
    })
    
    return {
      success: true,
      pid: child.pid
    }
    
  } catch (error: any) {
    logSpawnEvent('CLI_SPAWN', `Failed to spawn sub-agent`, undefined, undefined, error.message)
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
 * Execute a task
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
  
  // Write context to file for coordinator
  const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
  fs.mkdirSync(contextDir, { recursive: true })
  const contextFile = path.join(contextDir, `${taskId}-context.md`)
  fs.writeFileSync(contextFile, fullContext, 'utf-8')
  
  // Submit task to coordinator (which will use sessions_spawn)
  const submitted = submitTaskToCoordinator({
    taskId,
    projectId: task.projectId,
    title: task.title,
    description: task.description || task.title,
    agentId: task.agentId
  })
  
  if (!submitted) {
    // Fallback to direct CLI spawn if coordinator not available
    const spawnResult = await spawnViaCli(task, agentConfig, fullContext)
    if (!spawnResult.success) {
      updateTaskStatus(taskId, 'failed', 'Failed to spawn sub-agent', {
        error: spawnResult.error
      })
      return { success: false, error: spawnResult.error }
    }
  } else {
    updateTaskStatus(taskId, 'pending', 'Waiting for coordinator...')
  }
  
  return { success: true }
}

// =====================================================
// SPAWN FOR TASK - Main entry point
// =====================================================

export async function spawnForTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  return executeTask(taskId)
}

// =====================================================
// CHECK STATUS
// =====================================================

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
    // Check if process is still running
    process.kill(subagentInfo.pid, 0)
    
    // Check progress file
    const progress = readTaskProgressFile(taskId)
    if (progress?.percentage === 100) {
      return { status: 'completed', result: progress.message }
    }
    
    return { status: 'running' }
  } catch (e) {
    // Process is dead, check if completed successfully
    const progress = readTaskProgressFile(taskId)
    if (progress?.percentage === 100 || progress?.message?.includes('completed')) {
      return { status: 'completed', result: progress.message }
    }
    return { status: 'failed', error: 'Process terminated' }
  }
}

// =====================================================
// CANCEL TASK
// =====================================================

export async function cancelTask(taskId: string): Promise<boolean> {
  const subagentInfo = store.get(`subagent:${taskId}`) as any
  
  if (!subagentInfo?.pid) {
    return false
  }
  
  try {
    process.kill(subagentInfo.pid, 'SIGTERM')
    updateTaskStatus(taskId, 'cancelled', 'Task cancelled by user')
    return true
  } catch (error) {
    return false
  }
}

// =====================================================
// EXPORTS
// =====================================================

export {
  getAgentConfig,
  buildTaskContext,
  writeTaskProgressFile
}
