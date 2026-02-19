
const fs = require('fs');
const path = require('path');
const progressFile = path.join('/Users/icue/.openclaw/workspace-coder/dashboard/data/task-contexts', 'task-1771489693870-5us22w6vm.progress');
function writeProgress(pct, msg) {
  fs.writeFileSync(progressFile, JSON.stringify({
    percentage: parseInt(pct),
    message: msg,
    timestamp: Date.now()
  }));
  console.log('PROGRESS: ' + pct + '% - ' + msg);
}
const [,, pct, msg] = process.argv;
writeProgress(pct, msg);
