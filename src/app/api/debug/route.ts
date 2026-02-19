/**
 * Debug API - Returns current system status for troubleshooting
 */

import { NextResponse } from 'next/server'
import { taskQueue } from '@/lib/taskQueue'
import { getRecentSpawnLog, clearSpawnLog } from '@/lib/spawnLogger'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const TASKS_FILE = path.join(process.cwd(), 'data', 'tasks.json')

export async function GET() {
  console.log('[GET /api/debug] Debug info requested')
  
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    system: {},
    openclaw: {},
    tasks: {},
    spawnLog: getRecentSpawnLog(20), // Last 20 spawn events
    errors: [] as string[]
  }
  
  // Check system info
  try {
    debugInfo.system = {
      platform: process.platform,
      nodeVersion: process.version,
      cwd: process.cwd(),
      envHome: process.env.HOME,
      gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:18789',
      gatewayToken: process.env.GATEWAY_TOKEN ? '***set***' : 'not set'
    }
  } catch (e: any) {
    debugInfo.errors.push(`System info error: ${e.message}`)
  }
  
  // Check OpenClaw availability
  try {
    const { stdout: whichOutput } = await execAsync('which openclaw')
    debugInfo.openclaw.cliPath = whichOutput.trim()
  } catch (e: any) {
    debugInfo.openclaw.cliPath = null
    debugInfo.errors.push(`OpenClaw CLI not found: ${e.message}`)
  }
  
  try {
    const { stdout: versionOutput } = await execAsync('openclaw --version')
    debugInfo.openclaw.version = versionOutput.trim()
  } catch (e: any) {
    debugInfo.openclaw.version = null
    debugInfo.errors.push(`OpenClaw version check failed: ${e.message}`)
  }
  
  try {
    const { stdout: gatewayOutput } = await execAsync('openclaw gateway status')
    debugInfo.openclaw.gatewayStatus = gatewayOutput.includes('running') ? 'running' : 'not running'
    debugInfo.openclaw.gatewayDetails = gatewayOutput
  } catch (e: any) {
    debugInfo.openclaw.gatewayStatus = 'error'
    debugInfo.openclaw.gatewayError = e.message
    debugInfo.errors.push(`Gateway status check failed: ${e.message}`)
  }
  
  // Check tasks file
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const tasksData = fs.readFileSync(TASKS_FILE, 'utf-8')
      const tasks = JSON.parse(tasksData)
      debugInfo.tasks.total = tasks.length
      debugInfo.tasks.byStatus = tasks.reduce((acc: any, t: any) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      }, {})
      debugInfo.tasks.processing = tasks.filter((t: any) => t.status === 'processing').map((t: any) => ({
        id: t.id,
        title: t.title,
        assignedAgent: t.assignedAgent,
        startedAt: t.startedAt
      }))
      debugInfo.tasks.pending = tasks.filter((t: any) => t.status === 'pending' || t.status === 'active').length
    } else {
      debugInfo.tasks.error = 'Tasks file not found'
    }
  } catch (e: any) {
    debugInfo.tasks.error = `Failed to read tasks: ${e.message}`
    debugInfo.errors.push(`Tasks file error: ${e.message}`)
  }
  
  // Check queue processor status
  debugInfo.queueProcessor = {
    isRunning: taskQueue.isQueueProcessorRunning(),
    config: taskQueue.getQueueConfig()
  }
  
  // Test gateway endpoints
  debugInfo.gatewayTests = {}
  const endpoints = [
    'http://localhost:18789/api/sessions',
    'http://localhost:18789/api/sessions/spawn',
    'http://localhost:18789/v1/sessions',
    'http://localhost:18789/health'
  ]
  
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(endpoint, { 
        method: 'GET',
        signal: controller.signal 
      })
      clearTimeout(timeout)
      debugInfo.gatewayTests[endpoint] = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      }
    } catch (e: any) {
      debugInfo.gatewayTests[endpoint] = {
        error: e.message,
        ok: false
      }
    }
  }
  
  // Check agent config
  try {
    const configPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json')
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      debugInfo.agents = {
        count: config.agents?.list?.length || 0,
        list: config.agents?.list?.map((a: any) => ({ id: a.id, name: a.name, model: a.model })) || []
      }
    } else {
      debugInfo.agents = { error: 'Config file not found' }
    }
  } catch (e: any) {
    debugInfo.agents = { error: `Failed to read config: ${e.message}` }
    debugInfo.errors.push(`Agent config error: ${e.message}`)
  }
  
  console.log('[GET /api/debug] Returning debug info with', debugInfo.errors.length, 'errors')
  
  return NextResponse.json({
    success: true,
    debug: debugInfo
  })
}

// Allow clearing spawn log
export async function DELETE() {
  clearSpawnLog()
  return NextResponse.json({ success: true, message: 'Spawn log cleared' })
}
