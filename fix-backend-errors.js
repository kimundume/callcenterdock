// Fix for backend TypeScript errors in widget.ts
const fs = require('fs');
const path = require('path');

const filePath = 'backend/src/routes/widget.ts';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Replace global.tempStorage.sessions with sessions from persistentStorage
content = content.replace(
  /global\.tempStorage\.sessions/g,
  'sessions'
);

// Fix 2: Add socketId property to agent type or handle it properly
content = content.replace(
  /agent\.socketId/g,
  'agent.socketId || null'
);

// Write the fixed content back
fs.writeFileSync(filePath, content);

console.log('✅ Fixed backend TypeScript errors'); 