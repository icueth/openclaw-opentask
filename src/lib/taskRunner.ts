/**
 * Task Runner with Sessions Spawn (OpenClaw Native)
 * Uses sessions_spawn for sub-agents with proper progress tracking
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
  formatMemoryForPrompt, 
  initializeMemorySync 
} from './memory'
import { logSpawnEvent } from './spawnLogger'

const execAsync = promisify(exec)

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
// SESSION LOCK MANAGEMENT
// =====================================================

/**
 * Clear all session locks for an agent before spawning
 * This prevents "session file locked" errors
 */
async function clearAgentSessionLocks(agentId: string): Promise<void> {
  logSpawnEvent('SESSION_LOCK', `Clearing session locks for agent: ${agentId}`)
  
  try {
    const sessionsDir = path.join(
      process.env.HOME || '',
      '.openclaw',
      'agents',
      agentId,
      'sessions'
    )

    if (!fs.existsSync(sessionsDir)) {
      logSpawnEvent('SESSION_LOCK', `No sessions directory for ${agentId}`)
      return
    }

    // Remove all .lock files
    const files = fs.readdirSync(sessionsDir)
    let clearedCount = 0
    
    for (const file of files) {
      if (file.endsWith('.lock')) {
        const lockPath = path.join(sessionsDir, file)
        try {
          fs.unlinkSync(lockPath)
          clearedCount++
          logSpawnEvent('SESSION_LOCK', `Removed lock: ${file}`)
        } catch (e: any) {
          logSpawnEvent('SESSION_LOCK', `Failed to remove lock ${file}`, undefined, undefined, e.message)
        }
      }
    }
    
    logSpawnEvent('SESSION_LOCK', `Cleared ${clearedCount} locks for ${agentId}`)
  } catch (error: any) {
    logSpawnEvent('SESSION_LOCK', `Error clearing locks`, undefined, undefined, error.message)
    // Non-fatal, continue anyway
  }
}

/**
 * Kill any hanging agent processes (but not the server/gateway)
 */
async function killHangingAgentProcesses(agentId: string): Promise<void> {
  try {
    const currentPid = process.pid
    
    // Find agent processes (specific to this agent only)
    const { stdout } = await execAsync(
      `ps aux | grep "openclaw.*agent.*${agentId}" | grep -v grep | grep -v "${currentPid}" | awk "{print \\\$2}" || true`
    )
    const pids = stdout.trim().split('\n').filter(Boolean)
    
    for (const pid of pids) {
      try {
        const pidNum = parseInt(pid)
        if (pidNum !== currentPid && pidNum !== process.ppid) {
          process.kill(pidNum, 'SIGTERM')
          logSpawnEvent('PROCESS_KILL', `Killed hanging process: ${pid}`)
          await new Promise(r => setTimeout(r, 500))
        }
      } catch (e) {
        // Process might already be dead
      }
    }
  } catch (e) {
    // No processes found or error, continue
  }
}

// =====================================================
// PROGRESS TRACKING
// =====================================================

const PROGRESS_DIR = path.join(process.cwd(), 'data', 'task-contexts')

/**
 * Write progress to file for polling
 */
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

/**
 * Read progress from file
 */
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
  logSpawnEvent('AGENT_CONFIG', `Looking up agent config for: ${agentId}`)
  
  try {
    const configPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json')
    
    if (!fs.existsSync(configPath)) {
      logSpawnEvent('AGENT_CONFIG', `Config file not found`)
      return null
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const agents: AgentConfig[] = config.agents?.list || []
    
    const agent = agents.find(a => a.id === agentId) || null
    if (agent) {
      logSpawnEvent('AGENT_CONFIG', `Agent ${agentId} found`, { name: agent.name, model: agent.model })
    } else {
      logSpawnEvent('AGENT_CONFIG', `Agent ${agentId} NOT found`)
    }
    
    return agent
  } catch (error: any) {
    logSpawnEvent('AGENT_CONFIG', `Failed to read config`, undefined, undefined, error.message)
    return null
  }
}

