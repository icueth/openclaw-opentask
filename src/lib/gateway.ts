// OpenClaw Gateway API Client

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:18789'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || ''

interface FetchOptions {
  method?: string
  body?: any
}

export async function gatewayFetch(endpoint: string, options: FetchOptions = {}) {
  const response = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  
  if (!response.ok) {
    throw new Error(`Gateway error: ${response.status}`)
  }
  
  return response.json()
}

// Gateway Tool Invoker - for calling gateway tools
export async function invokeTool(tool: string, params: any = {}) {
  return gatewayFetch('/api/invoke', {
    method: 'POST',
    body: { tool, params }
  })
}
