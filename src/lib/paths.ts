/**
 * Path Configuration for Dashboard
 * Separates Dashboard data from OpenClaw Core data
 */

import path from 'path'
import { homedir } from 'os'

// Base directories
export const HOME_DIR = process.env.HOME || homedir() || '/Users/icue'

// OpenClaw Core (separate from Dashboard)
export const OPENCLAW_DIR = path.join(HOME_DIR, '.openclaw')
export const OPENCLAW_WORKSPACES = {
  main: path.join(OPENCLAW_DIR, 'workspace'),
  coder: path.join(OPENCLAW_DIR, 'workspace-coder'),
  coordinator: path.join(OPENCLAW_DIR, 'workspace-coordinator')
}

// Dashboard Data (completely separate from OpenClaw Core)
// Can be configured via DASHBOARD_DATA_DIR env var
export const DASHBOARD_DATA_DIR = process.env.DASHBOARD_DATA_DIR || path.join(process.cwd(), 'data')
export const DASHBOARD_DIR = path.dirname(DASHBOARD_DATA_DIR)

// Dashboard subdirectories
export const DASHBOARD_PATHS = {
  // Projects stored in dashboard/data/projects/
  projects: path.join(DASHBOARD_DATA_DIR, 'projects'),
  
  // Task contexts stored in dashboard/data/task-contexts/
  taskContexts: path.join(DASHBOARD_DATA_DIR, 'task-contexts'),
  
  // Store files (JSON)
  store: {
    projects: path.join(DASHBOARD_DATA_DIR, 'projects.json'),
    tasks: path.join(DASHBOARD_DATA_DIR, 'tasks.json'),
    agents: path.join(DASHBOARD_DATA_DIR, 'agents.json')
  },
  
  // Logs
  logs: path.join(DASHBOARD_DATA_DIR, 'logs')
}

// Ensure all dashboard directories exist
export function ensureDashboardDirectories(): void {
  const fs = require('fs')
  
  Object.values(DASHBOARD_PATHS).forEach(dir => {
    if (typeof dir === 'string' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
  
  // Create store subdirectories
  if (!fs.existsSync(DASHBOARD_PATHS.projects)) {
    fs.mkdirSync(DASHBOARD_PATHS.projects, { recursive: true })
  }
  
  if (!fs.existsSync(DASHBOARD_PATHS.taskContexts)) {
    fs.mkdirSync(DASHBOARD_PATHS.taskContexts, { recursive: true })
  }
  
  if (!fs.existsSync(DASHBOARD_PATHS.logs)) {
    fs.mkdirSync(DASHBOARD_PATHS.logs, { recursive: true })
  }
}

// Get project workspace path (in dashboard)
export function getProjectWorkspace(projectId: string): string {
  return path.join(DASHBOARD_PATHS.projects, projectId)
}

// Get task context path (in dashboard)
export function getTaskContextPath(sessionKey: string): string {
  return path.join(DASHBOARD_PATHS.taskContexts, sessionKey)
}

// Validate path is within dashboard (security)
export function isWithinDashboard(targetPath: string): boolean {
  const resolved = path.resolve(targetPath)
  return resolved.startsWith(path.resolve(DASHBOARD_DATA_DIR))
}

// Export configuration
export default {
  HOME_DIR,
  OPENCLAW_DIR,
  OPENCLAW_WORKSPACES,
  DASHBOARD_DIR,
  DASHBOARD_DATA_DIR,
  DASHBOARD_PATHS,
  ensureDashboardDirectories,
  getProjectWorkspace,
  getTaskContextPath,
  isWithinDashboard
}
