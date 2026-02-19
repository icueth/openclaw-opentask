import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const WORKSPACE_PATH = path.join(process.env.HOME || '', '.openclaw', 'workspace')
const MEMORY_PATH = path.join(WORKSPACE_PATH, 'memory')

// GET single file
export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const fileName = decodeURIComponent(params.name)
    const filePath = path.join(WORKSPACE_PATH, fileName)
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        error: 'File not found',
        exists: false,
        content: ''
      }, { status: 404 })
    }
    
    const content = fs.readFileSync(filePath, 'utf-8')
    const stats = fs.statSync(filePath)
    
    return NextResponse.json({
      success: true,
      name: fileName,
      path: filePath,
      content,
      size: stats.size,
      modified: stats.mtime
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update file
export async function PUT(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const fileName = decodeURIComponent(params.name)
    const body = await request.json()
    const { content } = body
    
    if (content === undefined) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    
    const filePath = path.join(WORKSPACE_PATH, fileName)
    
    // Ensure workspace exists
    if (!fs.existsSync(WORKSPACE_PATH)) {
      fs.mkdirSync(WORKSPACE_PATH, { recursive: true })
    }
    
    // Create backup
    if (fs.existsSync(filePath)) {
      const backupPath = filePath + '.backup'
      fs.copyFileSync(filePath, backupPath)
    }
    
    // Write new content
    fs.writeFileSync(filePath, content, 'utf-8')
    
    return NextResponse.json({
      success: true,
      message: `${fileName} updated successfully`,
      path: filePath
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE file
export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const fileName = decodeURIComponent(params.name)
    const filePath = path.join(WORKSPACE_PATH, fileName)
    
    // Don't delete certain files
    const protectedFiles = ['AGENTS.md', 'SOUL.md']
    if (protectedFiles.includes(fileName)) {
      return NextResponse.json({ 
        error: 'Cannot delete protected file. Clear content instead.' 
      }, { status: 400 })
    }
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Move to trash instead of delete
    const trashPath = filePath + '.trash'
    fs.renameSync(filePath, trashPath)
    
    return NextResponse.json({
      success: true,
      message: `${fileName} moved to trash`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
