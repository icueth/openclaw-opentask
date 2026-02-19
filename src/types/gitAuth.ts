/**
 * Git Authentication Types
 */

export type GitAuthMethod = 'pat' | 'ssh' | 'oauth' | 'none'
export type OAuthProvider = 'github' | 'gitlab' | 'bitbucket'

// OAuth App Configuration (stored encrypted)
export interface OAuthAppConfig {
  provider: OAuthProvider
  clientId: string // plain text - not a secret, shown in URLs
  clientSecret: string // encrypted
  redirectUri?: string
  createdAt?: string
  updatedAt?: string
}

// OAuth App credentials for UI (decrypted)
export interface OAuthAppCredentials {
  provider: OAuthProvider
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface GitAuthConfig {
  method: GitAuthMethod
  provider: 'github' | 'gitlab' | 'bitbucket' | 'other'
  pat?: {
    token: string // encrypted
    username: string
  }
  ssh?: {
    privateKeyPath: string
    publicKeyPath: string
    passphrase?: string // encrypted
  }
  oauth?: {
    accessToken: string // encrypted
    refreshToken: string // encrypted
    expiresAt?: string // ISO date string (optional for tokens that don't expire)
    username?: string
    userId?: number
    avatarUrl?: string
    email?: string
    // App configuration (encrypted clientSecret)
    appConfig?: OAuthAppConfig
  }
  createdAt?: string
  updatedAt?: string
}

// For project-specific auth overrides
export interface ProjectGitAuthConfig extends GitAuthConfig {
  useGlobal: boolean // if true, use global auth instead of project-specific
}

// API Response types
export interface GitAuthStatus {
  configured: boolean
  method: GitAuthMethod
  provider: string
  hasCredentials: boolean
  username?: string
  expiresAt?: string
}

// Test connection result
export interface GitAuthTestResult {
  success: boolean
  message: string
  details?: string
}

// Storage location for credentials
export type CredentialStorage = 'keychain' | 'file' | 'env'

// Encryption metadata
export interface EncryptedData {
  iv: string // initialization vector
  authTag: string // authentication tag for AES-GCM
  encrypted: string // base64 encrypted data
  version: number // encryption version for future migrations
}
