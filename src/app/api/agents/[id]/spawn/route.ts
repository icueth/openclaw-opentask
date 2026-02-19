import { NextResponse } from 'next/server'
import { subagents } from '@/lib/subagents'

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
      // Simulate spawn for development
      const mockSpawn = {
        id: `spawn-${Date.now()}`,
        parentAgentId: agentId,
        task,
        status: 'spawning',
        createdAt: new Date().toISOString()
      }
      
      // Track in our store
      subagents.add({
        id: mockSpawn.id,
        parentAgentId: agentId,
        task,
        status: 'running',
        createdAt: mockSpawn.createdAt
      })
      
      return NextResponse.json(mockSpawn)
    }

    const data = await response.json()
    
    // Track the subagent
    subagents.add({
      id: data.id || `spawn-${Date.now()}`,
      parentAgentId: agentId,
      task,
      status: 'running',
      createdAt: new Date().toISOString(),
      sessionKey: data.sessionKey
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to spawn sub-agent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to spawn sub-agent' },
      { status: 500 }
    )
  }
}

// GET - Get sub-agents for this agent
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const subagentList = subagents.getByParentId(agentId)
    
    return NextResponse.json(subagentList)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
