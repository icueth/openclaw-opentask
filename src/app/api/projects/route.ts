import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { store, PROJECTS_DIR } from '@/lib/store'
import { homedir } from 'os'
import { cloneRepository, getRepoInfo, generateGitHubProjectMd, validateGitHubUrl } from '@/lib/git'
import { createInitTask } from '@/lib/initTask'

// Read agent config from openclaw.json
function getAgentConfig(agentId: string): { id: string; name: string; workspace: string } | null {
  try {
    const configPath = path.join(homedir(), '.openclaw', 'openclaw.json')
    if (!fs.existsSync(configPath)) return null
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const agents = config.agents?.list || []
    return agents.find((a: any) => a.id === agentId) || null
  } catch (error) {
    console.error('Failed to read agent config:', error)
    return null
  }
}

// Ensure directories exist
function ensureDirs(projectPath: string) {
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true })
  }
}

// Generate PROJECT.md template
function generateProjectMd(config: any): string {
  return `# ${config.name}

## Overview
${config.description || 'Project description goes here...'}

## Goals
- Goal 1
- Goal 2
- Goal 3

## Architecture
<!-- Describe the tech stack, architecture decisions -->

## Team
<!-- List team members and their roles -->

## Getting Started
<!-- Setup instructions, dependencies -->

---
*Created: ${config.createdAt}*
*Updated: ${config.createdAt}*
*Agent: ${config.agentId}*
`
}

// Generate PROJECT.md template for GitHub-imported projects
function generateGitHubProjectMdTemplate(config: any, githubUrl: string, repoInfo: any): string {
  const timestamp = new Date().toISOString()
  const readmeSection = repoInfo?.readmeContent
    ? `\n## Original README\n\n${repoInfo.readmeContent.substring(0, 5000)}${repoInfo.readmeContent.length > 5000 ? '\n\n...(truncated)' : ''}`
    : ''

  return `# ${config.name}

## GitHub Repository
- **URL:** ${githubUrl}
- **Cloned:** ${timestamp}
${repoInfo?.defaultBranch ? `- **Default Branch:** ${repoInfo.defaultBranch}` : ''}
${repoInfo?.lastCommit ? `- **Last Commit:** ${repoInfo.lastCommit}` : ''}

## Overview
${config.description || 'Project imported from GitHub repository.'}

## Getting Started
<!-- Add setup instructions here -->

1. Install dependencies
2. Configure environment variables
3. Run the project

## Architecture
<!-- Describe the tech stack and architecture -->

${readmeSection}

---
*Created: ${timestamp}*
*Source: ${githubUrl}*
`
}

// Generate MEMORY.md template
function generateMemoryMd(config: any): string {
  return `# ${config.name} - Project Memory

Project-specific memory shared among agents.

## Key Decisions
<!-- Important decisions made during development -->
- Decision 1
- Decision 2

## Learnings
<!-- Lessons learned, best practices -->
- Learning 1
- Learning 2

## Context
<!-- Ongoing context, current state -->
- Current focus:
- Blockers:
- Next steps:

## References
<!-- Links to relevant docs, designs, etc. -->

---
*Created: ${config.createdAt}*
`
}

// Generate TASKS.md template
function generateTasksMd(config: any): string {
  return `# ${config.name} - Tasks

## Todo
- [ ] Add initial tasks here

## In Progress
<!-- Tasks currently being worked on -->

## Done
<!-- Completed tasks -->
- [x] Project initialized

---
*Created: ${config.createdAt}*
`
}

