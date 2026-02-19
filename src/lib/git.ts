import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

// GitHub URL validation regex
const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+(\/)?(\.git)?$/

export interface GitCloneResult {
  success: boolean
  repoName?: string
  error?: string
  errorCode?: 'INVALID_URL' | 'NOT_FOUND' | 'ACCESS_DENIED' | 'GIT_NOT_INSTALLED' | 'TIMEOUT' | 'UNKNOWN'
}

export interface RepoInfo {
  name: string
  url: string
  defaultBranch?: string
  lastCommit?: string
  readmeContent?: string
}

/**
 * Validate GitHub URL format
 */
export function validateGitHubUrl(url: string): boolean {
  if (!url) return false
  return GITHUB_URL_REGEX.test(url.trim())
}

/**
 * Extract repository name from GitHub URL
 */
export function extractRepoName(url: string): string | null {
  if (!url) return null
  const match = url.match(/github\.com\/[^/]+\/([^/]+)/)
  if (match) {
    return match[1].replace(/\.git$/, '')
  }
  return null
}

/**
 * Clone a GitHub repository to a target path
 */
export async function cloneRepository(
  githubUrl: string, 
  targetPath: string,
  timeoutMs: number = 120000
): Promise<GitCloneResult> {
  const url = githubUrl.trim()
  
  // Validate URL format
  if (!validateGitHubUrl(url)) {
    return {
      success: false,
      error: 'Invalid GitHub URL format. Expected: https://github.com/username/repo',
      errorCode: 'INVALID_URL'
    }
  }
  
  const repoName = extractRepoName(url)
  if (!repoName) {
    return {
      success: false,
      error: 'Could not extract repository name from URL',
      errorCode: 'INVALID_URL'
    }
  }
  
  // Check if git is installed
  try {
    await execAsync('git --version')
  } catch (error) {
    return {
      success: false,
      error: 'Git is not installed on the server',
      errorCode: 'GIT_NOT_INSTALLED'
    }
  }
  
  // Check if target path already exists
  if (fs.existsSync(targetPath)) {
    const files = fs.readdirSync(targetPath)
    if (files.length > 0) {
      return {
        success: false,
        error: 'Target directory already exists and is not empty',
        errorCode: 'UNKNOWN'
      }
    }
  }
  
  try {
    // Clone with timeout
    const clonePromise = execAsync(`git clone "${url}" "${targetPath}"`, {
      timeout: timeoutMs
    })
    
    await clonePromise
    
    return {
      success: true,
      repoName
    }
  } catch (error: any) {
    const errorMessage = error.message || String(error)
    
    // Parse error message to determine error code
    if (error.code === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
      return {
        success: false,
        error: 'Clone operation timed out. The repository may be too large.',
        errorCode: 'TIMEOUT'
      }
    }
    
    if (errorMessage.includes('Repository not found') || 
        errorMessage.includes('does not exist') ||
        errorMessage.includes('404')) {
      return {
        success: false,
        error: 'Repository not found. Please check the URL.',
        errorCode: 'NOT_FOUND'
      }
    }
    
    if (errorMessage.includes('Authentication failed') || 
        errorMessage.includes('access denied') ||
        errorMessage.includes('403') ||
        errorMessage.includes('could not read')) {
      return {
        success: false,
        error: 'Repository is private or you do not have access.',
        errorCode: 'ACCESS_DENIED'
      }
    }
    
    return {
      success: false,
      error: `Failed to clone repository: ${errorMessage}`,
      errorCode: 'UNKNOWN'
    }
  }
}

/**
 * Get repository information from a cloned repo
 */
export async function getRepoInfo(repoPath: string): Promise<RepoInfo | null> {
  try {
    if (!fs.existsSync(repoPath)) {
      return null
    }
    
    // Get default branch
    let defaultBranch: string | undefined
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: repoPath
      })
      defaultBranch = stdout.trim()
    } catch (e) {
      // Ignore
    }
    
    // Get last commit
    let lastCommit: string | undefined
    try {
      const { stdout } = await execAsync('git log -1 --format=%cd', {
        cwd: repoPath
      })
      lastCommit = stdout.trim()
    } catch (e) {
      // Ignore
    }
    
    // Get remote URL
    let url: string | undefined
    try {
      const { stdout } = await execAsync('git remote get-url origin', {
        cwd: repoPath
      })
      url = stdout.trim()
    } catch (e) {
      // Ignore
    }
    
    // Get README content
    let readmeContent: string | undefined
    const readmeFiles = ['README.md', 'README.MD', 'readme.md', 'Readme.md', 'README']
    for (const readmeName of readmeFiles) {
      const readmePath = path.join(repoPath, readmeName)
      if (fs.existsSync(readmePath)) {
        try {
          readmeContent = fs.readFileSync(readmePath, 'utf-8')
          break
        } catch (e) {
          // Ignore
        }
      }
    }
    
    // Get repo name from folder
    const name = path.basename(repoPath)
    
    return {
      name,
      url: url || '',
      defaultBranch,
      lastCommit,
      readmeContent
    }
  } catch (error) {
    console.error('Failed to get repo info:', error)
    return null
  }
}

/**
 * Generate PROJECT.md content for a GitHub-cloned project
 */
export function generateGitHubProjectMd(
  projectName: string,
  githubUrl: string,
  repoInfo: RepoInfo | null,
  description: string
): string {
  const timestamp = new Date().toISOString()
  const readmeSection = repoInfo?.readmeContent 
    ? `\n## Original README\n\n${repoInfo.readmeContent}` 
    : ''
  
  return `# ${projectName}

## GitHub Repository
- **URL:** ${githubUrl}
- **Cloned:** ${timestamp}
${repoInfo?.defaultBranch ? `- **Default Branch:** ${repoInfo.defaultBranch}` : ''}
${repoInfo?.lastCommit ? `- **Last Commit:** ${repoInfo.lastCommit}` : ''}

## Overview
${description || 'Project imported from GitHub repository.'}

## Getting Started
<!-- Add setup instructions here -->

1. Install dependencies
2. Configure environment variables
3. Run the project

## Architecture
<!-- Describe the tech stack and architecture -->

${readmeSection}

---
*Created: ${timestamp}*
*Source: ${githubUrl}*
`
}
