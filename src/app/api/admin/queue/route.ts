import { NextResponse } from 'next/server'
import { 
  taskQueue, 
  isQueueProcessorRunning, 
  startQueueProcessor, 
  stopQueueProcessor,
  processQueue,
  getRunningTasksCount,
  getPendingTasks,
  cleanupZombieTasks
} from '@/lib/taskQueue'
import { store } from '@/lib/store'

// GET /api/admin/queue - Get queue status
export async function GET() {
  try {
    const status = {
      isRunning: isQueueProcessorRunning(),
      runningTasks: getRunningTasksCount(),
      pendingTasks: getPendingTasks().length,
      allTasks: store.getTasks().length
    }
    
    return NextResponse.json({
      success: true,
      status
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/queue - Control queue
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    
    switch (action) {
      case 'start':
        if (!isQueueProcessorRunning()) {
          startQueueProcessor()
          return NextResponse.json({ success: true, message: 'Queue processor started' })
        }
        return NextResponse.json({ success: true, message: 'Queue processor already running' })
        
      case 'stop':
        stopQueueProcessor()
        return NextResponse.json({ success: true, message: 'Queue processor stopped' })
        
      case 'process':
        // Manually trigger one queue processing cycle
        await processQueue()
        return NextResponse.json({ success: true, message: 'Queue processed' })
        
      case 'force-process':
        // Force process all pending tasks immediately
        const pendingTasks = getPendingTasks()
        const results = []
        for (const task of pendingTasks) {
          try {
            await processQueue()
            results.push({ taskId: task.id, status: 'processed' })
          } catch (err: any) {
            results.push({ taskId: task.id, status: 'failed', error: err.message })
          }
        }
        return NextResponse.json({ 
          success: true, 
          message: `Processed ${pendingTasks.length} tasks`,
          results 
        })
        
      case 'cleanup':
        // Cleanup zombie tasks
        const cleaned = cleanupZombieTasks()
        return NextResponse.json({ 
          success: true, 
          message: `Cleaned up ${cleaned} zombie tasks`,
          cleaned 
        })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}