/**
 * Read agent's SOUL.md for system prompt
 */
function getAgentSystemPrompt(agentId: string, agentWorkspace: string): string {
  try {
    const agentDir = path.join(agentWorkspace, agentId)
    const soulPath = path.join(agentDir, 'SOUL.md')
    
    if (fs.existsSync(soulPath)) {
      return fs.readFileSync(soulPath, 'utf-8')
    }
  } catch (error: any) {
    console.error('Failed to read SOUL.md:', error)
  }
  return `You are an OpenClaw agent named "${agentId}". Help the user complete their task.`
}

// =====================================================
// TASK CONTEXT BUILDER
// =====================================================

function buildTaskContext(
  task: any,
  agentConfig: AgentConfig,
  project?: any
): string {
  logSpawnEvent('BUILD_CONTEXT', `Building context for task ${task.id}`)
  
  const projectPath = project?.workspace || path.join(agentConfig.workspace, 'projects', task.projectId)
  const agentWorkspace = agentConfig.workspace || DEFAULT_WORKSPACE_PATH
  
  // Initialize memory if needed
  if (project) {
    initializeMemorySync(projectPath, project.name || 'Project')
  }
  
  const memoryContent = readMemorySync(projectPath)
  const formattedMemory = formatMemoryForPrompt(memoryContent)
  
  let context = `# Task Execution Context

## 🎯 Task Information
- **Task ID:** ${task.id}
- **Title:** ${task.title}
- **Description:** ${task.description || 'N/A'}
- **Priority:** ${task.priority}
- **Status:** ${task.status}

## 🤖 Your Agent Identity
- **ID:** ${agentConfig.id}
- **Name:** ${agentConfig.name}
- **Model:** ${agentConfig.model || 'default'}
- **Thinking Level:** ${agentConfig.thinking || 'medium'}

`

  // Add system prompt from SOUL.md
  const systemPrompt = getAgentSystemPrompt(agentConfig.id, agentWorkspace)
  if (systemPrompt) {
    context += `## 📋 Agent Instructions (from SOUL.md)
${systemPrompt}

`
  }

  // Add tools
  context += `## 🛠️ YOUR TOOLS AND WORKSPACE

### Available Tools
You have access to these tools:
- **write** - Create new files
- **read** - Read file contents
- **edit** - Modify existing files
- **exec** - Execute shell commands

### Workspace Location
**Your current working directory is:** 
\`\`\`
${agentWorkspace}
\`\`\`

### Project Location
**The project you are working on is at:**
\`\`\`
${projectPath}
\`\`\`

**ALL files you create or modify MUST be in the project directory above.**

### How to Use Tools

#### Creating Files
Use the write tool with the full path:
\`\`\`
write: {"file_path": "${projectPath}/filename.md", "content": "# Your content here"}
\`\`\`

#### Reading Files
\`\`\`
read: {"file_path": "${projectPath}/existing-file.md"}
\`\`\`

#### Editing Files
\`\`\`
edit: {"file_path": "${projectPath}/file.md", "old_string": "old text", "new_string": "new text"}
\`\`\`

#### Executing Commands
\`\`\`
exec: {"command": "cd ${projectPath} && ls -la"}
\`\`\`

`

  // Add project context
  if (project) {
    context += `## 📁 Project Context
- **Project ID:** ${project.id}
- **Project Name:** ${project.name}
- **Project Path:** ${projectPath}

### PROJECT.md
${project.projectInfo || '(No project info)'}

`
  }
  
  // Add memory
  const memorySection = formattedMemory ? `
## 📚 PROJECT MEMORY - READ THIS FIRST (CRITICAL)

The following contains ALL previous work on this project. 
YOU MUST READ AND UNDERSTAND THIS BEFORE STARTING.

${formattedMemory}

---
` : `
## 📚 PROJECT MEMORY
No previous memory recorded. You are starting fresh.
`

  context += memorySection

  // Add task-specific instructions
  const isPullTask = task.title?.includes('Pull') || task.description?.includes('Pull')
  
  if (isPullTask && project?.githubUrl) {
    context += `## 🔄 GIT PULL TASK

This is a **Git Pull** task. You MUST execute git pull from the repository.

### Steps:
1. Navigate to project directory: cd ${projectPath}
2. Report progress 20%: "🔄 Starting git pull..."
3. Execute: git pull origin [branch-name]
4. Report progress 60%: "✅ Pulled latest changes"
5. Check if there are any new files or changes
6. Report progress 100%: "🎉 Git pull completed"

### Commands to use:
exec: {"command": "cd ${projectPath} && git pull origin [branch]"}

If pull fails, check for merge conflicts and report them.

`
  }

  // Add task with progress reporting
  context += `## ✅ YOUR TASK

${task.description || task.title}

### Requirements
1. **DO THE ACTUAL WORK** - Don't just say you'll do it
2. **Create/modify files** using the write/edit tools
3. **Work in the project directory:** ${projectPath}
4. **Save all outputs** to files in that directory
5. **Report completion** when done (see below)

### Example: If asked to create a file
DON'T just respond with "I'll create the file". 
INSTEAD, use the write tool:
\`\`\`
write: {"file_path": "${projectPath}/HELLO.md", "content": "# Hello\\n\\nThis is the content."}
\`\`\`

## 📊 PROGRESS TRACKING (CRITICAL - DO THIS!)

You MUST report progress every 20% using the exec tool. This is REQUIRED!

### 🔧 HOW TO REPORT PROGRESS

Use the exec tool to call the progress API:

    exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/__PROJECT_ID__/tasks/__TASK_ID__/progress -H 'Content-Type: application/json' -d '{"percentage": 20, "message": "📝 กำลังสร้างไฟล์..."}'"}

Replace __PROJECT_ID__ with: ${task.projectId}
Replace __TASK_ID__ with: ${task.id}

### 📈 PROGRESS CHECKPOINTS (REQUIRED)

Report at these percentages:
- **20%** - เริ่มต้น, อ่าน context, วางแผน
- **40%** - สร้างไฟล์แรก, setup project
- **60%** - ทำงานหลัก, implement features
- **80%** - แก้ไข, finalize, test
- **100%** - เสร็จสมบูรณ์

### 📝 MESSAGE FORMAT

ใช้ emoji + คำอธิบายสั้นๆ:
- "📝 สร้าง {filename}..."
- "🔍 อ่านไฟล์ {filename}..."
- "✏️ แก้ไข {filename}..."
- "⚡ รันคำสั่ง {command}..."
- "✅ สร้าง {filename} สำเร็จ"

### 💡 COMPLETE EXAMPLE

Step 1 - เริ่มต้น:
    exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/progress -H 'Content-Type: application/json' -d '{"percentage": 20, "message": "🔍 วิเคราะห์ requirements"}'"}

Step 2 - สร้างไฟล์แรก:
    write: {"file_path": "${projectPath}/package.json", "content": "..."}
    exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/progress -H 'Content-Type: application/json' -d '{"percentage": 40, "message": "📝 สร้าง package.json"}'"}

Step 3 - ทำงานหลัก:
    write: {"file_path": "${projectPath}/index.js", "content": "..."}
    exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/progress -H 'Content-Type: application/json' -d '{"percentage": 60, "message": "📝 สร้าง index.js"}'"}

Step 4 - ทดสอบ:
    exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/progress -H 'Content-Type: application/json' -d '{"percentage": 80, "message": "✅ ทดสอบและตรวจสอบ"}'"}

Step 5 - เสร็จสมบูรณ์:
    exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/progress -H 'Content-Type: application/json' -d '{"percentage": 100, "message": "🎉 Task completed successfully"}'"}

⚠️ **IMPORTANT**: ถ้าไม่ report progress ระบบจะไม่แสดงว่าคุณทำอะไรอยู่!

## 📋 GROUND RULE: Memory Logging (MANDATORY)

**When you complete this task, you MUST provide a clear summary:**

1. **What you did** - Brief description of work completed
2. **Files changed** - List of files created/modified
3. **Key findings** - Important discoveries
4. **Decisions made** - Any choices or trade-offs
5. **Next steps** - Recommendations for future tasks

This memory will be read by future agents working on this project.

## 📤 Task Completion (REQUIRED)

When you have COMPLETED the actual work, you MUST call the complete API with detailed result:

### วิธี Complete Task:

Use exec tool to call complete API:

    exec: {"command": "curl -s -X POST http://localhost:3000/api/projects/__PROJECT_ID__/tasks/__TASK_ID__/complete -H 'Content-Type: application/json' -d '{"result": "สรุปงานที่ทำ", "artifacts": ["path/to/file"]}'"}

Replace __PROJECT_ID__ with project ID and __TASK_ID__ with task ID.

### Result Format (ตัวอย่างดี):

    ✅ สร้างระบบสุ่มตัวเลข 1-1000 สำเร็จ
    
    ไฟล์ที่สร้าง:
    - random-1-1000.js (ฟังก์ชั่นสุ่มเลข)
    
    รายละเอียด:
    - รองรับการสุ่ม 1-1000
    - มีฟังก์ชั่น randomRange()
    - ทดสอบผลลัพธ์ถูกต้อง

### Result ไม่ดี (อย่าทำแบบนี้):

    ❌ "Task completed" - ไม่มีรายละเอียด

⚠️ **ต้องส่ง result ที่มีรายละเอียด!**

The system will automatically log your completion to MEMORY.md.

---
*Task spawned at: ${new Date().toISOString()}*
*Remember: You MUST use the tools to do actual work. Don't just respond with text.*
`

  return context
}

