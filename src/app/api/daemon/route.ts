import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getTaskById, updateTaskStatus } from '@/lib/taskQueue'
import fs from 'fs'
import path from 'path'

const DAEMON_MESSAGES_FILE = path.join(process.cwd(), 'data', 'daemon-messages.json')

// POST /api/projects/[id]/tasks/[taskId]/daemon-spawn - Send task to daemon
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
    
    // Send to daemon via file-based messaging
    const message = {
      type: 'spawn_task',
      task: {
        id: taskId,
        projectId,
        title: task.title,
        description: task.description || task.title,
        agentId: task.agentId
      }
    }
    
    // Append to daemon messages file
    let messages: any[] = []
    if (fs.existsSync(DAEMON_MESSAGES_FILE)) {
      messages = JSON.parse(fs.readFileSync(DAEMON_MESSAGES_FILE, 'utf-8'))
    }
    messages.push(message)
    fs.writeFileSync(DAEMON_MESSAGES_FILE, JSON.stringify(messages, null, 2))
    
    // Update task status
    updateTaskStatus(taskId, 'pending', 'Sent to daemon queue')
    
    return NextResponse.json({
      success: true,
      message: 'Task sent to daemon',
      task: getTaskById(taskId)
    })
    
  } catch (error: any) {
    console.error('[Daemon Spawn API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/daemon/status - Get daemon status
export async function GET(request: NextRequest) {
  try {
    const daemonStateFile = path.join(process.cwd(), 'data', 'daemon-state.json')
    const daemonQueueFile = path.join(process.cwd(), 'data', 'daemon-queue.json')
    
    let status = {
      running: false,
      lastActive: null as string | null,
      queueLength: 0,
      activeWorkers: 0
    }
    
    if (fs.existsSync(daemonStateFile)) {
      const state = JSON.parse(fs.readFileSync(daemonStateFile, 'utf-8'))
      status.running = true
      status.lastActive = state.lastActive
      status.activeWorkers = state.activeWorkers?.length || 0
    }
    
    if (fs.existsSync(daemonQueueFile)) {
      const queue = JSON.parse(fs.readFileSync(daemonQueueFile, 'utf-8'))
      status.queueLength = queue.length
    }
    
    return NextResponse.json({ success: true, status })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
