// Fix duplicate CSS properties in frontend files
const fs = require('fs');
const path = require('path');

// Fix IVRChatWidget.tsx duplicate border property
const ivrFile = 'frontend/dashboard/src/IVRChatWidget.tsx';
let ivrContent = fs.readFileSync(ivrFile, 'utf8');

// Fix duplicate border property around line 727-729
ivrContent = ivrContent.replace(
  /border: 'none',\s*cursor: 'pointer',\s*border: '2px solid #F6C23E'/g,
  "border: '2px solid #F6C23E',\n      cursor: 'pointer'"
);

fs.writeFileSync(ivrFile, ivrContent);

// Fix LandingPage.tsx duplicate boxShadow property
const landingFile = 'frontend/dashboard/src/LandingPage.tsx';
let landingContent = fs.readFileSync(landingFile, 'utf8');

// Fix duplicate boxShadow property around line 189
landingContent = landingContent.replace(
  /boxShadow: '0 2px 16px #2E73FF11',.*?boxShadow: '0 4px 24px #F6C23E22, 0 2px 8px #00e6ef22'/g,
  "boxShadow: '0 4px 24px #F6C23E22, 0 2px 8px #00e6ef22'"
);

fs.writeFileSync(landingFile, landingContent);

// Fix AdminDashboard.tsx duplicate alignItems property
const adminFile = 'frontend/dashboard/src/AdminDashboard.tsx';
let adminContent = fs.readFileSync(adminFile, 'utf8');

// Fix duplicate alignItems properties around lines 1699 and 1722
adminContent = adminContent.replace(
  /alignItems: 'center',\s*gap: 16,\s*flexDirection: 'column',\s*alignItems: 'flex-start'/g,
  "gap: 16,\n      flexDirection: 'column',\n      alignItems: 'flex-start'"
);

fs.writeFileSync(adminFile, adminContent);

console.log('✅ Fixed duplicate CSS properties'); 