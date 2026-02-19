import { NextResponse } from 'next/server'
import { getTaskById, updateTaskStatus } from '@/lib/taskQueue'
import { store } from '@/lib/store'
import fs from 'fs'

// POST /api/projects/[id]/tasks/[taskId]/cancel - Cancel task
export async function POST(
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
    
    // Cancel task by updating status (sub-agent will timeout naturally)
    updateTaskStatus(taskId, 'failed', 'Task cancelled by user')
    
    return NextResponse.json({
      success: true,
      message: 'Task cancelled',
      task: getTaskById(taskId)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}