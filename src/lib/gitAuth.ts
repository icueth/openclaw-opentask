/**
 * Git Authentication - Secure Credential Storage
 * 
 * Features:
 * - macOS Keychain integration (preferred)
 * - Encrypted file fallback
 * - Per-project auth overrides
 * - Credential encryption with AES-256-GCM
 * - OAuth App configuration storage
 */

import { GitAuthConfig, GitAuthMethod, EncryptedData, GitAuthTestResult, ProjectGitAuthConfig, OAuthAppConfig, OAuthAppCredentials, OAuthProvider } from '@/types/gitAuth'
import { execSync, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Constants
const OPENCLAW_DIR = path.join(process.env.HOME || '', '.openclaw')
const CREDENTIALS_FILE = path.join(OPENCLAW_DIR, '.git-credentials.enc')
const PROJECT_AUTH_FILE = path.join(OPENCLAW_DIR, '.git-project-auth.enc')
const OAUTH_CONFIG_FILE = path.join(OPENCLAW_DIR, '.oauth-app-config.enc')
const KEYCHAIN_SERVICE = 'com.openclaw.git-auth'
const KEYCHAIN_ACCOUNT = 'git-credentials'
const OAUTH_KEYCHAIN_SERVICE = 'com.openclaw.oauth-app'
const OAUTH_KEYCHAIN_ACCOUNT = 'oauth-app-credentials'
const ENCRYPTION_VERSION = 1

// Get or create encryption key
function getEncryptionKey(): Buffer {
  const keyPath = path.join(OPENCLAW_DIR, '.encryption-key')
  
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath)
  }
  
  // Generate new key
  const key = crypto.randomBytes(32)
  fs.mkdirSync(OPENCLAW_DIR, { recursive: true })
  fs.writeFileSync(keyPath, key)
  fs.chmodSync(keyPath, 0o600) // Only owner can read/write
  return key
}

