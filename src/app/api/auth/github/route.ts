import { NextResponse } from 'next/server'
import { 
  isOAuthConfigured, 
  getOAuthConfigError,
  generateState,
  storeState,
  getGitHubAuthUrl,
  testOAuthCredentials
} from '@/lib/githubOAuth'
import { loadOAuthConfig } from '@/lib/gitAuth'

/**
 * POST /api/auth/github
 * Initiate GitHub OAuth flow
 */
export async function POST() {
  try {
    // Check if OAuth is configured
    if (!isOAuthConfigured()) {
      const error = getOAuthConfigError()
      return NextResponse.json({
        success: false,
        error: error || 'GitHub OAuth is not configured',
        setupRequired: true
      }, { status: 400 })
    }
    
    // Generate state for CSRF protection
    const state = generateState()
    storeState(state, 'github')
    
    // Generate authorization URL
    const authUrl = getGitHubAuthUrl(state)
    
    return NextResponse.json({
      success: true,
      authUrl,
      state
    })
  } catch (error: any) {
    console.error('OAuth initiate error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to initiate OAuth flow'
    }, { status: 500 })
  }
}

/**
 * GET /api/auth/github
 * Check if OAuth is configured and get status
 */
export async function GET() {
  const config = loadOAuthConfig()
  
  return NextResponse.json({
    configured: isOAuthConfigured(),
    hasClientId: !!config?.clientId,
    hasClientSecret: !!config?.clientSecret,
    clientId: config?.clientId || null, // Safe to expose (shown in URLs anyway)
    error: getOAuthConfigError()
  })
}

/**
 * PUT /api/auth/github
 * Save OAuth App configuration
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { clientId, clientSecret, provider = 'github', redirectUri } = body
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'Client ID and Client Secret are required'
      }, { status: 400 })
    }
    
    // Import here to avoid circular dependency
    const { saveOAuthConfig } = await import('@/lib/gitAuth')
    
    const result = saveOAuthConfig({
      provider,
      clientId,
      clientSecret, // Will be encrypted by saveOAuthConfig
      redirectUri: redirectUri || undefined
    })
    
    return NextResponse.json({
      success: true,
      storage: result.storage
    })
  } catch (error: any) {
    console.error('Failed to save OAuth config:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save OAuth configuration'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/github
 * Delete OAuth App configuration
 */
export async function DELETE() {
  try {
    const { deleteOAuthConfig } = await import('@/lib/gitAuth')
    deleteOAuthConfig()
    
    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    console.error('Failed to delete OAuth config:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete OAuth configuration'
    }, { status: 500 })
  }
}
