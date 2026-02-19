import { NextResponse } from 'next/server'
import { 
  loadCredentials, 
  saveCredentials, 
  deleteCredentials, 
  getAuthStatus,
  testAuth,
  encryptCredential
} from '@/lib/gitAuth'
import { GitAuthConfig, GitAuthMethod } from '@/types/gitAuth'

// GET /api/settings/git-auth - Get current auth config (without sensitive data)
export async function GET() {
  try {
    const status = getAuthStatus()
    const config = loadCredentials()
    
    // Return safe version (without encrypted data)
    return NextResponse.json({
      success: true,
      status,
      config: config ? {
        method: config.method,
        provider: config.provider,
        pat: config.pat ? {
          username: config.pat.username,
          hasToken: true
        } : undefined,
        ssh: config.ssh ? {
          privateKeyPath: config.ssh.privateKeyPath,
          publicKeyPath: config.ssh.publicKeyPath,
          hasPassphrase: !!config.ssh.passphrase
        } : undefined,
        oauth: config.oauth ? {
          username: config.oauth.username,
          expiresAt: config.oauth.expiresAt,
          hasAccessToken: true,
          hasRefreshToken: !!config.oauth.refreshToken
        } : undefined
      } : null
    })
  } catch (error: any) {
    console.error('GET git-auth error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// POST /api/settings/git-auth - Save/update auth config
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { method, provider, pat, ssh, oauth } = body
    
    // Validate
    if (!method || !['pat', 'ssh', 'oauth', 'none'].includes(method)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid authentication method'
      }, { status: 400 })
    }
    
    const config: GitAuthConfig = {
      method: method as GitAuthMethod,
      provider: provider || 'github',
      createdAt: new Date().toISOString()
    }
    
    // Handle PAT
    if (method === 'pat' && pat) {
      if (!pat.token || pat.token.length < 10) {
        return NextResponse.json({
          success: false,
          error: 'Invalid PAT token'
        }, { status: 400 })
      }
      
      config.pat = {
        token: JSON.stringify(encryptCredential(pat.token)),
        username: pat.username || ''
      }
    }
    
    // Handle SSH
    if (method === 'ssh' && ssh) {
      if (!ssh.privateKeyPath) {
        return NextResponse.json({
          success: false,
          error: 'SSH private key path is required'
        }, { status: 400 })
      }
      
      config.ssh = {
        privateKeyPath: ssh.privateKeyPath,
        publicKeyPath: ssh.publicKeyPath || `${ssh.privateKeyPath}.pub`,
        passphrase: ssh.passphrase ? JSON.stringify(encryptCredential(ssh.passphrase)) : undefined
      }
    }
    
    // Handle OAuth
    if (method === 'oauth' && oauth) {
      if (!oauth.accessToken) {
        return NextResponse.json({
          success: false,
          error: 'OAuth access token is required'
        }, { status: 400 })
      }
      
      config.oauth = {
        accessToken: JSON.stringify(encryptCredential(oauth.accessToken)),
        refreshToken: oauth.refreshToken ? JSON.stringify(encryptCredential(oauth.refreshToken)) : '',
        expiresAt: oauth.expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
        username: oauth.username
      }
    }
    
    // Save credentials
    const result = saveCredentials(config)
    
    return NextResponse.json({
      success: true,
      storage: result.storage,
      status: getAuthStatus()
    })
  } catch (error: any) {
    console.error('POST git-auth error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// DELETE /api/settings/git-auth - Remove credentials
export async function DELETE() {
  try {
    deleteCredentials()
    
    return NextResponse.json({
      success: true,
      message: 'Credentials cleared',
      status: getAuthStatus()
    })
  } catch (error: any) {
    console.error('DELETE git-auth error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
