#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const progressFile = path.join('/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts', 'daemon-test-001.progress');

function writeProgress(pct, msg) {
  fs.mkdirSync(path.dirname(progressFile), { recursive: true });
  fs.writeFileSync(progressFile, JSON.stringify({
    percentage: parseInt(pct),
    message: msg,
    timestamp: Date.now()
  }));
  console.log('[PROGRESS]', pct + '% - ' + msg);
}

const [,, pct, msg] = process.argv;
writeProgress(pct, msg);