// Encrypt data using AES-256-GCM
export function encryptCredential(data: string): EncryptedData {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(data, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  return {
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    encrypted,
    version: ENCRYPTION_VERSION
  }
}

// Decrypt data
export function decryptCredential(data: EncryptedData): string {
  const key = getEncryptionKey()
  const iv = Buffer.from(data.iv, 'base64')
  const authTag = Buffer.from(data.authTag, 'base64')
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(data.encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Check if running on macOS
function isMacOS(): boolean {
  return process.platform === 'darwin'
}

// Check if keychain is available
function isKeychainAvailable(): boolean {
  if (!isMacOS()) return false
  try {
    execSync('security -h', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Save to macOS Keychain
function saveToKeychain(config: GitAuthConfig): boolean {
  if (!isKeychainAvailable()) return false
  
  try {
    const jsonData = JSON.stringify(config)
    const encrypted = encryptCredential(jsonData)
    const base64Data = Buffer.from(JSON.stringify(encrypted)).toString('base64')
    
    // Delete existing entry first
    try {
      execSync(`security delete-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT}" 2>/dev/null`, { stdio: 'ignore' })
    } catch {
      // Ignore error if doesn't exist
    }
    
    // Add new entry
    execSync(
      `security add-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT}" -w "${base64Data}" -U`,
      { stdio: 'ignore' }
    )
    return true
  } catch (error) {
    console.error('Failed to save to keychain:', error)
    return false
  }
}

// Load from macOS Keychain
function loadFromKeychain(): GitAuthConfig | null {
  if (!isKeychainAvailable()) return null
  
  try {
    const result = execSync(
      `security find-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT}" -w`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    )
    
    const base64Data = result.trim()
    const jsonData = Buffer.from(base64Data, 'base64').toString('utf8')
    const encrypted: EncryptedData = JSON.parse(jsonData)
    const decrypted = decryptCredential(encrypted)
    
    return JSON.parse(decrypted)
  } catch (error) {
    // No credentials found or other error
    return null
  }
}

// Delete from macOS Keychain
function deleteFromKeychain(): boolean {
  if (!isKeychainAvailable()) return false
  
  try {
    execSync(`security delete-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT}"`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Save to encrypted file (fallback)
function saveToFile(config: GitAuthConfig): void {
  fs.mkdirSync(OPENCLAW_DIR, { recursive: true })
  const jsonData = JSON.stringify(config)
  const encrypted = encryptCredential(jsonData)
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(encrypted), { mode: 0o600 })
}

// Load from encrypted file
function loadFromFile(): GitAuthConfig | null {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) return null
    
    const fileContent = fs.readFileSync(CREDENTIALS_FILE, 'utf8')
    const encrypted: EncryptedData = JSON.parse(fileContent)
    const decrypted = decryptCredential(encrypted)
    
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Failed to load credentials from file:', error)
    return null
  }
}

// Delete file credentials
function deleteFileCredentials(): void {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE)
    }
  } catch (error) {
    console.error('Failed to delete credentials file:', error)
  }
}

// Main save function - tries keychain first, falls back to file
export function saveCredentials(config: GitAuthConfig): { success: boolean; storage: 'keychain' | 'file' } {
  const configWithTimestamps = {
    ...config,
    updatedAt: new Date().toISOString(),
    createdAt: config.createdAt || new Date().toISOString()
  }
  
  // Try keychain first on macOS
  if (isKeychainAvailable()) {
    if (saveToKeychain(configWithTimestamps)) {
      // Clean up file if it exists (we're using keychain now)
      deleteFileCredentials()
      return { success: true, storage: 'keychain' }
    }
  }
  
  // Fallback to file
  saveToFile(configWithTimestamps)
  return { success: true, storage: 'file' }
}

// Main load function - tries keychain first, falls back to file
export function loadCredentials(): GitAuthConfig | null {
  // Try keychain first
  if (isKeychainAvailable()) {
    const keychainConfig = loadFromKeychain()
    if (keychainConfig) return keychainConfig
  }
  
  // Fallback to file
  return loadFromFile()
}

// Delete all credentials
export function deleteCredentials(): boolean {
  let success = true
  
  if (isKeychainAvailable()) {
    if (!deleteFromKeychain()) success = false
  }
  
  deleteFileCredentials()
  return success
}

// Get auth status (without exposing sensitive data)
export function getAuthStatus(): { 
  configured: boolean
  method: GitAuthMethod
  provider: string
  username?: string
  expiresAt?: string
} {
  const config = loadCredentials()
  
  if (!config || config.method === 'none') {
    return {
      configured: false,
      method: 'none',
      provider: 'none'
    }
  }
  
  return {
    configured: true,
    method: config.method,
    provider: config.provider,
    username: config.pat?.username || config.oauth?.username,
    expiresAt: config.oauth?.expiresAt
  }
}

// Test PAT authentication
async function testPATAuth(config: GitAuthConfig, testRepo?: string): Promise<GitAuthTestResult> {
  if (!config.pat?.token) {
    return { success: false, message: 'No PAT token configured' }
  }
  
  try {
    const decryptedToken = decryptCredential(JSON.parse(config.pat.token) as EncryptedData)
    const provider = config.provider || 'github'
    
    // Build test URL
    let testUrl: string
    if (testRepo) {
      testUrl = `https://${decryptedToken}@${provider}.com/${testRepo}.git`
    } else {
      testUrl = `https://${decryptedToken}@${provider}.com/test/test.git`
    }
    
    // Try to ls-remote
    return new Promise((resolve) => {
      const proc = spawn('git', ['ls-remote', '--heads', testUrl], {
        timeout: 30000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
      })
      
      let stderr = ''
      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, message: 'PAT authentication successful' })
        } else if (stderr.includes('403') || stderr.includes('Unauthorized')) {
          resolve({ success: false, message: 'Authentication failed: Invalid or expired token' })
        } else if (stderr.includes('404') || stderr.includes('not found')) {
          resolve({ success: true, message: 'Authentication successful (repository not found is OK)' })
        } else {
          resolve({ success: false, message: 'Connection failed', details: stderr })
        }
      })
      
      proc.on('error', (error) => {
        resolve({ success: false, message: 'Failed to run git command', details: error.message })
      })
    })
  } catch (error: any) {
    return { success: false, message: 'Failed to decrypt token', details: error.message }
  }
}

