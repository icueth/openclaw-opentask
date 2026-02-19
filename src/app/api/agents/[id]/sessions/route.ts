import { NextResponse } from 'next/server'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:18789'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || ''

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Get sessions for a specific agent
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (GATEWAY_TOKEN) {
      headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`
    }

    // Get all sessions from gateway
    const response = await fetch(`${GATEWAY_URL}/api/sessions`, { 
      headers,
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return NextResponse.json(getMockSessions(agentId))
    }

    const data = await response.json()
    
    // Filter sessions for this agent
    const allSessions = data.sessions || data || []
    const agentSessions = allSessions.filter((session: any) => {
      const sessionKey = session.key || session.sessionKey || session.id || ''
      return sessionKey.includes(agentId)
    })

    // Transform the response
    const sessions = agentSessions.map((session: any) => ({
      key: session.key || session.sessionKey || session.id,
      channel: session.channel || session.provider || 'unknown',
      model: session.model || 'Unknown',
      lastActivity: session.lastActivity || session.lastMessageAt || 'Unknown',
      messageCount: session.messageCount || session.messages?.length || 0,
      status: session.status || 'active'
    }))

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Failed to fetch agent sessions:', error)
    return NextResponse.json(getMockSessions(params.id))
  }
}

function getMockSessions(agentId: string) {
  return [
    {
      key: `${agentId}:main`,
      channel: 'telegram',
      model: 'kimi-coding/kimi-for-coding',
      lastActivity: '1 min ago',
      messageCount: 156,
      status: 'active'
    }
  ]
}
