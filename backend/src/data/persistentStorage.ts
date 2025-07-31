import fs from 'fs';
import path from 'path';

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
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
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
export const companies = readJsonFile(COMPANIES_FILE, defaultCompanies);
export const users = readJsonFile(USERS_FILE, {});
export const agents = readJsonFile(AGENTS_FILE, defaultAgents);
export const sessions = readJsonFile(SESSIONS_FILE, []);
export const widgetSettings = readJsonFile(WIDGET_SETTINGS_FILE, {});

// Other in-memory data (these don't need persistence for now)
export const calls: Record<string, any> = {};
export const ivrConfigs: Record<string, any> = {};
export const callQueue: Record<string, string[]> = {};
export const chatSessions: Record<string, any> = {};
export const pendingCompanies: Record<string, any> = {};

// Save functions
export function saveCompanies(): void {
  writeJsonFile(COMPANIES_FILE, companies);
}

export function saveUsers(): void {
  writeJsonFile(USERS_FILE, users);
}

export function saveAgents(): void {
  writeJsonFile(AGENTS_FILE, agents);
}

export function saveSessions(): void {
  writeJsonFile(SESSIONS_FILE, sessions);
}

export function saveWidgetSettings(): void {
  writeJsonFile(WIDGET_SETTINGS_FILE, widgetSettings);
}

// Helper functions
export function findUserByCompanyAndRole(companyUuid: string, username: string, role: string) {
  return Object.values(users).find(
    (u: any) => u.companyUuid === companyUuid && u.username === username && u.role === role
  );
}

export function findCompanyByEmail(email: string) {
  return Object.values(companies).find((c: any) => c.email === email);
}

export function findPendingCompanyByEmail(email: string) {
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
};

console.log('✅ Persistent storage loaded successfully');
console.log(`📁 Data directory: ${DATA_DIR}`);
console.log(`🏢 Companies loaded: ${Object.keys(companies).length}`);
console.log(`👥 Agents loaded: ${Object.keys(agents).length}`);
console.log(`👤 Users loaded: ${Object.keys(users).length}`); 