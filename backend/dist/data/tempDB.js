"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tempStorage = exports.pendingCompanies = exports.sessions = exports.chatSessions = exports.callQueue = exports.ivrConfigs = exports.calls = exports.widgetSettings = exports.agents = exports.users = exports.companies = void 0;
exports.findUserByCompanyAndRole = findUserByCompanyAndRole;
exports.findCompanyByEmail = findCompanyByEmail;
exports.findPendingCompanyByEmail = findPendingCompanyByEmail;
// In-memory storage for MVP
exports.companies = {
    'demo-company-uuid': {
        uuid: 'demo-company-uuid',
        name: 'Demo Company',
        email: 'demo@company.com',
        verified: true,
        createdAt: new Date().toISOString(),
    }
};
exports.users = {};
exports.agents = {
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
exports.widgetSettings = {};
exports.calls = {};
exports.ivrConfigs = {};
exports.callQueue = {}; // companyUuid -> array of socket IDs in queue. This will track the order of calls for queue logic.
exports.chatSessions = {}; // sessionId -> { companyUuid, visitorId, pageUrl, startedAt, messages: [] }
exports.sessions = [];
// Pending company registrations (waiting for email verification)
exports.pendingCompanies = {};
// Helper to find users by company and role
function findUserByCompanyAndRole(companyUuid, username, role) {
    return Object.values(exports.users).find((u) => u.companyUuid === companyUuid && u.username === username && u.role === role);
}
// Helper to find company by email
function findCompanyByEmail(email) {
    return Object.values(exports.companies).find((c) => c.email === email);
}
// Helper to find pending company by email
function findPendingCompanyByEmail(email) {
    return Object.values(exports.pendingCompanies).find((c) => c.email === email);
}
exports.tempStorage = {
    companies: {
        'demo-company-uuid': {
            uuid: 'demo-company-uuid',
            name: 'Demo Company',
            email: 'demo@company.com',
            verified: true,
            createdAt: new Date().toISOString(),
        }
    },
    users: exports.users,
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
    widgetSettings: exports.widgetSettings,
    calls: exports.calls,
    ivrConfigs: exports.ivrConfigs,
    callQueue: exports.callQueue,
    chatSessions: exports.chatSessions,
    sessions: exports.sessions,
};
