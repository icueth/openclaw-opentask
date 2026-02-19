import { NextResponse } from 'next/server'
import { getTasksByProject, createTask, Task } from '@/lib/taskQueue'
import { store } from '@/lib/store'
import fs from 'fs'
import path from 'path'

// GET /api/projects/[id]/tasks - List tasks for project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    console.log(`[GET /api/projects/${projectId}/tasks] Received request`)
    
    // Check if project exists in store
    const project = store.getProjectById(projectId)
    if (!project) {
      console.log(`[GET /api/projects/${projectId}/tasks] Project not found in store`)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    
    console.log(`[GET /api/projects/${projectId}/tasks] Filters - status: ${status}, priority: ${priority}`)
    
    let tasks = getTasksByProject(projectId)
    console.log(`[GET /api/projects/${projectId}/tasks] Found ${tasks.length} total tasks`)
    
    // Apply filters
    if (status) {
      const statusList = status.split(',') as Task['status'][]
      tasks = tasks.filter(t => statusList.includes(t.status))
      console.log(`[GET /api/projects/${projectId}/tasks] After status filter: ${tasks.length} tasks`)
    }
    if (priority) {
      tasks = tasks.filter(t => t.priority === priority)
      console.log(`[GET /api/projects/${projectId}/tasks] After priority filter: ${tasks.length} tasks`)
    }
    
    // Sort by createdAt desc
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    console.log(`[GET /api/projects/${projectId}/tasks] Returning ${tasks.length} tasks`)
    
    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length
    })
  } catch (error: any) {
    console.error(`[GET /api/projects/${params.id}/tasks] Error:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/projects/[id]/tasks - Create new task
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  console.log(`[POST /api/projects/${params.id}/tasks] ====== START ======`)
  
  try {
    const projectId = params.id
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      console.log(`[POST /api/projects/${projectId}/tasks] ERROR: Project not found in store`)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    console.log(`[POST /api/projects/${projectId}/tasks] Found project:`, { 
      name: project.name, 
      agentId: project.agentId,
      workspace: project.workspace 
    })
    
    // Check if project exists on disk
    const projectPath = project.workspace || project.path
    if (!fs.existsSync(projectPath)) {
      console.log(`[POST /api/projects/${projectId}/tasks] ERROR: Project folder not found at ${projectPath}`)
      return NextResponse.json({ error: 'Project folder not found' }, { status: 404 })
    }
    
    let body: any
    try {
      body = await request.json()
      console.log(`[POST /api/projects/${projectId}/tasks] Request body:`, JSON.stringify(body, null, 2))
    } catch (parseError: any) {
      console.error(`[POST /api/projects/${projectId}/tasks] ERROR: Failed to parse JSON body:`, parseError.message)
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    
    // Validation
    if (!body.title) {
      console.log(`[POST /api/projects/${projectId}/tasks] ERROR: Title is required`)
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    // Use project's agentId automatically (inherited)
    const agentId = body.agentId || project.agentId
    if (!agentId) {
      console.log(`[POST /api/projects/${projectId}/tasks] ERROR: No agentId available (project has no agent)`)
      return NextResponse.json({ error: 'Project has no assigned agent' }, { status: 400 })
    }
    
    console.log(`[POST /api/projects/${projectId}/tasks] Using agentId: ${agentId} (from ${body.agentId ? 'request' : 'project'})`)
    
    // Create task (simplified - createTask handles execution automatically)
    console.log(`[POST /api/projects/${projectId}/tasks] Creating task...`)
    const task = await createTask(projectId, {
      title: body.title,
      description: body.description || '',
      priority: body.priority || 'medium'
    })
    console.log(`[POST /api/projects/${projectId}/tasks] Task created: ${task.id}, status: ${task.status}`)
    
    const duration = Date.now() - startTime
    console.log(`[POST /api/projects/${projectId}/tasks] ====== END (${duration}ms) ======`)
    
    // Return immediately with the created task (status will be 'processing')
    return NextResponse.json({
      success: true,
      task: task,
      message: 'Task created and execution started'
    }, { status: 201 })
  } catch (error: any) {
    console.error(`[POST /api/projects/${params.id}/tasks] UNEXPECTED ERROR:`, error.message)
    console.error(error.stack)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}