// Test SSH authentication
async function testSSHAuth(config: GitAuthConfig): Promise<GitAuthTestResult> {
  if (!config.ssh?.privateKeyPath) {
    return { success: false, message: 'No SSH key configured' }
  }
  
  try {
    // Check if key files exist
    if (!fs.existsSync(config.ssh.privateKeyPath)) {
      return { success: false, message: `Private key not found: ${config.ssh.privateKeyPath}` }
    }
    
    // Test SSH connection to GitHub
    return new Promise((resolve) => {
      const proc = spawn('ssh', [
        '-T',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'BatchMode=yes',
        '-i', config.ssh!.privateKeyPath,
        'git@github.com'
      ], {
        timeout: 30000
      })
      
      let stderr = ''
      let stdout = ''
      
      proc.stdout?.on('data', (data) => {
        stdout += data.toString()
      })
      
      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })
      
      proc.on('close', (code) => {
        // GitHub returns code 1 on successful auth (no shell access)
        if (stderr.includes('successfully authenticated') || stdout.includes('successfully authenticated')) {
          const username = stderr.match(/Hi ([^!]+)/)?.[1]
          resolve({ 
            success: true, 
            message: `SSH authentication successful${username ? ` (user: ${username})` : ''}` 
          })
        } else if (stderr.includes('Permission denied')) {
          resolve({ success: false, message: 'Authentication failed: Permission denied' })
        } else {
          resolve({ success: false, message: 'SSH connection failed', details: stderr || stdout })
        }
      })
      
      proc.on('error', (error) => {
        resolve({ success: false, message: 'Failed to run SSH command', details: error.message })
      })
    })
  } catch (error: any) {
    return { success: false, message: 'SSH test failed', details: error.message }
  }
}

// Test OAuth authentication
async function testOAuthAuth(config: GitAuthConfig): Promise<GitAuthTestResult> {
  if (!config.oauth?.accessToken) {
    return { success: false, message: 'No OAuth token configured' }
  }
  
  try {
    const decryptedToken = decryptCredential(JSON.parse(config.oauth.accessToken) as EncryptedData)
    const provider = config.provider || 'github'
    
    // Check if token is expired
    if (config.oauth.expiresAt && new Date(config.oauth.expiresAt) < new Date()) {
      return { success: false, message: 'OAuth token has expired' }
    }
    
    // Test with git ls-remote
    return new Promise((resolve) => {
      const testUrl = `https://${decryptedToken}@${provider}.com/test/test.git`
      
      const proc = spawn('git', ['ls-remote', '--heads', testUrl], {
        timeout: 30000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
      })
      
      let stderr = ''
      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, message: 'OAuth authentication successful' })
        } else if (stderr.includes('403') || stderr.includes('Unauthorized')) {
          resolve({ success: false, message: 'Authentication failed: Invalid or expired OAuth token' })
        } else if (stderr.includes('404')) {
          resolve({ success: true, message: 'OAuth authentication successful (test repo not found is OK)' })
        } else {
          resolve({ success: false, message: 'Connection failed', details: stderr })
        }
      })
      
      proc.on('error', (error) => {
        resolve({ success: false, message: 'Failed to run git command', details: error.message })
      })
    })
  } catch (error: any) {
    return { success: false, message: 'Failed to decrypt OAuth token', details: error.message }
  }
}

// Test authentication
export async function testAuth(config?: GitAuthConfig, testRepo?: string): Promise<GitAuthTestResult> {
  const authConfig = config || loadCredentials()
  
  if (!authConfig || authConfig.method === 'none') {
    return { success: false, message: 'No authentication configured' }
  }
  
  switch (authConfig.method) {
    case 'pat':
      return testPATAuth(authConfig, testRepo)
    case 'ssh':
      return testSSHAuth(authConfig)
    case 'oauth':
      return testOAuthAuth(authConfig)
    default:
      return { success: false, message: 'Unknown authentication method' }
  }
}

// --- OAuth App Configuration ---

// Default redirect URI
const DEFAULT_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
  : 'http://localhost:3456/api/auth/github/callback'

// Migrate from env vars if they exist and no stored config
function migrateFromEnvVars(): OAuthAppConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  
  if (clientId && clientSecret) {
    console.log('Migrating OAuth credentials from environment variables to encrypted storage...')
    const config: OAuthAppConfig = {
      provider: 'github',
      clientId,
      clientSecret: JSON.stringify(encryptCredential(clientSecret)),
      redirectUri: process.env.GITHUB_REDIRECT_URI || DEFAULT_REDIRECT_URI,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    saveOAuthConfig(config)
    return config
  }
  return null
}

