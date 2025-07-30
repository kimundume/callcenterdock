// In-memory storage for MVP
export const companies: Record<string, any> = {
  'demo-company-uuid': {
    uuid: 'demo-company-uuid',
    name: 'Demo Company',
    email: 'demo@company.com',
    verified: true,
    createdAt: new Date().toISOString(),
  }
};

export const users: Record<string, any> = {};
export const agents: Record<string, any> = {
  'agent1': {
    uuid: 'demo-agent-uuid',
    companyUuid: 'demo-company-uuid',
    username: 'agent1',
    email: 'agent1@demo.com',
    status: 'online',
    registrationStatus: 'approved',
    createdAt: new Date().toISOString(),
  }
};
export const widgetSettings: Record<string, any> = {};
export const calls: Record<string, any> = {};
export const ivrConfigs: Record<string, any> = {};
export const callQueue: Record<string, string[]> = {}; // companyUuid -> array of socket IDs in queue. This will track the order of calls for queue logic.
export const chatSessions: Record<string, any> = {}; // sessionId -> { companyUuid, visitorId, pageUrl, startedAt, messages: [] }
export const sessions: Array<{
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
}> = [];

// Pending company registrations (waiting for email verification)
export const pendingCompanies: Record<string, {
  uuid: string;
  companyName: string;
  displayName?: string;
  email: string;
  adminUsername: string;
  adminPassword: string;
  verificationToken: string;
  createdAt: string;
}> = {};

// Helper to find users by company and role
export function findUserByCompanyAndRole(companyUuid: string, username: string, role: string) {
  return Object.values(users).find(
    (u: any) => u.companyUuid === companyUuid && u.username === username && u.role === role
  );
}

// Helper to find company by email
export function findCompanyByEmail(email: string) {
  return Object.values(companies).find((c: any) => c.email === email);
}

// Helper to find pending company by email
export function findPendingCompanyByEmail(email: string) {
  return Object.values(pendingCompanies).find((c: any) => c.email === email);
} 

export interface TempStorage {
  companies: Record<string, any>;
  users: Record<string, any>;
  agents: Record<string, any>;
  widgetSettings: Record<string, any>;
  calls: Record<string, any>;
  ivrConfigs: Record<string, any>;
  callQueue: Record<string, string[]>; // companyUuid -> array of socket IDs in queue. This will track the order of calls for queue logic.
  chatSessions: Record<string, any>; // sessionId -> { companyUuid, visitorId, pageUrl, startedAt, messages: [] }
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

export const tempStorage: TempStorage = {
  companies: {
    'demo-company-uuid': {
      uuid: 'demo-company-uuid',
      name: 'Demo Company',
      email: 'demo@company.com',
      verified: true,
      createdAt: new Date().toISOString(),
    }
  },
  users,
  agents: {
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
  },
  widgetSettings,
  calls,
  ivrConfigs,
  callQueue,
  chatSessions,
  sessions,
}; 