/**
 * Startup Module - Simple version
 */

let started = false

export function ensureServicesStarted(): void {
  if (started) return
  if (typeof window !== 'undefined') return // Only server-side
  
  started = true
  
  console.log('[Startup] ==========================================')
  console.log('[Startup] OpenClaw Dashboard Starting...')
  console.log('[Startup] ==========================================')
  
  // Start simple status detector
  console.log('[Startup] Starting status detector...')
  const { startStatusDetector } = require('./statusDetector')
  startStatusDetector()
  console.log('[Startup] ✓ Status detector started')
  
  console.log('[Startup] ==========================================')
  console.log('[Startup] Ready!')
  console.log('[Startup] ==========================================')
}

// Auto-start on module load (server-side only)
if (typeof window === 'undefined') {
  setTimeout(() => {
    ensureServicesStarted()
  }, 1000)
}

export default ensureServicesStarted
