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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Simple in-memory storage with file persistence
const DATA_DIR = process.env.NODE_ENV === 'production'
    ? path_1.default.join(process.cwd(), 'data')
    : path_1.default.join(__dirname, '../../data');
const COMPANIES_FILE = path_1.default.join(DATA_DIR, 'companies.json');
const USERS_FILE = path_1.default.join(DATA_DIR, 'users.json');
const AGENTS_FILE = path_1.default.join(DATA_DIR, 'agents.json');
// Ensure data directory exists
function ensureDataDirectory() {
    try {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
            console.log(`📁 Created data directory: ${DATA_DIR}`);
        }
    }
    catch (error) {
        console.error(`❌ Error creating data directory: ${error}`);
        return false;
    }
    return true;
}
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
function writeJsonFile(filePath, data) {
    try {
        const dir = path_1.default.dirname(filePath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`💾 Saved data to: ${filePath}`);
    }
    catch (error) {
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
        password: 'password',
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
// Save functions
function saveCompanies() {
    console.log(`💾 Saving ${Object.keys(companies).length} companies...`);
    writeJsonFile(COMPANIES_FILE, companies);
}
function saveUsers() {
    console.log(`💾 Saving ${Object.keys(users).length} users...`);
    writeJsonFile(USERS_FILE, users);
}
function saveAgents() {
    console.log(`💾 Saving ${Object.keys(agents).length} agents...`);
    writeJsonFile(AGENTS_FILE, agents);
}
// Helper functions
function findUserByCompanyAndRole(companyUuid, username, role) {
    return Object.values(users).find((u) => u.companyUuid === companyUuid && u.username === username && u.role === role);
}
function findCompanyByEmail(email) {
    return Object.values(companies).find((c) => c.email === email);
}
// In-memory storage for temporary data
const pendingAdmins = [];
const pendingAgentCredentials = [];
const contactMessages = [];
const router = express_1.default.Router();
// Simple endpoint to check agent data (no auth required)
router.get('/debug/agents', (req, res) => {
    try {
        console.log('[DEBUG] Debug agents request received');
        console.log('[DEBUG] Raw agents object:', agents);
        console.log('[DEBUG] Agents keys:', Object.keys(agents));
        console.log('[DEBUG] Agents values:', Object.values(agents));
        // Create sample agent data for testing
        const sampleAgents = [
            {
                id: 'agent-001',
                username: 'agent1',
                email: 'agent1@demo.com',
                companyName: 'Demo Company',
                status: 'online',
                assignedToPublic: true,
                currentCalls: 1,
                maxCalls: 5,
                availability: 'online',
                lastActivity: new Date().toISOString(),
                skills: ['sales', 'support'],
                callsHandled: 15,
                avgDuration: 240,
                satisfaction: 4.5,
                responseTime: 45,
                totalCalls: 20,
                missedCalls: 2
            },
            {
                id: 'agent-002',
                username: 'agent2',
                email: 'agent2@demo.com',
                companyName: 'Demo Company',
                status: 'offline',
                assignedToPublic: false,
                currentCalls: 0,
                maxCalls: 3,
                availability: 'offline',
                lastActivity: new Date(Date.now() - 3600000).toISOString(),
                skills: ['technical'],
                callsHandled: 8,
                avgDuration: 180,
                satisfaction: 4.2,
                responseTime: 60,
                totalCalls: 10,
                missedCalls: 1
            }
        ];
        res.json({
            message: 'Agents debug data',
            count: Object.keys(agents).length,
            agents: agents,
            agentsArray: Object.values(agents),
            sampleAgents: sampleAgents,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Debug agents error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Simple endpoint to check companies data (no auth required)
router.get('/debug/companies', (req, res) => {
    try {
        console.log('[DEBUG] Debug companies request received');
        console.log('[DEBUG] Raw companies object:', companies);
        console.log('[DEBUG] Companies keys:', Object.keys(companies));
        console.log('[DEBUG] Companies values:', Object.values(companies));
        res.json({
            message: 'Companies debug data',
            count: Object.keys(companies).length,
            companies: companies,
            companiesArray: Object.values(companies),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Debug companies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Test endpoint to check if server is working
router.get('/test', (req, res) => {
    res.json({
        message: 'Super Admin API is working',
        timestamp: new Date().toISOString(),
        companies: Object.keys(companies).length,
        users: Object.keys(users).length
    });
});
// Test endpoint without authentication
router.post('/test-create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('[DEBUG] Test create company request received:', req.body);
        res.json({
            message: 'Test endpoint working',
            receivedData: req.body,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Super Admin authentication middleware
const authenticateSuperAdmin = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // Check if the user is a super admin
        if (decoded.role !== 'super-admin') {
            return res.status(403).json({ error: 'Super admin access required' });
        }
        req.superAdmin = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
// Super Admin login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        console.log('Super Admin login attempt:', { username, password: password ? '[HIDDEN]' : 'undefined' });
        if (!username || !password) {
            console.log('Login failed: Missing username or password');
            return res.status(400).json({ error: 'Username and password required' });
        }
        // For demo purposes, using hardcoded super admin credentials
        // In production, this should be stored in a database
        const superAdminCredentials = {
            username: 'superadmin',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
            role: 'super-admin'
        };
        console.log('Expected username:', superAdminCredentials.username);
        console.log('Provided username:', username);
        console.log('Username match:', username === superAdminCredentials.username);
        if (username !== superAdminCredentials.username) {
            console.log('Login failed: Invalid username');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = yield bcrypt_1.default.compare(password, superAdminCredentials.password);
        console.log('Password validation result:', isValidPassword);
        if (!isValidPassword) {
            console.log('Login failed: Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({
            username: superAdminCredentials.username,
            role: superAdminCredentials.role
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        console.log('Super Admin login successful for user:', username);
        res.json({
            token,
            user: {
                username: superAdminCredentials.username,
                role: superAdminCredentials.role
            }
        });
    }
    catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get all accounts (protected)
router.get('/accounts', authenticateSuperAdmin, (req, res) => {
    try {
        console.log('[DEBUG] Accounts request received');
        console.log('[DEBUG] Companies data:', companies);
        console.log('[DEBUG] Users data:', users);
        // Transform existing companies data to match the expected format
        const accounts = Object.values(companies).map((company) => ({
            id: company.uuid,
            companyName: company.name,
            email: company.email,
            status: company.suspended ? 'suspended' : (company.verified ? 'active' : 'pending'),
            createdAt: company.createdAt || new Date().toISOString(),
            lastLogin: company.lastLogin || new Date().toISOString(),
            subscription: 'pro', // Default subscription
            agents: Object.values(agents).filter((agent) => agent.companyUuid === company.uuid).length,
            calls: 0, // This would be calculated from call logs
            revenue: Math.floor(Math.random() * 5000) + 1000 // Mock revenue data
        }));
        console.log('[DEBUG] Transformed accounts:', accounts);
        console.log('[DEBUG] Returning accounts count:', accounts.length);
        res.json(accounts);
    }
    catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get raw companies data (for debugging)
router.get('/companies', (req, res) => {
    try {
        console.log('Companies data requested:', companies);
        res.json(companies);
    }
    catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get raw users data (for debugging)
router.get('/users', (req, res) => {
    try {
        console.log('Users data requested:', users);
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Suspend account
router.put('/accounts/:id/suspend', authenticateSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        // Find and update the company status
        const company = companies[id];
        if (!company) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // Add suspended status to company
        company.suspended = true;
        saveCompanies(); // Save to file
        res.json({ message: 'Account suspended successfully' });
    }
    catch (error) {
        console.error('Suspend account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Activate account
router.put('/accounts/:id/activate', authenticateSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        // Find and update the company status
        const company = companies[id];
        if (!company) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // Remove suspended status from company
        company.suspended = false;
        saveCompanies(); // Save to file
        res.json({ message: 'Account activated successfully' });
    }
    catch (error) {
        console.error('Activate account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete account
router.put('/accounts/:id/delete', authenticateSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        // Find and remove the company
        if (!companies[id]) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // Remove company and related data
        delete companies[id];
        saveCompanies(); // Save to file
        // Remove related agents
        Object.keys(agents).forEach(agentId => {
            if (agents[agentId].companyUuid === id) {
                delete agents[agentId];
            }
        });
        saveAgents(); // Save to file
        res.json({ message: 'Account deleted successfully' });
    }
    catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get system analytics
router.get('/analytics', authenticateSuperAdmin, (req, res) => {
    try {
        const analytics = {
            totalAccounts: Object.keys(companies).length,
            activeAccounts: Object.values(companies).filter((c) => c.verified && !c.suspended).length,
            suspendedAccounts: Object.values(companies).filter((c) => c.suspended).length,
            pendingAccounts: Object.values(companies).filter((c) => !c.verified).length,
            totalAgents: Object.keys(agents).length,
            totalRevenue: Object.keys(companies).length * 2500, // Mock calculation
            systemHealth: {
                backend: 'online',
                database: 'connected',
                emailService: 'configured'
            }
        };
        res.json(analytics);
    }
    catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get system health (protected)
router.get('/health', authenticateSuperAdmin, (req, res) => {
    try {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                backend: 'online',
                database: 'connected',
                email: 'configured'
            },
            metrics: {
                cpu: Math.floor(Math.random() * 30) + 20,
                memory: Math.floor(Math.random() * 40) + 40,
                disk: Math.floor(Math.random() * 20) + 10
            }
        });
    }
    catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Content Management Routes
router.get('/content/blog-posts', authenticateSuperAdmin, (req, res) => {
    try {
        const posts = []; // This would be loaded from persistent storage
        res.json({ posts });
    }
    catch (error) {
        console.error('Get blog posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/content/blog-posts', authenticateSuperAdmin, (req, res) => {
    try {
        const post = Object.assign(Object.assign({ id: `post-${Date.now()}` }, req.body), { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        res.json({ post });
    }
    catch (error) {
        console.error('Create blog post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/content/frontpage', authenticateSuperAdmin, (req, res) => {
    try {
        const content = {
            heroTitle: 'Turn Every Click Into a Call',
            heroSubtitle: 'Calldocker turns your visitors into conversations — instantly.',
            features: []
        };
        res.json({ content });
    }
    catch (error) {
        console.error('Get frontpage content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/content/frontpage', authenticateSuperAdmin, (req, res) => {
    try {
        const content = Object.assign(Object.assign({}, req.body), { updatedAt: new Date().toISOString() });
        res.json({ content });
    }
    catch (error) {
        console.error('Update frontpage content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Package Management Routes
router.get('/packages', authenticateSuperAdmin, (req, res) => {
    try {
        const packages = [
            {
                id: 'basic',
                name: 'Basic',
                price: 29,
                features: ['1 Agent', 'Basic Widget', 'Email Support'],
                active: true
            },
            {
                id: 'pro',
                name: 'Professional',
                price: 99,
                features: ['5 Agents', 'Custom Branding', 'Webhooks', 'Analytics'],
                active: true
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                price: 299,
                features: ['Unlimited Agents', 'Priority Support', 'Advanced Analytics', 'Integrations'],
                active: true
            }
        ];
        res.json({ packages });
    }
    catch (error) {
        console.error('Get packages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/packages', authenticateSuperAdmin, (req, res) => {
    try {
        const pkg = Object.assign(Object.assign({ id: `pkg-${Date.now()}` }, req.body), { createdAt: new Date().toISOString() });
        res.json({ package: pkg });
    }
    catch (error) {
        console.error('Create package error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Customer Care Routes
router.get('/support/tickets', authenticateSuperAdmin, (req, res) => {
    try {
        const tickets = [
            {
                id: 'TICKET-001',
                subject: 'Widget not loading',
                customer: 'john@example.com',
                status: 'open',
                priority: 'high',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                description: 'The widget is not loading properly on our website.'
            },
            {
                id: 'TICKET-002',
                subject: 'Billing question',
                customer: 'jane@company.com',
                status: 'in-progress',
                priority: 'medium',
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                description: 'I have a question about my monthly billing.'
            }
        ];
        res.json({ tickets });
    }
    catch (error) {
        console.error('Get support tickets error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/support/tickets', authenticateSuperAdmin, (req, res) => {
    try {
        const ticket = Object.assign(Object.assign({ id: `TICKET-${Date.now()}` }, req.body), { createdAt: new Date().toISOString(), status: 'open' });
        res.json({ ticket });
    }
    catch (error) {
        console.error('Create support ticket error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Advanced Analytics Routes
router.get('/analytics/advanced', authenticateSuperAdmin, (req, res) => {
    try {
        // Mock advanced analytics data
        const analytics = {
            revenue: {
                monthly: [12000, 19000, 15000, 25000, 22000, 30000],
                growth: 25.5
            },
            users: {
                growth: [45, 78, 56, 89, 67, 95],
                total: Object.keys(companies).length
            },
            performance: {
                responseTime: 245,
                uptime: 99.9,
                activeSessions: 1247
            },
            features: {
                widgetInstalls: 89,
                activeCalls: 23,
                chatSessions: 156
            },
            support: {
                openTickets: 5,
                avgResolutionTime: 4.2,
                satisfaction: 4.8
            }
        };
        res.json(analytics);
    }
    catch (error) {
        console.error('Get advanced analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// System Management Routes
router.get('/system/config', authenticateSuperAdmin, (req, res) => {
    try {
        const config = {
            maintenanceMode: false,
            emailService: 'smtp',
            storageProvider: 'local',
            autoBackup: true,
            maxFileSize: 10485760,
            sessionTimeout: 3600
        };
        res.json({ config });
    }
    catch (error) {
        console.error('Get system config error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/system/config', authenticateSuperAdmin, (req, res) => {
    try {
        const config = Object.assign(Object.assign({}, req.body), { updatedAt: new Date().toISOString() });
        res.json({ config });
    }
    catch (error) {
        console.error('Update system config error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// User Management Routes
router.get('/users', authenticateSuperAdmin, (req, res) => {
    try {
        const systemUsers = [
            {
                id: 'user-1',
                username: 'superadmin',
                email: 'admin@calldocker.com',
                role: 'super-admin',
                status: 'active',
                lastLogin: new Date().toISOString(),
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'user-2',
                username: 'support1',
                email: 'support@calldocker.com',
                role: 'support',
                status: 'active',
                lastLogin: new Date(Date.now() - 3600000).toISOString(),
                createdAt: new Date(Date.now() - 172800000).toISOString()
            }
        ];
        res.json({ users: systemUsers });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/users', authenticateSuperAdmin, (req, res) => {
    try {
        const user = Object.assign(Object.assign({ id: `user-${Date.now()}` }, req.body), { status: 'active', createdAt: new Date().toISOString(), lastLogin: null });
        res.json({ user });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// API Management Routes
router.get('/api-keys', authenticateSuperAdmin, (req, res) => {
    try {
        const apiKeys = [
            {
                id: 'key-1',
                name: 'Production API Key',
                key: 'prod_sk_1234567890abcdef',
                permissions: ['read', 'write'],
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                lastUsed: new Date(Date.now() - 3600000).toISOString(),
                expiresAt: null
            },
            {
                id: 'key-2',
                name: 'Development API Key',
                key: 'dev_sk_abcdef1234567890',
                permissions: ['read'],
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                lastUsed: new Date(Date.now() - 7200000).toISOString(),
                expiresAt: new Date(Date.now() + 86400000 * 30).toISOString()
            }
        ];
        res.json({ apiKeys });
    }
    catch (error) {
        console.error('Get API keys error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/api-keys', authenticateSuperAdmin, (req, res) => {
    try {
        const apiKey = {
            id: `key-${Date.now()}`,
            name: req.body.name,
            key: `sk_${Math.random().toString(36).substr(2, 15)}`,
            permissions: req.body.permissions || ['read'],
            createdAt: new Date().toISOString(),
            lastUsed: null,
            expiresAt: req.body.expiresAt || null
        };
        res.json({ apiKey });
    }
    catch (error) {
        console.error('Create API key error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// --- Super Admin: Pending Registrations ---
// GET /api/superadmin/pending-registrations
router.get('/pending-registrations', (req, res) => {
    const pendingCompanies = Object.values(companies).filter((c) => c.status === 'pending');
    const pendingAgents = Object.values(agents).filter((a) => a.status === 'pending');
    res.json({ companies: pendingCompanies, agents: pendingAgents });
});
// POST /api/superadmin/approve
router.post('/approve', (req, res) => {
    const { type, id } = req.body;
    if (type === 'company') {
        const company = companies[id];
        if (company) {
            company.status = 'approved';
            company.verified = true;
            saveCompanies();
            // Create admin user from pending admin credentials
            const pendingAdmin = pendingAdmins.find((pa) => pa.uuid === id);
            if (pendingAdmin) {
                // In a real application, you'd hash the password here
                const hashedPassword = pendingAdmin.adminPassword; // This should be bcrypt.hash() in production
                // Add to users array
                const adminUser = {
                    uuid: (0, uuid_1.v4)(),
                    username: pendingAdmin.adminUsername,
                    password: hashedPassword,
                    companyUuid: id,
                    role: 'admin',
                    email: pendingAdmin.email,
                    createdAt: new Date().toISOString()
                };
                users[adminUser.uuid] = adminUser;
                saveUsers();
                // Remove from pending admins
                const index = pendingAdmins.findIndex((pa) => pa.uuid === id);
                if (index > -1) {
                    pendingAdmins.splice(index, 1);
                }
            }
            return res.json({ success: true, message: 'Company approved successfully' });
        }
    }
    else if (type === 'agent') {
        const agent = agents[id];
        if (agent) {
            agent.registrationStatus = 'approved';
            agent.status = 'offline'; // Set initial status to offline
            saveAgents();
            // Create agent user from pending agent credentials
            const pendingAgentCred = pendingAgentCredentials.find((pac) => pac.uuid === id);
            if (pendingAgentCred) {
                // In a real application, you'd hash the password here
                const hashedPassword = pendingAgentCred.password; // This should be bcrypt.hash() in production
                // Add to users array
                const agentUser = {
                    uuid: (0, uuid_1.v4)(),
                    username: pendingAgentCred.username,
                    password: hashedPassword,
                    companyUuid: pendingAgentCred.companyUuid,
                    role: 'agent',
                    email: pendingAgentCred.email,
                    createdAt: new Date().toISOString()
                };
                users[agentUser.uuid] = agentUser;
                saveUsers();
                // Remove from pending agent credentials
                const index = pendingAgentCredentials.findIndex((pac) => pac.uuid === id);
                if (index > -1) {
                    pendingAgentCredentials.splice(index, 1);
                }
            }
            return res.json({ success: true, message: 'Agent approved successfully' });
        }
    }
    res.status(404).json({ error: 'Not found' });
});
// POST /api/superadmin/reject
router.post('/reject', (req, res) => {
    const { type, id } = req.body;
    if (type === 'company') {
        const company = companies[id];
        if (company) {
            company.status = 'rejected';
            saveCompanies();
            return res.json({ success: true });
        }
    }
    else if (type === 'agent') {
        const agent = agents[id];
        if (agent) {
            agent.status = 'rejected';
            saveAgents();
            return res.json({ success: true });
        }
    }
    res.status(404).json({ error: 'Not found' });
});
// --- Super Admin: Contact Messages ---
// GET /api/superadmin/contact-messages
router.get('/contact-messages', (req, res) => {
    res.json({ messages: contactMessages });
});
// POST /api/superadmin/contact-messages/:id/handle
router.post('/contact-messages/:id/handle', (req, res) => {
    const { id } = req.params;
    const msg = contactMessages.find((m) => m._id === id);
    if (msg) {
        msg.handled = true;
        res.json({ success: true });
    }
    else {
        res.status(404).json({ error: 'Message not found' });
    }
});
// ===== CALL MANAGEMENT ENDPOINTS =====
// Get active calls
router.get('/calls/active', authenticateSuperAdmin, (req, res) => {
    try {
        const activeCalls = []; // This would be loaded from persistent storage
        res.json({
            success: true,
            calls: activeCalls,
            count: activeCalls.length
        });
    }
    catch (error) {
        console.error('Error fetching active calls:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get call history
router.get('/calls/history', authenticateSuperAdmin, (req, res) => {
    try {
        const { page = 1, limit = 20, status, agentId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const allCalls = []; // This would be loaded from persistent storage
        let filteredCalls = allCalls;
        if (status) {
            filteredCalls = filteredCalls.filter((call) => call.status === status);
        }
        if (agentId) {
            filteredCalls = filteredCalls.filter((call) => call.assignedAgent === agentId);
        }
        const paginatedCalls = filteredCalls.slice(skip, skip + Number(limit));
        res.json({
            success: true,
            calls: paginatedCalls,
            total: filteredCalls.length,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(filteredCalls.length / Number(limit))
        });
    }
    catch (error) {
        console.error('Error fetching call history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Assign call to agent
router.post('/calls/:id/assign', authenticateSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { agentId } = req.body;
        if (!agentId) {
            return res.status(400).json({ error: 'Agent ID required' });
        }
        // This would update the call in persistent storage
        res.json({
            success: true,
            message: 'Call assigned successfully'
        });
    }
    catch (error) {
        console.error('Error assigning call:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update call status
router.put('/calls/:id/status', authenticateSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status required' });
        }
        // This would update the call in persistent storage
        res.json({
            success: true,
            message: 'Call status updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating call status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get call analytics
router.get('/calls/analytics', authenticateSuperAdmin, (req, res) => {
    try {
        const { period = '7d' } = req.query;
        const now = new Date();
        let startDate = new Date();
        switch (period) {
            case '24h':
                startDate.setHours(now.getHours() - 24);
                break;
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            default:
                startDate.setDate(now.getDate() - 7);
        }
        const analytics = {
            totalCalls: 0,
            activeCalls: 0,
            avgDuration: 0,
            callsByStatus: {
                waiting: 0,
                active: 0,
                ended: 0,
                missed: 0
            },
            callsByType: {
                chat: 0,
                voice: 0
            }
        };
        res.json({
            success: true,
            analytics,
            period
        });
    }
    catch (error) {
        console.error('Error fetching call analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ===== AGENT MANAGEMENT ENDPOINTS =====
// Get all agents with status
router.get('/agents/status', authenticateSuperAdmin, (req, res) => {
    try {
        console.log('[DEBUG] Agent status request received');
        console.log('[DEBUG] Agents data:', agents);
        // Ensure we have some default agents if none exist
        if (Object.keys(agents).length === 0) {
            console.log('[DEBUG] No agents found, creating default agents');
            const defaultAgent = {
                uuid: 'default-agent-001',
                username: 'agent1',
                email: 'agent1@demo.com',
                companyUuid: 'demo-company-uuid',
                status: 'online',
                assignedToPublic: true,
                currentCalls: 1,
                maxCalls: 5,
                availability: 'online',
                callsHandled: 15,
                avgDuration: 240,
                satisfaction: 4.5,
                skills: ['sales', 'support'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            agents[defaultAgent.uuid] = defaultAgent;
        }
        const agentsWithStatus = Object.values(agents).map((agent) => {
            const company = companies[agent.companyUuid];
            // Ensure all required fields exist with defaults
            const agentData = {
                id: agent.uuid || agent.id || `agent-${Math.random().toString(36).substr(2, 9)}`,
                username: agent.username || 'Unknown Agent',
                email: agent.email || 'agent@example.com',
                companyName: (company === null || company === void 0 ? void 0 : company.name) || 'Unknown Company',
                status: agent.status || 'offline',
                assignedToPublic: agent.assignedToPublic || false,
                currentCalls: agent.currentCalls || 0,
                maxCalls: agent.maxCalls || 5,
                availability: agent.availability || 'offline',
                lastActivity: agent.updatedAt || agent.createdAt || new Date().toISOString(),
                skills: agent.skills || [],
                callsHandled: agent.callsHandled || 0,
                avgDuration: agent.avgDuration || 0,
                satisfaction: agent.satisfaction || 0,
                responseTime: agent.responseTime || 0,
                totalCalls: agent.totalCalls || 0,
                missedCalls: agent.missedCalls || 0
            };
            console.log('[DEBUG] Processed agent:', agentData);
            return agentData;
        });
        console.log('[DEBUG] Final agents array:', agentsWithStatus);
        res.json({
            success: true,
            agents: agentsWithStatus,
            onlineCount: agentsWithStatus.filter((a) => a.status === 'online').length,
            totalCount: agentsWithStatus.length
        });
    }
    catch (error) {
        console.error('Error fetching agent status:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Update agent assignment
router.put('/agents/:id/assignment', authenticateSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { assignedToPublic, maxCalls, skills } = req.body;
        // This would update the agent assignment in persistent storage
        res.json({
            success: true,
            message: 'Agent assignment updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating agent assignment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get agent performance
router.get('/agents/:id/performance', authenticateSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { period = '7d' } = req.query;
        const performance = {
            callsHandled: 0,
            avgDuration: 0,
            responseTime: 0,
            satisfaction: 4.5,
            totalCalls: 0,
            missedCalls: 0
        };
        res.json({
            success: true,
            performance,
            period
        });
    }
    catch (error) {
        console.error('Error fetching agent performance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/superadmin/create-company - Direct company creation (bypass email verification)
router.post('/create-company', authenticateSuperAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('[DEBUG] Create company request received:', {
            body: req.body,
            headers: req.headers,
            method: req.method,
            url: req.url
        });
        const { companyName, displayName, adminUsername, adminPassword, email, adminEmail } = req.body;
        console.log('[DEBUG] Extracted fields:', {
            companyName,
            displayName,
            adminUsername,
            adminPassword: adminPassword ? '[HIDDEN]' : 'undefined',
            email,
            adminEmail
        });
        // Validate required fields
        if (!companyName || !adminUsername || !adminPassword || !email) {
            console.log('[DEBUG] Validation failed - missing required fields');
            return res.status(400).json({ error: 'Company name, admin username, password, and email are required' });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('[DEBUG] Validation failed - invalid email format:', email);
            return res.status(400).json({ error: 'Invalid email format' });
        }
        // Check if company already exists (by email)
        const existingCompany = Object.values(companies).find((c) => c.email === email);
        if (existingCompany) {
            console.log('[DEBUG] Validation failed - company already exists:', email);
            return res.status(400).json({ error: 'A company with this email already exists' });
        }
        console.log('[DEBUG] All validations passed, creating company...');
        // Generate UUID
        const uuid = (0, uuid_1.v4)();
        // Hash admin password
        const hashedPassword = yield bcrypt_1.default.hash(adminPassword, 10);
        // Create company with approved status
        const newCompany = {
            uuid,
            name: companyName,
            displayName: displayName || companyName,
            email,
            verified: true,
            suspended: false,
            createdAt: new Date().toISOString(),
            status: 'approved' // Directly approved
        };
        // Add to companies object
        companies[uuid] = newCompany;
        saveCompanies(); // Save to file
        // Create admin user
        const adminUser = {
            uuid: (0, uuid_1.v4)(),
            username: adminUsername,
            password: hashedPassword,
            companyUuid: uuid,
            role: 'admin',
            email: adminEmail || email,
            createdAt: new Date().toISOString()
        };
        // Add to users object
        users[adminUser.uuid] = adminUser;
        saveUsers(); // Save to file
        // Create default agents for the new company
        const defaultAgent1 = {
            uuid: (0, uuid_1.v4)(),
            username: 'agent1',
            email: 'agent1@' + email.split('@')[1],
            companyUuid: uuid,
            status: 'offline',
            assignedToPublic: true,
            currentCalls: 0,
            maxCalls: 5,
            availability: 'offline',
            callsHandled: 0,
            avgDuration: 0,
            satisfaction: 0,
            responseTime: 0,
            totalCalls: 0,
            missedCalls: 0,
            skills: ['sales', 'support'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const defaultAgent2 = {
            uuid: (0, uuid_1.v4)(),
            username: 'agent2',
            email: 'agent2@' + email.split('@')[1],
            companyUuid: uuid,
            status: 'offline',
            assignedToPublic: false,
            currentCalls: 0,
            maxCalls: 3,
            availability: 'offline',
            callsHandled: 0,
            avgDuration: 0,
            satisfaction: 0,
            responseTime: 0,
            totalCalls: 0,
            missedCalls: 0,
            skills: ['technical'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // Add default agents to agents object
        agents[defaultAgent1.uuid] = defaultAgent1;
        agents[defaultAgent2.uuid] = defaultAgent2;
        saveAgents(); // Save to file
        // Generate JWT token for admin
        const token = jsonwebtoken_1.default.sign({
            username: adminUsername,
            companyUuid: uuid,
            role: 'admin'
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        console.log(`[SuperAdmin] Company created: ${companyName} (${uuid})`);
        console.log(`[SuperAdmin] Company saved to persistent storage`);
        res.json({
            success: true,
            message: 'Company created successfully',
            company: {
                uuid,
                name: companyName,
                displayName: displayName || companyName,
                email,
                status: 'approved'
            },
            admin: {
                username: adminUsername,
                email: adminEmail || email,
                token
            },
            loginUrl: `/admin-login?companyUuid=${uuid}&username=${adminUsername}&password=${adminPassword}`
        });
    }
    catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
