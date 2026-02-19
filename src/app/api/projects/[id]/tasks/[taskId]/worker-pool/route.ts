import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { createWorkerPool, checkWorkerPoolCompletion, mergeWorkerOutputs } from '@/lib/workerPool'
import { getTaskById } from '@/lib/taskQueue'

// POST /api/projects/[id]/tasks/[taskId]/worker-pool - Create worker pool
export async function POST(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = params
    
    // Check project exists
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Check task exists
    const task = getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    const body = await request.json()
    
    // Validate
    if (!body.workerCount || body.workerCount < 1 || body.workerCount > 10) {
      return NextResponse.json({ error: 'Worker count must be between 1 and 10' }, { status: 400 })
    }
    
    const strategy = body.strategy || 'collaborative'
    const validStrategies = ['split', 'collaborative', 'review']
    if (!validStrategies.includes(strategy)) {
      return NextResponse.json({ error: `Strategy must be one of: ${validStrategies.join(', ')}` }, { status: 400 })
    }
    
    // Create worker pool
    const assignments = await createWorkerPool({
      taskId,
      projectId,
      workerCount: body.workerCount,
      workDistribution: strategy,
      instructions: body.instructions || task.description
    })
    
    return NextResponse.json({
      success: true,
      message: `Created ${assignments.length} workers for task "${task.title}"`,
      parentTask: {
        id: taskId,
        title: task.title
      },
      workers: assignments.map(a => ({
        index: a.workerIndex,
        taskId: a.taskId,
        scope: a.scope
      })),
      strategy,
      sharedContextPath: 'SHARED_CONTEXT.md'
    })
    
  } catch (error: any) {
    console.error('[Worker Pool API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/projects/[id]/tasks/[taskId]/worker-pool - Get worker pool status
export async function GET(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = params
    
    const status = await checkWorkerPoolCompletion(projectId, taskId)
    
    // Get merge results if complete
    let mergeResults = null
    if (status.complete) {
      try {
        mergeResults = await mergeWorkerOutputs(projectId, taskId)
      } catch (e) {
        console.log('[Worker Pool API] Could not merge results yet')
      }
    }
    
    return NextResponse.json({
      success: true,
      status: {
        ...status,
        complete: status.complete,
        progress: status.allWorkers.length > 0 
          ? Math.round((status.completedWorkers.length / status.allWorkers.length) * 100)
          : 0
      },
      mergeResults
    })
    
  } catch (error: any) {
    console.error('[Worker Pool API] GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}