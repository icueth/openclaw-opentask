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

    const response = await fetch(`${gatewayUrl}/api/nodes`, { headers })
    
    if (!response.ok) {
      // Fallback to mock data if gateway not available
      return NextResponse.json(getMockNodes())
    }

    const data = await response.json()
    
    // Transform gateway response to our format
    const nodes = (data.nodes || data || []).map((node: any) => ({
      id: node.id || node.nodeId || node.name,
      name: node.name || node.hostname || 'Unknown Node',
      ip: node.ip || node.address || '0.0.0.0',
      status: node.status || (node.connected ? 'online' : 'offline'),
      platform: node.platform || node.os || 'Unknown',
      version: node.version || 'Unknown',
      lastSeen: node.lastSeen || node.lastConnected || 'Unknown',
    }))

    return NextResponse.json(nodes)
  } catch (error) {
    // Return mock data on error
    return NextResponse.json(getMockNodes())
  }
}

function getMockNodes() {
  return [
    {
      id: 'macbook-local',
      name: 'MacBook Pro ของ iCue',
      ip: '192.168.1.219',
      status: 'online',
      platform: 'macOS',
      version: '2026.2.14',
      lastSeen: 'Just now'
    },
  ]
}
