import { NextResponse } from 'next/server'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:18789'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || ''

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST - Spawn a new sub-agent
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const body = await request.json()
    
    const { task, prompt, model, thinking } = body
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task is required' }, 
        { status: 400 }
      )
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (GATEWAY_TOKEN) {
      headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`
    }

    // Call the gateway's subagents_spawn endpoint
    const response = await fetch(`${GATEWAY_URL}/api/subagents_spawn`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parentAgentId: agentId,
        task,
        prompt: prompt || `You are a sub-agent spawned by ${agentId}. Task: ${task}`,
        model: model || 'kimi-coding/kimi-for-coding',
        thinking: thinking || 'off'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gateway spawn error:', errorText)
      return NextResponse.json(
        { error: 'Failed to spawn sub-agent via gateway' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to spawn sub-agent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to spawn sub-agent' },
      { status: 500 }
    )
  }
}

// GET - Get sub-agents status from gateway
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headers: HeadersInit = {}
    
    if (GATEWAY_TOKEN) {
      headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`
    }

    const response = await fetch(`${GATEWAY_URL}/api/subagents`, {
      headers
    })

    if (!response.ok) {
      return NextResponse.json([])
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to get sub-agents:', error)
    return NextResponse.json([])
  }
}
