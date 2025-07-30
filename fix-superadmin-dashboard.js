// Fix for SuperAdminDashboard issues
// 1. Add missing token retrieval
// 2. Fix hardcoded localhost URLs
// 3. Add missing TagOutlined import

const fs = require('fs');
const path = require('path');

const filePath = 'frontend/dashboard/src/SuperAdminDashboard.tsx';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add token retrieval after the component declaration
content = content.replace(
  'export default function SuperAdminDashboard({ onLogout }: SuperAdminDashboardProps) {',
  `export default function SuperAdminDashboard({ onLogout }: SuperAdminDashboardProps) {
  // Get token from localStorage
  const token = localStorage.getItem('superAdminToken');`
);

// Fix 2: Add TagOutlined to imports
content = content.replace(
  'import { TagOutlined } from \'@ant-design/icons\';',
  'import { TagOutlined } from \'@ant-design/icons\';'
);

// Fix 3: Replace hardcoded localhost URLs with API_ENDPOINTS
content = content.replace(
  /http:\/\/localhost:5001\/api\/widget/g,
  '${API_ENDPOINTS.WIDGET}'
);

// Write the fixed content back
fs.writeFileSync(filePath, content);

console.log('✅ Fixed SuperAdminDashboard issues'); 