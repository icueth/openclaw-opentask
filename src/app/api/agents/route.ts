import { NextRequest, NextResponse } from 'next/server'
import { getAgents, createAgent, deleteAgent, readOpenClawConfig } from '@/lib/agent'
import { CreateAgentData } from '@/types/agent'
import { existsSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Valid models list
const VALID_MODELS = [
  'default',
  'kimi-coding/kimi-for-coding',
  'kimi-coding/k2p5',
  'anthropic/claude-sonnet-4-20250514',
  'anthropic/claude-opus-4',
  'openai/gpt-4o',
]

// GET - List all agents
export async function GET() {
  try {
    const agents = getAgents()
    return NextResponse.json(agents)
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

// POST - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const data: CreateAgentData = await request.json()
    
    // Validate required fields
    if (!data.id?.trim()) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }
    
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'Agent Name is required' },
        { status: 400 }
      )
    }
    
    // Validate ID format (lowercase letters, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(data.id)) {
      return NextResponse.json(
        { error: 'Agent ID can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }
    
    // Validate ID length
    if (data.id.length < 2 || data.id.length > 32) {
      return NextResponse.json(
        { error: 'Agent ID must be between 2 and 32 characters' },
        { status: 400 }
      )
    }
    
    // Validate model
    if (data.model && data.model !== 'default' && !VALID_MODELS.includes(data.model)) {
      return NextResponse.json(
        { error: `Invalid model: ${data.model}. Valid models: ${VALID_MODELS.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Check if agent already exists
    const config = readOpenClawConfig()
    const existingAgent = config.agents?.list?.find(a => a.id === data.id)
    if (existingAgent) {
      return NextResponse.json(
        { error: `Agent with ID "${data.id}" already exists` },
        { status: 409 }
      )
    }
    
    // Create the agent
    const agent = await createAgent(data)
    
    // Validate that all required files were created
    const requiredFiles = ['SOUL.md', 'IDENTITY.md', 'AGENTS.md', 'MEMORY.md', 'TOOLS.md', 'HEARTBEAT.md', 'USER.md']
    const missingFiles: string[] = []
    
    for (const file of requiredFiles) {
      const filePath = join(agent.workspace, file)
      if (!existsSync(filePath)) {
        missingFiles.push(file)
      }
    }
    
    if (missingFiles.length > 0) {
      return NextResponse.json(
        { 
          error: `Agent created but some files are missing: ${missingFiles.join(', ')}`,
          agent,
          missingFiles
        },
        { status: 500 }
      )
    }
    
    // Validate openclaw.json was updated
    const updatedConfig = readOpenClawConfig()
    const agentInConfig = updatedConfig.agents?.list?.find(a => a.id === data.id)
    if (!agentInConfig) {
      return NextResponse.json(
        { error: 'Agent created but not found in openclaw.json', agent },
        { status: 500 }
      )
    }
    
    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create agent'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
