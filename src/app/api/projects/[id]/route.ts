import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { store } from '@/lib/store'

// GET project details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Get project from store first
    const project = store.getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const projectPath = project.workspace || project.path
    
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Project folder not found' }, { status: 404 })
    }
    
    // Load config from disk
    const configPath = path.join(projectPath, 'PROJECT.json')
    let config: any = { id: projectId, name: projectId, agentId: project.agentId }
    
    if (fs.existsSync(configPath)) {
      try {
        config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) }
      } catch (e) {}
    }
    
    // Merge with store data
    config = { ...project, ...config }
    
    // List all files with content preview
    const files = fs.readdirSync(projectPath)
      .filter(f => !f.startsWith('.'))
      .map(fileName => {
        const filePath = path.join(projectPath, fileName)
        const stats = fs.statSync(filePath)
        
        let content = ''
        let preview = ''
        
        if (stats.isFile() && stats.size < 100000) { // Only read files < 100KB
          try {
            content = fs.readFileSync(filePath, 'utf-8')
            preview = content.slice(0, 200) + (content.length > 200 ? '...' : '')
          } catch (e) {}
        }
        
        return {
          name: fileName,
          path: filePath,
          size: stats.size,
          isDirectory: stats.isDirectory(),
          modified: stats.mtime,
          preview,
          content: stats.isFile() ? content : null
        }
      })
    
    return NextResponse.json({
      success: true,
      project: {
        ...config,
        path: projectPath,
        files
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update project config
export async function PUT(
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
    
    // Update config on disk
    const configPath = path.join(projectPath, 'PROJECT.json')
    let config: any = {}
    
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      } catch (e) {}
    }
    
    // Merge updates
    config = {
      ...config,
      ...body,
      id: projectId, // Prevent id change
      updatedAt: new Date().toISOString()
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    
    // Update JSON store
    store.updateProject(projectId, {
      name: config.name,
      description: config.description || '',
      agentId: config.agentId || project.agentId,
      workspace: projectPath
    })
    
    return NextResponse.json({ success: true, project: config })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE project
export async function DELETE(
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
    
    // Move to trash instead of deleting
    const trashPath = projectPath + '.trash-' + Date.now()
    fs.renameSync(projectPath, trashPath)
    
    // Remove from JSON store
    store.deleteProject(projectId)
    
    return NextResponse.json({ 
      success: true,
      message: `Project "${projectId}" moved to trash`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}