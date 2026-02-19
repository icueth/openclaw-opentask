import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:18789'
    const gatewayToken = process.env.GATEWAY_TOKEN || ''
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (gatewayToken) {
      headers['Authorization'] = `Bearer ${gatewayToken}`
    }

    const response = await fetch(`${gatewayUrl}/api/sessions`, { headers })
    
    if (!response.ok) {
      return NextResponse.json(getMockSessions())
    }

    const data = await response.json()
    
    // Transform gateway response
    const sessions = (data.sessions || data || []).map((session: any) => ({
      key: session.key || session.sessionKey || session.id,
      channel: session.channel || session.provider || 'unknown',
      model: session.model || 'Unknown',
      lastActivity: session.lastActivity || session.lastMessageAt || 'Unknown',
      messageCount: session.messageCount || session.messages?.length || 0,
    }))

    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json(getMockSessions())
  }
}

function getMockSessions() {
  return [
    {
      key: 'agent:main:main',
      channel: 'telegram',
      model: 'GLM-5',
      lastActivity: '1 min ago',
      messageCount: 156
    },
  ]
}
