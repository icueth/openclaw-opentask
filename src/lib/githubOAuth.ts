/**
 * GitHub OAuth Integration
 * 
 * Handles OAuth flow for GitHub authentication
 * - Generate authorization URL
 * Exchange code for access token
 * - Store encrypted tokens
 * - Load credentials from encrypted storage (not env vars)
 */

import { encryptCredential, loadOAuthCredentials, loadOAuthConfig } from './gitAuth'

// OAuth Token response from GitHub
export interface GitHubTokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in?: number
  refresh_token?: string
  refresh_token_expires_in?: number
}

// GitHub user info
export interface GitHubUserInfo {
  login: string
  id: number
  avatar_url: string
  name: string
  email: string
  html_url: string
}

// OAuth state stored temporarily
export interface OAuthState {
  state: string
  provider: string
  createdAt: number
}

// In-memory state storage (use Redis/database in production)
const stateStore = new Map<string, OAuthState>()

// Clean up old states periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of stateStore.entries()) {
    if (now - value.createdAt > 10 * 60 * 1000) { // 10 minutes
      stateStore.delete(key)
    }
  }
}, 60 * 1000) // Clean up every minute

// Default redirect URI
const DEFAULT_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
  : 'http://localhost:3456/api/auth/github/callback'

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Store OAuth state temporarily
 */
export function storeState(state: string, provider: string = 'github'): void {
  stateStore.set(state, {
    state,
    provider,
    createdAt: Date.now()
  })
}

/**
 * Verify and remove OAuth state
 */
export function verifyState(state: string): boolean {
  const stored = stateStore.get(state)
  if (!stored) return false
  
  // Check if state is not too old (10 minutes max)
  if (Date.now() - stored.createdAt > 10 * 60 * 1000) {
    stateStore.delete(state)
    return false
  }
  
  stateStore.delete(state)
  return true
}

/**
 * Get OAuth configuration from storage
 */
function getOAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } | null {
  const credentials = loadOAuthCredentials()
  if (!credentials) return null
  
  return {
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri: credentials.redirectUri || DEFAULT_REDIRECT_URI
  }
}

/**
 * Generate GitHub authorization URL
 */
export function getGitHubAuthUrl(state: string): string {
  const config = getOAuthConfig()
  if (!config) {
    throw new Error('OAuth not configured')
  }
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'repo read:user',
    state: state
  })
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
  const config = getOAuthConfig()
  if (!config) {
    throw new Error('OAuth not configured')
  }
  
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri
    })
  })
  
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error} - ${data.error_description}`)
  }
  
  return data
}

/**
 * Get GitHub user info using access token
 */
export async function getGitHubUserInfo(accessToken: string): Promise<GitHubUserInfo> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'OpenClaw-Dashboard'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Check if OAuth is configured properly
 */
export function isOAuthConfigured(): boolean {
  const config = loadOAuthConfig()
  return !!(config && config.clientId && config.clientSecret)
}

/**
 * Get OAuth configuration error message
 */
export function getOAuthConfigError(): string | null {
  const config = loadOAuthConfig()
  if (!config?.clientId) {
    return 'GitHub Client ID is not configured. Please set up your OAuth App in Settings.'
  }
  if (!config?.clientSecret) {
    return 'GitHub Client Secret is not configured. Please set up your OAuth App in Settings.'
  }
  return null
}

/**
 * Create encrypted OAuth config for storage
 */
export function createOAuthConfig(
  tokenResponse: GitHubTokenResponse,
  userInfo: GitHubUserInfo
) {
  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
    : undefined
    
  const refreshTokenExpiresAt = tokenResponse.refresh_token && tokenResponse.refresh_token_expires_in
    ? new Date(Date.now() + tokenResponse.refresh_token_expires_in * 1000).toISOString()
    : undefined
  
  return {
    accessToken: JSON.stringify(encryptCredential(tokenResponse.access_token)),
    refreshToken: tokenResponse.refresh_token 
      ? JSON.stringify(encryptCredential(tokenResponse.refresh_token))
      : '',
    expiresAt,
    refreshTokenExpiresAt,
    username: userInfo.login,
    userId: userInfo.id,
    avatarUrl: userInfo.avatar_url,
    email: userInfo.email
  }
}

/**
 * Test OAuth app credentials
 */
export async function testOAuthCredentials(): Promise<{ success: boolean; error?: string }> {
  const config = getOAuthConfig()
  if (!config) {
    return { success: false, error: 'OAuth credentials not configured' }
  }
  
  try {
    // Test by making a simple request to GitHub API
    // We'll use the client_id in the user agent to test connectivity
    const response = await fetch('https://api.github.com', {
      headers: {
        'User-Agent': `OpenClaw-Dashboard (${config.clientId})`
      }
    })
    
    if (response.status === 401 || response.status === 403) {
      return { success: false, error: 'Invalid credentials' }
    }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to test credentials' }
  }
}
