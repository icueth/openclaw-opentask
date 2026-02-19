import { NextRequest, NextResponse } from 'next/server'
import { getProjects, createProject } from '@/lib/project'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - List all projects
export async function GET() {
  try {
    const projects = getProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
    )
    }
    
    const project = createProject({
      name: data.name,
      description: data.description,
      agentId: data.agentId
    })
    
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
