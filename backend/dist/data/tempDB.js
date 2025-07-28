"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pendingCompanies = exports.chatSessions = exports.callQueue = exports.ivrConfigs = exports.calls = exports.widgetSettings = exports.agents = exports.users = exports.companies = void 0;
exports.findUserByCompanyAndRole = findUserByCompanyAndRole;
exports.findCompanyByEmail = findCompanyByEmail;
exports.findPendingCompanyByEmail = findPendingCompanyByEmail;
// In-memory storage for MVP
exports.companies = {};
exports.users = {};
exports.agents = {};
exports.widgetSettings = {};
exports.calls = {};
exports.ivrConfigs = {};
exports.callQueue = {}; // companyUuid -> array of socket IDs in queue. This will track the order of calls for queue logic.
exports.chatSessions = {}; // sessionId -> { companyUuid, visitorId, pageUrl, startedAt, messages: [] }
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
