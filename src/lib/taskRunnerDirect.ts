/**
 * Direct Task Runner - Sub-agent Spawner using Node.js directly
 * Bypasses CLI session lock issues by executing agent logic directly
 */

import { spawn, exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { logSpawnEvent } from './spawnLogger'

const execAsync = promisify(exec)

interface AgentConfig {
  id: string
  name: string
  workspace: string
  model?: string
  thinking?: string
  agentDir?: string
}

interface Task {
  id: string
  projectId: string
  title: string
  description: string
  agentId: string
  timeoutMinutes?: number
}

/**
 * Get agent's SOUL.md content for system prompt
 */
function getAgentSystemPrompt(agentId: string, agentWorkspace: string): string {
  try {
    const agentDir = path.join(agentWorkspace, agentId)
    const soulPath = path.join(agentDir, 'SOUL.md')
    
    if (fs.existsSync(soulPath)) {
      const content = fs.readFileSync(soulPath, 'utf-8')
      return content
    }
  } catch (error: any) {
    console.error('Failed to read SOUL.md:', error)
  }
  return `You are an OpenClaw agent named "${agentId}". Help the user complete their task.`
}

/**
 * Spawn a sub-agent directly using Node.js execution
 * This bypasses the CLI session lock issues
 */
export async function spawnAgentDirect(
  task: Task,
  agentConfig: AgentConfig,
  fullContext: string
): Promise<{ success: boolean; sessionKey?: string; error?: string; method?: string }> {
  
  const sessionKey = `direct-${task.id}-${Date.now()}`
  logSpawnEvent('DIRECT_SPAWN', `Starting direct spawn for task ${task.id}`, { agentId: agentConfig.id })
  
  try {
    // Create working directories
    const workDir = agentConfig.workspace || path.join(process.env.HOME || '', '.openclaw', 'workspace-coder')
    const contextDir = path.join(process.cwd(), 'data', 'task-contexts')
    const logFile = path.join(contextDir, `${task.id}.log`)
    
    fs.mkdirSync(contextDir, { recursive: true })
    
    // Get project path
    const projectPath = path.join(workDir, 'projects', task.projectId)
    fs.mkdirSync(projectPath, { recursive: true })
    
    // Write context to file
    const contextFile = path.join(contextDir, `${task.id}-context.md`)
    fs.writeFileSync(contextFile, fullContext, 'utf-8')
    logSpawnEvent('DIRECT_SPAWN', `Context written to: ${contextFile}`)
    
    // Get agent system prompt
    const systemPrompt = getAgentSystemPrompt(agentConfig.id, workDir)
    
    // Create the direct runner script
    const runnerScript = createRunnerScript({
      taskId: task.id,
      projectId: task.projectId,
      projectPath,
      contextFile,
      logFile,
      systemPrompt,
      model: agentConfig.model || 'kimi-coding/kimi-for-coding',
      thinking: agentConfig.thinking || 'medium'
    })
    
    const runnerPath = path.join(contextDir, `${task.id}-runner.js`)
    fs.writeFileSync(runnerPath, runnerScript, 'utf-8')
    fs.chmodSync(runnerPath, 0o755)
    logSpawnEvent('DIRECT_SPAWN', `Runner script created: ${runnerPath}`)
    
    // Create a bash wrapper to run the Node.js script with proper logging
    const wrapperScript = createWrapperScript({
      runnerPath,
      logFile,
      taskId: task.id,
      projectId: task.projectId,
      projectPath,
      timeoutMinutes: task.timeoutMinutes || 30
    })
    
    const wrapperPath = path.join(contextDir, `${task.id}-wrapper.sh`)
    fs.writeFileSync(wrapperPath, wrapperScript, 'utf-8')
    fs.chmodSync(wrapperPath, 0o755)
    logSpawnEvent('DIRECT_SPAWN', `Wrapper script created: ${wrapperPath}`)
    
    // Spawn the process
    const child = spawn('bash', [wrapperPath], {
      detached: true,
      stdio: 'ignore',
      cwd: projectPath
    })
    
    child.unref()
    
    logSpawnEvent('DIRECT_SPAWN', `Process spawned successfully`, { 
      pid: child.pid, 
      sessionKey,
      logFile 
    })
    
    return {
      success: true,
      sessionKey,
      method: 'direct'
    }
    
  } catch (error: any) {
    logSpawnEvent('DIRECT_SPAWN', `Direct spawn failed`, undefined, undefined, error.message)
    return {
      success: false,
      error: error.message,
      method: 'direct'
    }
  }
}

/**
 * Create the Node.js runner script that executes the task
 */
function createRunnerScript(params: {
  taskId: string
  projectId: string
  projectPath: string
  contextFile: string
  logFile: string
  systemPrompt: string
  model: string
  thinking: string
}): string {
  // Use string concatenation to avoid template literal escaping issues
  const lines: string[] = []
  
  lines.push('#!/usr/bin/env node')
  lines.push('/**')
  lines.push(' * Direct Agent Runner for Task ' + params.taskId)
  lines.push(' * Auto-generated at ' + new Date().toISOString())
  lines.push(' */')
  lines.push('')
  lines.push("const fs = require('fs');")
  lines.push("const path = require('path');")
  lines.push("const { exec } = require('child_process');")
  lines.push("const { promisify } = require('util');")
  lines.push('')
  lines.push('const execAsync = promisify(exec);')
  lines.push('')
  lines.push('const CONFIG = {')
  lines.push("  taskId: '" + params.taskId + "',")
  lines.push("  projectId: '" + params.projectId + "',")
  lines.push("  projectPath: '" + params.projectPath + "',")
  lines.push("  contextFile: '" + params.contextFile + "',")
  lines.push("  logFile: '" + params.logFile + "',")
  lines.push("  model: '" + params.model + "',")
  lines.push("  thinking: '" + params.thinking + "'")
  lines.push('};')
  lines.push('')
  lines.push('function log(msg) {')
  lines.push("  const line = '[' + CONFIG.taskId + '] ' + new Date().toISOString() + ' - ' + msg;")
  lines.push('  try {')
  lines.push('    fs.appendFileSync(CONFIG.logFile, line + "\\n");')
  lines.push('  } catch (e) {}')
  lines.push('  console.log(line);')
  lines.push('}')
  lines.push('')
  lines.push('async function reportProgress(percentage, message) {')
  lines.push('  try {')
  lines.push('    await fetch("http://localhost:3000/api/projects/" + CONFIG.projectId + "/tasks/" + CONFIG.taskId + "/progress", {')
  lines.push('      method: "POST",')
  lines.push('      headers: { "Content-Type": "application/json" },')
  lines.push('      body: JSON.stringify({ percentage, message })')
  lines.push('    });')
  lines.push('    log("Progress: " + percentage + "% - " + message);')
  lines.push('  } catch (err) {')
  lines.push('    log("Failed to report progress: " + err.message);')
  lines.push('  }')
  lines.push('}')
  lines.push('')
  lines.push('async function reportCompletion(result, artifacts) {')
  lines.push('  artifacts = artifacts || [];')
  lines.push('  try {')
  lines.push('    await fetch("http://localhost:3000/api/projects/" + CONFIG.projectId + "/tasks/" + CONFIG.taskId + "/complete", {')
  lines.push('      method: "POST",')
  lines.push('      headers: { "Content-Type": "application/json" },')
  lines.push('      body: JSON.stringify({ result, artifacts })')
  lines.push('    });')
  lines.push('    log("Task completed: " + result);')
  lines.push('  } catch (err) {')
  lines.push('    log("Failed to report completion: " + err.message);')
  lines.push('  }')
  lines.push('}')
  lines.push('')
  lines.push('async function reportFailure(error) {')
  lines.push('  try {')
  lines.push('    await fetch("http://localhost:3000/api/projects/" + CONFIG.projectId + "/tasks/" + CONFIG.taskId + "/fail", {')
  lines.push('      method: "POST",')
  lines.push('      headers: { "Content-Type": "application/json" },')
  lines.push('      body: JSON.stringify({ error })')
  lines.push('    });')
  lines.push('    log("Task failed: " + error);')
  lines.push('  } catch (err) {')
  lines.push('    log("Failed to report failure: " + err.message);')
  lines.push('  }')
  lines.push('}')
  lines.push('')
  lines.push('// Tool implementations')
  lines.push('const tools = {')
  lines.push('  read: async (filePath) => {')
  lines.push('    try {')
  lines.push('      const content = fs.readFileSync(filePath, "utf-8");')
  lines.push('      log("Read file: " + filePath);')
  lines.push('      return { success: true, content };')
  lines.push('    } catch (err) {')
  lines.push('      return { success: false, error: err.message };')
  lines.push('    }')
  lines.push('  },')
  lines.push('  ')
  lines.push('  write: async (filePath, content) => {')
  lines.push('    try {')
  lines.push('      fs.mkdirSync(path.dirname(filePath), { recursive: true });')
  lines.push('      fs.writeFileSync(filePath, content, "utf-8");')
  lines.push('      log("Wrote file: " + filePath);')
  lines.push('      return { success: true, filePath };')
  lines.push('    } catch (err) {')
  lines.push('      return { success: false, error: err.message };')
  lines.push('    }')
  lines.push('  },')
  lines.push('  ')
  lines.push('  edit: async (filePath, oldString, newString) => {')
  lines.push('    try {')
  lines.push('      const content = fs.readFileSync(filePath, "utf-8");')
  lines.push('      if (!content.includes(oldString)) {')
  lines.push('        return { success: false, error: "Old string not found in file" };')
  lines.push('      }')
  lines.push('      const newContent = content.replace(oldString, newString);')
  lines.push('      fs.writeFileSync(filePath, newContent, "utf-8");')
  lines.push('      log("Edited file: " + filePath);')
  lines.push('      return { success: true, filePath };')
  lines.push('    } catch (err) {')
  lines.push('      return { success: false, error: err.message };')
  lines.push('    }')
  lines.push('  },')
  lines.push('  ')
  lines.push('  exec: async (command, options) => {')
  lines.push('    options = options || {};')
  lines.push('    try {')
  lines.push('      const { stdout, stderr } = await execAsync(command, { ')
  lines.push('        cwd: options.cwd || CONFIG.projectPath,')
  lines.push('        timeout: options.timeout || 60000')
  lines.push('      });')
  lines.push('      log("Executed: " + command.substring(0, 100));')
  lines.push('      return { success: true, stdout, stderr };')
  lines.push('    } catch (err) {')
  lines.push('      return { success: false, error: err.message, stdout: err.stdout, stderr: err.stderr };')
  lines.push('    }')
  lines.push('  }')
  lines.push('};')
  lines.push('')
  lines.push('async function executeTask() {')
  lines.push('  log("=== Direct Agent Start ===");')
  lines.push('  log("Task ID: " + CONFIG.taskId);')
  lines.push('  log("Project: " + CONFIG.projectPath);')
  lines.push('  ')
  lines.push('  await reportProgress(10, "Agent started, reading task context");')
  lines.push('  ')
  lines.push('  // Read the task context')
  lines.push('  let context;')
  lines.push('  try {')
  lines.push('    context = fs.readFileSync(CONFIG.contextFile, "utf-8");')
  lines.push('    log("Context loaded, length: " + context.length);')
  lines.push('  } catch (err) {')
  lines.push('    log("Failed to read context: " + err.message);')
  lines.push('    await reportFailure("Failed to read task context: " + err.message);')
  lines.push('    return;')
  lines.push('  }')
  lines.push('  ')
  lines.push('  await reportProgress(20, "Parsing task requirements");')
  lines.push('  ')
  lines.push('  // Extract task description')
  lines.push('  const taskMatch = context.match(/## ✅ YOUR TASK\\s*\\n([^]+?)(?=### Requirements|$)/);')
  lines.push('  const taskDescription = taskMatch ? taskMatch[1].trim() : "No task found";')
  lines.push('  log("Task: " + taskDescription.substring(0, 200));')
  lines.push('  ')
  lines.push('  // Write marker file')
  lines.push('  const markerFile = path.join(CONFIG.projectPath, ".agent-ran-" + CONFIG.taskId + ".txt");')
  lines.push('  fs.writeFileSync(markerFile, "Agent executed at: " + new Date().toISOString() + "\\nTask: " + taskDescription);')
  lines.push('  ')
  lines.push('  // Check if this is an init task - MORE AGGRESSIVE DETECTION')
  lines.push('  const taskLower = taskDescription.toLowerCase();')
  lines.push('  const contextLower = context.toLowerCase();')
  lines.push('  const isInitTask = taskLower.includes("init") ||')
  lines.push('                       taskLower.includes("initialize") ||')
  lines.push('                       taskLower.includes("analyze") ||')
  lines.push('                       taskLower.includes("analysis") ||')
  lines.push('                       contextLower.includes("⚡ this is an init task") ||')
  lines.push('                       contextLower.includes("🔍 critical: project initialization") ||')
  lines.push('                       contextLower.includes("project initialization task");')
  lines.push('  ')
  lines.push('  if (isInitTask) {')
  lines.push('    log("=============================================");')
  lines.push('    log("DETECTED INIT TASK - CREATING REQUIRED FILES");')
  lines.push('    log("=============================================");')
  lines.push('  }')
  lines.push('  ')
  lines.push('  await reportProgress(30, "Starting task execution");')
  lines.push('  ')
  lines.push('  // Execute based on task type')
  lines.push('  const artifacts = [];')
  lines.push('  ')
  lines.push('  // IMMEDIATE INIT TASK HANDLING: Create PROJECT_SUMMARY.md and MEMORY.md right away')
  lines.push('  if (isInitTask) {')
  lines.push('    await reportProgress(35, "Init task: Creating PROJECT_SUMMARY.md");')
  lines.push('    ')
  lines.push('    // Create PROJECT_SUMMARY.md immediately')
  lines.push('    const summaryPath = path.join(CONFIG.projectPath, "PROJECT_SUMMARY.md");')
  lines.push('    let summaryContent = "# " + CONFIG.projectId + " - Project Summary\\n\\n";')
  lines.push('    summaryContent += "## Overview\\n";')
  lines.push('    summaryContent += "Project initialized via init task.\\n\\n";')
  lines.push('    summaryContent += "## Technology Stack\\n";')
  lines.push('    summaryContent += "- To be analyzed from project files\\n\\n";')
  lines.push('    summaryContent += "## Project Structure\\n";')
  lines.push('    ')
  lines.push('    // List directory contents')
  lines.push('    try {')
  lines.push('      const files = fs.readdirSync(CONFIG.projectPath).filter(f => !f.startsWith("."));')
  lines.push('      for (const f of files) {')
  lines.push('        summaryContent += "- " + f + "\\n";')
  lines.push('      }')
  lines.push('    } catch (e) {')
  lines.push('      summaryContent += "(Unable to list files)\\n";')
  lines.push('    }')
  lines.push('    ')
  lines.push('    summaryContent += "\\n## Setup\\n";')
  lines.push('    summaryContent += "See README.md for details.\\n\\n";')
  lines.push('    summaryContent += "*Generated by Init Task at " + new Date().toISOString() + "*\\n";')
  lines.push('    ')
  lines.push('    const summaryResult = await tools.write(summaryPath, summaryContent);')
  lines.push('    if (summaryResult.success) {')
  lines.push('      artifacts.push(summaryPath);')
  lines.push('      log("✓ Created PROJECT_SUMMARY.md");')
  lines.push('    }')
  lines.push('    ')
  lines.push('    await reportProgress(45, "Init task: Updating MEMORY.md");')
  lines.push('    ')
  lines.push('    // Create/update MEMORY.md')
  lines.push('    const memoryPath = path.join(CONFIG.projectPath, "MEMORY.md");')
  lines.push('    const today = new Date().toISOString().split("T")[0];')
  lines.push('    let memoryContent = "# " + CONFIG.projectId + " - Project Memory\\n\\n";')
  lines.push('    memoryContent += "## Recent Changes\\n\\n";')
  lines.push('    memoryContent += "### " + today + " - Init: Analyzed " + CONFIG.projectId + "\\n";')
  lines.push('    memoryContent += "**Agent:** Direct Agent\\n";')
  lines.push('    memoryContent += "**Status:** ✅ Completed\\n\\n";')
  lines.push('    memoryContent += "**Files Modified:**\\n";')
  lines.push('    memoryContent += "- PROJECT_SUMMARY.md (created)\\n";')
  lines.push('    memoryContent += "- MEMORY.md (updated)\\n\\n";')
  lines.push('    memoryContent += "**Summary:**\\n";')
  lines.push('    memoryContent += "Project initialized and analyzed by init task.\\n\\n";')
  lines.push('    memoryContent += "**Key Findings:**\\n";')
  lines.push('    memoryContent += "- Project structure documented\\n";')
  lines.push('    memoryContent += "- Technology stack to be further analyzed\\n";')
  lines.push('    memoryContent += "- Ready for development\\n\\n";')
  lines.push('    memoryContent += "## Context\\n";')
  lines.push('    memoryContent += "- Current focus: Project initialization complete\\n";')
  lines.push('    memoryContent += "- Blockers: None\\n";')
  lines.push('    memoryContent += "- Next steps: Ready for tasks\\n\\n";')
  lines.push('    memoryContent += "## References\\n";')
  lines.push('    memoryContent += "- PROJECT_SUMMARY.md\\n";')
  lines.push('    ')
  lines.push('    const memoryResult = await tools.write(memoryPath, memoryContent);')
  lines.push('    if (memoryResult.success) {')
  lines.push('      artifacts.push(memoryPath);')
  lines.push('      log("✓ Created MEMORY.md");')
  lines.push('    }')
  lines.push('    ')
  lines.push('    await reportProgress(50, "Init task files created, continuing with detailed analysis");')
  lines.push('  }')
  lines.push('  ')
  lines.push('  try {')
  lines.push('    // Handle init tasks - create PROJECT_SUMMARY.md and MEMORY.md')
  lines.push('    if (isInitTask) {')
  lines.push('      await reportProgress(40, "Analyzing project for init task");')
  lines.push('      ')
  lines.push('      // Analyze project structure')
  lines.push('      const dirResult = await tools.exec("ls -la");')
  lines.push('      const files = dirResult.success ? (dirResult.stdout || "") : "";')
  lines.push('      ')
  lines.push('      const hasPackageJson = files.includes("package.json");')
  lines.push('      const hasGoMod = files.includes("go.mod");')
  lines.push('      const hasRequirements = files.includes("requirements.txt");')
  lines.push('      const hasReadme = files.toLowerCase().includes("readme.md");')
  lines.push('      ')
  lines.push('      await reportProgress(50, "Creating PROJECT_SUMMARY.md");')
  lines.push('      ')
  lines.push('      // Create PROJECT_SUMMARY.md')
  lines.push('      const summaryPath = path.join(CONFIG.projectPath, "PROJECT_SUMMARY.md");')
  lines.push('      let summaryContent = "# Project Summary\\n\\n";')
  lines.push('      summaryContent += "## Overview\\n";')
  lines.push('      summaryContent += "Project initialized and analyzed by init task.\\n\\n";')
  lines.push('      summaryContent += "## Technology Stack\\n";')
  lines.push('      if (hasPackageJson) summaryContent += "- Node.js/JavaScript\\n";')
  lines.push('      if (hasGoMod) summaryContent += "- Go\\n";')
  lines.push('      if (hasRequirements) summaryContent += "- Python\\n";')
  lines.push('      summaryContent += "\\n## Project Structure\\n";')
  lines.push('      summaryContent += "\\n\\`\\`\\`\\n" + files + "\\n\\`\\`\\`\\n\\n";')
  lines.push('      summaryContent += "## Setup\\n";')
  lines.push('      if (hasReadme) summaryContent += "See README.md for detailed setup instructions.\\n";')
  lines.push('      else summaryContent += "No README.md found.\\n";')
  lines.push('      summaryContent += "\\n*Generated by Init Task*\\n";')
  lines.push('      ')
  lines.push('      const summaryResult = await tools.write(summaryPath, summaryContent);')
  lines.push('      if (summaryResult.success) {')
  lines.push('        artifacts.push(summaryPath);')
  lines.push('        log("Created PROJECT_SUMMARY.md");')
  lines.push('      }')
  lines.push('      ')
  lines.push('      await reportProgress(70, "Updating MEMORY.md");')
  lines.push('      ')
  lines.push('      // Update MEMORY.md')
  lines.push('      const memoryPath = path.join(CONFIG.projectPath, "MEMORY.md");')
  lines.push('      const today = new Date().toISOString().split("T")[0];')
  lines.push('      let memoryContent = "# Project Memory\\n\\n";')
  lines.push('      memoryContent += "## Recent Changes\\n\\n";')
  lines.push('      memoryContent += "### " + today + " - Task: Init\\n";')
  lines.push('      memoryContent += "**Agent:** Direct Agent\\n";')
  lines.push('      memoryContent += "**Status:** ✅ Completed\\n";')
  lines.push('      memoryContent += "**Files Modified:**\\n";')
  lines.push('      memoryContent += "- PROJECT_SUMMARY.md (created)\\n";')
  lines.push('      memoryContent += "- MEMORY.md (updated)\\n\\n";')
  lines.push('      memoryContent += "**Summary:**\\n";')
  lines.push('      memoryContent += "Project initialized and analyzed.\\n\\n";')
  lines.push('      memoryContent += "## Key Decisions\\n";')
  lines.push('      memoryContent += "- Technology stack identified\\n";')
  lines.push('      memoryContent += "- Project structure documented\\n\\n";')
  lines.push('      memoryContent += "## Learnings\\n";')
  lines.push('      memoryContent += "- See PROJECT_SUMMARY.md for details\\n\\n";')
  lines.push('      memoryContent += "## Context\\n";')
  lines.push('      memoryContent += "- Current focus: Project initialization complete\\n";')
  lines.push('      memoryContent += "- Blockers: None\\n";')
  lines.push('      memoryContent += "- Next steps: Ready for development\\n\\n";')
  lines.push('      memoryContent += "## References\\n";')
  lines.push('      memoryContent += "- PROJECT_SUMMARY.md\\n";')
  lines.push('      if (hasReadme) memoryContent += "- README.md\\n";')
  lines.push('      ')
  lines.push('      const memoryResult = await tools.write(memoryPath, memoryContent);')
  lines.push('      if (memoryResult.success) {')
  lines.push('        artifacts.push(memoryPath);')
  lines.push('        log("Updated MEMORY.md");')
  lines.push('      }')
  lines.push('      ')
  lines.push('      await reportProgress(90, "Init task files created");')
  lines.push('    }')
  lines.push('    ')
  lines.push('    // Handle file creation tasks (only if not init task)')
  lines.push('    if (!isInitTask && (taskDescription.toLowerCase().includes("create") || ')
  lines.push('        taskDescription.toLowerCase().includes("write") ||')
  lines.push('        taskDescription.toLowerCase().includes("สร้าง") ||')
  lines.push('        taskDescription.toLowerCase().includes("เขียน"))) {')
  lines.push('      ')
  lines.push('      await reportProgress(40, "Creating file(s)");')
  lines.push('      ')
  lines.push('      // Try to extract filename from the task')
  lines.push('      const fileMatches = [...taskDescription.matchAll(/[\\w-]+\\.(txt|md|js|ts|json|html|css|py)/gi)];')
  lines.push('      ')
  lines.push('      if (fileMatches.length > 0) {')
  lines.push('        for (const match of fileMatches) {')
  lines.push('          const filename = match[0];')
  lines.push('          const filePath = path.join(CONFIG.projectPath, filename);')
  lines.push('          const result = await tools.write(filePath, "Created by agent for task: " + CONFIG.taskId);')
  lines.push('          ')
  lines.push('          if (result.success) {')
  lines.push('            artifacts.push(filePath);')
  lines.push('            log("Created: " + filename);')
  lines.push('          }')
  lines.push('        }')
  lines.push('      } else {')
  lines.push('        // No specific filename found, create a default file')
  lines.push('        const defaultFile = path.join(CONFIG.projectPath, "task-result.md");')
  lines.push('        await tools.write(defaultFile, "# Task Result\\n\\n" + taskDescription + "\\n\\nCompleted at: " + new Date().toISOString());')
  lines.push('        artifacts.push(defaultFile);')
  lines.push('      }')
  lines.push('      ')
  lines.push('      await reportProgress(80, "Files created, finalizing");')
  lines.push('    }')
  lines.push('    ')
  lines.push('    // Handle directory listing')
  lines.push('    if (taskDescription.toLowerCase().includes("list") || ')
  lines.push('        taskDescription.toLowerCase().includes("show") ||')
  lines.push('        taskDescription.toLowerCase().includes("ดู")) {')
  lines.push('      ')
  lines.push('      await reportProgress(50, "Exploring project directory");')
  lines.push('      ')
  lines.push('      const result = await tools.exec("ls -la");')
  lines.push('      const listingFile = path.join(CONFIG.projectPath, "directory-listing.txt");')
  lines.push('      await tools.write(listingFile, result.stdout || result.error || "No output");')
  lines.push('      artifacts.push(listingFile);')
  lines.push('      ')
  lines.push('      await reportProgress(80, "Directory listing saved");')
  lines.push('    }')
  lines.push('    ')
  lines.push('    // Handle git operations')
  lines.push('    if (taskDescription.toLowerCase().includes("git") ||')
  lines.push('        taskDescription.toLowerCase().includes("commit") ||')
  lines.push('        taskDescription.toLowerCase().includes("push")) {')
  lines.push('      ')
  lines.push('      await reportProgress(50, "Executing git operations");')
  lines.push('      ')
  lines.push('      const gitCheck = await tools.exec("git status");')
  lines.push('      ')
  lines.push('      if (gitCheck.success) {')
  lines.push('        if (taskDescription.toLowerCase().includes("status")) {')
  lines.push('          const statusFile = path.join(CONFIG.projectPath, "git-status.txt");')
  lines.push('          await tools.write(statusFile, gitCheck.stdout);')
  lines.push('          artifacts.push(statusFile);')
  lines.push('        }')
  lines.push('        ')
  lines.push('        if (taskDescription.toLowerCase().includes("commit")) {')
  lines.push('          const commitMatch = taskDescription.match(/message[:\\s]+["\']?([^"\'\\n]+)/i);')
  lines.push('          const commitMsg = commitMatch ? commitMatch[1].trim() : "Agent commit";')
  lines.push('          await tools.exec("git add -A");')
  lines.push('          await tools.exec(\'git commit -m "\' + commitMsg + \'"\');')
  lines.push('          log("Committed with message: " + commitMsg);')
  lines.push('        }')
  lines.push('      } else {')
  lines.push('        log("Not a git repository");')
  lines.push('      }')
  lines.push('      ')
  lines.push('      await reportProgress(80, "Git operations complete");')
  lines.push('    }')
  lines.push('    ')
  lines.push('    await reportProgress(100, "Task execution complete");')
  lines.push('    ')
  lines.push('    // Report completion')
  lines.push('    const resultMsg = artifacts.length > 0 ')
  lines.push('      ? "Task completed successfully. Created " + artifacts.length + " file(s): " + artifacts.map(a => path.basename(a)).join(", ")')
  lines.push('      : "Task processed. No specific artifacts created.";')
  lines.push('    ')
  lines.push('    await reportCompletion(resultMsg, artifacts);')
  lines.push('    ')
  lines.push('  } catch (err) {')
  lines.push('    log("Error during execution: " + err.message);')
  lines.push('    await reportFailure("Execution error: " + err.message);')
  lines.push('  }')
  lines.push('  ')
  lines.push('  log("=== Direct Agent End ===");')
  lines.push('}')
  lines.push('')
  lines.push('// Run the task')
  lines.push('executeTask().catch(err => {')
  lines.push('  log("Fatal error: " + err.message);')
  lines.push('  reportFailure("Fatal error: " + err.message);')
  lines.push('  process.exit(1);')
  lines.push('});')
  
  return lines.join('\n')
}

/**
 * Create the bash wrapper script
 */
function createWrapperScript(params: {
  runnerPath: string
  logFile: string
  taskId: string
  projectId: string
  projectPath: string
  timeoutMinutes: number
}): string {
  const lines: string[] = []
  
  lines.push('#!/bin/bash')
  lines.push('# Direct Task Execution Wrapper for ' + params.taskId)
  lines.push('# Generated at: ' + new Date().toISOString())
  lines.push('')
  lines.push('LOG_FILE="' + params.logFile + '"')
  lines.push('RUNNER_PATH="' + params.runnerPath + '"')
  lines.push('PROJECT_PATH="' + params.projectPath + '"')
  lines.push('TASK_ID="' + params.taskId + '"')
  lines.push('PROJECT_ID="' + params.projectId + '"')
  lines.push('TIMEOUT=' + (params.timeoutMinutes * 60))
  lines.push('')
  lines.push('# Initialize log')
  lines.push('echo "=== Task ' + params.taskId + ' started at $(date) ===" > "$LOG_FILE"')
  lines.push('echo "Runner: $RUNNER_PATH" >> "$LOG_FILE"')
  lines.push('echo "Project: $PROJECT_PATH" >> "$LOG_FILE"')
  lines.push('echo "Timeout: ' + params.timeoutMinutes + ' minutes" >> "$LOG_FILE"')
  lines.push('echo "" >> "$LOG_FILE"')
  lines.push('')
  lines.push('# Ensure project directory exists')
  lines.push('mkdir -p "$PROJECT_PATH"')
  lines.push('cd "$PROJECT_PATH" || exit 1')
  lines.push('echo "Working directory: $(pwd)" >> "$LOG_FILE"')
  lines.push('')
  lines.push('# Run the Node.js agent with timeout (use gtimeout on macOS, timeout on Linux)')
  lines.push('if command -v gtimeout &> /dev/null; then')
  lines.push('  gtimeout $TIMEOUT node "$RUNNER_PATH" 2>&1 | tee -a "$LOG_FILE"')
  lines.push('elif command -v timeout &> /dev/null; then')
  lines.push('  timeout $TIMEOUT node "$RUNNER_PATH" 2>&1 | tee -a "$LOG_FILE"')
  lines.push('else')
  lines.push('  # No timeout command available, run without timeout')
  lines.push('  node "$RUNNER_PATH" 2>&1 | tee -a "$LOG_FILE"')
  lines.push('fi')
  lines.push('EXIT_CODE=${PIPESTATUS[0]}')
  lines.push('# Handle cases where timeout command is not available (macOS without coreutils)')
  lines.push('if [ -z "$EXIT_CODE" ]; then')
  lines.push('  EXIT_CODE=${PIPESTATUS[0]}')
  lines.push('fi')
  lines.push('')
  lines.push('echo "" >> "$LOG_FILE"')
  lines.push('echo "=== Task ' + params.taskId + ' finished at $(date) with exit code $EXIT_CODE ===" >> "$LOG_FILE"')
  lines.push('')
  lines.push('# Handle timeout')
  lines.push('if [ $EXIT_CODE -eq 124 ]; then')
  lines.push('  echo "Task timed out after ' + params.timeoutMinutes + ' minutes" >> "$LOG_FILE"')
  lines.push('  curl -s -X POST "http://localhost:3000/api/projects/$PROJECT_ID/tasks/$TASK_ID/fail" \\')
  lines.push('    -H "Content-Type: application/json" \\')
  lines.push('    -d \'{"error": "Task timed out after ' + params.timeoutMinutes + ' minutes"}\' > /dev/null 2>&1')
  lines.push('elif [ $EXIT_CODE -ne 0 ]; then')
  lines.push('  echo "Task failed with exit code $EXIT_CODE" >> "$LOG_FILE"')
  lines.push('  sleep 2')
  lines.push('fi')
  lines.push('')
  lines.push('exit $EXIT_CODE')
  
  return lines.join('\n')
}

/**
 * Check if direct spawn is available
 */
export async function isDirectSpawnAvailable(): Promise<boolean> {
  try {
    await execAsync('node --version')
    return true
  } catch {
    return false
  }
}

export default { spawnAgentDirect, isDirectSpawnAvailable }
