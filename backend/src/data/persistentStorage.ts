import fs from 'fs';
import path from 'path';

// Define the data directory - use a more reliable path for production
const DATA_DIR = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'data')  // Use project root in production
  : path.join(__dirname, '../../data');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const WIDGET_SETTINGS_FILE = path.join(DATA_DIR, 'widget-settings.json');

// Ensure data directory exists
function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`📁 Created data directory: ${DATA_DIR}`);
    }
  } catch (error) {
    console.error(`❌ Error creating data directory: ${error}`);
    // Fallback to current directory if needed
    return false;
  }
  return true;
}

// Helper functions for file operations
function readJsonFile(filePath: string, defaultValue: any = {}): any {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

function writeJsonFile(filePath: string, data: any): void {
  try {
    // Ensure directory exists before writing
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved data to: ${filePath}`);
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// Initialize data directory
ensureDataDirectory();

// Initialize default data
const defaultCompanies = {
  'demo-company-uuid': {
    uuid: 'demo-company-uuid',
    name: 'Demo Company',
    email: 'demo@company.com',
    verified: true,
    createdAt: new Date().toISOString(),
  }
};

const defaultAgents = {
  'agent1': {
    uuid: 'demo-agent-uuid',
    companyUuid: 'demo-company-uuid',
    username: 'agent1',
    password: 'password', // Set this to match frontend login
    email: 'agent1@demo.com',
    status: 'online',
    registrationStatus: 'approved',
    createdAt: new Date().toISOString(),
  }
};

// Load data from files or create with defaults
const companies = readJsonFile(COMPANIES_FILE, defaultCompanies);
const users = readJsonFile(USERS_FILE, {});
const agents = readJsonFile(AGENTS_FILE, defaultAgents);
const sessions = readJsonFile(SESSIONS_FILE, []);
const widgetSettings = readJsonFile(WIDGET_SETTINGS_FILE, {});

// Other in-memory data (these don't need persistence for now)
const calls: Record<string, any> = {};
const ivrConfigs: Record<string, any> = {};
const callQueue: Record<string, string[]> = {};
const chatSessions: Record<string, any> = {};
const pendingCompanies: Record<string, any> = {};

// Save functions with enhanced error handling
function saveCompanies(): void {
  console.log(`💾 Saving ${Object.keys(companies).length} companies...`);
  writeJsonFile(COMPANIES_FILE, companies);
}

function saveUsers(): void {
  console.log(`💾 Saving ${Object.keys(users).length} users...`);
  writeJsonFile(USERS_FILE, users);
}

function saveAgents(): void {
  console.log(`💾 Saving ${Object.keys(agents).length} agents...`);
  writeJsonFile(AGENTS_FILE, agents);
}

function saveSessions(): void {
  console.log(`💾 Saving ${sessions.length} sessions...`);
  writeJsonFile(SESSIONS_FILE, sessions);
}

function saveWidgetSettings(): void {
  console.log(`💾 Saving widget settings...`);
  writeJsonFile(WIDGET_SETTINGS_FILE, widgetSettings);
}

// Helper functions
function findUserByCompanyAndRole(companyUuid: string, username: string, role: string) {
  return Object.values(users).find(
    (u: any) => u.companyUuid === companyUuid && u.username === username && u.role === role
  );
}

function findCompanyByEmail(email: string) {
  return Object.values(companies).find((c: any) => c.email === email);
}

function findPendingCompanyByEmail(email: string) {
  return Object.values(pendingCompanies).find((c: any) => c.email === email);
}

// Export the main storage object
export interface PersistentStorage {
  companies: Record<string, any>;
  users: Record<string, any>;
  agents: Record<string, any>;
  widgetSettings: Record<string, any>;
  calls: Record<string, any>;
  ivrConfigs: Record<string, any>;
  callQueue: Record<string, string[]>;
  chatSessions: Record<string, any>;
  sessions: Array<{
    sessionId: string;
    companyUuid: string;
    visitorId: string;
    agentId?: string;
    type: 'call' | 'chat';
    status: 'waiting' | 'ringing' | 'active' | 'ended';
    createdAt: string;
    startedAt?: string;
    endedAt?: string;
    pageUrl?: string;
    queuePosition?: number;
  }>;
  // Additional properties used in server.ts
  formPushes: Array<{
    _id: string;
    companyId: string;
    sessionId: string;
    from: string;
    type: string;
    fields: any[];
    active: boolean;
    timestamp: string;
  }>;
  formResponses: Array<{
    _id: string;
    companyId: string;
    sessionId: string;
    formId: string;
    from: string;
    values: any;
    timestamp: string;
  }>;
  chatMessages: Array<{
    _id: string;
    companyId: string;
    sessionId: string;
    message: string;
    from: string;
    timestamp: string;
    type?: string;
  }>;
  cannedResponses: Array<{
    _id: string;
    companyId: string;
    category: string;
    title: string;
    message: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  chatNotes: Array<{
    _id: string;
    companyId: string;
    sessionId: string;
    author: string;
    text: string;
    timestamp: string;
  }>;
  contacts: Array<{
    _id: string;
    companyId: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    tags: string[];
    notes: Array<{
      _id: string;
      content: string;
      agentId: string;
      timestamp: string;
    }>;
    interactions: Array<{
      _id: string;
      type: 'call' | 'chat' | 'form';
      sessionId: string;
      timestamp: string;
      duration?: number;
      status: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  agentAssignments: Array<{
    id: string;
    agentId: string;
    assignedToPublic: boolean;
    maxCalls: number;
    currentCalls: number;
    skills: string[];
    availability: 'available' | 'busy' | 'break' | 'offline';
    lastActivity: string;
  }>;
  callAnalytics: Array<{
    id: string;
    agentId: string;
    callsHandled: number;
    avgDuration: number;
    satisfaction: number;
    responseTime: number;
    date: string;
  }>;
  // Save functions
  saveCompanies: () => void;
  saveUsers: () => void;
  saveAgents: () => void;
  saveSessions: () => void;
  saveWidgetSettings: () => void;
  // Helper functions
  findUserByCompanyAndRole: (companyUuid: string, username: string, role: string) => any;
  findCompanyByEmail: (email: string) => any;
  findPendingCompanyByEmail: (email: string) => any;
}

export const persistentStorage: PersistentStorage = {
  companies,
  users,
  agents,
  widgetSettings,
  calls,
  ivrConfigs,
  callQueue,
  chatSessions,
  sessions,
  // Initialize additional properties
  formPushes: [],
  formResponses: [],
  chatMessages: [],
  cannedResponses: [],
  chatNotes: [],
  contacts: [],
  agentAssignments: [],
  callAnalytics: [],
  // Save functions
  saveCompanies,
  saveUsers,
  saveAgents,
  saveSessions,
  saveWidgetSettings,
  // Helper functions
  findUserByCompanyAndRole,
  findCompanyByEmail,
  findPendingCompanyByEmail
};

console.log('✅ Persistent storage loaded successfully');
console.log(`📁 Data directory: ${DATA_DIR}`);
console.log(`🏢 Companies loaded: ${Object.keys(companies).length}`);
console.log(`👥 Agents loaded: ${Object.keys(agents).length}`);
console.log(`👤 Users loaded: ${Object.keys(users).length}`); 