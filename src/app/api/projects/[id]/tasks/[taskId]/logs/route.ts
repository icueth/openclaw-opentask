import { NextResponse } from 'next/server'
import { getTaskById } from '@/lib/taskQueue'
import { getTaskLog, getTaskLogsFromOffset } from '@/lib/taskLogger'

// GET /api/projects/[id]/tasks/[taskId]/logs - Get task logs (streaming)
export async function GET(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = await Promise.resolve(params)
    
    // Get query params
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const stream = searchParams.get('stream') === 'true'
    
    // Get task
    const task = getTaskById(taskId)
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Verify task belongs to project
    if (task.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Task does not belong to this project' },
        { status: 403 }
      )
    }
    
    // Get logs
    const log = getTaskLog(taskId)
    
    if (!log) {
      // Return empty logs if not initialized yet
      return NextResponse.json({
        success: true,
        logs: [],
        offset: 0,
        total: 0,
        status: task.status,
        isComplete: task.status === 'completed' || task.status === 'failed'
      })
    }
    
    // If streaming mode, only return new logs since offset
    if (stream) {
      const { logs, total } = getTaskLogsFromOffset(taskId, offset)
      return NextResponse.json({
        success: true,
        logs,
        offset: total,
        total,
        status: log.status,
        result: log.result,
        artifacts: log.artifacts,
        isComplete: log.status === 'completed' || log.status === 'failed'
      })
    }
    
    // Return full log
    return NextResponse.json({
      success: true,
      logs: log.logs,
      offset: log.logs.length,
      total: log.logs.length,
      status: log.status,
      result: log.result,
      artifacts: log.artifacts,
      isComplete: log.status === 'completed' || log.status === 'failed'
    })
    
  } catch (error: any) {
    console.error('[Logs API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
