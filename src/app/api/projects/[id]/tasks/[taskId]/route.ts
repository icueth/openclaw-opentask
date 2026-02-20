import { NextResponse } from 'next/server'
import { getTaskById, deleteTask, updateTaskStatus } from '@/lib/taskQueue'
import { store } from '@/lib/store'
import { checkTaskStatusFromFile } from '@/lib/taskRunner'
import { getTaskLog } from '@/lib/taskLogger'
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
    let task = getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    // Sync from log file (new logging system)
    const logData = getTaskLog(taskId)
    if (logData) {
      const tasks = store.getTasks()
      const index = tasks.findIndex(t => t.id === taskId)
      if (index !== -1) {
        // Update status if log shows completed/failed
        if (logData.status === 'completed' && tasks[index].status !== 'completed') {
          tasks[index] = {
            ...tasks[index],
            status: 'completed',
            completedAt: logData.completedAt || new Date().toISOString(),
            result: logData.result || tasks[index].result,
            artifacts: logData.artifacts || tasks[index].artifacts,
            currentStep: 'Task completed'
          }
          store.writeTasks(tasks)
          task = tasks[index]
        } else if (logData.status === 'failed' && tasks[index].status !== 'failed') {
          tasks[index] = {
            ...tasks[index],
            status: 'failed',
            completedAt: logData.completedAt || new Date().toISOString(),
            error: logData.result || 'Task failed',
            currentStep: 'Task failed'
          }
          store.writeTasks(tasks)
          task = tasks[index]
        } else if (logData.result && !tasks[index].result) {
          // Just update result if available
          tasks[index] = {
            ...tasks[index],
            result: logData.result,
            artifacts: logData.artifacts || tasks[index].artifacts
          }
          store.writeTasks(tasks)
          task = tasks[index]
        }
      }
    }
    
    // Fallback: Sync result from old status file if task is completed but missing result
    if (task.status === 'completed' && !task.result) {
      const fileStatus = checkTaskStatusFromFile(taskId)
      if (fileStatus?.result) {
        const tasks = store.getTasks()
        const index = tasks.findIndex(t => t.id === taskId)
        if (index !== -1) {
          tasks[index] = {
            ...tasks[index],
            result: fileStatus.result,
            artifacts: fileStatus.artifacts || tasks[index].artifacts
          }
          store.writeTasks(tasks)
          task = tasks[index]
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      task
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/projects/[id]/tasks/[taskId] - Update task (limited in simplified API)
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
    const task = getTaskById(taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 })
    }
    
    // Note: In simplified API, direct task updates are limited
    // For major updates, the task should be recreated
    const updatedTask = { 
      ...task,
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description })
    }
    
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
    const task = getTaskById(taskId)
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
    deleteTask(taskId)
    
    return NextResponse.json({
      success: true,
      message: `Task ${taskId} deleted`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}