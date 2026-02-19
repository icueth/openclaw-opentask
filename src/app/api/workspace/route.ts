import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const WORKSPACE_PATH = path.join(process.env.HOME || '', '.openclaw', 'workspace')

// GET - List workspace files
export async function GET() {
  try {
    const files = [
      { name: 'AGENTS.md', description: 'Agent configuration and behavior' },
      { name: 'HEARTBEAT.md', description: 'Heartbeat tasks and checks' },
      { name: 'IDENTITY.md', description: 'Agent identity and persona' },
      { name: 'SOUL.md', description: 'Agent soul and core personality' },
      { name: 'TEAM.md', description: 'Team members and roles' },
      { name: 'TOOLS.md', description: 'Tool configurations and notes' },
      { name: 'USER.md', description: 'User information and preferences' },
      { name: 'MEMORY.md', description: 'Long-term memory storage' },
    ]
    
    const filesWithContent = files.map(file => {
      const filePath = path.join(WORKSPACE_PATH, file.name)
      let exists = false
      let content = ''
      let size = 0
      
      try {
        if (fs.existsSync(filePath)) {
          exists = true
          const stats = fs.statSync(filePath)
          size = stats.size
          content = fs.readFileSync(filePath, 'utf-8')
        }
      } catch (e) {
        // File doesn't exist
      }
      
      return {
        ...file,
        exists,
        size,
        content: exists ? content : null,
        path: filePath
      }
    })
    
    return NextResponse.json({
      success: true,
      workspacePath: WORKSPACE_PATH,
      files: filesWithContent
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
