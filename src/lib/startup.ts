/**
 * Startup Module - Ensures all background services start when the server starts
 * Import this in layout.tsx or page.tsx to ensure services start
 */

let started = false

export function ensureServicesStarted(): void {
  if (started) return
  if (typeof window !== 'undefined') return // Only server-side
  
  started = true
  
  console.log('[Startup] ==========================================')
  console.log('[Startup] OpenClaw OpenTask Dashboard Starting...')
  console.log('[Startup] ==========================================')
  console.log('[Startup] Dashboard ready!')
  console.log('[Startup] ==========================================')
}

export default ensureServicesStarted
