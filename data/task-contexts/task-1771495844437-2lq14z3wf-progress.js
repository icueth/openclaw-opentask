#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const progressFile = '/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts/task-1771495844437-2lq14z3wf.progress';

function writeProgress(pct, msg) {
  try {
    fs.mkdirSync(path.dirname(progressFile), { recursive: true });
    fs.writeFileSync(progressFile, JSON.stringify({
      percentage: parseInt(pct),
      message: msg,
      timestamp: Date.now()
    }));
    console.log('[PROGRESS]', pct + '% - ' + msg);
  } catch (e) {
    console.error('[PROGRESS ERROR]', e.message);
  }
}

const [,, pct, msg] = process.argv;
if (pct && msg) {
  writeProgress(pct, msg);
} else {
  console.log('Usage: node progress.js <percentage> <message>');
}
