import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Try to read real logs from gateway log file
    const logPath = path.join(process.env.HOME || '', '.openclaw', 'logs', 'gateway.log')
    
    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf-8')
      const lines = logContent.trim().split('\n').slice(-50) // Last 50 lines
      
      const logs = lines.map(line => {
        // Parse log line format: 2026-02-15T12:34:56.789Z [gateway] message
        const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+\[(\w+)\]\s+(.+)$/)
        
        if (match) {
          const [, timestamp, source, message] = match
          const level: 'info' | 'warn' | 'error' = 
            message.toLowerCase().includes('error') ? 'error' :
            message.toLowerCase().includes('warn') ? 'warn' : 'info'
          
          return {
            timestamp: timestamp.split('T')[1].split('.')[0], // Just time
            level,
            message,
            source
          }
        }
        
        return {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info' as const,
          message: line,
          source: 'gateway'
        }
      }).reverse() // Most recent first

      return NextResponse.json(logs)
    }
  } catch (error) {
    console.error('Failed to read logs:', error)
  }

  // Fallback to mock logs
  return NextResponse.json(getMockLogs())
}

function getMockLogs() {
  return [
    {
      timestamp: new Date().toLocaleTimeString().split(' ')[0],
      level: 'info' as const,
      message: 'Dashboard connected to gateway',
      source: 'dashboard'
    },
  ]
}
