import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { createTask } from '@/lib/taskQueue'

// POST /api/projects/[id]/git-pull - Create a git pull task
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = await Promise.resolve(params)
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

    // Check if project has git
    if (!project.githubUrl) {
      return NextResponse.json(
        { success: false, error: 'Project is not linked to a Git repository' },
        { status: 400 }
      )
    }

    // Create pull task
    const task = await createTask(projectId, {
      title: `🔄 Pull Git: ${branch}`,
      description: `Pull latest changes from branch "${branch}"\n\nRepository: ${project.githubUrl}\nBranch: ${branch}\n\nActions:\n1. git fetch origin\n2. git checkout ${branch}\n3. git pull origin ${branch}`,
      priority: 'high'
    })

    return NextResponse.json({
      success: true,
      task,
      message: `Git pull task created for branch "${branch}"`
    })

  } catch (error: any) {
    console.error('[Git Pull API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
