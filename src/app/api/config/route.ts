import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Deep merge helper - defined at module level to avoid strict mode issues
function deepMerge(target: any, source: any): any {
  const output = { ...target }
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key])
    } else {
      output[key] = source[key]
    }
  }
  return output
}

// GET full config
export async function GET() {
  try {
    const configPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json')
    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configContent)
    
    return NextResponse.json({
      success: true,
      config,
      path: configPath
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update full config
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const configPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json')
    
    // Read current config for backup
    const currentConfig = fs.readFileSync(configPath, 'utf-8')
    const backupPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json.backup')
    fs.writeFileSync(backupPath, currentConfig)
    
    // Update meta
    if (!body.meta) body.meta = {}
    body.meta.lastTouchedAt = new Date().toISOString()
    
    // Write new config
    fs.writeFileSync(configPath, JSON.stringify(body, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Config updated. Restart gateway to apply changes.',
      backupPath
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Partial update
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const configPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json')
    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configContent)
    
    const merged = deepMerge(config, body)
    
    // Update meta
    if (!merged.meta) merged.meta = {}
    merged.meta.lastTouchedAt = new Date().toISOString()
    
    // Write config
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2))
    
    return NextResponse.json({ 
      success: true,
      message: 'Config patched. Restart gateway to apply changes.'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}