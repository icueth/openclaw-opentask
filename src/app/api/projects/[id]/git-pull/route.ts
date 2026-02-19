import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getTaskById, processQueue } from '@/lib/taskQueue'

// POST /api/projects/[id]/git-pull - Create a pull task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { branch = 'main' } = body

    // Get project
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project has GitHub URL
    if (!project.githubUrl) {
      return NextResponse.json(
        { success: false, error: 'Project is not linked to a GitHub repository' },
        { status: 400 }
      )
    }

    // Create a pull task
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const task = {
      id: taskId,
      projectId,
      title: `🔄 Pull from ${branch}`,
      description: `Pull latest changes from GitHub branch: ${branch}`,
      agentId: 'coder', // Use coder agent for git operations
      priority: 'high' as const,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      statusHistory: [{
        status: 'pending' as const,
        timestamp: new Date().toISOString(),
        message: 'Git pull task queued'
      }],
      retryCount: 0,
      maxRetries: 2,
      timeoutMinutes: 10,
      progress: 0
    }

    // Store task using createTask
    store.createTask(task)

    // Start queue processing
    setTimeout(() => {
      processQueue().catch(console.error)
    }, 100)

    return NextResponse.json({
      success: true,
      message: 'Git pull task created',
      task: {
        id: taskId,
        title: task.title,
        status: 'pending'
      }
    })
  } catch (error: any) {
    console.error('[Git Pull API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET /api/projects/[id]/git-branches - List available branches
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = await params

    // Get project
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project has GitHub URL
    if (!project.githubUrl) {
      return NextResponse.json(
        { success: false, error: 'Project is not linked to a GitHub repository' },
        { status: 400 }
      )
    }

    // Try to get branches from git
    const { execSync } = require('child_process')
    const path = require('path')
    const projectPath = project.workspace || project.path

    let branches: string[] = ['main', 'master'] // Default branches

    try {
      // Get local branches
      const output = execSync('git branch -a', { 
        cwd: projectPath,
        encoding: 'utf-8'
      })
      
      // Parse branches
      const allBranches: string[] = output
        .split('\n')
        .map((b: string) => b.trim().replace(/^\*\s*/, '').replace(/^remotes\/origin\//, ''))
        .filter((b: string) => b && !b.includes('HEAD'))
      
      // Remove duplicates and sort
      branches = [...new Set(allBranches)].sort()
    } catch (e) {
      // If git command fails, return default branches
      console.log('[Git Branches] Could not fetch branches, using defaults')
    }

    return NextResponse.json({
      success: true,
      branches,
      current: 'main' // Default to main
    })
  } catch (error: any) {
    console.error('[Git Branches API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}