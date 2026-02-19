/**
 * Init Task Creation - Auto-create analysis task for GitHub projects
 */

import { store, Task } from './store'
import { taskQueue } from './taskQueue'

export interface InitTaskResult {
  task: Task
  instructionFilePath: string
}

/**
 * Create an initialization task for a newly cloned GitHub project
 */
export async function createInitTask(
  projectId: string,
  projectPath: string,
  repoName: string,
  githubUrl: string,
  agentId: string
): Promise<InitTaskResult> {
  const initTaskData = {
    projectId,
    title: `🔍 Init: Analyze ${repoName}`,
    description: `Auto-generated initialization task to analyze and understand the ${repoName} project structure, technologies, and architecture.`,
    agentId: agentId,
    priority: 'high' as const,
    maxRetries: 1,
    timeoutMinutes: 10
  }
  
  // Create task via taskQueue (this also creates the instruction file)
  const task = taskQueue.createTask(initTaskData)
  
  // Build and update the instruction file with the init task prompt
  const instructionFilePath = updateInitTaskInstructionFile(task, projectPath, repoName, githubUrl)
  
  // Auto-start the task (queue it for processing)
  taskQueue.startTask(task.id)
  
  console.log(`[InitTask] Created init task ${task.id} for project ${projectId}`)
  
  return { task, instructionFilePath }
}

/**
 * Build the init task prompt content
 */
export function buildInitTaskPrompt(
  projectPath: string,
  repoName: string,
  githubUrl: string
): string {
  return `
# 🔍 CRITICAL: Project Initialization Task

## ⚠️ THIS IS MANDATORY - DO NOT SKIP ANY STEP

You MUST complete ALL steps below. The project CANNOT be used until you finish.

## Step 1: Read Existing MEMORY.md
Read the current MEMORY.md file to see what's already there.

## Step 2: Analyze Project Structure
Execute these commands to understand the project:
- ls -la (list all files)
- cat README.md (read documentation)
- cat package.json OR cat go.mod OR cat requirements.txt (find dependencies)
- Find the main entry point files

## Step 3: Create PROJECT_SUMMARY.md
Create this file at: ${projectPath}/PROJECT_SUMMARY.md

Content MUST include:
- # Project Name
- ## Overview (what this project does, 2-3 sentences)
- ## Technology Stack (languages, frameworks, databases)
- ## Project Structure (list main directories and their purposes)
- ## Key Files (entry points, config files)
- ## Dependencies (main libraries used)
- ## Setup Instructions (how to install and run)

## Step 4: Update MEMORY.md
Update ${projectPath}/MEMORY.md with:

## Recent Changes
### ${new Date().toISOString().split('T')[0]} - Init: Analyzed ${repoName}
**Agent:** Init Agent  
**Status:** ✅ Completed  
**Files Modified:**
- PROJECT_SUMMARY.md (created with full analysis)
- MEMORY.md (updated with project knowledge)

**Summary:**  
Analyzed ${repoName} project structure and technology stack.

**Key Findings:**
- [List 3-5 key technical findings]
- Technology: [what you found]
- Architecture: [what you found]
- Main purpose: [what you found]

## Context
- Current focus: Project initialized and ready for development
- Blockers: None
- Next steps: Ready for task execution

## References
- GitHub: ${githubUrl}
- PROJECT_SUMMARY.md

## Step 5: Report Completion
YOU MUST call the complete API with BOTH files as artifacts:
- ${projectPath}/PROJECT_SUMMARY.md
- ${projectPath}/MEMORY.md

## ⚠️ WARNING
If you do not create BOTH files above, the task is NOT complete.
DO NOT report completion until both files exist with proper content.

---
Task ID: {{TASK_ID}}
Created: {{CREATED_AT}}
`
}

/**
 * Update the task instruction file with init task specific content
 */
function updateInitTaskInstructionFile(
  task: Task,
  projectPath: string,
  repoName: string,
  githubUrl: string
): string {
  const fs = require('fs')
  const path = require('path')
  
  const taskInstructionsDir = path.join(process.cwd(), 'data', 'task-instructions')
  const instructionFile = path.join(taskInstructionsDir, `${task.id}.md`)
  
  // Get workspace path from project path
  const workspacePath = path.dirname(path.dirname(projectPath))
  
  const initPrompt = buildInitTaskPrompt(projectPath, repoName, githubUrl)
    .replace('{{TASK_ID}}', task.id)
    .replace('{{CREATED_AT}}', task.createdAt)
  
  const content = `# 🔍 Init Task Instructions for ${task.id}

## Task Information
- **ID:** ${task.id}
- **Project ID:** ${task.projectId}
- **Title:** ${task.title}
- **Description:** ${task.description || 'N/A'}
- **Priority:** ${task.priority}
- **Created:** ${task.createdAt}

## Workspace Context
- **Workspace Path:** ${workspacePath}
- **Project Path:** ${projectPath}
- **Current Working Directory:** You are here: ${projectPath}

## ⚡ This is an INIT Task
This is the **first task** for this GitHub project. Your analysis will establish the baseline knowledge for all future tasks.

---

${initPrompt}

---

## Available Tools
- write - Create files: write({ file_path: "${projectPath}/filename.md", content: "..." })
- read - Read files: read({ file_path: "${projectPath}/file.md" })
- edit - Edit files: edit({ file_path: "${projectPath}/file.md", old_string: "...", new_string: "..." })
- exec - Run commands: exec({ command: "cd ${projectPath} && ls -la" })

## Completion API
When done, POST to: http://localhost:3000/api/projects/${task.projectId}/tasks/${task.id}/complete
Body: { "result": "What you did", "artifacts": ["path/to/files"] }

---
Task created at: ${new Date().toISOString()}
`
  
  fs.mkdirSync(taskInstructionsDir, { recursive: true })
  fs.writeFileSync(instructionFile, content, 'utf-8')
  console.log(`[InitTask] Updated instruction file: ${instructionFile}`)
  
  return instructionFile
}

export default { createInitTask, buildInitTaskPrompt }
