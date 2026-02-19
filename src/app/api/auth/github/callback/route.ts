import { NextResponse } from 'next/server'
import { 
  verifyState,
  exchangeCodeForToken,
  getGitHubUserInfo,
  createOAuthConfig
} from '@/lib/githubOAuth'
import { saveCredentials, getAuthStatus } from '@/lib/gitAuth'

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')
    
    // Build redirect URL back to settings
    const baseRedirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3456'
    const settingsUrl = `${baseRedirectUrl}/settings/git-auth`
    
    // Handle user denial or GitHub error
    if (error) {
      const redirectUrl = new URL(settingsUrl)
      redirectUrl.searchParams.set('error', error)
      if (errorDescription) {
        redirectUrl.searchParams.set('error_description', errorDescription)
      }
      return NextResponse.redirect(redirectUrl.toString())
    }
    
    // Validate required parameters
    if (!code) {
      const redirectUrl = new URL(settingsUrl)
      redirectUrl.searchParams.set('error', 'missing_code')
      redirectUrl.searchParams.set('error_description', 'Authorization code is missing')
      return NextResponse.redirect(redirectUrl.toString())
    }
    
    if (!state) {
      const redirectUrl = new URL(settingsUrl)
      redirectUrl.searchParams.set('error', 'missing_state')
      redirectUrl.searchParams.set('error_description', 'State parameter is missing')
      return NextResponse.redirect(redirectUrl.toString())
    }
    
    // Verify state to prevent CSRF
    if (!verifyState(state)) {
      const redirectUrl = new URL(settingsUrl)
      redirectUrl.searchParams.set('error', 'invalid_state')
      redirectUrl.searchParams.set('error_description', 'Security check failed. Please try again.')
      return NextResponse.redirect(redirectUrl.toString())
    }
    
    // Exchange code for access token
    let tokenResponse
    try {
      tokenResponse = await exchangeCodeForToken(code)
    } catch (err: any) {
      console.error('Token exchange failed:', err)
      const redirectUrl = new URL(settingsUrl)
      redirectUrl.searchParams.set('error', 'token_exchange_failed')
      redirectUrl.searchParams.set('error_description', err.message || 'Failed to exchange authorization code')
      return NextResponse.redirect(redirectUrl.toString())
    }
    
    // Get user info from GitHub
    let userInfo
    try {
      userInfo = await getGitHubUserInfo(tokenResponse.access_token)
    } catch (err: any) {
      console.error('Failed to get user info:', err)
      const redirectUrl = new URL(settingsUrl)
      redirectUrl.searchParams.set('error', 'user_info_failed')
      redirectUrl.searchParams.set('error_description', err.message || 'Failed to get user information')
      return NextResponse.redirect(redirectUrl.toString())
    }
    
    // Create OAuth config with encrypted tokens
    const oauthConfig = createOAuthConfig(tokenResponse, userInfo)
    
    // Save credentials
    const config = {
      method: 'oauth' as const,
      provider: 'github' as const,
      oauth: oauthConfig,
      createdAt: new Date().toISOString()
    }
    
    const result = saveCredentials(config)
    
    // Redirect back to settings with success
    const redirectUrl = new URL(settingsUrl)
    redirectUrl.searchParams.set('success', '1')
    redirectUrl.searchParams.set('method', 'oauth')
    redirectUrl.searchParams.set('username', userInfo.login)
    
    return NextResponse.redirect(redirectUrl.toString())
    
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    
    const baseRedirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3456'
    const redirectUrl = new URL(`${baseRedirectUrl}/settings/git-auth`)
    redirectUrl.searchParams.set('error', 'internal_error')
    redirectUrl.searchParams.set('error_description', error.message || 'An unexpected error occurred')
    
    return NextResponse.redirect(redirectUrl.toString())
  }
}
