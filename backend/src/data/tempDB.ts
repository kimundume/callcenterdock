// In-memory storage for MVP
export const companies: Record<string, any> = {};
export const users: Record<string, any> = {};
export const agents: Record<string, any> = {};
export const widgetSettings: Record<string, any> = {};
export const calls: Record<string, any> = {};
export const ivrConfigs: Record<string, any> = {};
export const callQueue: Record<string, string[]> = {}; // companyUuid -> array of socket IDs in queue. This will track the order of calls for queue logic.
export const chatSessions: Record<string, any> = {}; // sessionId -> { companyUuid, visitorId, pageUrl, startedAt, messages: [] }

// Helper to find users by company and role
export function findUserByCompanyAndRole(companyUuid: string, username: string, role: string) {
  return Object.values(users).find(
    (u: any) => u.companyUuid === companyUuid && u.username === username && u.role === role
  );
} 