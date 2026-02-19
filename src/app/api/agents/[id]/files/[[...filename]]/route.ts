import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getAgent } from '@/lib/agent'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Get file content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = getAgent(params.id)
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Get file name from URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const fileName = decodeURIComponent(segments[segments.length - 1])

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name required' },
        { status: 400 }
      )
    }

    const filePath = join(agent.workspace, fileName)

    // Security check - ensure file is within workspace
    if (!filePath.startsWith(agent.workspace)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      )
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({
        success: true,
        content: '',
        exists: false
      })
    }

    const content = readFileSync(filePath, 'utf-8')
    return NextResponse.json({
      success: true,
      content,
      exists: true
    })
  } catch (error) {
    console.error('Failed to read file:', error)
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    )
  }
}

// PUT - Update file content
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = getAgent(params.id)
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Get file name from URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const fileName = decodeURIComponent(segments[segments.length - 1])

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name required' },
        { status: 400 }
      )
    }

    const filePath = join(agent.workspace, fileName)

    // Security check - ensure file is within workspace
    if (!filePath.startsWith(agent.workspace)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      )
    }

    const { content } = await request.json()
    writeFileSync(filePath, content || '', 'utf-8')

    return NextResponse.json({
      success: true,
      message: 'File saved successfully'
    })
  } catch (error) {
    console.error('Failed to write file:', error)
    return NextResponse.json(
      { error: 'Failed to write file' },
      { status: 500 }
    )
  }
}