// =====================================================
// SESSIONS SPAWN (OpenClaw Native)
// =====================================================

/**
 * Spawn sub-agent using OpenClaw sessions_spawn (native method)
 */
async function spawnViaSessions(
  task: any,
  agentConfig: AgentConfig,
  fullContext: string
): Promise<{ success: boolean; sessionKey?: string; error?: string; method?: string }> {
  
  const sessionKey = `sub-${task.id}-${Date.now()}`
  logSpawnEvent('SESSIONS_SPAWN', `Spawning via sessions_spawn for task ${task.id}`, { sessionKey })
  
  try {
    // STEP 1: Clear session locks
    await clearAgentSessionLocks(agentConfig.id)
    await killHangingAgentProcesses(agentConfig.id)
    
    // STEP 2: Write initial progress
    writeTaskProgressFile(task.id, 10, '🚀 Sub-agent starting...')
    
    // STEP 3: Write context to file (for sub-agent to read if needed)
    const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
    fs.mkdirSync(contextDir, { recursive: true })
    const contextFile = path.join(contextDir, `${task.id}-context.md`)
    fs.writeFileSync(contextFile, fullContext, 'utf-8')
    
    // STEP 4: Create progress helper script
    const progressHelperPath = path.join(contextDir, `${task.id}-progress.js`)
    const progressHelperScript = `
const fs = require('fs');
const path = require('path');
const progressFile = path.join('${contextDir}', '${task.id}.progress');
function writeProgress(pct, msg) {
  fs.writeFileSync(progressFile, JSON.stringify({
    percentage: parseInt(pct),
    message: msg,
    timestamp: Date.now()
  }));
  console.log('PROGRESS: ' + pct + '% - ' + msg);
}
const [,, pct, msg] = process.argv;
writeProgress(pct, msg);
`
    fs.writeFileSync(progressHelperPath, progressHelperScript)
    
    // STEP 5: Build the task prompt with embedded progress helper
    const taskPrompt = `${fullContext}

## 📊 PROGRESS REPORTING TOOL

You have a special tool to report progress. Use it frequently:

**Usage:**
exec: {"command": "node ${progressHelperPath} 25 \\"📝 Writing file...\\""}

**Progress checkpoints:**
- 10% - Started
- 25% - Reading/Analyzing
- 50% - Working/Implementing
- 75% - Finalizing
- 100% - Completed

Report progress after EVERY significant step!
`
    
    // STEP 6: Use sessions_spawn (via CLI for now - until we have direct API)
    // For now, we'll use exec to spawn the agent process
    const cliPath = 'openclaw'
    const promptFile = path.join(contextDir, `${task.id}-prompt.txt`)
    fs.writeFileSync(promptFile, taskPrompt, 'utf-8')
    
    const wrapperScript = `#!/bin/bash
# Background Sub-Agent Spawn Wrapper
# This script spawns agent in background and exits immediately

TASK_ID="${task.id}"
CONTEXT_FILE="${contextFile}"
PROMPT_FILE="${promptFile}"
PROGRESS_HELPER="${progressHelperPath}"
LOG_FILE="${contextDir}/${task.id}.log"
PID_FILE="${contextDir}/${task.id}.pid"

# Log start
echo "=== Sub-Agent Spawn Wrapper ===" > "$LOG_FILE"
echo "Task: $TASK_ID" >> "$LOG_FILE"
echo "Agent: ${agentConfig.id}" >> "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "PID File: $PID_FILE" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to report progress
report_progress() {
  node "$PROGRESS_HELPER" "$1" "$2" >> "$LOG_FILE" 2>&1
}

# Report initial progress
report_progress 10 "🚀 Agent initializing..."

# Create a background script that runs the agent
AGENT_SCRIPT="${contextDir}/${task.id}-agent.sh"
cat > "$AGENT_SCRIPT" << 'AGENT_EOF'
#!/bin/bash
TASK_ID="${task.id}"
LOG_FILE="${contextDir}/${task.id}.log"
PROGRESS_HELPER="${progressHelperPath}"
PROMPT_FILE="${promptFile}"

# Function to report progress
report_progress() {
  node "$PROGRESS_HELPER" "$1" "$2" >> "$LOG_FILE" 2>&1
}

# Report start
report_progress 15 "📖 Reading task context..."

# Run agent and capture output
${cliPath} agent \\
  --agent ${agentConfig.id} \\
  --message "$(cat $PROMPT_FILE)" \\
  --thinking ${agentConfig.thinking || 'medium'} \\
  --timeout ${(task.timeoutMinutes || 30) * 60} \\
  --json >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  report_progress 100 "✅ Task completed successfully"
  echo "" >> "$LOG_FILE"
  echo "=== Task Completed ===" >> "$LOG_FILE"
else
  report_progress 0 "❌ Task failed with exit code $EXIT_CODE"
  echo "" >> "$LOG_FILE"
  echo "=== Task Failed ===" >> "$LOG_FILE"
fi

exit $EXIT_CODE
AGENT_EOF

chmod +x "$AGENT_SCRIPT"

# Run agent script in background using nohup
nohup "$AGENT_SCRIPT" > /dev/null 2>&1 &
AGENT_PID=$!

# Save PID
echo $AGENT_PID > "$PID_FILE"

# Log PID
echo "Agent PID: $AGENT_PID" >> "$LOG_FILE"
echo "Wrapper exiting, agent running in background..." >> "$LOG_FILE"

# Exit immediately - parent process ends here
exit 0
`
    
    const wrapperPath = path.join(contextDir, `${task.id}-wrapper.sh`)
    fs.writeFileSync(wrapperPath, wrapperScript, 'utf-8')
    fs.chmodSync(wrapperPath, 0o755)
    
    logSpawnEvent('SESSIONS_SPAWN', `Wrapper script created: ${wrapperPath}`)
    
    // STEP 7: Execute wrapper (detached so it runs independently)
    const child = spawn('bash', [wrapperPath], {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore']
    })
    
    child.unref()
    
    logSpawnEvent('SESSIONS_SPAWN', `Agent spawned with PID: ${child.pid}`, { sessionKey })
    
    return {
      success: true,
      sessionKey,
      method: 'sessions'
    }
    
  } catch (error: any) {
    logSpawnEvent('SESSIONS_SPAWN', `Failed to spawn`, undefined, undefined, error.message)
    return {
      success: false,
      error: error.message,
      method: 'sessions'
    }
  }
}

