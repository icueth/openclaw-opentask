// OpenClaw API Configuration
export const OPENCLAW_CONFIG = {
  gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:18789',
  gatewayToken: process.env.NEXT_PUBLIC_GATEWAY_TOKEN || '',
}

// API Helper
export async function fetchGateway(endpoint: string) {
  const response = await fetch(`${OPENCLAW_CONFIG.gatewayUrl}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${OPENCLAW_CONFIG.gatewayToken}`,
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`Gateway error: ${response.status}`)
  }
  
  return response.json()
}

// Types
export interface NodeInfo {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline'
  lastSeen: string
  platform: string
  version: string
}

export interface SessionInfo {
  key: string
  channel: string
  model: string
  lastActivity: string
  messageCount: number
}

export interface GatewayStatus {
  status: 'online' | 'offline'
  uptime: number
  version: string
  model: string
  nodeCount: number
  sessionCount: number
  totalTokens: number
}

export interface ActivityLog {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  source: string
}
