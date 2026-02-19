import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import fs from 'fs'
import path from 'path'

// GET project file content
export async function GET(
  request: Request,
  { params }: { params: { id: string; filename: string } }
) {
  try {
    const projectId = params.id
    const fileName = decodeURIComponent(params.filename)
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    const filePath = path.join(projectPath, fileName)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    const content = fs.readFileSync(filePath, 'utf-8')
    const stats = fs.statSync(filePath)
    
    return NextResponse.json({
      success: true,
      name: fileName,
      content,
      size: stats.size,
      modified: stats.mtime
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update project file
export async function PUT(
  request: Request,
  { params }: { params: { id: string; filename: string } }
) {
  try {
    const projectId = params.id
    const fileName = decodeURIComponent(params.filename)
    const body = await request.json()
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    const filePath = path.join(projectPath, fileName)
    
    // Backup
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, filePath + '.backup')
    }
    
    // Write
    fs.writeFileSync(filePath, body.content || '', 'utf-8')
    
    return NextResponse.json({ success: true, message: 'File saved' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE file
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; filename: string } }
) {
  try {
    const projectId = params.id
    const fileName = decodeURIComponent(params.filename)
    
    // Get project from store
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    const filePath = path.join(projectPath, fileName)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Move to trash
    fs.renameSync(filePath, filePath + '.trash')
    
    return NextResponse.json({ success: true, message: 'File deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}