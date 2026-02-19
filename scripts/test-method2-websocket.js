#!/usr/bin/env node
/**
 * Test Method 2: WebSocket Gateway Connection
 * ทดสอบการเชื่อมต่อ Gateway ผ่าน WebSocket
 */

const WebSocket = require('ws')
const fs = require('fs')
const path = require('path')

const GATEWAY_URL = 'ws://localhost:18789'
const TOKEN = process.env.GATEWAY_TOKEN || ''

console.log('==========================================')
console.log('Test Method 2: WebSocket Gateway')
console.log('==========================================')
console.log('')
console.log('Gateway:', GATEWAY_URL)
console.log('Token:', TOKEN ? '***' : 'Not set')
console.log('')

// Check if ws module is available
try {
  require('ws')
} catch (e) {
  console.log('❌ WebSocket module (ws) not installed')
  console.log('Installing...')
  console.log('   npm install ws')
  console.log('')
  process.exit(1)
}

// Test WebSocket connection
async function testWebSocket() {
  return new Promise((resolve, reject) => {
    console.log('Step 1: Connecting to Gateway WebSocket...')
    
    const ws = new WebSocket(GATEWAY_URL, {
      headers: TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}
    })
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected!')
      console.log('')
      
      // Send test message
      console.log('Step 2: Sending test message...')
      const testMessage = {
        type: 'chat.send',
        message: 'Test message from WebSocket client'
      }
      
      ws.send(JSON.stringify(testMessage))
      console.log('✅ Message sent')
      console.log('')
      
      // Close after a moment
      setTimeout(() => {
        ws.close()
        resolve(true)
      }, 2000)
    })
    
    ws.on('message', (data) => {
      console.log('📨 Received:', data.toString().substring(0, 200))
    })
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message)
      reject(error)
    })
    
    ws.on('close', () => {
      console.log('✅ WebSocket closed')
    })
  })
}

// Test via Gateway REST API (chat.inject)
async function testRestAPI() {
  console.log('Step 3: Testing REST API (alternative)...')
  console.log('')
  
  try {
    // Try to inject a message via REST API
    const response = await fetch(`${GATEWAY_URL.replace('ws', 'http')}/api/chat/inject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
      },
      body: JSON.stringify({
        sessionKey: 'agent:coordinator:main',
        message: 'Test inject from Dashboard'
      })
    })
    
    if (response.ok) {
      console.log('✅ REST API works!')
      const data = await response.json()
      console.log('Response:', data)
    } else {
      console.log('❌ REST API failed:', response.status)
      const text = await response.text()
      console.log('Error:', text)
    }
  } catch (error) {
    console.log('❌ REST API error:', error.message)
  }
}

// Main
async function main() {
  console.log('Testing WebSocket connection...')
  console.log('')
  
  try {
    await testWebSocket()
  } catch (e) {
    console.log('WebSocket test failed, trying REST API...')
    console.log('')
  }
  
  await testRestAPI()
  
  console.log('')
  console.log('==========================================')
  console.log('Test Summary:')
  console.log('==========================================')
  console.log('')
  console.log('WebSocket: Requires authentication and proper protocol')
  console.log('REST API:  May work if endpoints are exposed')
  console.log('')
  console.log('Note: Gateway WebSocket is primarily for WebChat UI')
  console.log('      It may not accept arbitrary connections')
  console.log('')
}

main().catch(console.error)
