import { NextResponse } from 'next/server'
import { 
  loadProjectAuth, 
  saveProjectAuth, 
  deleteProjectAuth,
  getProjectEffectiveAuth,
  encryptCredential
} from '@/lib/gitAuth'
import { ProjectGitAuthConfig, GitAuthMethod } from '@/types/gitAuth'

// GET /api/projects/[id]/git-auth - Get project-specific auth config
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const projectAuth = loadProjectAuth(projectId)
    const effectiveAuth = getProjectEffectiveAuth(projectId)
    
    return NextResponse.json({
      success: true,
      projectAuth: projectAuth ? {
        useGlobal: projectAuth.useGlobal,
        method: projectAuth.method,
        provider: projectAuth.provider
      } : null,
      effectiveAuth: effectiveAuth ? {
        method: effectiveAuth.method,
        provider: effectiveAuth.provider
      } : null,
      usingGlobal: !projectAuth || projectAuth.useGlobal
    })
  } catch (error: any) {
    console.error('GET project git-auth error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// POST /api/projects/[id]/git-auth - Save project-specific auth config
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()
    const { useGlobal, method, provider, pat, ssh, oauth } = body
    
    if (useGlobal) {
      // Just set to use global, don't store credentials
      saveProjectAuth(projectId, {
        useGlobal: true,
        method: 'none',
        provider: 'github'
      })
      
      return NextResponse.json({
        success: true,
        message: 'Using global authentication settings'
      })
    }
    
    // Validate
    if (!method || !['pat', 'ssh', 'oauth', 'none'].includes(method)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid authentication method'
      }, { status: 400 })
    }
    
    const config: ProjectGitAuthConfig = {
      useGlobal: false,
      method: method as GitAuthMethod,
      provider: provider || 'github'
    }
    
    // Handle PAT
    if (method === 'pat' && pat?.token) {
      config.pat = {
        token: JSON.stringify(encryptCredential(pat.token)),
        username: pat.username || ''
      }
    }
    
    // Handle SSH
    if (method === 'ssh' && ssh?.privateKeyPath) {
      config.ssh = {
        privateKeyPath: ssh.privateKeyPath,
        publicKeyPath: ssh.publicKeyPath || `${ssh.privateKeyPath}.pub`,
        passphrase: ssh.passphrase ? JSON.stringify(encryptCredential(ssh.passphrase)) : undefined
      }
    }
    
    // Handle OAuth
    if (method === 'oauth' && oauth?.accessToken) {
      config.oauth = {
        accessToken: JSON.stringify(encryptCredential(oauth.accessToken)),
        refreshToken: oauth.refreshToken ? JSON.stringify(encryptCredential(oauth.refreshToken)) : '',
        expiresAt: oauth.expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
        username: oauth.username
      }
    }
    
    saveProjectAuth(projectId, config)
    
    return NextResponse.json({
      success: true,
      message: 'Project-specific authentication saved'
    })
  } catch (error: any) {
    console.error('POST project git-auth error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/git-auth - Remove project-specific auth
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    deleteProjectAuth(projectId)
    
    return NextResponse.json({
      success: true,
      message: 'Project-specific authentication removed (using global)'
    })
  } catch (error: any) {
    console.error('DELETE project git-auth error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
