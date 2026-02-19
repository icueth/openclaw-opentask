import { NextRequest, NextResponse } from 'next/server'
import { submitTaskToCoordinator } from '@/lib/agentCoordinator'
import { store } from '@/lib/store'
import { getTaskById, updateTaskStatus } from '@/lib/taskQueue'

// POST /api/projects/[id]/tasks/[taskId]/spawn-worker - Spawn worker via coordinator
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await Promise.resolve(params)
    
    // Get task
    const task = getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to project' }, { status: 403 })
    }
    
    // Get project
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Submit to coordinator
    const submitted = submitTaskToCoordinator({
      taskId,
      projectId,
      title: task.title,
      description: task.description || task.title,
      agentId: task.agentId
    })
    
    if (!submitted) {
      return NextResponse.json({ error: 'Failed to submit to coordinator' }, { status: 500 })
    }
    
    // Update task status
    updateTaskStatus(taskId, 'pending', 'Submitted to coordinator queue')
    
    return NextResponse.json({
      success: true,
      message: 'Task submitted to coordinator',
      task: getTaskById(taskId)
    })
    
  } catch (error: any) {
    console.error('[Spawn Worker API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
