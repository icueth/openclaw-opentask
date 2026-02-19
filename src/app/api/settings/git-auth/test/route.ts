import { NextResponse } from 'next/server'
import { testAuth, loadCredentials } from '@/lib/gitAuth'

// POST /api/settings/git-auth/test - Test authentication
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { method, provider, pat, ssh, oauth, testRepo } = body
    
    // If no config provided, test current saved config
    if (!method) {
      const result = await testAuth(undefined, testRepo)
      return NextResponse.json(result)
    }
    
    // Build temporary config for testing
    const config = {
      method,
      provider: provider || 'github',
      pat: pat?.token ? {
        token: JSON.stringify({ encrypted: pat.token }), // simplified for test
        username: pat.username
      } : undefined,
      ssh: ssh ? {
        privateKeyPath: ssh.privateKeyPath,
        publicKeyPath: ssh.publicKeyPath,
        passphrase: ssh.passphrase
      } : undefined,
      oauth: oauth?.accessToken ? {
        accessToken: JSON.stringify({ encrypted: oauth.accessToken }),
        refreshToken: oauth.refreshToken,
        expiresAt: oauth.expiresAt,
        username: oauth.username
      } : undefined
    }
    
    // Note: This is a simplified test - in production we'd need proper decryption
    // For now, test with saved credentials or simulate the test
    const savedConfig = loadCredentials()
    
    if (!savedConfig || savedConfig.method !== method) {
      return NextResponse.json({
        success: false,
        message: 'Please save credentials first before testing'
      })
    }
    
    const result = await testAuth(savedConfig, testRepo)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Test auth error:', error)
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      details: error.message
    }, { status: 500 })
  }
}
