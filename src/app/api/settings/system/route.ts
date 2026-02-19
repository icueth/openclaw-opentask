import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'system-settings.json')
const DEFAULT_SETTINGS = {
  gatewayToken: '',
  gatewayPassword: '',
  taskModel: 'kimi-coding/kimi-for-coding',
  taskThinking: 'medium'
}

// GET /api/settings/system - Get system settings
export async function GET() {
  try {
    let settings = DEFAULT_SETTINGS
    
    if (fs.existsSync(SETTINGS_FILE)) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) }
    }
    
    // Don't return sensitive data in full
    return NextResponse.json({
      success: true,
      settings: {
        hasToken: !!settings.gatewayToken,
        hasPassword: !!settings.gatewayPassword,
        taskModel: settings.taskModel,
        taskThinking: settings.taskThinking
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/settings/system - Save system settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Load existing settings
    let settings = DEFAULT_SETTINGS
    if (fs.existsSync(SETTINGS_FILE)) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) }
    }
    
    // Update fields
    if (body.gatewayToken !== undefined) settings.gatewayToken = body.gatewayToken
    if (body.gatewayPassword !== undefined) settings.gatewayPassword = body.gatewayPassword
    if (body.taskModel) settings.taskModel = body.taskModel
    if (body.taskThinking) settings.taskThinking = body.taskThinking
    
    // Save
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true })
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
    
    return NextResponse.json({
      success: true,
      settings: {
        hasToken: !!settings.gatewayToken,
        hasPassword: !!settings.gatewayPassword,
        taskModel: settings.taskModel,
        taskThinking: settings.taskThinking
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