// GET - List projects
export async function GET() {
  try {
    // Get projects from JSON file
    const projects = store.getProjects()
    
    // Enrich with disk data
    const enrichedProjects = projects.map(project => {
      const projectPath = project.workspace || project.path
      
      if (!fs.existsSync(projectPath)) {
        return { ...project, exists: false }
      }
      
      const configPath = path.join(projectPath, 'PROJECT.json')
      const projectMdPath = path.join(projectPath, 'PROJECT.md')
      const memoryPath = path.join(projectPath, 'MEMORY.md')
      
      let diskConfig: any = {}
      if (fs.existsSync(configPath)) {
        try {
          diskConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        } catch (e) {}
      }
      
      // List files in project
      let files: string[] = []
      try {
        files = fs.readdirSync(projectPath)
          .filter(f => !f.startsWith('.'))
      } catch (e) {}
      
      return {
        ...project,
        ...diskConfig,
        exists: true,
        hasProjectMd: fs.existsSync(projectMdPath),
        hasMemoryMd: fs.existsSync(memoryPath),
        files
      }
    })
    
    return NextResponse.json({
      success: true,
      projects: enrichedProjects
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new project
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const projectId = body.id || body.name?.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID or name required' }, { status: 400 })
    }

    // Validate id format
    if (!/^[a-z0-9-]+$/.test(projectId)) {
      return NextResponse.json({ error: 'Project ID must be lowercase alphanumeric with hyphens only' }, { status: 400 })
    }

    // Use taskman as default agent (system-wide task executor)
    const agentId = body.agentId || 'taskman'
    const agentName = 'TaskMan'

    // Build project path in dashboard's data/projects folder (portable!)
    const projectsRoot = PROJECTS_DIR
    const projectPath = path.join(projectsRoot, projectId)

    // Check if exists
    if (fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Project already exists' }, { status: 400 })
    }

    const githubUrl = body.githubUrl?.trim()
    let repoInfo: any = null
    let cloneResult: any = null

    // Handle GitHub repository cloning if URL provided
    if (githubUrl) {
      // Validate GitHub URL format
      if (!validateGitHubUrl(githubUrl)) {
        return NextResponse.json({
          error: 'Invalid GitHub URL format. Expected: https://github.com/username/repo',
          errorCode: 'INVALID_URL'
        }, { status: 400 })
      }

      // Create parent directory first
      ensureDirs(projectsRoot)

      // Clone the repository
      cloneResult = await cloneRepository(githubUrl, projectPath)

      if (!cloneResult.success) {
        // Map error codes to appropriate HTTP status codes
        const statusMap: Record<string, number> = {
          'INVALID_URL': 400,
          'NOT_FOUND': 404,
          'ACCESS_DENIED': 403,
          'GIT_NOT_INSTALLED': 500,
          'TIMEOUT': 408,
          'UNKNOWN': 500
        }
        return NextResponse.json({
          error: cloneResult.error,
          errorCode: cloneResult.errorCode
        }, { status: statusMap[cloneResult.errorCode || 'UNKNOWN'] || 500 })
      }

      // Get repository info after successful clone
      repoInfo = await getRepoInfo(projectPath)
    } else {
      // Create blank project folder
      ensureDirs(projectPath)
    }

    // Create project config
    const now = new Date().toISOString()
    const projectConfig: any = {
      id: projectId,
      name: body.name || projectId,
      description: body.description || '',
      agentId: agentId,
      agentName: agentName,
      workspace: projectPath,
      createdAt: now,
      updatedAt: now
    }

    // Add GitHub info if cloned from repo
    if (githubUrl && cloneResult?.success) {
      projectConfig.githubUrl = githubUrl
      projectConfig.githubRepoName = cloneResult.repoName
    }

    // Create PROJECT.json
    fs.writeFileSync(
      path.join(projectPath, 'PROJECT.json'),
      JSON.stringify(projectConfig, null, 2)
    )

    // Create PROJECT.md with appropriate template
    if (githubUrl && cloneResult?.success) {
      fs.writeFileSync(
        path.join(projectPath, 'PROJECT.md'),
        generateGitHubProjectMdTemplate(projectConfig, githubUrl, repoInfo)
      )
    } else {
      fs.writeFileSync(
        path.join(projectPath, 'PROJECT.md'),
        generateProjectMd(projectConfig)
      )
    }

    // Create MEMORY.md with template
    fs.writeFileSync(
      path.join(projectPath, 'MEMORY.md'),
      generateMemoryMd(projectConfig)
    )

    // Create TASKS.md with template
    fs.writeFileSync(
      path.join(projectPath, 'TASKS.md'),
      generateTasksMd(projectConfig)
    )

    // Create TASKS folder for task artifacts (only for blank projects)
    if (!githubUrl) {
      const tasksPath = path.join(projectPath, 'TASKS')
      fs.mkdirSync(tasksPath, { recursive: true })
    }

    // Add to projects.json
    const newProject: any = {
      id: projectId,
      name: body.name || projectId,
      description: body.description || '',
      agentId: agentId,
      agentName: agentName,
      workspace: projectPath,
      createdAt: now,
      path: projectPath
    }

    if (githubUrl) {
      newProject.githubUrl = githubUrl
      newProject.githubRepoName = cloneResult?.repoName
    }

    try {
      store.createProject(newProject)
    } catch (e) {
      // Project might already exist in JSON, update it
      store.updateProject(projectId, newProject)
    }

    // List files in project
    let files: string[] = []
    try {
      files = fs.readdirSync(projectPath).filter(f => !f.startsWith('.'))
    } catch (e) {
      // Ignore
    }

    // If githubUrl provided, auto-create init task for analysis
    let initTask = null
    if (githubUrl && cloneResult?.success) {
      try {
        const initTaskResult = await createInitTask(
          projectId,
          projectPath,
          cloneResult.repoName,
          githubUrl,
          agentId
        )
        initTask = {
          id: initTaskResult.task.id,
          title: initTaskResult.task.title,
          message: 'Init task created and queued for analysis'
        }
        console.log(`[API] Created init task ${initTaskResult.task.id} for project ${projectId}`)
      } catch (initError: any) {
        console.error(`[API] Failed to create init task:`, initError.message)
        // Don't fail the project creation if init task fails
        initTask = {
          error: 'Failed to create init task',
          details: initError.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      project: {
        ...projectConfig,
        path: projectPath,
        files: [...files, githubUrl ? '(cloned from GitHub)' : ''],
        clonedFromGithub: !!githubUrl
      },
      cloned: !!githubUrl,
      initTask
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}