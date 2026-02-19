'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import GlassCard from '@/components/GlassCard'
import HolographicText from '@/components/HolographicText'
import NeonButton from '@/components/NeonButton'
import SetupGuideModal from '@/components/SetupGuideModal'
import { 
  Key, Lock, Shield, Unlock, CheckCircle, XCircle, 
  AlertCircle, ExternalLink, Save, Trash2, TestTube,
  Github, GitBranch, KeyRound, Fingerprint, Loader2,
  Eye, EyeOff, HelpCircle, Copy
} from 'lucide-react'

type AuthMethod = 'pat' | 'ssh' | 'oauth' | 'none'
type AuthProvider = 'github' | 'gitlab' | 'bitbucket' | 'other'

interface GitAuthState {
  method: AuthMethod
  provider: AuthProvider
  pat: {
    token: string
    username: string
  }
  ssh: {
    privateKeyPath: string
    publicKeyPath: string
    passphrase: string
  }
  oauth: {
    username: string
  }
}

interface OAuthAppState {
  clientId: string
  clientSecret: string
  showSecret: boolean
  configured: boolean
  loading: boolean
}

export default function GitAuthSettingsPage() {
  const [activeTab, setActiveTab] = useState<AuthMethod>('pat')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [oauthConnecting, setOauthConnecting] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [testingApp, setTestingApp] = useState(false)
  
  // OAuth App configuration state
  const [oauthApp, setOauthApp] = useState<OAuthAppState>({
    clientId: '',
    clientSecret: '',
    showSecret: false,
    configured: false,
    loading: false
  })
  
  const [auth, setAuth] = useState<GitAuthState>({
    method: 'pat',
    provider: 'github',
    pat: { token: '', username: '' },
    ssh: { privateKeyPath: '', publicKeyPath: '', passphrase: '' },
    oauth: { username: '' }
  })

  const callbackUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth/github/callback`
    : 'http://localhost:3456/api/auth/github/callback'

  useEffect(() => {
    fetchAuthStatus()
    checkOAuthAppConfig()
    handleOAuthCallback()
  }, [])

  // Check OAuth App configuration status
  async function checkOAuthAppConfig() {
    try {
      const res = await fetch('/api/auth/github')
      const data = await res.json()
      setOauthApp(prev => ({
        ...prev,
        configured: data.configured,
        clientId: data.clientId || ''
      }))
    } catch (error) {
      console.error('Failed to check OAuth app config:', error)
      setOauthApp(prev => ({ ...prev, configured: false }))
    }
  }

  // Handle OAuth callback from URL params
  const handleOAuthCallback = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    const success = url.searchParams.get('success')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')
    const username = url.searchParams.get('username')
    
    if (success) {
      setMessage({ 
        type: 'success', 
        text: username ? `Successfully connected GitHub account: @${username}` : 'GitHub account connected successfully'
      })
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname)
      // Refresh auth status
      fetchAuthStatus()
    } else if (error) {
      let errorText = 'OAuth failed'
      
      switch (error) {
        case 'access_denied':
          errorText = 'Authorization denied. You can try again.'
          break
        case 'invalid_state':
          errorText = 'Security check failed. Please try again.'
          break
        case 'missing_code':
        case 'token_exchange_failed':
          errorText = errorDescription || 'Failed to complete authorization. Please try again.'
          break
        default:
          errorText = errorDescription || `OAuth error: ${error}`
      }
      
      setMessage({ type: 'error', text: errorText })
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function fetchAuthStatus() {
    try {
      const res = await fetch('/api/settings/git-auth')
      const data = await res.json()
      
      if (data.success) {
        setStatus(data.status)
        if (data.config) {
          setActiveTab(data.config.method)
          setAuth(prev => ({
            ...prev,
            method: data.config.method,
            provider: data.config.provider,
            pat: { ...prev.pat, username: data.config.pat?.username || '' },
            ssh: data.config.ssh ? {
              privateKeyPath: data.config.ssh.privateKeyPath,
              publicKeyPath: data.config.ssh.publicKeyPath || '',
              passphrase: ''
            } : prev.ssh,
            oauth: { username: data.config.oauth?.username || '' }
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch auth status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveAuth() {
    setSaving(true)
    setMessage(null)
    
    try {
      const body: any = {
        method: activeTab,
        provider: auth.provider
      }
      
      if (activeTab === 'pat') {
        body.pat = auth.pat
      } else if (activeTab === 'ssh') {
        body.ssh = auth.ssh
      } else if (activeTab === 'oauth') {
        body.oauth = auth.oauth
      }
      
      const res = await fetch('/api/settings/git-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setStatus(data.status)
        setMessage({ type: 'success', text: `Credentials saved to ${data.storage}` })
        // Clear sensitive fields
        setAuth(prev => ({
          ...prev,
          pat: { ...prev.pat, token: '' },
          ssh: { ...prev.ssh, passphrase: '' }
        }))
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save credentials' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function testConnection() {
    setTesting(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/settings/git-auth/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setTesting(false)
    }
  }

  async function clearCredentials() {
    if (!confirm('Are you sure you want to clear all stored Git credentials?')) return
    
    try {
      const res = await fetch('/api/settings/git-auth', { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setStatus(data.status)
        setMessage({ type: 'info', text: 'Credentials cleared' })
        setAuth({
          method: 'pat',
          provider: 'github',
          pat: { token: '', username: '' },
          ssh: { privateKeyPath: '', publicKeyPath: '', passphrase: '' },
          oauth: { username: '' }
        })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  // OAuth App Configuration handlers
  async function saveOAuthAppConfig() {
    if (!oauthApp.clientId || !oauthApp.clientSecret) {
      setMessage({ type: 'error', text: 'Both Client ID and Client Secret are required' })
      return
    }
    
    setOauthApp(prev => ({ ...prev, loading: true }))
    setMessage(null)
    
    try {
      const res = await fetch('/api/auth/github', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'github',
          clientId: oauthApp.clientId,
          clientSecret: oauthApp.clientSecret,
          redirectUri: callbackUrl
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setOauthApp(prev => ({ 
          ...prev, 
          configured: true,
          clientSecret: '' // Clear secret after save
        }))
        setMessage({ type: 'success', text: `OAuth App credentials saved to ${data.storage}` })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save OAuth app credentials' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setOauthApp(prev => ({ ...prev, loading: false }))
    }
  }

  async function testOAuthAppConfig() {
    setTestingApp(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/auth/github/test-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'OAuth App credentials are valid!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'OAuth App credentials test failed' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to test OAuth credentials' })
    } finally {
      setTestingApp(false)
    }
  }

  async function clearOAuthAppConfig() {
    if (!confirm('Are you sure you want to clear the OAuth App configuration?')) return
    
    try {
      const res = await fetch('/api/auth/github', { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setOauthApp({
          clientId: '',
          clientSecret: '',
          showSecret: false,
          configured: false,
          loading: false
        })
        setMessage({ type: 'info', text: 'OAuth App configuration cleared' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  // OAuth User handlers
  async function handleOAuthConnect() {
    setOauthConnecting(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/auth/github', { method: 'POST' })
      const data = await res.json()
      
      if (data.success && data.authUrl) {
        // Redirect to GitHub for authorization
        window.location.href = data.authUrl
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to initiate OAuth flow'
        })
        if (data.setupRequired) {
          setMessage({
            type: 'info',
            text: 'Please configure your OAuth App credentials below first.'
          })
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to connect' })
    } finally {
      setOauthConnecting(false)
    }
  }

  async function handleOAuthDisconnect() {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) return
    
    try {
      const res = await fetch('/api/settings/git-auth', { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setStatus(data.status)
        setMessage({ type: 'info', text: 'GitHub account disconnected' })
        setAuth(prev => ({
          ...prev,
          oauth: { username: '' }
        }))
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const tabs = [
    { id: 'pat' as AuthMethod, label: 'PAT', icon: Key, desc: 'Personal Access Token' },
    { id: 'ssh' as AuthMethod, label: 'SSH', icon: Fingerprint, desc: 'SSH Keys' },
    { id: 'oauth' as AuthMethod, label: 'OAuth', icon: Shield, desc: 'GitHub App / OAuth' },
  ]

  const providers: { id: AuthProvider; label: string }[] = [
    { id: 'github', label: 'GitHub' },
    { id: 'gitlab', label: 'GitLab' },
    { id: 'bitbucket', label: 'Bitbucket' },
    { id: 'other', label: 'Other' },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-neon-cyan/20 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-t-2 border-neon-cyan rounded-full animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Setup Guide Modal */}
      <SetupGuideModal 
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
        callbackUrl={callbackUrl}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 
        bg-space-800/80 backdrop-blur-xl 
        border-b border-neon-cyan/10 
        px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Lock className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <HolographicText size="xl" variant="multi">Git Authentication</HolographicText>
              <p className="text-sm text-gray-500 font-mono">Configure secure access to Git repositories</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status?.configured && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                <CheckCircle className="w-4 h-4 text-neon-green" />
                <span className="text-sm text-neon-green font-mono">
                  {status.method.toUpperCase()} • {status.provider}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6 max-w-4xl">
        {/* Message */}
        {message && (
          <GlassCard 
            variant={message.type === 'success' ? 'green' : message.type === 'error' ? 'pink' : 'yellow'}
            className="p-4 flex items-center gap-3"
            hover={false}
          >
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-neon-green" /> : 
             message.type === 'error' ? <XCircle className="w-5 h-5 text-neon-pink" /> :
             <AlertCircle className="w-5 h-5 text-neon-yellow" />}
            <span className={`font-mono text-sm ${
              message.type === 'success' ? 'text-neon-green' : 
              message.type === 'error' ? 'text-neon-pink' : 'text-neon-yellow'
            }`}>
              {message.text}
            </span>
          </GlassCard>
        )}

        {/* Auth Method Tabs */}
        <div className="grid grid-cols-3 gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isConfigured = status?.method === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative p-6 rounded-xl border transition-all duration-300 text-left
                  ${isActive 
                    ? 'bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border-neon-cyan/50 shadow-[0_0_30px_rgba(0,240,255,0.1)]' 
                    : 'bg-space-800/50 border-space-600/50 hover:border-neon-cyan/30'
                  }
                `}
              >
                {isConfigured && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-4 h-4 text-neon-green" />
                  </div>
                )}
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center mb-3
                  ${isActive ? 'bg-neon-cyan/20' : 'bg-space-700/50'}
                `}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-neon-cyan' : 'text-gray-400'}`} />
                </div>
                <h3 className={`font-semibold mb-1 ${isActive ? 'text-white' : 'text-gray-300'}`}>
                  {tab.label}
                </h3>
                <p className="text-xs text-gray-500 font-mono">{tab.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Auth Configuration Form */}
        <GlassCard variant="cyan" className="p-6">
          {/* Provider Selection */}
          <div className="mb-6">
            <label className="block text-sm font-mono text-gray-400 mb-2">
              Git Provider
            </label>
            <div className="flex gap-2 flex-wrap">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setAuth(prev => ({ ...prev, provider: p.id }))}
                  className={`
                    px-4 py-2 rounded-lg border font-mono text-sm transition-all
                    ${auth.provider === p.id
                      ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'
                      : 'bg-space-800/50 border-space-600/50 text-gray-400 hover:border-neon-cyan/30'
                    }
                  `}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* PAT Form */}
          {activeTab === 'pat' && (
            <div className="space-y-4">
              <div className="p-4 bg-neon-blue/5 border border-neon-blue/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Github className="w-5 h-5 text-neon-blue mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-neon-blue mb-1">
                      Personal Access Token
                    </h4>
                    <p className="text-xs text-gray-400 font-mono">
                      Create a token with 'repo' scope at{' '}
                      <a 
                        href={`https://${auth.provider === 'github' ? 'github.com/settings/tokens' : auth.provider === 'gitlab' ? 'gitlab.com/-/profile/personal_access_tokens' : 'github.com/settings/tokens'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neon-cyan hover:underline inline-flex items-center gap-1"
                      >
                        {auth.provider} <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  Username (optional)
                </label>
                <input
                  type="text"
                  value={auth.pat.username}
                  onChange={(e) => setAuth(prev => ({ 
                    ...prev, 
                    pat: { ...prev.pat, username: e.target.value }
                  }))}
                  placeholder="your-username"
                  className="w-full px-4 py-3 bg-space-900 border border-space-600 rounded-xl text-sm text-white font-mono placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/30"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  Access Token
                </label>
                <input
                  type="password"
                  value={auth.pat.token}
                  onChange={(e) => setAuth(prev => ({ 
                    ...prev, 
                    pat: { ...prev.pat, token: e.target.value }
                  }))}
                  placeholder={status?.configured && status.method === 'pat' ? '••••••••••••••••' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
                  className="w-full px-4 py-3 bg-space-900 border border-space-600 rounded-xl text-sm text-white font-mono placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/30"
                />
                {status?.configured && status.method === 'pat' && (
                  <p className="mt-1 text-xs text-neon-green font-mono">
                    ✓ Token stored securely. Enter new token to update.
                  </p>
                )}
              </div>

              <div className="p-3 bg-neon-yellow/5 border border-neon-yellow/20 rounded-lg">
                <p className="text-xs text-neon-yellow/80 font-mono">
                  💡 Tip: Use a classic token with 'repo' scope for full repository access
                </p>
              </div>
            </div>
          )}

          {/* SSH Form */}
          {activeTab === 'ssh' && (
            <div className="space-y-4">
              <div className="p-4 bg-neon-purple/5 border border-neon-purple/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-neon-purple mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-neon-purple mb-1">
                      SSH Key Authentication
                    </h4>
                    <p className="text-xs text-gray-400 font-mono">
                      Uses SSH keys for secure, passwordless authentication
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  Private Key Path
                </label>
                <input
                  type="text"
                  value={auth.ssh.privateKeyPath}
                  onChange={(e) => setAuth(prev => ({ 
                    ...prev, 
                    ssh: { ...prev.ssh, privateKeyPath: e.target.value }
                  }))}
                  placeholder="~/.ssh/id_rsa"
                  className="w-full px-4 py-3 bg-space-900 border border-space-600 rounded-xl text-sm text-white font-mono placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/30"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  Public Key Path (optional)
                </label>
                <input
                  type="text"
                  value={auth.ssh.publicKeyPath}
                  onChange={(e) => setAuth(prev => ({ 
                    ...prev, 
                    ssh: { ...prev.ssh, publicKeyPath: e.target.value }
                  }))}
                  placeholder="~/.ssh/id_rsa.pub"
                  className="w-full px-4 py-3 bg-space-900 border border-space-600 rounded-xl text-sm text-white font-mono placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/30"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  Passphrase (if key is encrypted)
                </label>
                <input
                  type="password"
                  value={auth.ssh.passphrase}
                  onChange={(e) => setAuth(prev => ({ 
                    ...prev, 
                    ssh: { ...prev.ssh, passphrase: e.target.value }
                  }))}
                  placeholder={status?.configured && status.method === 'ssh' ? '••••••••' : 'Enter passphrase if required'}
                  className="w-full px-4 py-3 bg-space-900 border border-space-600 rounded-xl text-sm text-white font-mono placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/30"
                />
              </div>

              <div className="p-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg">
                <p className="text-xs text-neon-cyan/80 font-mono">
                  🔐 Generate new keys: <code className="bg-space-900 px-1 rounded">ssh-keygen -t ed25519 -C "your@email.com"</code>
                </p>
              </div>
            </div>
          )}

          {/* OAuth Form */}
          {activeTab === 'oauth' && (
            <div className="space-y-6">
              <div className="p-4 bg-neon-green/5 border border-neon-green/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-neon-green mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-neon-green mb-1">
                      OAuth / GitHub App
                    </h4>
                    <p className="text-xs text-gray-400 font-mono">
                      Connect via OAuth for secure, token-based authentication. Configure your OAuth App below.
                    </p>
                  </div>
                </div>
              </div>

              {/* OAuth App Configuration Section */}
              <div className="bg-space-800/50 rounded-xl border border-space-600/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-space-600/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                    <h5 className="text-sm font-medium text-white">OAuth App Configuration</h5>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSetupGuide(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-neon-cyan hover:bg-neon-cyan/10 rounded-lg transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      How to Setup
                    </button>
                    <button
                      onClick={testOAuthAppConfig}
                      disabled={testingApp || !oauthApp.configured}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-neon-green hover:bg-neon-green/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube className="w-3.5 h-3.5" />}
                      {testingApp ? 'Testing...' : 'Test App Config'}
                    </button>
                  </div>
                </div>
                
                <div className="p-5 space-y-4">
                  {/* Client ID */}
                  <div>
                    <label className="block text-sm font-mono text-gray-400 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={oauthApp.clientId}
                      onChange={(e) => setOauthApp(prev => ({ ...prev, clientId: e.target.value }))}
                      placeholder={oauthApp.configured ? '••••••••••••••••' : 'Iv1xxxxxxxxxxxxxxxxxxx'}
                      className="w-full px-4 py-3 bg-space-900 border border-space-600 rounded-xl text-sm text-white font-mono placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/30"
                    />
                    {oauthApp.configured && !oauthApp.clientId && (
                      <p className="mt-1 text-xs text-neon-green font-mono">
                        ✓ Client ID stored. Enter new value to update.
                      </p>
                    )}
                  </div>

                  {/* Client Secret */}
                  <div>
                    <label className="block text-sm font-mono text-gray-400 mb-2">
                      Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={oauthApp.showSecret ? 'text' : 'password'}
                        value={oauthApp.clientSecret}
                        onChange={(e) => setOauthApp(prev => ({ ...prev, clientSecret: e.target.value }))}
                        placeholder={oauthApp.configured ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : 'Enter your GitHub OAuth App Client Secret'}
                        className="w-full px-4 py-3 pr-12 bg-space-900 border border-space-600 rounded-xl text-sm text-white font-mono placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/30"
                      />
                      <button
                        type="button"
                        onClick={() => setOauthApp(prev => ({ ...prev, showSecret: !prev.showSecret }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-space-700 text-gray-400 hover:text-neon-cyan transition-colors"
                        title={oauthApp.showSecret ? 'Hide secret' : 'Show secret'}
                      >
                        {oauthApp.showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {oauthApp.configured && !oauthApp.clientSecret && (
                      <p className="mt-1 text-xs text-neon-green font-mono">
                        ✓ Client Secret stored securely. Enter new value to rotate.
                      </p>
                    )}
                  </div>

                  {/* Callback URL Display */}
                  <div className="p-3 bg-space-900/50 rounded-lg">
                    <label className="block text-xs font-mono text-gray-500 mb-1.5">
                      Authorization Callback URL
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-neon-cyan font-mono break-all">{callbackUrl}</code>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(callbackUrl)
                          setMessage({ type: 'success', text: 'Callback URL copied!' })
                        }}
                        className="p-1.5 rounded hover:bg-neon-cyan/10 text-gray-400 hover:text-neon-cyan transition-colors"
                        title="Copy callback URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-2 p-3 bg-neon-yellow/5 border border-neon-yellow/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-neon-yellow flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-neon-yellow/80 font-mono">
                      Keep your client secret secure. Never share it or commit it to version control.
                      Credentials are encrypted with AES-256-GCM and stored in your system keychain.
                    </p>
                  </div>

                  {/* Save/Clear Buttons */}
                  <div className="flex gap-3">
                    <NeonButton
                      variant="cyan"
                      onClick={saveOAuthAppConfig}
                      disabled={oauthApp.loading || (!oauthApp.clientId && !oauthApp.clientSecret)}
                      icon={<Save className="w-4 h-4" />}
                    >
                      {oauthApp.loading ? 'Saving...' : 'Save App Credentials'}
                    </NeonButton>
                    {oauthApp.configured && (
                      <button
                        onClick={clearOAuthAppConfig}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-mono text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear App Config
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-space-600/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-space-800 text-xs text-gray-500 font-mono">User Connection</span>
                </div>
              </div>

              {/* User Connection Status */}
              {status?.method === 'oauth' && status?.configured ? (
                <div className="p-6 bg-space-800/50 rounded-xl border border-neon-green/30">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-neon-green" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white mb-1">
                        ✅ Connected to GitHub
                      </h4>
                      <p className="text-sm text-gray-400 font-mono">
                        Your account is securely linked
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between py-2 border-b border-space-600/50">
                      <span className="text-sm text-gray-400 font-mono">Account</span>
                      <span className="text-sm text-neon-green font-mono font-medium">
                        @{status.username || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-space-600/50">
                      <span className="text-sm text-gray-400 font-mono">Method</span>
                      <span className="text-sm text-neon-cyan font-mono">OAuth</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-space-600/50">
                      <span className="text-sm text-gray-400 font-mono">Provider</span>
                      <span className="text-sm text-white font-mono capitalize">{status.provider}</span>
                    </div>
                    {status.expiresAt && (
                      <div className="flex items-center justify-between py-2 border-b border-space-600/50">
                        <span className="text-sm text-gray-400 font-mono">Token Expires</span>
                        <span className="text-sm text-neon-yellow font-mono">
                          {new Date(status.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <NeonButton
                      variant="outline"
                      onClick={testConnection}
                      disabled={testing}
                      icon={<TestTube className="w-4 h-4" />}
                    >
                      {testing ? 'Testing...' : 'Test Connection'}
                    </NeonButton>
                    <button
                      onClick={handleOAuthDisconnect}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neon-pink/10 text-neon-pink border border-neon-pink/30 rounded-lg font-mono text-sm hover:bg-neon-pink/20 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-space-800/50 rounded-xl border border-space-600/50">
                  {!oauthApp.configured ? (
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-neon-yellow" />
                      </div>
                      <h4 className="text-lg font-medium text-white mb-2">
                        OAuth App Not Configured
                      </h4>
                      <p className="text-sm text-gray-400 font-mono mb-4 max-w-md mx-auto">
                        You need to configure your OAuth App credentials above before connecting your GitHub account.
                      </p>
                      <button
                        onClick={() => setShowSetupGuide(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-neon-cyan hover:underline font-mono text-sm"
                      >
                        <HelpCircle className="w-4 h-4" />
                        View Setup Guide
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mx-auto mb-4">
                          <Github className="w-8 h-8 text-neon-green" />
                        </div>
                        <h4 className="text-lg font-medium text-white mb-2">
                          Connect with GitHub
                        </h4>
                        <p className="text-sm text-gray-400 font-mono max-w-md mx-auto">
                          Your OAuth App is configured. Click below to authorize OpenClaw to access your GitHub account.
                        </p>
                      </div>
                      
                      <div className="bg-space-900/50 rounded-lg p-4 mb-6">
                        <p className="text-xs text-gray-500 font-mono mb-2">This will allow OpenClaw to:</p>
                        <ul className="space-y-2 text-sm text-gray-400 font-mono">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-neon-green" />
                            Access your repositories (read/write)
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-neon-green" />
                            Read your profile information
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-neon-green" />
                            Push changes on your behalf
                          </li>
                        </ul>
                      </div>
                      
                      <button
                        onClick={handleOAuthConnect}
                        disabled={oauthConnecting}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-neon-green/20 text-neon-green border border-neon-green/50 rounded-lg font-mono text-sm hover:bg-neon-green/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {oauthConnecting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Github className="w-5 h-5" />
                            Connect GitHub Account
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-space-600/50">
            <button
              onClick={clearCredentials}
              className="flex items-center gap-2 px-4 py-2 text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-colors font-mono text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear Credentials
            </button>
            
            <div className="flex gap-3">
              <NeonButton
                variant="outline"
                onClick={testConnection}
                disabled={testing || !status?.configured}
                icon={<TestTube className="w-4 h-4" />}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </NeonButton>
              {activeTab !== 'oauth' && (
                <NeonButton
                  variant="cyan"
                  onClick={saveAuth}
                  disabled={saving || (activeTab === 'pat' && !auth.pat.token && !status?.configured)}
                  icon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving...' : 'Save Credentials'}
                </NeonButton>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Security Info */}
        <GlassCard variant="purple" className="p-6" hover={false}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-neon-purple" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-2 font-mono">
                Security Information
              </h4>
              <ul className="space-y-2 text-sm text-gray-400 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  Credentials are encrypted with AES-256-GCM
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  On macOS, credentials are stored in Keychain
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  File storage uses 0600 permissions (owner only)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  Tokens are never logged or displayed
                </li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  )
}
