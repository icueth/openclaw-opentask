import { NextResponse } from 'next/server'
import { taskQueue } from '@/lib/taskQueue'

// GET /api/tasks - List all tasks (optionally filtered)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    
    let tasks = taskQueue.getAllTasks()
    
    // Apply filters
    if (projectId) {
      tasks = tasks.filter(t => t.projectId === projectId)
    }
    
    if (status) {
      const statusList = status.split(',') as any[]
      tasks = tasks.filter(t => statusList.includes(t.status))
    }
    
    // Sort by createdAt desc
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
