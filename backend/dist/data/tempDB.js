"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callQueue = exports.ivrConfigs = exports.calls = exports.widgetSettings = exports.agents = exports.users = exports.companies = void 0;
exports.findUserByCompanyAndRole = findUserByCompanyAndRole;
// In-memory storage for MVP
exports.companies = {};
exports.users = {};
exports.agents = {};
exports.widgetSettings = {};
exports.calls = {};
exports.ivrConfigs = {};
exports.callQueue = {}; // companyUuid -> array of socket IDs in queue. This will track the order of calls for queue logic.
// Helper to find users by company and role
function findUserByCompanyAndRole(companyUuid, username, role) {
    return Object.values(exports.users).find((u) => u.companyUuid === companyUuid && u.username === username && u.role === role);
}
