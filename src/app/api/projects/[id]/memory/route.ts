import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { store } from '@/lib/store'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = store.getProjectById(params.id)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const memoryPath = path.join(project.path || project.workspace || '', 'MEMORY.md')
    
    if (!fs.existsSync(memoryPath)) {
      return NextResponse.json({ success: false, error: 'Memory file not found' }, { status: 404 })
    }

    const content = fs.readFileSync(memoryPath, 'utf-8')
    
    return NextResponse.json({ success: true, content })
  } catch (error: any) {
    console.error('Failed to read memory:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = store.getProjectById(params.id)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { content } = await request.json()
    
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be a string' }, { status: 400 })
    }

    const memoryPath = path.join(project.path || project.workspace || '', 'MEMORY.md')
    
    fs.writeFileSync(memoryPath, content, 'utf-8')
    
    return NextResponse.json({ success: true, message: 'Memory updated' })
  } catch (error: any) {
    console.error('Failed to write memory:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}