// Save OAuth app configuration to keychain
function saveOAuthToKeychain(config: OAuthAppConfig): boolean {
  if (!isKeychainAvailable()) return false
  
  try {
    const base64Data = Buffer.from(JSON.stringify(config)).toString('base64')
    
    // Delete existing entry first
    try {
      execSync(`security delete-generic-password -s "${OAUTH_KEYCHAIN_SERVICE}" -a "${OAUTH_KEYCHAIN_ACCOUNT}" 2>/dev/null`, { stdio: 'ignore' })
    } catch {
      // Ignore error if doesn't exist
    }
    
    // Add new entry
    execSync(
      `security add-generic-password -s "${OAUTH_KEYCHAIN_SERVICE}" -a "${OAUTH_KEYCHAIN_ACCOUNT}" -w "${base64Data}" -U`,
      { stdio: 'ignore' }
    )
    return true
  } catch (error) {
    console.error('Failed to save OAuth config to keychain:', error)
    return false
  }
}

// Load OAuth app configuration from keychain
function loadOAuthFromKeychain(): OAuthAppConfig | null {
  if (!isKeychainAvailable()) return null
  
  try {
    const result = execSync(
      `security find-generic-password -s "${OAUTH_KEYCHAIN_SERVICE}" -a "${OAUTH_KEYCHAIN_ACCOUNT}" -w`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    )
    
    const base64Data = result.trim()
    const jsonData = Buffer.from(base64Data, 'base64').toString('utf8')
    return JSON.parse(jsonData)
  } catch (error) {
    return null
  }
}

