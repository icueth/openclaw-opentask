import { NextRequest, NextResponse } from 'next/server'
import { getAgent, updateAgent, deleteAgent, readOpenClawConfig } from '@/lib/agent'
import { UpdateAgentData } from '@/types/agent'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Get a specific agent
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
    
    return NextResponse.json(agent)
  } catch (error) {
    console.error('Failed to fetch agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}

// Valid models list
const VALID_MODELS = [
  'default',
  'kimi-coding/kimi-for-coding',
  'kimi-coding/k2p5',
  'anthropic/claude-sonnet-4-20250514',
  'anthropic/claude-opus-4',
  'openai/gpt-4o',
]

// PUT - Update an agent
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates: UpdateAgentData = await request.json()
    
    // Get current agent to check for model changes
    const currentAgent = getAgent(params.id)
    if (!currentAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    // Validate model if provided
    if (updates.model && updates.model !== 'default' && !VALID_MODELS.includes(updates.model)) {
      return NextResponse.json(
        { error: `Invalid model: ${updates.model}` },
        { status: 400 }
      )
    }
    
    // Track what changed
    const changes: { modelChanged: boolean; filesUpdated: string[] } = {
      modelChanged: updates.model !== undefined && updates.model !== currentAgent.model,
      filesUpdated: []
    }
    
    // Update the agent
    const agent = updateAgent(params.id, updates)
    
    // Verify openclaw.json was updated correctly
    const config = readOpenClawConfig()
    const agentInConfig = config.agents?.list?.find((a: any) => a.id === params.id)
    
    if (!agentInConfig) {
      return NextResponse.json(
        { error: 'Agent update failed - not found in configuration' },
        { status: 500 }
      )
    }
    
    // Return success with change information
    return NextResponse.json({
      ...agent,
      _meta: {
        modelChanged: changes.modelChanged,
        message: changes.modelChanged 
          ? 'Model changed. Gateway restart required for changes to take effect.'
          : undefined
      }
    })
  } catch (error) {
    console.error('Failed to update agent:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update agent'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE - Delete an agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    deleteAgent(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete agent'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
