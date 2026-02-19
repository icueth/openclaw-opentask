#!/usr/bin/env node
/**
 * Test WebSocket with Challenge-Response Authentication
 */

const WebSocket = require('ws');
const crypto = require('crypto');

const TOKEN = process.env.GATEWAY_TOKEN || 'aa86ae060b0089c42b8a70c07ae4cd1653408cf109704387';
const GATEWAY_URL = 'ws://localhost:18789';

console.log('==========================================');
console.log('WebSocket Auth Test with Challenge-Response');
console.log('==========================================');
console.log('');

let ws;
let authenticated = false;

function connect() {
  console.log('Connecting to Gateway...');
  
  ws = new WebSocket(GATEWAY_URL, {
    headers: { 
      'Authorization': 'Bearer ' + TOKEN,
      'X-Client': 'dashboard-test'
    }
  });
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected');
    console.log('');
    console.log('Waiting for challenge...');
  });
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('📨 Received:', JSON.stringify(msg, null, 2));
    console.log('');
    
    // Handle challenge
    if (msg.type === 'event' && msg.event === 'connect.challenge') {
      console.log('🔐 Challenge received!');
      console.log('Nonce:', msg.payload.nonce);
      
      // Send challenge response
      // The response format depends on Gateway implementation
      // Usually it's: hash(token + nonce) or similar
      
      const response = {
        type: 'authenticate',
        token: TOKEN,
        nonce: msg.payload.nonce,
        timestamp: Date.now()
      };
      
      console.log('📤 Sending auth response...');
      ws.send(JSON.stringify(response));
    }
    
    // Handle auth success
    if (msg.type === 'event' && msg.event === 'authenticated') {
      console.log('✅ Authenticated!');
      authenticated = true;
      
      // Now we can send messages
      testSendMessage();
    }
    
    // Handle chat history or other responses
    if (msg.type === 'chat.history') {
      console.log('📜 Chat history received');
    }
  });
  
  ws.on('error', (err) => {
    console.log('❌ Error:', err.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log('🔌 Connection closed');
    console.log('Code:', code, 'Reason:', reason);
  });
}

function testSendMessage() {
  if (!authenticated) {
    console.log('❌ Not authenticated yet');
    return;
  }
  
  console.log('');
  console.log('Sending test message...');
  
  // Try to inject message to coordinator agent
  ws.send(JSON.stringify({
    type: 'chat.inject',
    sessionKey: 'agent:coordinator:main',
    message: 'Spawn task: Create factorial function'
  }));
  
  // Or try to send to main session
  // ws.send(JSON.stringify({
  //   type: 'chat.send',
  //   message: 'Test message from Dashboard'
  // }));
}

// Run
connect();

// Close after 10 seconds
setTimeout(() => {
  console.log('');
  console.log('Closing connection...');
  ws.close();
}, 10000);
