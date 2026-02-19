import { NextResponse } from 'next/server'
import { taskQueue, Task } from '@/lib/taskQueue'
import { store } from '@/lib/store'
import { getAuthStatus, getProjectEffectiveAuth, testAuth, decryptCredential } from '@/lib/gitAuth'
import { EncryptedData } from '@/types/gitAuth'
import { GitAuthConfig, GitAuthMethod } from '@/types/gitAuth'
import fs from 'fs'

export interface GitPushTaskResult {
  success: boolean
  task?: Task
  error?: string
}

/**
 * Build the git commit instructions for the sub-agent
 * Includes authentication configuration
 */
function buildGitCommitPrompt(
  project: { id: string; name: string; workspace?: string; path?: string },
  task: Task,
  authConfig: GitAuthConfig | null,
  authStatus: { configured: boolean; method: GitAuthMethod; provider: string }
): string {
  const projectPath = project.workspace || project.path || ''
  
  // Get artifacts/files created by the task
  const artifacts = task.artifacts || []
  const artifactList = artifacts.length > 0 
    ? artifacts.map(a => `- ${a}`).join('\n')
    : '- (All modified files in the project)'

  // Build the file list for git add command
  const filesToAdd = artifacts.length > 0
    ? artifacts.map(a => `"${a}"`).join(' ')
    : '.'

  // Clean task title for commit message
  const cleanTitle = task.title.replace(/"/g, '\\"').substring(0, 50)
  const commitMessage = `${cleanTitle} - ${task.id.substring(0, 8)}`

  // Build auth instructions
  let authInstructions = ''
  let authWarning = ''
  
  if (authStatus.configured && authConfig) {
    authInstructions = `
## 🔐 Git Authentication Configuration

**Method:** ${authConfig.method.toUpperCase()}  
**Provider:** ${authConfig.provider}

### Authentication Steps

Before pushing, ensure authentication is configured:
`
    
    switch (authConfig.method) {
      case 'pat':
        authInstructions += `
1. **Check current remote URL:**
   \`\`\`bash
   cd "${projectPath}" && git remote -v
   \`\`\`

2. **Update remote to use HTTPS with PAT:**
   - Extract the owner/repo from the current remote URL
   - Update remote: \`git remote set-url origin https://[TOKEN]@${authConfig.provider}.com/[owner]/[repo].git\`
   - Or use: \`git remote set-url origin https://${authConfig.provider}.com/[owner]/[repo].git\`
   
   Note: Git credential helper should handle the token automatically.
`
        break
        
      case 'ssh':
        if (authConfig.ssh) {
          authInstructions += `
1. **Check current remote URL:**
   \`\`\`bash
   cd "${projectPath}" && git remote -v
   \`\`\`

2. **Ensure remote uses SSH format:**
   - Should be: \`git@${authConfig.provider}.com:[owner]/[repo].git\`
   - If using HTTPS, convert: \`git remote set-url origin git@${authConfig.provider}.com:[owner]/[repo].git\`

3. **SSH Key Info:**
   - Private Key: ${authConfig.ssh.privateKeyPath}
   - Public Key: ${authConfig.ssh.publicKeyPath}
`
        }
        break
        
      case 'oauth':
        authInstructions += `
1. **Check current remote URL:**
   \`\`\`bash
   cd "${projectPath}" && git remote -v
   \`\`\`

2. **Update remote to use HTTPS with OAuth:**
   - Update remote: \`git remote set-url origin https://[OAUTH_TOKEN]@${authConfig.provider}.com/[owner]/[repo].git\`
   - Or use: \`git remote set-url origin https://${authConfig.provider}.com/[owner]/[repo].git\`
`
        break
    }
  } else {
    authWarning = `
⚠️ **WARNING: No Git Authentication Configured**

Push may fail due to authentication issues. 
Configure authentication at: /settings/git-auth

If push fails, report the specific authentication error.
`
  }

  return `## 🚀 Git Commit and Push Task

**Original Task:** ${task.title}  
**Task ID:** ${task.id}
${authWarning}

### Files to Commit
${artifactList}

### Your Mission
Commit and push all changes from the original task to the remote repository.
${authInstructions}

### Standard Git Workflow

1. **Check git status** in the project directory:
   \`\`\`bash
   cd "${projectPath}" && git status
   \`\`\`

2. **Configure git user** (if not already configured):
   \`\`\`bash
   cd "${projectPath}" && git config user.email "openclaw@local" && git config user.name "OpenClaw"
   \`\`\`

3. **Stage the files**:
   \`\`\`bash
   cd "${projectPath}" && git add ${filesToAdd}
   \`\`\`
   Or stage all changes:
   \`\`\`bash
   cd "${projectPath}" && git add .
   \`\`\`

4. **Create commit** with a descriptive message:
   \`\`\`bash
   cd "${projectPath}" && git commit -m "${commitMessage}"
   \`\`\`

5. **Push to remote**:
   \`\`\`bash
   cd "${projectPath}" && git push origin $(git branch --show-current)
   \`\`\`

6. **Verify success** - Check that push completed and get the commit hash:
   \`\`\`bash
   cd "${projectPath}" && git log -1 --oneline
   \`\`\`

### Error Handling

If you encounter errors:

- **Git not initialized?** → Run \`git init\` first, then add remote
- **No remote configured?** → Check with \`git remote -v\` and add if needed
- **Authentication issues?** → 
  - Report the specific error message
  - Check if authentication is configured at /settings/git-auth
  - For HTTPS: Check if token is valid
  - For SSH: Check if key is loaded (\`ssh-add -l\`)
- **Merge conflicts?** → Report and ask for help

### Success Criteria

✅ Changes staged and committed  
✅ Pushed to remote repository  
✅ Commit hash obtained  

Report back the commit hash and branch name when done!
`
}

/**
 * Create a new git push task based on an original task
 */
async function createGitPushTask(
  projectId: string,
  originalTask: Task,
  authConfig: GitAuthConfig | null,
  authStatus: { configured: boolean; method: GitAuthMethod; provider: string }
): Promise<GitPushTaskResult> {
  try {
    // Get project info
    const project = store.getProjectById(projectId)
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Build the git commit instructions with auth
    const gitInstructions = buildGitCommitPrompt(project, originalTask, authConfig, authStatus)

    // Create the git push task
    const gitTask = taskQueue.createTask({
      projectId,
      title: `Git Commit/Push: ${originalTask.title}`,
      description: `Auto-commit and push changes from task ${originalTask.id}\n\n${gitInstructions}`,
      agentId: project.agentId,
      priority: 'medium',
      maxRetries: 1,
      timeoutMinutes: 10
    })

    return { success: true, task: gitTask }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// POST /api/projects/[id]/tasks/[taskId]/git-push - Create git push task
export async function POST(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const startTime = Date.now()
  console.log(`[POST /api/projects/${params.id}/tasks/${params.taskId}/git-push] ====== START ======`)

  try {
    const projectId = params.id
    const taskId = params.taskId

    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      console.log(`[GitPush] ERROR: Project not found`)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if project exists on disk
    const projectPath = project.workspace || project.path
    if (!fs.existsSync(projectPath)) {
      console.log(`[GitPush] ERROR: Project folder not found at ${projectPath}`)
      return NextResponse.json({ error: 'Project folder not found' }, { status: 404 })
    }

    // Get the original task
    const originalTask = taskQueue.getTaskById(taskId)
    if (!originalTask) {
      console.log(`[GitPush] ERROR: Task not found`)
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify task belongs to this project
    if (originalTask.projectId !== projectId) {
      console.log(`[GitPush] ERROR: Task does not belong to project`)
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 400 })
    }

    // Check if task is completed or has artifacts
    if (originalTask.status !== 'completed' && (!originalTask.artifacts || originalTask.artifacts.length === 0)) {
      console.log(`[GitPush] ERROR: Task not ready for git push`)
      return NextResponse.json({ 
        error: 'Task must be completed or have artifacts before creating a git push task' 
      }, { status: 400 })
    }

    // Get authentication configuration
    console.log(`[GitPush] Loading authentication config for project: ${projectId}`)
    const authConfig = getProjectEffectiveAuth(projectId)
    const authStatus = getAuthStatus()
    
    if (authStatus.configured) {
      console.log(`[GitPush] Auth configured: ${authStatus.method} (${authStatus.provider})`)
    } else {
      console.log(`[GitPush] WARNING: No authentication configured`)
    }

    console.log(`[GitPush] Creating git push task for: ${originalTask.title}`)

    // Create the git push task
    const result = await createGitPushTask(projectId, originalTask, authConfig, authStatus)

    if (!result.success || !result.task) {
      console.log(`[GitPush] ERROR: Failed to create git push task - ${result.error}`)
      return NextResponse.json({ 
        error: result.error || 'Failed to create git push task' 
      }, { status: 500 })
    }

    const gitTask = result.task
    console.log(`[GitPush] Git push task created: ${gitTask.id}`)

    // Auto-start the git task (move from created to pending)
    console.log(`[GitPush] Auto-starting git task ${gitTask.id}...`)
    taskQueue.startTask(gitTask.id)

    // Process queue to spawn sub-agent immediately
    try {
      await taskQueue.processQueue()
      console.log(`[GitPush] processQueue completed successfully`)
    } catch (queueError: any) {
      console.error(`[GitPush] processQueue FAILED:`, queueError.message)
    }

    // Get the updated task
    const updatedTask = taskQueue.getTaskById(gitTask.id)

    const duration = Date.now() - startTime
    console.log(`[GitPush] ====== END (${duration}ms) ======`)

    return NextResponse.json({
      success: true,
      message: 'Git push task created and started',
      gitTask: updatedTask || gitTask,
      originalTask: {
        id: originalTask.id,
        title: originalTask.title
      },
      auth: {
        configured: authStatus.configured,
        method: authStatus.method,
        provider: authStatus.provider
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error(`[GitPush] UNEXPECTED ERROR:`, error.message)
    console.error(error.stack)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