// Delete OAuth config from keychain
function deleteOAuthFromKeychain(): boolean {
  if (!isKeychainAvailable()) return false
  
  try {
    execSync(`security delete-generic-password -s "${OAUTH_KEYCHAIN_SERVICE}" -a "${OAUTH_KEYCHAIN_ACCOUNT}"`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Save OAuth app configuration to file
function saveOAuthToFile(config: OAuthAppConfig): void {
  fs.mkdirSync(OPENCLAW_DIR, { recursive: true })
  fs.writeFileSync(OAUTH_CONFIG_FILE, JSON.stringify(config), { mode: 0o600 })
}

// Load OAuth app configuration from file
function loadOAuthFromFile(): OAuthAppConfig | null {
  try {
    if (!fs.existsSync(OAUTH_CONFIG_FILE)) return null
    const fileContent = fs.readFileSync(OAUTH_CONFIG_FILE, 'utf8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('Failed to load OAuth config from file:', error)
    return null
  }
}

// Delete OAuth config file
function deleteOAuthFile(): void {
  try {
    if (fs.existsSync(OAUTH_CONFIG_FILE)) {
      fs.unlinkSync(OAUTH_CONFIG_FILE)
    }
  } catch (error) {
    console.error('Failed to delete OAuth config file:', error)
  }
}

// Save OAuth app configuration
export function saveOAuthConfig(config: OAuthAppConfig): { success: boolean; storage: 'keychain' | 'file' } {
  const configWithTimestamps = {
    ...config,
    updatedAt: new Date().toISOString(),
    createdAt: config.createdAt || new Date().toISOString()
  }
  
  // Encrypt client secret if not already encrypted
  if (!configWithTimestamps.clientSecret.startsWith('{')) {
    configWithTimestamps.clientSecret = JSON.stringify(encryptCredential(configWithTimestamps.clientSecret))
  }
  
  // Try keychain first on macOS
  if (isKeychainAvailable()) {
    if (saveOAuthToKeychain(configWithTimestamps)) {
      deleteOAuthFile()
      return { success: true, storage: 'keychain' }
    }
  }
  
  // Fallback to file
  saveOAuthToFile(configWithTimestamps)
  return { success: true, storage: 'file' }
}

// Load OAuth app configuration
export function loadOAuthConfig(): OAuthAppConfig | null {
  // Try keychain first
  if (isKeychainAvailable()) {
    const keychainConfig = loadOAuthFromKeychain()
    if (keychainConfig) return keychainConfig
  }
  
  // Fallback to file
  const fileConfig = loadOAuthFromFile()
  if (fileConfig) return fileConfig
  
  // Try migrating from env vars
  return migrateFromEnvVars()
}

// Load OAuth credentials (decrypted for use)
export function loadOAuthCredentials(): OAuthAppCredentials | null {
  const config = loadOAuthConfig()
  if (!config) return null
  
  try {
    const clientSecret = decryptCredential(JSON.parse(config.clientSecret))
    return {
      provider: config.provider,
      clientId: config.clientId,
      clientSecret,
      redirectUri: config.redirectUri || DEFAULT_REDIRECT_URI
    }
  } catch (error) {
    console.error('Failed to decrypt OAuth client secret:', error)
    return null
  }
}

// Delete OAuth configuration
export function deleteOAuthConfig(): boolean {
  let success = true
  
  if (isKeychainAvailable()) {
    if (!deleteOAuthFromKeychain()) success = false
  }
  
  deleteOAuthFile()
  return success
}

// Check if OAuth is configured
export function isOAuthAppConfigured(): boolean {
  const config = loadOAuthConfig()
  return !!(config && config.clientId && config.clientSecret)
}

// Get OAuth configuration status
export function getOAuthConfigStatus(): { 
  configured: boolean
  provider?: OAuthProvider
  clientId?: string
  hasClientSecret: boolean
} {
  const config = loadOAuthConfig()
  
  if (!config) {
    return { configured: false, hasClientSecret: false }
  }
  
  return {
    configured: !!(config.clientId && config.clientSecret),
    provider: config.provider,
    clientId: config.clientId,
    hasClientSecret: !!config.clientSecret
  }
}

// --- Project-specific auth overrides ---

// Save project-specific auth
export function saveProjectAuth(projectId: string, config: ProjectGitAuthConfig): void {
  fs.mkdirSync(OPENCLAW_DIR, { recursive: true })
  
  let projectAuths: Record<string, ProjectGitAuthConfig> = {}
  if (fs.existsSync(PROJECT_AUTH_FILE)) {
    const encrypted: EncryptedData = JSON.parse(fs.readFileSync(PROJECT_AUTH_FILE, 'utf8'))
    const decrypted = decryptCredential(encrypted)
    projectAuths = JSON.parse(decrypted)
  }
  
  projectAuths[projectId] = {
    ...config,
    updatedAt: new Date().toISOString()
  }
  
  const encrypted = encryptCredential(JSON.stringify(projectAuths))
  fs.writeFileSync(PROJECT_AUTH_FILE, JSON.stringify(encrypted), { mode: 0o600 })
}

// Load project-specific auth
export function loadProjectAuth(projectId: string): ProjectGitAuthConfig | null {
  try {
    if (!fs.existsSync(PROJECT_AUTH_FILE)) return null
    
    const encrypted: EncryptedData = JSON.parse(fs.readFileSync(PROJECT_AUTH_FILE, 'utf8'))
    const decrypted = decryptCredential(encrypted)
    const projectAuths: Record<string, ProjectGitAuthConfig> = JSON.parse(decrypted)
    
    return projectAuths[projectId] || null
  } catch {
    return null
  }
}

// Get effective auth config for a project (resolves override)
export function getProjectEffectiveAuth(projectId: string): GitAuthConfig | null {
  const projectAuth = loadProjectAuth(projectId)
  
  if (projectAuth && !projectAuth.useGlobal) {
    return projectAuth
  }
  
  return loadCredentials()
}

// Delete project-specific auth
export function deleteProjectAuth(projectId: string): void {
  try {
    if (!fs.existsSync(PROJECT_AUTH_FILE)) return
    
    const encrypted: EncryptedData = JSON.parse(fs.readFileSync(PROJECT_AUTH_FILE, 'utf8'))
    const decrypted = decryptCredential(encrypted)
    const projectAuths: Record<string, ProjectGitAuthConfig> = JSON.parse(decrypted)
    
    delete projectAuths[projectId]
    
    const newEncrypted = encryptCredential(JSON.stringify(projectAuths))
    fs.writeFileSync(PROJECT_AUTH_FILE, JSON.stringify(newEncrypted), { mode: 0o600 })
  } catch {
    // Ignore errors
  }
}
