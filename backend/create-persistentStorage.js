const fs = require('fs');
const path = require('path');

// Ensure dist/data directory exists
const distDataDir = path.join(__dirname, 'dist/data');
if (!fs.existsSync(distDataDir)) {
  fs.mkdirSync(distDataDir, { recursive: true });
  console.log('✅ Created dist/data directory');
}

// Create persistentStorage.js file
const targetPath = path.join(distDataDir, 'persistentStorage.js');
const content = `const fs = require('fs');
const path = require('path');

// Define the data directory
const DATA_DIR = path.join(__dirname, '../../data');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const WIDGET_SETTINGS_FILE = path.join(DATA_DIR, 'widget-settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions for file operations
function readJsonFile(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(\`Error reading \${filePath}:\`, error);
  }
  return defaultValue;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(\`Error writing \${filePath}:\`, error);
  }
}

// Initialize default data
const defaultCompanies = {
  'demo-company-uuid': {
    uuid: 'demo-company-uuid',
    name: 'Demo Company',
    email: 'demo@company.com',
    verified: true,
    createdAt: new Date().toISOString(),
  },
  'calldocker-company-uuid': {
    uuid: 'calldocker-company-uuid',
    name: 'CallDocker',
    email: 'admin@calldocker.com',
    verified: true,
    createdAt: new Date().toISOString(),
  }
};

const defaultAgents = {
  'agent1': {
    uuid: 'demo-agent-uuid',
    companyUuid: 'demo-company-uuid',
    username: 'agent1',
    password: 'password',
    email: 'agent1@demo.com',
    status: 'online',
    registrationStatus: 'approved',
    createdAt: new Date().toISOString(),
  },
  'calldocker-main-agent': {
    uuid: 'calldocker-main-agent',
    companyUuid: 'calldocker-company-uuid',
    username: 'calldocker_agent',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // "CallDocker2024!"
    email: 'agent@calldocker.com',
    phone: '+1-555-CALL-DOCKER',
    fullName: 'CallDocker Main Agent',
    role: 'senior_agent',
    status: 'online',
    registrationStatus: 'approved',
    skills: ['customer_service', 'technical_support', 'sales', 'enquiry_handling', 'billing'],
    performance: {
      callsHandled: 1250,
      avgRating: 4.9,
      successRate: 98.5
    },
    currentCalls: 0,
    maxCalls: 10,
    availability: 'online',
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: 'Main CallDocker agent responsible for handling all incoming calls from the CallDocker landing page. This agent is always available and ready to assist customers.'
  }
};

// Load data from files or create with defaults
const companies = readJsonFile(COMPANIES_FILE, defaultCompanies);
const users = readJsonFile(USERS_FILE, {});
const agents = readJsonFile(AGENTS_FILE, defaultAgents);
const sessions = readJsonFile(SESSIONS_FILE, []);
const widgetSettings = readJsonFile(WIDGET_SETTINGS_FILE, {});

// Other in-memory data
const calls = {};
const ivrConfigs = {};
const callQueue = {};
const chatSessions = {};
const pendingCompanies = {};

// Save functions
function saveCompanies() {
  writeJsonFile(COMPANIES_FILE, companies);
}

function saveUsers() {
  writeJsonFile(USERS_FILE, users);
}

function saveAgents() {
  writeJsonFile(AGENTS_FILE, agents);
}

function saveSessions() {
  writeJsonFile(SESSIONS_FILE, sessions);
}

function saveWidgetSettings() {
  writeJsonFile(WIDGET_SETTINGS_FILE, widgetSettings);
}

// Helper functions
function findUserByCompanyAndRole(companyUuid, username, role) {
  return Object.values(users).find(
    (u) => u.companyUuid === companyUuid && u.username === username && u.role === role
  );
}

function findCompanyByEmail(email) {
  return Object.values(companies).find((c) => c.email === email);
}

function findPendingCompanyByEmail(email) {
  return Object.values(pendingCompanies).find((c) => c.email === email);
}

// Export everything
module.exports = {
  companies,
  users,
  agents,
  sessions,
  widgetSettings,
  calls,
  ivrConfigs,
  callQueue,
  chatSessions,
  pendingCompanies,
  saveCompanies,
  saveUsers,
  saveAgents,
  saveSessions,
  saveWidgetSettings,
  findUserByCompanyAndRole,
  findCompanyByEmail,
  findPendingCompanyByEmail
};
`;

fs.writeFileSync(targetPath, content);
console.log('✅ persistentStorage.js created successfully');
console.log(`📁 File location: ${targetPath}`);
console.log(`📊 File size: ${fs.statSync(targetPath).size} bytes`); 