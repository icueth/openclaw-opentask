import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import fs from 'fs'
import path from 'path'

// GET - List files in project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Project folder not found' }, { status: 404 })
    }
    
    const files = fs.readdirSync(projectPath)
      .filter(f => !f.startsWith('.') && !f.endsWith('.trash'))
      .map(fileName => {
        const filePath = path.join(projectPath, fileName)
        const stats = fs.statSync(filePath)
        
        return {
          name: fileName,
          path: filePath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        }
      })
    
    return NextResponse.json({ success: true, files, projectPath })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new file
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Project folder not found' }, { status: 404 })
    }
    
    const fileName = body.name
    if (!fileName) {
      return NextResponse.json({ error: 'File name required' }, { status: 400 })
    }
    
    const filePath = path.join(projectPath, fileName)
    
    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File already exists' }, { status: 400 })
    }
    
    // Create file or folder
    if (body.type === 'folder') {
      fs.mkdirSync(filePath, { recursive: true })
    } else {
      fs.writeFileSync(filePath, body.content || '', 'utf-8')
    }
    
    return NextResponse.json({ success: true, path: filePath })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}