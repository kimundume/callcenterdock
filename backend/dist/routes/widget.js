"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
// Updated: Agent authentication endpoints moved to widget routes for proper URL mapping
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// Import persistentStorage with robust fallback
let persistentStorage;
let companiesData;
let usersData;
let agentsData;
let sessionsData;
try {
    // Try multiple import strategies for persistentStorage
    const possiblePaths = [
        '../data/persistentStorage',
        path_1.default.resolve(__dirname, '../data/persistentStorage'),
        path_1.default.resolve(__dirname, '../data/persistentStorage.js'),
        path_1.default.join(__dirname, '../data/persistentStorage'),
        path_1.default.join(__dirname, '../data/persistentStorage.js')
    ];
    let importSuccess = false;
    for (const importPath of possiblePaths) {
        try {
            persistentStorage = require(importPath);
            companiesData = persistentStorage.companies;
            usersData = persistentStorage.users;
            agentsData = persistentStorage.agents;
            sessionsData = persistentStorage.sessions;
            console.log(`✅ persistentStorage imported successfully from: ${importPath}`);
            console.log(`📊 Loaded data: ${Object.keys(companiesData).length} companies, ${Object.keys(agentsData).length} agents`);
            importSuccess = true;
            break;
        }
        catch (pathError) {
            console.log(`⚠️  Failed to import from: ${importPath}`);
        }
    }
    // If persistentStorage failed, try tempDB as fallback
    if (!importSuccess) {
        console.log('🔄 Falling back to tempDB...');
        const tempDBPaths = [
            '../data/tempDB',
            path_1.default.resolve(__dirname, '../data/tempDB'),
            path_1.default.resolve(__dirname, '../data/tempDB.js'),
            path_1.default.join(__dirname, '../data/tempDB'),
            path_1.default.join(__dirname, '../data/tempDB.js')
        ];
        for (const importPath of tempDBPaths) {
            try {
                const tempDB = require(importPath);
                companiesData = tempDB.companies || ((_a = tempDB.tempStorage) === null || _a === void 0 ? void 0 : _a.companies) || {};
                usersData = tempDB.users || ((_b = tempDB.tempStorage) === null || _b === void 0 ? void 0 : _b.users) || {};
                agentsData = tempDB.agents || ((_c = tempDB.tempStorage) === null || _c === void 0 ? void 0 : _c.agents) || {};
                sessionsData = tempDB.sessions || ((_d = tempDB.tempStorage) === null || _d === void 0 ? void 0 : _d.sessions) || [];
                console.log(`✅ tempDB imported successfully from: ${importPath}`);
                console.log(`📊 Loaded data: ${Object.keys(companiesData).length} companies, ${Object.keys(agentsData).length} agents`);
                importSuccess = true;
                break;
            }
            catch (pathError) {
                console.log(`⚠️  Failed to import tempDB from: ${importPath}`);
            }
        }
    }
    if (!importSuccess) {
        throw new Error('All import paths failed for both persistentStorage and tempDB');
    }
}
catch (error) {
    console.error('❌ Failed to import storage:', error.message);
    // Fallback to file-based loading
    console.log('🔄 Falling back to file-based data loading...');
    // Simple in-memory storage with file persistence
    const DATA_DIR = process.env.NODE_ENV === 'production'
        ? path_1.default.join(process.cwd(), 'data')
        : path_1.default.join(__dirname, '../../data');
    const COMPANIES_FILE = path_1.default.join(DATA_DIR, 'companies.json');
    const USERS_FILE = path_1.default.join(DATA_DIR, 'users.json');
    const AGENTS_FILE = path_1.default.join(DATA_DIR, 'agents.json');
    // Helper functions for file operations
    function readJsonFile(filePath, defaultValue = {}) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                const data = fs_1.default.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            }
        }
        catch (error) {
            console.error(`Error reading ${filePath}:`, error);
        }
        return defaultValue;
    }
    // Load data from files
    companiesData = readJsonFile(COMPANIES_FILE, {});
    usersData = readJsonFile(USERS_FILE, {});
    agentsData = readJsonFile(AGENTS_FILE, {});
    sessionsData = [];
}
// Save functions that work with persistentStorage
function saveCompanies() {
    if (persistentStorage && persistentStorage.saveCompanies) {
        persistentStorage.saveCompanies();
    }
}
function saveUsers() {
    if (persistentStorage && persistentStorage.saveUsers) {
        persistentStorage.saveUsers();
    }
}
function saveAgents() {
    if (persistentStorage && persistentStorage.saveAgents) {
        persistentStorage.saveAgents();
    }
}
// Initialize CallDocker agent if it doesn't exist
function ensureCallDockerAgent() {
    if (!agentsData['calldocker-main-agent']) {
        console.log('[DEBUG] CallDocker agent not found, creating it');
        // Ensure CallDocker company exists
        if (!companiesData['calldocker-company-uuid']) {
            companiesData['calldocker-company-uuid'] = {
                uuid: 'calldocker-company-uuid',
                name: 'CallDocker',
                email: 'admin@calldocker.com',
                verified: true,
                createdAt: new Date().toISOString(),
            };
            saveCompanies();
        }
        // Create CallDocker agent
        agentsData['calldocker-main-agent'] = {
            uuid: 'calldocker-main-agent',
            companyUuid: 'calldocker-company-uuid',
            username: 'calldocker_agent',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "CallDocker2024!"
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
        };
        saveAgents();
        console.log('[DEBUG] CallDocker agent created successfully');
    }
}
// Initialize on startup
ensureCallDockerAgent();
// Test endpoint to verify CallDocker agent exists
router.get('/test-callDocker-agent', (req, res) => {
    try {
        const agent = agentsData['calldocker-main-agent'];
        if (agent) {
            res.json({
                success: true,
                message: 'CallDocker agent found',
                agent: {
                    id: agent.uuid,
                    username: agent.username,
                    fullName: agent.fullName,
                    status: agent.status,
                    companyUuid: agent.companyUuid
                }
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: 'CallDocker agent not found'
            });
        }
    }
    catch (error) {
        console.error('Test CallDocker agent error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Debug endpoint to check all agents
router.get('/debug/agents', (req, res) => {
    try {
        console.log('[DEBUG] All agents in agentsData:', agentsData);
        const allAgents = Object.values(agentsData).map((agent) => ({
            id: agent.uuid,
            username: agent.username,
            fullName: agent.fullName,
            companyUuid: agent.companyUuid,
            status: agent.status,
            registrationStatus: agent.registrationStatus,
            hasPassword: !!agent.password
        }));
        res.json({
            success: true,
            message: 'All agents retrieved',
            count: allAgents.length,
            agents: allAgents,
            rawData: agentsData
        });
    }
    catch (error) {
        console.error('Debug agents error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ===== AGENT AUTHENTICATION ENDPOINTS =====
// Agent login endpoint
router.post('/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('[DEBUG] Agent login request received:', {
            body: req.body,
            headers: req.headers,
            method: req.method,
            url: req.url
        });
        const { companyUuid, username, password } = req.body;
        console.log('[DEBUG] Extracted fields:', {
            companyUuid,
            username,
            password: password ? '[HIDDEN]' : 'undefined'
        });
        // Validate required fields
        if (!companyUuid || !username || !password) {
            console.log('[DEBUG] Validation failed - missing required fields');
            return res.status(400).json({ error: 'Company UUID, username, and password are required' });
        }
        console.log('[DEBUG] Available agents:', Object.keys(agentsData));
        console.log('[DEBUG] All agents data:', agentsData);
        // Find agent by company UUID and username
        const agent = Object.values(agentsData).find((a) => a.companyUuid === companyUuid && a.username === username);
        if (!agent) {
            console.log('[DEBUG] Agent not found:', { companyUuid, username });
            console.log('[DEBUG] Available agents with companyUuid:', Object.values(agentsData).filter((a) => a.companyUuid === companyUuid));
            console.log('[DEBUG] Available agents with username:', Object.values(agentsData).filter((a) => a.username === username));
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('[DEBUG] Agent found:', {
            agentId: agent.uuid,
            status: agent.status,
            hasPassword: !!agent.password,
            passwordLength: agent.password ? agent.password.length : 0
        });
        // Verify password
        const isValidPassword = yield bcrypt_1.default.compare(password, agent.password);
        console.log('[DEBUG] Password validation result:', isValidPassword);
        console.log('[DEBUG] Expected password hash:', agent.password);
        console.log('[DEBUG] Provided password:', password);
        if (!isValidPassword) {
            console.log('[DEBUG] Invalid password for agent:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check if agent is approved
        if (agent.registrationStatus !== 'approved') {
            console.log('[DEBUG] Agent not approved:', agent.registrationStatus);
            return res.status(403).json({ error: 'Agent account not approved' });
        }
        // Update agent status to online
        agent.status = 'online';
        agent.availability = 'online';
        agent.lastActivity = new Date().toISOString();
        agent.updatedAt = new Date().toISOString();
        saveAgents();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            agentId: agent.uuid,
            username: agent.username,
            companyUuid: agent.companyUuid,
            role: 'agent',
            fullName: agent.fullName
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        console.log('[DEBUG] Agent login successful:', username);
        res.json({
            success: true,
            message: 'Login successful',
            token,
            agent: {
                id: agent.uuid,
                username: agent.username,
                fullName: agent.fullName,
                email: agent.email,
                phone: agent.phone,
                role: agent.role,
                status: agent.status,
                companyUuid: agent.companyUuid,
                skills: agent.skills || [],
                performance: agent.performance || {
                    callsHandled: 0,
                    avgRating: 0,
                    successRate: 0
                }
            }
        });
    }
    catch (error) {
        console.error('Agent login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Agent logout endpoint
router.post('/auth/logout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { agentId } = req.body;
        if (agentId) {
            const agent = agentsData[agentId];
            if (agent) {
                agent.status = 'offline';
                agent.availability = 'offline';
                agent.lastActivity = new Date().toISOString();
                agent.updatedAt = new Date().toISOString();
                saveAgents();
            }
        }
        res.json({ success: true, message: 'Logout successful' });
    }
    catch (error) {
        console.error('Agent logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get agent status
router.get('/agent/status/:agentId', (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = agentsData[agentId];
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        res.json({
            success: true,
            agent: {
                id: agent.uuid,
                username: agent.username,
                fullName: agent.fullName,
                status: agent.status,
                availability: agent.availability,
                currentCalls: agent.currentCalls || 0,
                maxCalls: agent.maxCalls || 5,
                lastActivity: agent.lastActivity,
                performance: agent.performance || {
                    callsHandled: 0,
                    avgRating: 0,
                    successRate: 0
                }
            }
        });
    }
    catch (error) {
        console.error('Get agent status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update agent status
router.put('/agent/status/:agentId', (req, res) => {
    try {
        const { agentId } = req.params;
        const { status, availability, currentCalls } = req.body;
        const agent = agentsData[agentId];
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        if (status)
            agent.status = status;
        if (availability)
            agent.availability = availability;
        if (currentCalls !== undefined)
            agent.currentCalls = currentCalls;
        agent.lastActivity = new Date().toISOString();
        agent.updatedAt = new Date().toISOString();
        saveAgents();
        res.json({ success: true, message: 'Agent status updated' });
    }
    catch (error) {
        console.error('Update agent status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ===== CALL MANAGEMENT ENDPOINTS =====
// Get active calls for agent
router.get('/calls/active', (req, res) => {
    try {
        const { agentUuid, agentId, username } = req.query;
        console.log('[DEBUG] Getting active calls for:', { agentUuid, agentId, username });
        // Find agent by UUID, ID, or username
        let agent = null;
        if (agentUuid) {
            agent = Object.values(agentsData).find((a) => a.uuid === agentUuid);
        }
        else if (agentId) {
            agent = agentsData[agentId];
        }
        else if (username) {
            agent = Object.values(agentsData).find((a) => a.username === username);
        }
        if (!agent) {
            console.log('[DEBUG] Agent not found for active calls. Available agents:', Object.keys(agentsData));
            return res.status(404).json({ error: 'Agent not found' });
        }
        // Mock active calls data for now
        const activeCalls = [
            {
                id: 'call-001',
                customerName: 'John Doe',
                customerPhone: '+1-555-0123',
                status: 'active',
                duration: 180,
                startTime: new Date(Date.now() - 180000).toISOString(),
                type: 'incoming',
                priority: 'normal',
                agentId: agent.uuid,
                agentName: agent.fullName
            }
        ];
        console.log('[DEBUG] Returning active calls for agent:', agent.username);
        res.json({
            success: true,
            calls: activeCalls,
            count: activeCalls.length
        });
    }
    catch (error) {
        console.error('Get active calls error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get active calls for agent (legacy endpoint)
router.get('/agent/calls/:agentId', (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = agentsData[agentId];
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        // Mock active calls data
        const activeCalls = [
            {
                id: 'call-001',
                customerName: 'John Doe',
                customerPhone: '+1-555-0123',
                status: 'active',
                duration: 180,
                startTime: new Date(Date.now() - 180000).toISOString(),
                type: 'incoming',
                priority: 'normal'
            }
        ];
        res.json({
            success: true,
            calls: activeCalls,
            count: activeCalls.length
        });
    }
    catch (error) {
        console.error('Get agent calls error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Assign call to agent
router.post('/calls/assign', (req, res) => {
    try {
        const { callId, agentId } = req.body;
        const agent = agentsData[agentId];
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        // Check if agent can handle more calls
        if (agent.currentCalls >= agent.maxCalls) {
            return res.status(400).json({ error: 'Agent at maximum call capacity' });
        }
        // Update agent call count
        agent.currentCalls += 1;
        agent.updatedAt = new Date().toISOString();
        saveAgents();
        res.json({
            success: true,
            message: 'Call assigned successfully',
            agent: {
                id: agent.uuid,
                currentCalls: agent.currentCalls,
                maxCalls: agent.maxCalls
            }
        });
    }
    catch (error) {
        console.error('Assign call error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// End call
router.post('/calls/end/:callId', (req, res) => {
    try {
        const { callId } = req.params;
        const { agentId, duration, satisfaction } = req.body;
        const agent = agentsData[agentId];
        if (agent) {
            // Update agent call count and performance
            agent.currentCalls = Math.max(0, agent.currentCalls - 1);
            agent.performance = agent.performance || {
                callsHandled: 0,
                avgRating: 0,
                successRate: 0
            };
            agent.performance.callsHandled += 1;
            if (satisfaction) {
                agent.performance.avgRating = ((agent.performance.avgRating * (agent.performance.callsHandled - 1) + satisfaction) /
                    agent.performance.callsHandled);
            }
            agent.updatedAt = new Date().toISOString();
            saveAgents();
        }
        res.json({
            success: true,
            message: 'Call ended successfully',
            callId
        });
    }
    catch (error) {
        console.error('End call error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Escalate call
router.post('/calls/escalate/:callId', (req, res) => {
    try {
        const { callId } = req.params;
        const { reason, escalatedTo } = req.body;
        res.json({
            success: true,
            message: 'Call escalated successfully',
            callId,
            escalatedTo,
            reason
        });
    }
    catch (error) {
        console.error('Escalate call error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ===== MISSING ENDPOINTS - ADDING NOW =====
// Get online agents for a company (MUST COME BEFORE /agents/:companyUuid)
router.get('/agents/online', (req, res) => {
    try {
        const { companyUuid } = req.query;
        console.log('[DEBUG] Getting online agents for company:', companyUuid);
        let agents = Object.values(agentsData);
        // Filter by company if specified
        if (companyUuid) {
            agents = agents.filter((agent) => agent.companyUuid === companyUuid);
        }
        // Filter for online agents only
        const onlineAgents = agents.filter((agent) => agent.status === 'online' && agent.availability === 'online');
        console.log('[DEBUG] Found online agents:', onlineAgents.length);
        res.json({
            success: true,
            agents: onlineAgents.map((agent) => ({
                id: agent.uuid,
                username: agent.username,
                fullName: agent.fullName,
                email: agent.email,
                phone: agent.phone,
                role: agent.role,
                status: agent.status,
                availability: agent.availability,
                currentCalls: agent.currentCalls,
                maxCalls: agent.maxCalls,
                skills: agent.skills || [],
                performance: agent.performance || {
                    callsHandled: 0,
                    avgRating: 0,
                    successRate: 0
                },
                lastActivity: agent.lastActivity
            }))
        });
    }
    catch (error) {
        console.error('Get online agents error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get agents for a company
router.get('/agents/:companyUuid', (req, res) => {
    try {
        const { companyUuid } = req.params;
        console.log('[DEBUG] Getting agents for company:', companyUuid);
        // Find all agents for this company
        const companyAgents = Object.values(agentsData).filter((agent) => agent.companyUuid === companyUuid);
        console.log('[DEBUG] Found agents:', companyAgents.length);
        res.json({
            success: true,
            agents: companyAgents.map((agent) => ({
                id: agent.uuid,
                username: agent.username,
                fullName: agent.fullName,
                email: agent.email,
                phone: agent.phone,
                role: agent.role,
                status: agent.status,
                availability: agent.availability,
                currentCalls: agent.currentCalls,
                maxCalls: agent.maxCalls,
                skills: agent.skills || [],
                performance: agent.performance || {
                    callsHandled: 0,
                    avgRating: 0,
                    successRate: 0
                },
                lastActivity: agent.lastActivity,
                createdAt: agent.createdAt
            }))
        });
    }
    catch (error) {
        console.error('Get agents error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get call queue information
router.get('/queue/:companyUuid', (req, res) => {
    try {
        const { companyUuid } = req.params;
        if (!global.tempStorage || !global.tempStorage.callQueue || !global.tempStorage.callQueue[companyUuid]) {
            return res.json({
                success: true,
                queueLength: 0,
                queue: []
            });
        }
        const queue = global.tempStorage.callQueue[companyUuid];
        res.json({
            success: true,
            queueLength: queue.length,
            queue: queue.map((entry, index) => (Object.assign(Object.assign({}, entry), { position: index + 1, estimatedWaitTime: (index + 1) * 30 })))
        });
    }
    catch (error) {
        console.error('Get queue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Reset agent currentCalls (for testing/debugging)
router.post('/agent/reset-calls', (req, res) => {
    try {
        const { username } = req.body;
        console.log('[DEBUG] Resetting currentCalls for agent:', username);
        // Find agent by username
        const agent = Object.values(agentsData).find((a) => a.username === username);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        // Reset currentCalls
        agent.currentCalls = 0;
        agent.lastActivity = new Date().toISOString();
        agent.updatedAt = new Date().toISOString();
        saveAgents();
        console.log('[DEBUG] Agent currentCalls reset successfully:', {
            username: agent.username,
            currentCalls: agent.currentCalls
        });
        res.json({
            success: true,
            message: 'Agent currentCalls reset successfully',
            agent: {
                username: agent.username,
                currentCalls: agent.currentCalls,
                lastActivity: agent.lastActivity
            }
        });
    }
    catch (error) {
        console.error('Reset agent calls error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Decrement agent currentCalls when call ends
router.post('/agent/end-call', (req, res) => {
    try {
        const { username, sessionId } = req.body;
        console.log('[DEBUG] Ending call for agent:', username, 'session:', sessionId);
        // Find agent by username
        const agent = Object.values(agentsData).find((a) => a.username === username);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        // Decrement currentCalls but don't go below 0
        agent.currentCalls = Math.max(0, (agent.currentCalls || 1) - 1);
        agent.lastActivity = new Date().toISOString();
        agent.updatedAt = new Date().toISOString();
        saveAgents();
        console.log('[DEBUG] Agent call ended successfully:', {
            username: agent.username,
            currentCalls: agent.currentCalls,
            sessionId: sessionId
        });
        res.json({
            success: true,
            message: 'Agent call ended successfully',
            agent: {
                username: agent.username,
                currentCalls: agent.currentCalls,
                lastActivity: agent.lastActivity
            }
        });
    }
    catch (error) {
        console.error('End call error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get queue status for a company
router.get('/queue/:companyUuid', (req, res) => {
    var _a, _b;
    try {
        const { companyUuid } = req.params;
        console.log('[DEBUG] Getting queue for company:', companyUuid);
        // Get queue from global storage
        const queue = ((_b = (_a = global.tempStorage) === null || _a === void 0 ? void 0 : _a.callQueue) === null || _b === void 0 ? void 0 : _b[companyUuid]) || [];
        res.json({
            success: true,
            queueLength: queue.length,
            queue: queue.map((socketId, index) => ({
                position: index + 1,
                socketId: socketId,
                estimatedWait: (index + 1) * 30 // 30 seconds per position
            }))
        });
    }
    catch (error) {
        console.error('Get queue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get agent status
router.get('/agent/status', (req, res) => {
    try {
        const { username } = req.query;
        console.log('[DEBUG] Getting agent status for:', username);
        // Find agent by username
        const agent = Object.values(agentsData).find((a) => a.username === username);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        res.json({
            success: true,
            agent: {
                username: agent.username,
                status: agent.status,
                availability: agent.availability,
                currentCalls: agent.currentCalls,
                maxCalls: agent.maxCalls,
                lastActivity: agent.lastActivity
            }
        });
    }
    catch (error) {
        console.error('Get agent status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Auto-reset agent availability (emergency fix)
router.post('/agent/auto-reset', (req, res) => {
    try {
        console.log('[DEBUG] Auto-resetting all agents currentCalls to 0');
        // Reset all agents' currentCalls to 0
        Object.values(agentsData).forEach((agent) => {
            if (agent.currentCalls > 0) {
                console.log(`[DEBUG] Resetting agent ${agent.username} currentCalls from ${agent.currentCalls} to 0`);
                agent.currentCalls = 0;
                agent.lastActivity = new Date().toISOString();
                agent.updatedAt = new Date().toISOString();
            }
        });
        saveAgents();
        res.json({
            success: true,
            message: 'All agents reset successfully',
            resetCount: Object.values(agentsData).length
        });
    }
    catch (error) {
        console.error('Auto-reset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Route call endpoint - handles both calls and chats
router.post('/route-call', (req, res) => {
    try {
        const { companyUuid, visitorId, pageUrl, callType = 'call' } = req.body;
        console.log('[DEBUG] Route call request:', {
            companyUuid,
            visitorId,
            pageUrl,
            callType
        });
        // If no companyUuid provided, use CallDocker company as fallback
        const targetCompanyUuid = companyUuid || 'calldocker-company-uuid';
        console.log('[DEBUG] Using company UUID:', targetCompanyUuid);
        // Find available agents for this company (can handle multiple calls up to maxCalls)
        const availableAgents = Object.values(agentsData).filter((agent) => {
            // Reset currentCalls if it's been more than 5 minutes since last activity
            if (agent.lastActivity) {
                const lastActivity = new Date(agent.lastActivity);
                const now = new Date();
                const minutesSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
                if (minutesSinceLastActivity > 5 && agent.currentCalls > 0) {
                    console.log(`[DEBUG] Resetting currentCalls for agent ${agent.username} (inactive for ${Math.round(minutesSinceLastActivity)} minutes)`);
                    agent.currentCalls = 0;
                    agent.lastActivity = now.toISOString();
                    agent.updatedAt = now.toISOString();
                }
            }
            return agent.companyUuid === targetCompanyUuid &&
                agent.status === 'online' &&
                agent.availability === 'online' &&
                agent.currentCalls < (agent.maxCalls || 5); // Allow multiple calls up to maxCalls
        });
        console.log('[DEBUG] Available agents:', availableAgents.length);
        // If no agents available for the company, try to use CallDocker agent as fallback
        let finalAvailableAgents = availableAgents;
        if (availableAgents.length === 0 && targetCompanyUuid !== 'calldocker-company-uuid') {
            console.log('[DEBUG] No company agents available, trying CallDocker agent as fallback');
            const callDockerAgents = Object.values(agentsData).filter((agent) => agent.companyUuid === 'calldocker-company-uuid' &&
                agent.status === 'online' &&
                agent.availability === 'online' &&
                agent.currentCalls < (agent.maxCalls || 5) // Allow multiple calls up to maxCalls
            );
            finalAvailableAgents = callDockerAgents;
            console.log('[DEBUG] CallDocker fallback agents:', finalAvailableAgents.length);
        }
        // Initialize call queue if it doesn't exist
        if (!global.tempStorage)
            global.tempStorage = {};
        if (!global.tempStorage.callQueue)
            global.tempStorage.callQueue = {};
        if (!global.tempStorage.callQueue[targetCompanyUuid])
            global.tempStorage.callQueue[targetCompanyUuid] = [];
        // Generate a session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (finalAvailableAgents.length === 0) {
            // Add to queue instead of rejecting
            const queueEntry = {
                sessionId,
                visitorId,
                pageUrl,
                callType,
                timestamp: new Date().toISOString(),
                companyUuid: targetCompanyUuid
            };
            global.tempStorage.callQueue[targetCompanyUuid].push(queueEntry);
            const queuePosition = global.tempStorage.callQueue[targetCompanyUuid].length;
            const estimatedWaitTime = queuePosition * 30; // 30 seconds per call
            console.log('[DEBUG] Call queued. Position:', queuePosition, 'Estimated wait:', estimatedWaitTime);
            return res.json({
                success: true,
                message: 'Call queued successfully. An agent will be with you shortly.',
                sessionId: sessionId,
                queuePosition: queuePosition,
                estimatedWaitTime: estimatedWaitTime,
                status: 'queued'
            });
        }
        // Select the best available agent (simple round-robin for now)
        const selectedAgent = finalAvailableAgents[0];
        // Update agent call count
        selectedAgent.currentCalls = (selectedAgent.currentCalls || 0) + 1;
        selectedAgent.lastActivity = new Date().toISOString();
        selectedAgent.updatedAt = new Date().toISOString();
        saveAgents();
        console.log('[DEBUG] Call routed to agent:', selectedAgent.username);
        // Process queue if there are queued calls
        if (global.tempStorage.callQueue[targetCompanyUuid] && global.tempStorage.callQueue[targetCompanyUuid].length > 0) {
            console.log('[DEBUG] Processing queue for company:', targetCompanyUuid);
            // Queue processing will be handled by the agent when they finish a call
        }
        // Initialize Call Synchronization - Create call session
        try {
            const io = req.app.get('io');
            const callSyncService = req.app.get('callSyncService');
            if (io && callSyncService) {
                console.log('[DEBUG] Initializing synchronized call session');
                // Create synchronized call session
                const callSession = callSyncService.createCallSession({
                    sessionId: sessionId,
                    visitorSocketId: visitorId, // Will be updated when visitor connects
                    agentUsername: selectedAgent.username,
                    companyUuid: targetCompanyUuid
                });
                // Send enhanced incoming-call event to agent
                const agentRoom = `agent-${selectedAgent.username}`;
                io.to(agentRoom).emit('incoming-call', {
                    uuid: targetCompanyUuid,
                    agentId: selectedAgent.username,
                    callTime: new Date().toISOString(),
                    sessionId: sessionId,
                    visitorId: visitorId,
                    pageUrl: pageUrl,
                    callType: callType,
                    fromSocketId: visitorId,
                    // Enhanced synchronization data
                    syncEnabled: true,
                    callSessionId: callSession.sessionId
                });
                console.log('[DEBUG] Synchronized call session created:', sessionId);
            }
            else {
                console.log('[DEBUG] Socket.io or CallSyncService not available - falling back to basic routing');
                // Fallback to basic routing if sync service not available
                if (io) {
                    const agentRoom = `agent-${selectedAgent.username}`;
                    io.to(agentRoom).emit('incoming-call', {
                        uuid: targetCompanyUuid,
                        agentId: selectedAgent.username,
                        callTime: new Date().toISOString(),
                        sessionId: sessionId,
                        visitorId: visitorId,
                        pageUrl: pageUrl,
                        callType: callType,
                        fromSocketId: visitorId
                    });
                }
            }
        }
        catch (socketError) {
            console.error('[DEBUG] Call synchronization error:', socketError);
        }
        res.json({
            success: true,
            message: callType === 'chat' ? 'Chat connected successfully!' : 'Call connected successfully!',
            sessionId,
            agent: selectedAgent.username,
            agentId: selectedAgent.uuid,
            agentName: selectedAgent.fullName,
            callType,
            visitorId,
            pageUrl
        });
    }
    catch (error) {
        console.error('Route call error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while routing call'
        });
    }
});
// ===== ADDITIONAL MISSING ENDPOINTS =====
// Get call logs for a company
router.get('/call/logs/:companyUuid', (req, res) => {
    try {
        const { companyUuid } = req.params;
        console.log('[DEBUG] Getting call logs for company:', companyUuid);
        // Mock call logs data for now
        const callLogs = [
            {
                id: 'call-001',
                visitorId: 'visitor_123',
                agentId: 'calldocker-main-agent',
                agentName: 'CallDocker Main Agent',
                status: 'completed',
                duration: 180,
                startTime: new Date(Date.now() - 3600000).toISOString(),
                endTime: new Date(Date.now() - 3420000).toISOString(),
                callType: 'voice',
                pageUrl: 'https://calldocker.netlify.app/',
                notes: 'Test call'
            },
            {
                id: 'call-002',
                visitorId: 'visitor_456',
                agentId: 'calldocker-main-agent',
                agentName: 'CallDocker Main Agent',
                status: 'completed',
                duration: 240,
                startTime: new Date(Date.now() - 7200000).toISOString(),
                endTime: new Date(Date.now() - 6960000).toISOString(),
                callType: 'chat',
                pageUrl: 'https://calldocker.netlify.app/',
                notes: 'Support chat'
            }
        ];
        res.json({
            success: true,
            logs: callLogs,
            count: callLogs.length
        });
    }
    catch (error) {
        console.error('Get call logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get agent status (for frontend polling)
router.get('/agent/status', (req, res) => {
    try {
        const { agentUuid, agentId, username } = req.query;
        console.log('[DEBUG] Getting agent status:', { agentUuid, agentId, username });
        // Find agent by UUID, ID, or username
        let agent = null;
        if (agentUuid) {
            agent = Object.values(agentsData).find((a) => a.uuid === agentUuid);
        }
        else if (agentId) {
            agent = agentsData[agentId];
        }
        else if (username) {
            agent = Object.values(agentsData).find((a) => a.username === username);
        }
        if (!agent) {
            console.log('[DEBUG] Agent not found. Available agents:', Object.keys(agentsData));
            return res.status(404).json({ error: 'Agent not found' });
        }
        res.json({
            success: true,
            agent: {
                id: agent.uuid,
                username: agent.username,
                fullName: agent.fullName,
                status: agent.status,
                availability: agent.availability,
                currentCalls: agent.currentCalls || 0,
                maxCalls: agent.maxCalls || 5,
                lastActivity: agent.lastActivity,
                performance: agent.performance || {
                    callsHandled: 0,
                    avgRating: 0,
                    successRate: 0
                }
            }
        });
    }
    catch (error) {
        console.error('Get agent status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update agent status
router.post('/agent/status', (req, res) => {
    try {
        const { agentId, agentUuid, status, availability, currentCalls } = req.body;
        console.log('[DEBUG] Updating agent status:', { agentId, agentUuid, status, availability, currentCalls });
        // Find agent by ID or UUID
        let agent = null;
        if (agentId) {
            agent = agentsData[agentId];
        }
        else if (agentUuid) {
            agent = Object.values(agentsData).find((a) => a.uuid === agentUuid);
        }
        if (!agent) {
            console.log('[DEBUG] Agent not found. Available agents:', Object.keys(agentsData));
            return res.status(404).json({ error: 'Agent not found' });
        }
        // Update agent status
        if (status) {
            agent.status = status;
            console.log('[DEBUG] Updated agent status to:', status);
        }
        if (availability) {
            agent.availability = availability;
            console.log('[DEBUG] Updated agent availability to:', availability);
        }
        if (currentCalls !== undefined) {
            agent.currentCalls = currentCalls;
            console.log('[DEBUG] Updated agent currentCalls to:', currentCalls);
        }
        agent.lastActivity = new Date().toISOString();
        agent.updatedAt = new Date().toISOString();
        saveAgents();
        console.log('[DEBUG] Agent status updated successfully:', {
            username: agent.username,
            status: agent.status,
            availability: agent.availability,
            currentCalls: agent.currentCalls
        });
        res.json({
            success: true,
            message: 'Agent status updated successfully',
            agent: {
                id: agent.uuid,
                username: agent.username,
                status: agent.status,
                availability: agent.availability,
                currentCalls: agent.currentCalls,
                lastActivity: agent.lastActivity
            }
        });
    }
    catch (error) {
        console.error('Update agent status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ===== CRITICAL MISSING ENDPOINTS - FIXING 404 ERRORS =====
// GET Agent Status (for dashboard polling)
router.get('/agent/status', (req, res) => {
    try {
        const { agentId, username } = req.query;
        console.log('[DEBUG] Getting agent status for:', { agentId, username });
        // Find agent by ID or username
        let agent = null;
        if (agentId) {
            agent = agentsData[agentId];
        }
        else if (username) {
            agent = Object.values(agentsData).find((a) => a.username === username);
        }
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        res.json({
            success: true,
            agent: {
                id: agent.uuid,
                username: agent.username,
                status: agent.status,
                availability: agent.availability,
                currentCalls: agent.currentCalls,
                maxCalls: agent.maxCalls,
                lastActivity: agent.lastActivity
            }
        });
    }
    catch (error) {
        console.error('Get agent status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST Agent Status (for dashboard updates)
router.post('/agent/status', (req, res) => {
    try {
        const { agentId, username, status, availability } = req.body;
        console.log('[DEBUG] Updating agent status:', { agentId, username, status, availability });
        // Find agent by ID or username
        let agent = null;
        if (agentId) {
            agent = agentsData[agentId];
        }
        else if (username) {
            agent = Object.values(agentsData).find((a) => a.username === username);
        }
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        // Update agent status
        if (status !== undefined)
            agent.status = status;
        if (availability !== undefined)
            agent.availability = availability;
        agent.lastActivity = new Date().toISOString();
        agent.updatedAt = new Date().toISOString();
        console.log('[DEBUG] Agent status updated:', agent.username, agent.status, agent.availability);
        res.json({
            success: true,
            message: 'Agent status updated successfully',
            agent: {
                id: agent.uuid,
                username: agent.username,
                status: agent.status,
                availability: agent.availability,
                currentCalls: agent.currentCalls,
                lastActivity: agent.lastActivity
            }
        });
    }
    catch (error) {
        console.error('Update agent status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST Agent End Call (to decrement currentCalls)
router.post('/agent/end-call', (req, res) => {
    try {
        const { agentId, username, sessionId } = req.body;
        console.log('[DEBUG] Agent ending call:', { agentId, username, sessionId });
        // Find agent by ID or username
        let agent = null;
        if (agentId) {
            agent = agentsData[agentId];
        }
        else if (username) {
            agent = Object.values(agentsData).find((a) => a.username === username);
        }
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        // Decrement currentCalls (but not below 0)
        if (agent.currentCalls > 0) {
            agent.currentCalls--;
            console.log('[DEBUG] Agent currentCalls decremented to:', agent.currentCalls);
        }
        agent.lastActivity = new Date().toISOString();
        agent.updatedAt = new Date().toISOString();
        res.json({
            success: true,
            message: 'Call ended successfully',
            agent: {
                id: agent.uuid,
                username: agent.username,
                currentCalls: agent.currentCalls,
                status: agent.status,
                availability: agent.availability
            }
        });
    }
    catch (error) {
        console.error('Agent end call error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET Queue Status (for dashboard polling)
router.get('/queue/:companyUuid', (req, res) => {
    try {
        const { companyUuid } = req.params;
        console.log('[DEBUG] Getting queue status for company:', companyUuid);
        // Mock queue data for now
        const queueData = {
            waiting: 0,
            totalWaitTime: 0,
            averageWaitTime: 0,
            availableAgents: Object.values(agentsData).filter((agent) => agent.companyUuid === companyUuid &&
                agent.status === 'online' &&
                agent.availability === 'online' &&
                agent.currentCalls < agent.maxCalls).length
        };
        res.json({
            success: true,
            queue: queueData
        });
    }
    catch (error) {
        console.error('Get queue status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST Agent Auto Reset (emergency fix for agent availability)
router.post('/agent/auto-reset', (req, res) => {
    try {
        console.log('[DEBUG] Auto-resetting all agent currentCalls to 0');
        let resetCount = 0;
        Object.values(agentsData).forEach((agent) => {
            if (agent.currentCalls > 0) {
                agent.currentCalls = 0;
                agent.lastActivity = new Date().toISOString();
                agent.updatedAt = new Date().toISOString();
                resetCount++;
            }
        });
        console.log('[DEBUG] Reset', resetCount, 'agents');
        res.json({
            success: true,
            message: `Reset ${resetCount} agents successfully`,
            resetCount
        });
    }
    catch (error) {
        console.error('Agent auto reset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Check widget availability (for public landing page)
router.get('/availability', (req, res) => {
    try {
        console.log('[DEBUG] Checking widget availability');
        // Find any online agents (for public routing)
        const onlineAgents = Object.values(agentsData).filter((agent) => agent.status === 'online' &&
            agent.availability === 'online' &&
            agent.currentCalls < agent.maxCalls);
        console.log('[DEBUG] Found online agents:', onlineAgents.length);
        const isOnline = onlineAgents.length > 0;
        res.json({
            online: isOnline,
            routingType: 'public',
            availableAgents: onlineAgents.length,
            message: isOnline ? 'Agents are available' : 'No agents currently available'
        });
    }
    catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({
            online: false,
            routingType: 'public',
            availableAgents: 0,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
