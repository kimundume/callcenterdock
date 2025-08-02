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
exports.default = router;
