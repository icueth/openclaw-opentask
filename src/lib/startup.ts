/**
 * Startup Module - Ensures all background services start when the server starts
 * Import this in layout.tsx or page.tsx to ensure services start
 */

import { spawnForTask, listSubAgents, getSubAgent, steerSubAgent, killSubAgent } from './taskRunner-v3'
import { wsServer } from './task-system/realtime/WebSocketServer'
import { lifecycleHooks } from './task-system/hooks/LifecycleHooks'
import { subTaskManager } from './task-system/subtask/SubTaskManager'

let started = false

export function ensureServicesStarted(): void {
  if (started) return
  if (typeof window !== 'undefined') return // Only server-side
  
  started = true
  
  console.log('[Startup] ==========================================')
  console.log('[Startup] Dashboard Task System v2 Starting...')
  console.log('[Startup] ==========================================')
  
  // Task system v3 initialized (sessions-based)
  console.log('[Startup] Task system v3 initialized')
  console.log('[Startup] ✓ sessions_spawn ready')
  
  // Start WebSocket server for real-time updates
  console.log('[Startup] Starting WebSocket server...')
  try {
    wsServer.start(3001)
    console.log('[Startup] ✓ WebSocket server started on port 3001')
  } catch (error) {
    console.error('[Startup] ✗ WebSocket server failed:', error)
  }
  
  // Setup event forwarding from taskRunner to WebSocket
  setupEventForwarding()
  
  // Setup lifecycle hooks
  setupLifecycleHooks()
  
  console.log('[Startup] ==========================================')
  console.log('[Startup] Task System v2 ready!')
  console.log('[Startup] ==========================================')
}

/**
 * Forward events from task system to WebSocket clients
 */
function setupEventForwarding(): void {
  // Event forwarding for subTaskManager
  subTaskManager.on('subtasks:created', (event) => {
    wsServer.broadcast(event)
  })
  
  subTaskManager.on('parent:all-complete', (event) => {
    wsServer.broadcast(event)
  })
  
  console.log('[Startup] ✓ Event forwarding configured')
}

/**
 * Setup lifecycle hooks for automation
 */
function setupLifecycleHooks(): void {
  // On all sub-tasks complete
  subTaskManager.on('parent:all-complete', async (event) => {
    console.log(`[Lifecycle] All sub-tasks completed for parent: ${event.taskId}`)
  })
  
  console.log('[Startup] ✓ Lifecycle hooks configured')
}

// Note: Auto-start disabled - call ensureServicesStarted() manually in your app entry point
// This prevents conflicts during Next.js build process

export default ensureServicesStarted