// =====================================================
// MAIN SPAWN FUNCTION
// =====================================================

export async function spawnForTask(taskId: string): Promise<{ success: boolean; sessionKey?: string; error?: string }> {
  console.log(`[Runner] === spawnForTask called for ${taskId} ===`)
  logSpawnEvent('SPAWN_START', `=== spawnForTask called for ${taskId} ===`)
  
  const task = getTaskById(taskId)
  if (!task) {
    throw new Error(`Task ${taskId} not found`)
  }
  
  // Skip pipeline tracking tasks - they don't need agents
  if (task.title?.startsWith('🔄 [Pipeline]') && !task.description?.includes('Step ID:')) {
    console.log(`[Runner] Skipping pipeline tracking task ${taskId}`)
    logSpawnEvent('SPAWN_SKIP', `Pipeline tracking task - no agent needed`, undefined, taskId)
    // Mark as processing so it stays active while child tasks run
    updateTaskStatus(taskId, 'processing', 'Pipeline tracking - child tasks will be spawned')
    return {
      success: true,
      sessionKey: `pipeline-${taskId}`
    }
  }
  
  logSpawnEvent('SPAWN_START', `Task found`, { 
    title: task.title, 
    agentId: task.agentId, 
    status: task.status
  }, taskId)

  // Get agent config
  const agentConfig = getAgentConfig(task.agentId)
  if (!agentConfig) {
    const error = `Agent "${task.agentId}" not found in openclaw.json`
    logSpawnEvent('SPAWN_START', error, undefined, taskId, error)
    throw new Error(error)
  }
  
  logSpawnEvent('SPAWN_START', `Agent config loaded`, { 
    agentName: agentConfig.name,
    model: agentConfig.model
  }, taskId)

  // Load project context
  const projectContext = loadProjectContext(task.projectId)

  // Build context
  const fullContext = buildTaskContext(task, agentConfig, projectContext)

  // Try sessions spawn
  logSpawnEvent('SPAWN_EXEC', `Attempting sessions spawn...`, undefined, taskId)
  const spawnResult = await spawnViaSessions(task, agentConfig, fullContext)

  if (!spawnResult.success) {
    logSpawnEvent('SPAWN_EXEC', `Sessions spawn failed`, { error: spawnResult.error }, taskId)
    updateTaskStatus(taskId, 'failed', `Spawn failed: ${spawnResult.error}`)
    throw new Error(spawnResult.error || 'Failed to spawn sub-agent')
  }
  
  logSpawnEvent('SPAWN_SUCCESS', `Spawn succeeded`, { 
    sessionKey: spawnResult.sessionKey,
    method: spawnResult.method 
  }, taskId)
  
  // Update task status
  updateTaskStatus(taskId, 'processing', 'Sub-agent spawned and processing task', {
    assignedAgent: spawnResult.sessionKey
  })
  
  return {
    success: true,
    sessionKey: spawnResult.sessionKey
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function loadProjectContext(projectId: string) {
  logSpawnEvent('PROJECT_CONTEXT', `Loading project context for: ${projectId}`)
  
  const projectFromStore = store.getProjectById(projectId)
  const projectPath = projectFromStore?.workspace || projectFromStore?.path
  
  if (!projectPath || !fs.existsSync(projectPath)) {
    return undefined
  }

  const configPath = path.join(projectPath, 'PROJECT.json')
  let projectName = projectId
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      projectName = config.name || projectId
    } catch (e) {}
  }

  let projectInfo = ''
  const projectMdPath = path.join(projectPath, 'PROJECT.md')
  if (fs.existsSync(projectMdPath)) {
    projectInfo = fs.readFileSync(projectMdPath, 'utf-8')
  }

  let memory = ''
  const memoryPath = path.join(projectPath, 'MEMORY.md')
  if (fs.existsSync(memoryPath)) {
    memory = fs.readFileSync(memoryPath, 'utf-8')
  }
  
  return {
    id: projectId,
    name: projectName,
    workspace: projectPath,
    projectInfo,
    memory
  }
}

// Export writeTaskProgressFile for progress updates
export { writeTaskProgressFile }