import { NextResponse } from 'next/server'
import { taskQueue, Task } from '@/lib/taskQueue'
import { store } from '@/lib/store'
import fs from 'fs'

// GET /api/projects/[id]/tasks/[taskId] - Get task details
export async function GET(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await Promise.resolve(params)
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Project folder not found' }, { status: 404 })
    }
    
    // Get task
    const task = taskQueue.getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    return NextResponse.json({
      success: true,
      task
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/projects/[id]/tasks/[taskId] - Update task
export async function PUT(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await Promise.resolve(params)
    const body = await request.json()
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Project folder not found' }, { status: 404 })
    }
    
    // Get task
    const task = taskQueue.getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    // Prevent changing certain fields
    const allowedUpdates: Partial<Task> = {}
    if (body.title !== undefined) allowedUpdates.title = body.title
    if (body.description !== undefined) allowedUpdates.description = body.description
    if (body.priority !== undefined) allowedUpdates.priority = body.priority
    if (body.maxRetries !== undefined) allowedUpdates.maxRetries = body.maxRetries
    if (body.timeoutMinutes !== undefined) allowedUpdates.timeoutMinutes = body.timeoutMinutes
    if (body.artifacts !== undefined) allowedUpdates.artifacts = body.artifacts
    
    // Update task
    const updatedTask = taskQueue.updateTask(taskId, allowedUpdates)
    
    return NextResponse.json({
      success: true,
      task: updatedTask
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await Promise.resolve(params)
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Project folder not found' }, { status: 404 })
    }
    
    // Get task
    const task = taskQueue.getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    // Prevent deleting running tasks
    if (task.status === 'processing') {
      return NextResponse.json(
        { error: 'Cannot delete a running task. Cancel it first.' },
        { status: 400 }
      )
    }
    
    // Delete task
    taskQueue.deleteTask(taskId)
    
    return NextResponse.json({
      success: true,
      message: `Task ${taskId} deleted`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}