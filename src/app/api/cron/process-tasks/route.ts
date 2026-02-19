import { NextResponse } from 'next/server'
import { taskQueue } from '@/lib/taskQueue'

// Track last run time
let lastRun: Date | null = null
let isRunning = false

// POST /api/cron/process-tasks - Background task processor
// This can be called by:
// 1. A real cron job (curl)
// 2. A scheduled function
// 3. Manual trigger for testing
export async function POST(request: Request) {
  // Prevent concurrent runs
  if (isRunning) {
    return NextResponse.json({
      success: false,
      message: 'Task processor is already running',
      lastRun: lastRun?.toISOString()
    }, { status: 429 })
  }

  isRunning = true
  const startTime = Date.now()
  
  try {
    console.log('[Cron] Starting task queue processing...')
    
    // Check for timed-out tasks first
    taskQueue.checkTimeouts()
    
    // Process pending tasks
    await taskQueue.processQueue()
    
    // Get queue stats
    const allTasks = taskQueue.getAllTasks()
    const stats = {
      total: allTasks.length,
      created: allTasks.filter(t => t.status === 'created').length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      active: allTasks.filter(t => t.status === 'active').length,
      processing: allTasks.filter(t => t.status === 'processing').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      failed: allTasks.filter(t => t.status === 'failed').length,
      cancelled: allTasks.filter(t => t.status === 'cancelled').length,
      runningNow: taskQueue.getRunningTasksCount(),
      maxConcurrent: taskQueue.getQueueConfig().maxConcurrentTasks
    }
    
    lastRun = new Date()
    const duration = Date.now() - startTime
    
    console.log(`[Cron] Task processing completed in ${duration}ms`, stats)
    
    return NextResponse.json({
      success: true,
      message: 'Task queue processed',
      stats,
      duration: `${duration}ms`,
      lastRun: lastRun.toISOString()
    })
    
  } catch (error: any) {
    console.error('[Cron] Error processing task queue:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      lastRun: lastRun?.toISOString()
    }, { status: 500 })
  } finally {
    isRunning = false
  }
}

// GET /api/cron/process-tasks - Get status and stats
export async function GET(request: Request) {
  const allTasks = taskQueue.getAllTasks()
  const config = taskQueue.getQueueConfig()
  
  const stats = {
    total: allTasks.length,
    byStatus: {
      created: allTasks.filter(t => t.status === 'created').length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      active: allTasks.filter(t => t.status === 'active').length,
      processing: allTasks.filter(t => t.status === 'processing').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      failed: allTasks.filter(t => t.status === 'failed').length,
      cancelled: allTasks.filter(t => t.status === 'cancelled').length
    },
    runningNow: taskQueue.getRunningTasksCount(),
    maxConcurrent: config.maxConcurrentTasks,
    queueProcessorRunning: taskQueue.isQueueProcessorRunning()
  }
  
  return NextResponse.json({
    success: true,
    stats,
    config,
    lastRun: lastRun?.toISOString() || null,
    isRunning
  })
}

// PUT /api/cron/process-tasks - Update queue configuration
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const currentConfig = taskQueue.getQueueConfig()
    
    const updates: Partial<typeof currentConfig> = {}
    if (body.maxConcurrentTasks !== undefined) updates.maxConcurrentTasks = body.maxConcurrentTasks
    if (body.defaultTimeoutMinutes !== undefined) updates.defaultTimeoutMinutes = body.defaultTimeoutMinutes
    if (body.maxRetries !== undefined) updates.maxRetries = body.maxRetries
    if (body.processingIntervalMs !== undefined) updates.processingIntervalMs = body.processingIntervalMs
    
    taskQueue.configureQueue(updates)
    
    // Restart processor if running
    if (taskQueue.isQueueProcessorRunning()) {
      taskQueue.stopQueueProcessor()
      taskQueue.startQueueProcessor()
    }
    
    return NextResponse.json({
      success: true,
      message: 'Queue configuration updated',
      config: taskQueue.getQueueConfig()
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}