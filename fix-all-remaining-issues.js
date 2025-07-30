// Fix all remaining issues
const fs = require('fs');

// Fix LandingPage.tsx duplicate boxShadow property
const landingFile = 'frontend/dashboard/src/LandingPage.tsx';
let landingContent = fs.readFileSync(landingFile, 'utf8');

// Fix the specific duplicate boxShadow property around line 189
landingContent = landingContent.replace(
  /boxShadow: '0 2px 16px #2E73FF11', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s', fontWeight: 600, fontSize: 18, border: '2px solid #F6C23E33', boxShadow: '0 4px 24px #F6C23E22, 0 2px 8px #00e6ef22'/g,
  "boxShadow: '0 4px 24px #F6C23E22, 0 2px 8px #00e6ef22', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s', fontWeight: 600, fontSize: 18, border: '2px solid #F6C23E33'"
);

fs.writeFileSync(landingFile, landingContent);

// Fix AdminDashboard.tsx duplicate alignItems property
const adminFile = 'frontend/dashboard/src/AdminDashboard.tsx';
let adminContent = fs.readFileSync(adminFile, 'utf8');

// Fix the specific duplicate alignItems property around line 1722
adminContent = adminContent.replace(
  /display: 'flex', alignItems: 'center', gap: 16,\s*flexDirection: 'column',\s*alignItems: 'flex-start'/g,
  "display: 'flex', gap: 16, flexDirection: 'column', alignItems: 'flex-start'"
);

fs.writeFileSync(adminFile, adminContent);

// Fix backend TypeScript errors in widget.ts
const widgetFile = 'backend/src/routes/widget.ts';
let widgetContent = fs.readFileSync(widgetFile, 'utf8');

// Fix the remaining global.tempStorage references
widgetContent = widgetContent.replace(
  /global\.tempStorage\.sessions\.find/g,
  'sessions.find'
);

widgetContent = widgetContent.replace(
  /global\.tempStorage\.sessions\.filter/g,
  'sessions.filter'
);

widgetContent = widgetContent.replace(
  /global\.tempStorage\.sessions\.push/g,
  'sessions.push'
);

// Fix agent socketId property access
widgetContent = widgetContent.replace(
  /agent\.socketId/g,
  'agent.socketId || null'
);

fs.writeFileSync(widgetFile, widgetContent);

console.log('✅ All remaining issues fixed!'); 