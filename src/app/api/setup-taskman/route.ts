import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

// POST /api/setup-taskman - Setup TaskMan agent
export async function POST(request: NextRequest) {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'setup-taskman.sh')
    const { stdout, stderr } = await execAsync(`bash ${scriptPath}`)
    
    return NextResponse.json({
      success: true,
      output: stdout,
      error: stderr || undefined
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      output: error.stdout,
      stderr: error.stderr
    }, { status: 500 })
  }
}
