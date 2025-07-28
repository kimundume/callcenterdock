// In-memory storage for MVP
export const companies: Record<string, {
  uuid: string;
  name: string;
  companyName?: string; // For backward compatibility
  displayName?: string;
  email: string;
  verified: boolean;
  suspended?: boolean;
  createdAt: string;
  lastLogin?: string;
  updatedAt?: string;
}> = {};

export const users: Record<string, any> = {};
export const agents: Record<string, any> = {};
export const widgetSettings: Record<string, any> = {};
export const calls: Record<string, any> = {};
export const ivrConfigs: Record<string, any> = {};
export const callQueue: Record<string, string[]> = {}; // companyUuid -> array of socket IDs in queue. This will track the order of calls for queue logic.
export const chatSessions: Record<string, any> = {}; // sessionId -> { companyUuid, visitorId, pageUrl, startedAt, messages: [] }

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