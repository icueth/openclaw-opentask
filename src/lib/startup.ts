/**
 * Startup Module - Ensures all background services start when the server starts
 * Import this in layout.tsx or page.tsx to ensure services start
 */

import { startQueueProcessor, isQueueProcessorRunning } from './taskQueue'

let started = false

export function ensureServicesStarted(): void {
  if (started) return
  if (typeof window !== 'undefined') return // Only server-side
  
  started = true
  
  console.log('[Startup] ==========================================')
  console.log('[Startup] Dashboard Services Starting...')
  console.log('[Startup] ==========================================')
  
  // Start queue processor
  if (!isQueueProcessorRunning()) {
    console.log('[Startup] Starting queue processor...')
    startQueueProcessor()
    console.log('[Startup] ✓ Queue processor started')
  } else {
    console.log('[Startup] Queue processor already running')
  }
  
  console.log('[Startup] ==========================================')
  console.log('[Startup] All services started successfully')
  console.log('[Startup] ==========================================')
}

// Auto-start on module load (server-side only)
if (typeof window === 'undefined') {
  // Delay slightly to ensure all modules are loaded
  setTimeout(() => {
    ensureServicesStarted()
  }, 1000)
}

export default ensureServicesStarted
