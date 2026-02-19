import { NextResponse } from 'next/server'
import { taskQueue, Task } from '@/lib/taskQueue'
import { store } from '@/lib/store'
import fs from 'fs'
import path from 'path'
import { homedir } from 'os'

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
    
    let tasks = taskQueue.getTasksByProject(projectId)
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
    
    // Check if agent exists in openclaw.json
    try {
      const configPath = path.join(homedir(), '.openclaw', 'openclaw.json')
      console.log(`[POST /api/projects/${projectId}/tasks] Checking agent config at: ${configPath}`)
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      const agents = configData.agents?.list || []
      const agentExists = agents.some((a: any) => a.id === agentId)
      
      console.log(`[POST /api/projects/${projectId}/tasks] Agent exists: ${agentExists}, available agents: ${agents.map((a: any) => a.id).join(', ')}`)
      
      if (!agentExists) {
        console.log(`[POST /api/projects/${projectId}/tasks] ERROR: Agent "${agentId}" not found`)
        return NextResponse.json({ error: `Agent "${agentId}" not found` }, { status: 404 })
      }
    } catch (e: any) {
      console.warn(`[POST /api/projects/${projectId}/tasks] Could not verify agent existence:`, e.message)
    }
    
    // Create task
    console.log(`[POST /api/projects/${projectId}/tasks] Creating task...`)
    const task = taskQueue.createTask({
      projectId,
      title: body.title,
      description: body.description || '',
      agentId: agentId,
      priority: body.priority || 'medium',
      maxRetries: body.maxRetries,
      timeoutMinutes: body.timeoutMinutes
    })
    console.log(`[POST /api/projects/${projectId}/tasks] Task created: ${task.id}, status: ${task.status}`)
    
    // Auto-start if requested (move from created to pending)
    if (body.autoStart !== false) {
      console.log(`[POST /api/projects/${projectId}/tasks] Auto-starting task ${task.id}...`)
      taskQueue.startTask(task.id)
      console.log(`[POST /api/projects/${projectId}/tasks] Task ${task.id} started, new status: ${taskQueue.getTaskById(task.id)?.status}`)
    }
    
    // IMMEDIATELY process queue to spawn sub-agent (don't wait for background processor)
    console.log(`[POST /api/projects/${projectId}/tasks] Calling processQueue for task ${task.id}...`)
    
    try {
      await taskQueue.processQueue()
      console.log(`[POST /api/projects/${projectId}/tasks] processQueue completed successfully`)
    } catch (queueError: any) {
      console.error(`[POST /api/projects/${projectId}/tasks] processQueue FAILED:`, queueError.message)
      console.error(queueError.stack)
    }
    
    // Get the updated task (may have changed status)
    const updatedTask = taskQueue.getTaskById(task.id)
    console.log(`[POST /api/projects/${projectId}/tasks] Final task status: ${updatedTask?.status}, assignedAgent: ${updatedTask?.assignedAgent || 'none'}`)
    
    const duration = Date.now() - startTime
    console.log(`[POST /api/projects/${projectId}/tasks] ====== END (${duration}ms) ======`)
    
    return NextResponse.json({
      success: true,
      task: updatedTask || task
    }, { status: 201 })
  } catch (error: any) {
    console.error(`[POST /api/projects/${params.id}/tasks] UNEXPECTED ERROR:`, error.message)
    console.error(error.stack)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}