"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const server_1 = require("../server");
const persistentStorage_1 = require("../data/persistentStorage");
const router = express_1.default.Router();
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
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        // For demo purposes, using hardcoded super admin credentials
        // In production, this should be stored in a database
        const superAdminCredentials = {
            username: 'superadmin',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
            role: 'super-admin'
        };
        if (username !== superAdminCredentials.username) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = yield bcryptjs_1.default.compare(password, superAdminCredentials.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({
            username: superAdminCredentials.username,
            role: superAdminCredentials.role
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
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
        // Transform existing companies data to match the expected format
        const accounts = Object.values(persistentStorage_1.companies).map((company) => ({
            id: company.uuid,
            companyName: company.name,
            email: company.email,
            status: company.suspended ? 'suspended' : (company.verified ? 'active' : 'pending'),
            createdAt: company.createdAt || new Date().toISOString(),
            lastLogin: company.lastLogin || new Date().toISOString(),
            subscription: 'pro', // Default subscription
            agents: Object.values(persistentStorage_1.agents).filter((agent) => agent.companyUuid === company.uuid).length,
            calls: 0, // This would be calculated from call logs
            revenue: Math.floor(Math.random() * 5000) + 1000 // Mock revenue data
        }));
        res.json(accounts);
    }
    catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Suspend account
router.put('/accounts/:id/suspend', authenticateSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        // Find and update the company status
        const company = tempStorage.companies.find((c) => c.uuid === id);
        if (!company) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // Add suspended status to company
        company.suspended = true;
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        // Find and update the company status
        const company = tempStorage.companies.find((c) => c.uuid === id);
        if (!company) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // Remove suspended status from company
        company.suspended = false;
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        // Find and remove the company
        const companyIndex = tempStorage.companies.findIndex((c) => c.uuid === id);
        if (companyIndex === -1) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // Remove company and related data
        tempStorage.companies.splice(companyIndex, 1);
        // Remove related agents
        tempStorage.agents = tempStorage.agents.filter((agent) => agent.companyUuid !== id);
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const analytics = {
            totalAccounts: tempStorage.companies.length,
            activeAccounts: tempStorage.companies.filter((c) => c.verified && !c.suspended).length,
            suspendedAccounts: tempStorage.companies.filter((c) => c.suspended).length,
            pendingAccounts: tempStorage.companies.filter((c) => !c.verified).length,
            totalAgents: tempStorage.agents.length,
            totalRevenue: tempStorage.companies.length * 2500, // Mock calculation
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const posts = tempStorage.blogPosts || [];
        res.json({ posts });
    }
    catch (error) {
        console.error('Get blog posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/content/blog-posts', authenticateSuperAdmin, (req, res) => {
    try {
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        if (!tempStorage.blogPosts) {
            tempStorage.blogPosts = [];
        }
        const post = Object.assign(Object.assign({ id: `post-${Date.now()}` }, req.body), { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        tempStorage.blogPosts.push(post);
        res.json({ post });
    }
    catch (error) {
        console.error('Create blog post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/content/frontpage', authenticateSuperAdmin, (req, res) => {
    try {
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const content = tempStorage.frontpageContent || {
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        tempStorage.frontpageContent = Object.assign(Object.assign(Object.assign({}, tempStorage.frontpageContent), req.body), { updatedAt: new Date().toISOString() });
        res.json({ content: tempStorage.frontpageContent });
    }
    catch (error) {
        console.error('Update frontpage content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Package Management Routes
router.get('/packages', authenticateSuperAdmin, (req, res) => {
    try {
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const packages = tempStorage.packages || [
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        if (!tempStorage.packages) {
            tempStorage.packages = [];
        }
        const pkg = Object.assign(Object.assign({ id: `pkg-${Date.now()}` }, req.body), { createdAt: new Date().toISOString() });
        tempStorage.packages.push(pkg);
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const tickets = tempStorage.supportTickets || [
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        if (!tempStorage.supportTickets) {
            tempStorage.supportTickets = [];
        }
        const ticket = Object.assign(Object.assign({ id: `TICKET-${Date.now()}` }, req.body), { createdAt: new Date().toISOString(), status: 'open' });
        tempStorage.supportTickets.push(ticket);
        res.json({ ticket });
    }
    catch (error) {
        console.error('Create support ticket error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Advanced Analytics Routes
router.get('/analytics/advanced', authenticateSuperAdmin, (req, res) => {
    var _a;
    try {
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        // Mock advanced analytics data
        const analytics = {
            revenue: {
                monthly: [12000, 19000, 15000, 25000, 22000, 30000],
                growth: 25.5
            },
            users: {
                growth: [45, 78, 56, 89, 67, 95],
                total: tempStorage.companies.length
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
                openTickets: ((_a = tempStorage.supportTickets) === null || _a === void 0 ? void 0 : _a.filter((t) => t.status === 'open').length) || 0,
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const config = tempStorage.systemConfig || {
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        tempStorage.systemConfig = Object.assign(Object.assign(Object.assign({}, tempStorage.systemConfig), req.body), { updatedAt: new Date().toISOString() });
        res.json({ config: tempStorage.systemConfig });
    }
    catch (error) {
        console.error('Update system config error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// User Management Routes
router.get('/users', authenticateSuperAdmin, (req, res) => {
    try {
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const users = tempStorage.users || [
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
        res.json({ users });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/users', authenticateSuperAdmin, (req, res) => {
    try {
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        if (!tempStorage.users) {
            tempStorage.users = [];
        }
        const user = Object.assign(Object.assign({ id: `user-${Date.now()}` }, req.body), { status: 'active', createdAt: new Date().toISOString(), lastLogin: null });
        tempStorage.users.push(user);
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const apiKeys = tempStorage.apiKeys || [
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        if (!tempStorage.apiKeys) {
            tempStorage.apiKeys = [];
        }
        const apiKey = {
            id: `key-${Date.now()}`,
            name: req.body.name,
            key: `sk_${Math.random().toString(36).substr(2, 15)}`,
            permissions: req.body.permissions || ['read'],
            createdAt: new Date().toISOString(),
            lastUsed: null,
            expiresAt: req.body.expiresAt || null
        };
        tempStorage.apiKeys.push(apiKey);
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
    const pendingCompanies = global.tempStorage.companies.filter(c => c.status === 'pending');
    const pendingAgents = global.tempStorage.agents.filter(a => a.status === 'pending');
    res.json({ companies: pendingCompanies, agents: pendingAgents });
});
// POST /api/superadmin/approve
router.post('/approve', (req, res) => {
    var _a, _b, _c, _d;
    const { type, id } = req.body;
    if (type === 'company') {
        const company = global.tempStorage.companies.find(c => c.uuid === id);
        if (company) {
            company.status = 'approved';
            company.verified = true;
            // Create admin user from pending admin credentials
            const pendingAdmin = (_a = global.tempStorage.pendingAdmins) === null || _a === void 0 ? void 0 : _a.find(pa => pa.uuid === id);
            if (pendingAdmin) {
                // In a real application, you'd hash the password here
                const hashedPassword = pendingAdmin.adminPassword; // This should be bcrypt.hash() in production
                // Add to users array (you'll need to create this in tempStorage)
                global.tempStorage.authUsers = global.tempStorage.authUsers || [];
                global.tempStorage.authUsers.push({
                    uuid: (0, server_1.generateId)(),
                    username: pendingAdmin.adminUsername,
                    password: hashedPassword,
                    companyUuid: id,
                    role: 'admin',
                    email: pendingAdmin.email,
                    createdAt: new Date().toISOString()
                });
                // Remove from pending admins
                global.tempStorage.pendingAdmins = ((_b = global.tempStorage.pendingAdmins) === null || _b === void 0 ? void 0 : _b.filter(pa => pa.uuid !== id)) || [];
            }
            return res.json({ success: true, message: 'Company approved successfully' });
        }
    }
    else if (type === 'agent') {
        const agent = global.tempStorage.agents.find(a => a.uuid === id);
        if (agent) {
            agent.registrationStatus = 'approved';
            agent.status = 'offline'; // Set initial status to offline
            // Create agent user from pending agent credentials
            const pendingAgentCred = (_c = global.tempStorage.pendingAgentCredentials) === null || _c === void 0 ? void 0 : _c.find(pac => pac.uuid === id);
            if (pendingAgentCred) {
                // In a real application, you'd hash the password here
                const hashedPassword = pendingAgentCred.password; // This should be bcrypt.hash() in production
                // Add to authUsers array
                global.tempStorage.authUsers = global.tempStorage.authUsers || [];
                global.tempStorage.authUsers.push({
                    uuid: (0, server_1.generateId)(),
                    username: pendingAgentCred.username,
                    password: hashedPassword,
                    companyUuid: pendingAgentCred.companyUuid,
                    role: 'agent',
                    email: pendingAgentCred.email,
                    createdAt: new Date().toISOString()
                });
                // Remove from pending agent credentials
                global.tempStorage.pendingAgentCredentials = ((_d = global.tempStorage.pendingAgentCredentials) === null || _d === void 0 ? void 0 : _d.filter(pac => pac.uuid !== id)) || [];
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
        const company = global.tempStorage.companies.find(c => c.uuid === id);
        if (company) {
            company.status = 'rejected';
            return res.json({ success: true });
        }
    }
    else if (type === 'agent') {
        const agent = global.tempStorage.agents.find(a => a.uuid === id);
        if (agent) {
            agent.status = 'rejected';
            return res.json({ success: true });
        }
    }
    res.status(404).json({ error: 'Not found' });
});
// --- Super Admin: Contact Messages ---
// GET /api/superadmin/contact-messages
router.get('/contact-messages', (req, res) => {
    res.json(global.tempStorage.contactMessages || []);
});
// POST /api/superadmin/contact-messages/:id/mark-handled
router.post('/contact-messages/:id/mark-handled', (req, res) => {
    const { id } = req.params;
    const msg = (global.tempStorage.contactMessages || []).find(m => m._id === id);
    if (msg) {
        msg.handled = true;
        return res.json({ success: true });
    }
    res.status(404).json({ error: 'Message not found' });
});
// ===== CALL MANAGEMENT ENDPOINTS =====
// Get active calls
router.get('/calls/active', authenticateSuperAdmin, (req, res) => {
    try {
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const activeCalls = tempStorage.calls.filter((call) => ['waiting', 'connecting', 'active'].includes(call.status));
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const { page = 1, limit = 20, status, agentId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        let filteredCalls = tempStorage.calls;
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const { id } = req.params;
        const { agentId } = req.body;
        if (!agentId) {
            return res.status(400).json({ error: 'Agent ID required' });
        }
        const call = tempStorage.calls.find((c) => c.id === id);
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        // Check if agent exists and is available
        const agent = tempStorage.agents.find((a) => a.uuid === agentId);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        if (agent.status !== 'online') {
            return res.status(400).json({ error: 'Agent is not online' });
        }
        call.assignedAgent = agentId;
        call.status = 'connecting';
        res.json({
            success: true,
            message: 'Call assigned successfully',
            call
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const { id } = req.params;
        const { status, notes } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status required' });
        }
        const call = tempStorage.calls.find((c) => c.id === id);
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        call.status = status;
        if (notes) {
            call.notes = notes;
        }
        if (status === 'ended') {
            call.endTime = new Date().toISOString();
            if (call.startTime) {
                call.duration = Math.floor((new Date(call.endTime).getTime() - new Date(call.startTime).getTime()) / 1000);
            }
        }
        res.json({
            success: true,
            message: 'Call status updated successfully',
            call
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
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
        const recentCalls = tempStorage.calls.filter((call) => new Date(call.startTime) >= startDate);
        const analytics = {
            totalCalls: recentCalls.length,
            activeCalls: recentCalls.filter((c) => c.status === 'active').length,
            avgDuration: recentCalls.length > 0
                ? recentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / recentCalls.length
                : 0,
            callsByStatus: {
                waiting: recentCalls.filter((c) => c.status === 'waiting').length,
                active: recentCalls.filter((c) => c.status === 'active').length,
                ended: recentCalls.filter((c) => c.status === 'ended').length,
                missed: recentCalls.filter((c) => c.status === 'missed').length
            },
            callsByType: {
                chat: recentCalls.filter((c) => c.callType === 'chat').length,
                voice: recentCalls.filter((c) => c.callType === 'voice').length
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const agentsWithStatus = tempStorage.agents.map((agent) => {
            const assignment = tempStorage.agentAssignments.find((a) => a.agentId === agent.uuid);
            const company = tempStorage.companies.find((c) => c.uuid === agent.companyUuid);
            return {
                id: agent.uuid,
                username: agent.username,
                email: agent.email,
                companyName: (company === null || company === void 0 ? void 0 : company.name) || 'Unknown',
                status: agent.status,
                assignedToPublic: (assignment === null || assignment === void 0 ? void 0 : assignment.assignedToPublic) || false,
                currentCalls: (assignment === null || assignment === void 0 ? void 0 : assignment.currentCalls) || 0,
                maxCalls: (assignment === null || assignment === void 0 ? void 0 : assignment.maxCalls) || 5,
                availability: (assignment === null || assignment === void 0 ? void 0 : assignment.availability) || 'offline',
                lastActivity: (assignment === null || assignment === void 0 ? void 0 : assignment.lastActivity) || agent.updatedAt || agent.createdAt,
                skills: (assignment === null || assignment === void 0 ? void 0 : assignment.skills) || []
            };
        });
        res.json({
            success: true,
            agents: agentsWithStatus,
            onlineCount: agentsWithStatus.filter((a) => a.status === 'online').length,
            totalCount: agentsWithStatus.length
        });
    }
    catch (error) {
        console.error('Error fetching agent status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update agent assignment
router.put('/agents/:id/assignment', authenticateSuperAdmin, (req, res) => {
    try {
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const { id } = req.params;
        const { assignedToPublic, maxCalls, skills } = req.body;
        let assignment = tempStorage.agentAssignments.find((a) => a.agentId === id);
        if (!assignment) {
            assignment = {
                id: (0, server_1.generateId)(),
                agentId: id,
                assignedToPublic: assignedToPublic || false,
                maxCalls: maxCalls || 5,
                currentCalls: 0,
                skills: skills || [],
                availability: 'available',
                lastActivity: new Date().toISOString()
            };
            tempStorage.agentAssignments.push(assignment);
        }
        else {
            if (assignedToPublic !== undefined)
                assignment.assignedToPublic = assignedToPublic;
            if (maxCalls !== undefined)
                assignment.maxCalls = maxCalls;
            if (skills !== undefined)
                assignment.skills = skills;
            assignment.lastActivity = new Date().toISOString();
        }
        res.json({
            success: true,
            message: 'Agent assignment updated successfully',
            assignment
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
        const tempStorage = global.tempStorage;
        if (!tempStorage) {
            return res.status(500).json({ error: 'Storage not available' });
        }
        const { id } = req.params;
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
        const agentCalls = tempStorage.calls.filter((call) => call.assignedAgent === id && new Date(call.startTime) >= startDate);
        const performance = {
            callsHandled: agentCalls.filter((c) => c.status === 'ended').length,
            avgDuration: agentCalls.length > 0
                ? agentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / agentCalls.length
                : 0,
            responseTime: 0, // This would be calculated from call logs
            satisfaction: 4.5, // Mock satisfaction rating
            totalCalls: agentCalls.length,
            missedCalls: agentCalls.filter((c) => c.status === 'missed').length
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
        const { companyName, displayName, adminUsername, adminPassword, email, adminEmail } = req.body;
        // Validate required fields
        if (!companyName || !adminUsername || !adminPassword || !email) {
            return res.status(400).json({ error: 'Company name, admin username, password, and email are required' });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        // Check if company already exists (by email)
        const existingCompany = Object.values(persistentStorage_1.companies).find((c) => c.email === email);
        if (existingCompany) {
            return res.status(400).json({ error: 'A company with this email already exists' });
        }
        // Generate UUID
        const uuid = (0, server_1.generateId)();
        // Hash admin password
        const hashedPassword = yield bcryptjs_1.default.hash(adminPassword, 10);
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
        persistentStorage_1.companies[uuid] = newCompany;
        (0, persistentStorage_1.saveCompanies)(); // Save to file
        // Create admin user
        const adminUser = {
            uuid: (0, server_1.generateId)(),
            username: adminUsername,
            password: hashedPassword,
            companyUuid: uuid,
            role: 'admin',
            email: adminEmail || email,
            createdAt: new Date().toISOString()
        };
        // Add to users object
        const { users, saveUsers } = yield Promise.resolve().then(() => __importStar(require('../data/persistentStorage')));
        users[adminUser.uuid] = adminUser;
        saveUsers(); // Save to file
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
