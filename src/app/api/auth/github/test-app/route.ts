import { NextResponse } from 'next/server'
import { loadOAuthCredentials } from '@/lib/gitAuth'

/**
 * POST /api/auth/github/test-app
 * Test OAuth App credentials by attempting a token exchange validation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientId, clientSecret, redirectUri } = body
    
    // Use provided credentials or load from storage
    let testClientId = clientId
    let testClientSecret = clientSecret
    let testRedirectUri = redirectUri
    
    if (!testClientId || !testClientSecret) {
      // Try loading from storage
      const stored = loadOAuthCredentials()
      if (!stored) {
        return NextResponse.json({
          success: false,
          error: 'No OAuth credentials configured'
        }, { status: 400 })
      }
      testClientId = stored.clientId
      testClientSecret = stored.clientSecret
      testRedirectUri = stored.redirectUri
    }
    
    // Test by making a request to GitHub's OAuth endpoint
    // We'll send a dummy code which should return an error about invalid code
    // But if credentials are wrong, we'll get a different error
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: testClientId,
          client_secret: testClientSecret,
          code: 'test_dummy_code_12345',
          redirect_uri: testRedirectUri || 'http://localhost:3456/api/auth/github/callback'
        })
      })
      
      const data = await response.json()
      
      // Check the error type
      if (data.error === 'bad_verification_code') {
        // This is expected! Credentials are valid, just the code is wrong
        return NextResponse.json({
          success: true,
          message: 'Credentials are valid'
        })
      }
      
      if (data.error === 'incorrect_client_credentials') {
        return NextResponse.json({
          success: false,
          error: 'Invalid Client ID or Client Secret'
        }, { status: 400 })
      }
      
      if (data.error_description) {
        return NextResponse.json({
          success: false,
          error: data.error_description
        }, { status: 400 })
      }
      
      // Unknown response
      return NextResponse.json({
        success: false,
        error: `Unexpected response: ${data.error || 'Unknown error'}`
      }, { status: 400 })
      
    } catch (fetchError: any) {
      return NextResponse.json({
        success: false,
        error: `Failed to connect to GitHub: ${fetchError.message}`
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('OAuth test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to test OAuth credentials'
    }, { status: 500 })
  }
}
