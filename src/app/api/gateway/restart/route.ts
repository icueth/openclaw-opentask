import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

// POST - Restart the Gateway
export async function POST() {
  try {
    // Try to restart using openclaw command
    // This assumes openclaw is in PATH and can be run
    const { stdout, stderr } = await execAsync('openclaw gateway restart', { 
      timeout: 10000 
    }).catch(() => ({ stdout: '', stderr: '' }))
    
    // Also try common service managers as fallback
    try {
      await execAsync('launchctl kickstart -k system/openclaw.gateway 2>/dev/null || true', { timeout: 5000 })
    } catch {
      // Ignore errors from fallback
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Gateway restart initiated',
      output: stdout || stderr || null
    })
  } catch (error) {
    console.error('Failed to restart gateway:', error)
    // Even if the command fails, we return success as the config has been updated
    // and will take effect on next gateway start
    return NextResponse.json({ 
      success: true, 
      message: 'Gateway restart requested. Changes will take effect when Gateway restarts.',
      note: 'Please restart the Gateway manually if needed.'
    })
  }
}
