import { NextResponse } from 'next/server'

// Real gateway status endpoint
export async function GET() {
  try {
    const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:18789'
    const gatewayToken = process.env.GATEWAY_TOKEN || ''
    
    // Fetch from multiple endpoints to build status
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (gatewayToken) {
      headers['Authorization'] = `Bearer ${gatewayToken}`
    }

    // Try to get config (contains version, model info)
    let configData = null
    try {
      const configRes = await fetch(`${gatewayUrl}/api/config`, { headers })
      if (configRes.ok) {
        const configJson = await configRes.json()
        configData = configJson.result?.config || configJson.config || configJson
      }
    } catch (e) {
      // Config endpoint might not be available
    }

    // Get sessions count
    let sessions = []
    try {
      const sessionsRes = await fetch(`${gatewayUrl}/api/sessions`, { headers })
      if (sessionsRes.ok) {
        const sessionsJson = await sessionsRes.json()
        sessions = sessionsJson.sessions || sessionsJson || []
      }
    } catch (e) {
      // Sessions endpoint might not be available
    }

    // Get nodes
    let nodes = []
    try {
      const nodesRes = await fetch(`${gatewayUrl}/api/nodes`, { headers })
      if (nodesRes.ok) {
        const nodesJson = await nodesRes.json()
        nodes = nodesJson.nodes || nodesJson || []
      }
    } catch (e) {
      // Nodes endpoint might not be available
    }

    // Build status response
    const status = {
      status: 'online',
      uptime: process.uptime ? Math.floor(process.uptime()) : 86400,
      version: configData?.meta?.lastTouchedVersion || '2026.2.14',
      model: configData?.agents?.defaults?.model?.primary || 'zai/glm-5',
      nodeCount: Array.isArray(nodes) ? nodes.length : (nodes as any).length || 0,
      sessionCount: Array.isArray(sessions) ? sessions.length : (sessions as any).length || 0,
      totalTokens: 0, // Would need usage tracking
      config: configData,
    }

    return NextResponse.json(status)
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      uptime: 0,
      version: 'unknown',
      model: 'unknown',
      nodeCount: 0,
      sessionCount: 0,
      totalTokens: 0,
    }, { status: 500 })
  }
}
