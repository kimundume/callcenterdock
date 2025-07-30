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
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const persistentStorage_1 = require("../data/persistentStorage");
const emailService_1 = require("../services/emailService");
const server_1 = require("../server");
// In-memory storage for temporary data
const ivrConfigs = {};
const calls = {};
const onlineAgents = {};
const pendingAdmins = [];
const pendingAgentCredentials = [];
const contactMessages = [];
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-prod';
// Password strength regex (min 8 chars, 1 upper, 1 lower, 1 number)
function isStrongPassword(pw) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(pw);
}
// Email validation regex
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
// Input validation
function validateString(str) {
    return typeof str === 'string' && str.trim().length > 0;
}
// Rate limiting
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
    message: 'Too many authentication attempts, please try again later.'
});
// JWT middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
// POST /api/company/register - Now requires Super Admin approval
router.post('/company/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyName, displayName, adminUsername, adminPassword, email } = req.body;
    // Validate all required fields
    if (![companyName, adminUsername, adminPassword, email].every((v) => validateString(v))) {
        return res.status(400).json({ error: 'All fields required' });
    }
    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    // Validate password strength
    if (!isStrongPassword(adminPassword)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
    }
    // Check if company already exists (by email)
    const existingCompany = (0, persistentStorage_1.findCompanyByEmail)(email);
    if (existingCompany) {
        return res.status(400).json({ error: 'A company with this email already exists' });
    }
    // Generate UUID
    const uuid = (0, uuid_1.v4)();
    // Store company with pending status in persistent storage
    persistentStorage_1.companies[uuid] = {
        uuid,
        name: companyName,
        displayName: displayName || companyName,
        email,
        verified: false,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    (0, persistentStorage_1.saveCompanies)();
    // Store admin credentials for later use (when approved)
    pendingAdmins.push({
        uuid,
        adminUsername,
        adminPassword, // This should be hashed in production
        email,
        createdAt: new Date().toISOString()
    });
    res.json({
        message: 'Registration submitted successfully! Your account will be reviewed by our team and you will be notified once approved.',
        uuid,
        email,
        requiresApproval: true
    });
}));
// POST /api/company/verify-email
router.post('/company/verify-email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, token } = req.body;
    if (!email || !token) {
        return res.status(400).json({ error: 'Email and verification token required' });
    }
    // Verify token
    if (!emailService_1.EmailService.verifyToken(email, token, 'email')) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    // Find pending company
    const pendingCompany = (0, persistentStorage_1.findPendingCompanyByEmail)(email);
    if (!pendingCompany) {
        return res.status(404).json({ error: 'No pending registration found for this email' });
    }
    try {
        // Create the actual company
        persistentStorage_1.companies[pendingCompany.uuid] = {
            uuid: pendingCompany.uuid,
            name: pendingCompany.companyName,
            companyName: pendingCompany.companyName,
            displayName: pendingCompany.displayName,
            email: pendingCompany.email,
            verified: true,
            createdAt: new Date().toISOString()
        };
        // Create admin user
        const hashedPassword = yield bcrypt_1.default.hash(pendingCompany.adminPassword, 10);
        persistentStorage_1.users[pendingCompany.adminUsername + '@' + pendingCompany.uuid] = {
            username: pendingCompany.adminUsername,
            password: hashedPassword,
            companyUuid: pendingCompany.uuid,
            role: 'admin',
            email: pendingCompany.email,
            createdAt: new Date().toISOString()
        };
        // Remove from pending companies if exists
        if (pendingCompany) {
            // Note: pendingCompanies is not defined in this scope, removing this line
            // delete pendingCompanies[pendingCompany.uuid];
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            username: pendingCompany.adminUsername,
            companyUuid: pendingCompany.uuid,
            role: 'admin'
        }, JWT_SECRET, { expiresIn: '1h' });
        res.json({
            message: 'Email verified successfully! Your account is now active.',
            uuid: pendingCompany.uuid,
            token,
            companyName: pendingCompany.companyName,
            displayName: pendingCompany.displayName
        });
    }
    catch (error) {
        console.error('Error creating company after verification:', error);
        res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
}));
// POST /api/auth/login - Updated to support email login
router.post('/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { email, companyUuid, username, password, role } = req.body;
    let uuid = companyUuid;
    let user = null;
    // If email is provided, find company by email
    if (email && !companyUuid) {
        // Check both storage locations for companies
        let company = (0, persistentStorage_1.findCompanyByEmail)(email);
        if (!company) {
            // Check global.tempStorage for companies created by SuperAdmin
            company = (_b = (_a = global.tempStorage) === null || _a === void 0 ? void 0 : _a.companies) === null || _b === void 0 ? void 0 : _b.find((c) => c.email === email);
        }
        if (!company) {
            return res.status(404).json({ error: 'Company not found with this email' });
        }
        uuid = company.uuid;
    }
    if (!uuid || !password || !role) {
        return res.status(400).json({ error: 'Company UUID, password, and role are required' });
    }
    // Try to find user by username first - check both storage locations
    if (username) {
        user = (0, persistentStorage_1.findUserByCompanyAndRole)(uuid, username, role);
        if (!user) {
            // Check global.tempStorage for users created by SuperAdmin
            user = (_d = (_c = global.tempStorage) === null || _c === void 0 ? void 0 : _c.authUsers) === null || _d === void 0 ? void 0 : _d.find((u) => u.companyUuid === uuid && u.username === username && u.role === role);
        }
    }
    // If no user found and email provided, try to find admin by email
    if (!user && email && role === 'admin') {
        let company = (0, persistentStorage_1.findCompanyByEmail)(email);
        if (!company) {
            company = (_f = (_e = global.tempStorage) === null || _e === void 0 ? void 0 : _e.companies) === null || _f === void 0 ? void 0 : _f.find((c) => c.email === email);
        }
        if (company) {
            // Check both storage locations for admin user
            user = Object.values(persistentStorage_1.users).find((u) => u.companyUuid === company.uuid &&
                u.role === 'admin' &&
                u.email === email);
            if (!user) {
                user = (_h = (_g = global.tempStorage) === null || _g === void 0 ? void 0 : _g.authUsers) === null || _h === void 0 ? void 0 : _h.find((u) => u.companyUuid === company.uuid &&
                    u.role === 'admin' &&
                    u.email === email);
            }
        }
    }
    if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jsonwebtoken_1.default.sign({
        username: user.username,
        companyUuid: uuid,
        role
    }, JWT_SECRET, { expiresIn: '1h' });
    // Get company info for response - check both storage locations
    let company = persistentStorage_1.companies[uuid];
    if (!company) {
        company = (_k = (_j = global.tempStorage) === null || _j === void 0 ? void 0 : _j.companies) === null || _k === void 0 ? void 0 : _k.find((c) => c.uuid === uuid);
    }
    res.json({
        token,
        companyUuid: uuid,
        username: user.username,
        role,
        companyName: (company === null || company === void 0 ? void 0 : company.name) || (company === null || company === void 0 ? void 0 : company.companyName),
        displayName: company === null || company === void 0 ? void 0 : company.displayName
    });
}));
// POST /api/auth/forgot-password
router.post('/auth/forgot-password', authLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, companyUuid, username } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    let uuid = companyUuid;
    let user = null;
    // Find company by email if UUID not provided
    if (!uuid) {
        const company = (0, persistentStorage_1.findCompanyByEmail)(email);
        if (!company) {
            return res.status(404).json({ error: 'No account found with this email' });
        }
        uuid = company.uuid;
    }
    // Find user
    if (username) {
        user = (0, persistentStorage_1.findUserByCompanyAndRole)(uuid, username, 'admin');
    }
    else {
        // Find admin by email
        user = Object.values(persistentStorage_1.users).find((u) => u.companyUuid === uuid &&
            u.role === 'admin' &&
            u.email === email);
    }
    if (!user) {
        return res.status(404).json({ error: 'No account found with the provided information' });
    }
    // Generate reset token
    const resetToken = emailService_1.EmailService.generateToken();
    emailService_1.EmailService.storeToken(email, resetToken, 'password');
    // Send password reset email
    const emailSent = yield emailService_1.EmailService.sendPasswordReset(email, user.username, resetToken);
    if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send password reset email. Please try again.' });
    }
    res.json({ message: 'Password reset email sent. Please check your inbox.' });
}));
// POST /api/auth/reset-password
router.post('/auth/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
        return res.status(400).json({ error: 'Email, token, and new password are required' });
    }
    // Validate password strength
    if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
    }
    // Verify token
    if (!emailService_1.EmailService.verifyToken(email, token, 'password')) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    // Find company and user
    const company = (0, persistentStorage_1.findCompanyByEmail)(email);
    if (!company) {
        return res.status(404).json({ error: 'Company not found' });
    }
    const user = Object.values(persistentStorage_1.users).find((u) => u.companyUuid === company.uuid &&
        u.role === 'admin' &&
        u.email === email);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    try {
        // Update password
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Failed to update password. Please try again.' });
    }
}));
// POST /api/auth/forgot-uuid
router.post('/auth/forgot-uuid', authLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    // Find company by email
    const company = (0, persistentStorage_1.findCompanyByEmail)(email);
    if (!company) {
        return res.status(404).json({ error: 'No company found with this email' });
    }
    // Send UUID reminder email
    const emailSent = yield emailService_1.EmailService.sendCompanyUuidReminder(email, company.companyName || company.name, company.uuid);
    if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send UUID reminder. Please try again.' });
    }
    res.json({ message: 'Company UUID reminder sent. Please check your inbox.' });
}));
// POST /api/agent/add (admin only, protected) - Updated with email support
router.post('/agent/add', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const { agentUsername, agentPassword, agentEmail } = req.body;
    if (!validateString(agentUsername) || !validateString(agentPassword)) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    if (agentEmail && !isValidEmail(agentEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!isStrongPassword(agentPassword)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
    }
    const decoded = req.user;
    if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    // Check if agent already exists - check both storage locations
    const key = agentUsername + '@' + decoded.companyUuid;
    let existingUser = persistentStorage_1.users[key];
    if (!existingUser) {
        // Check global.tempStorage for users created by SuperAdmin
        existingUser = (_b = (_a = global.tempStorage) === null || _a === void 0 ? void 0 : _a.authUsers) === null || _b === void 0 ? void 0 : _b.find((u) => u.username === agentUsername && u.companyUuid === decoded.companyUuid);
    }
    if (existingUser) {
        return res.status(400).json({ error: 'Agent already exists' });
    }
    try {
        const hashed = yield bcrypt_1.default.hash(agentPassword, 10);
        // Get company info - check both storage locations
        let company = persistentStorage_1.companies[decoded.companyUuid];
        if (!company) {
            company = (_d = (_c = global.tempStorage) === null || _c === void 0 ? void 0 : _c.companies) === null || _d === void 0 ? void 0 : _d.find((c) => c.uuid === decoded.companyUuid);
        }
        // Create agent in the appropriate storage location
        if (company && ((_f = (_e = global.tempStorage) === null || _e === void 0 ? void 0 : _e.companies) === null || _f === void 0 ? void 0 : _f.find((c) => c.uuid === decoded.companyUuid))) {
            // Company was created by SuperAdmin, store in global.tempStorage
            const newAgent = {
                uuid: (0, server_1.generateId)(),
                username: agentUsername,
                password: hashed,
                companyUuid: decoded.companyUuid,
                role: 'agent',
                email: agentEmail,
                status: 'online',
                registrationStatus: 'approved',
                createdAt: new Date().toISOString()
            };
            global.tempStorage.authUsers = global.tempStorage.authUsers || [];
            global.tempStorage.authUsers.push(newAgent);
            // Also add to agents array for consistency
            global.tempStorage.agents = global.tempStorage.agents || [];
            global.tempStorage.agents.push(newAgent);
        }
        else {
            // Company was created through regular registration, store in users object
            persistentStorage_1.users[key] = {
                username: agentUsername,
                password: hashed,
                companyUuid: decoded.companyUuid,
                role: 'agent',
                email: agentEmail,
                createdAt: new Date().toISOString()
            };
        }
        // Send invitation email if email provided
        if (agentEmail && company) {
            const companyName = (company && typeof company.name === 'string' && company.name.trim())
                ? company.name
                : (company && typeof company.companyName === 'string' && company.companyName.trim())
                    ? company.companyName
                    : 'Company';
            const emailSent = yield emailService_1.EmailService.sendAgentInvitation(agentEmail, agentUsername, companyName, decoded.companyUuid, agentPassword // Send temporary password
            );
            if (!emailSent) {
                console.warn('Failed to send agent invitation email');
            }
        }
        res.json({
            success: true,
            message: agentEmail ? 'Agent created and invitation email sent' : 'Agent created successfully'
        });
    }
    catch (error) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: 'Failed to create agent. Please try again.' });
    }
}));
// POST /api/agent/reset-password (admin only, protected)
router.post('/agent/reset-password', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { companyUuid, agentUsername, newPassword } = req.body;
    if (!validateString(agentUsername) || !validateString(newPassword)) {
        return res.status(400).json({ error: 'Agent username and new password are required' });
    }
    if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
    }
    const decoded = req.user;
    if (decoded.role !== 'admin' || decoded.companyUuid !== companyUuid) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        // Find agent in both storage locations
        const key = agentUsername + '@' + companyUuid;
        let agent = persistentStorage_1.users[key];
        if (!agent) {
            // Check global.tempStorage for agents created by SuperAdmin
            agent = (_b = (_a = global.tempStorage) === null || _a === void 0 ? void 0 : _a.authUsers) === null || _b === void 0 ? void 0 : _b.find((u) => u.username === agentUsername && u.companyUuid === companyUuid && u.role === 'agent');
        }
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        // Update password
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        agent.password = hashedPassword;
        res.json({ success: true, message: 'Agent password updated successfully' });
    }
    catch (error) {
        console.error('Error updating agent password:', error);
        res.status(500).json({ error: 'Failed to update agent password. Please try again.' });
    }
}));
// POST /api/agent/register - Public agent registration requiring Super Admin approval
router.post('/agent/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email, companyUuid } = req.body;
    // Validate all required fields
    if (![username, password, email, companyUuid].every((v) => validateString(v))) {
        return res.status(400).json({ error: 'All fields required' });
    }
    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    // Validate password strength
    if (!isStrongPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
    }
    // Check if company exists and is approved
    const company = persistentStorage_1.companies[companyUuid];
    if (!company) {
        return res.status(400).json({ error: 'Company not found' });
    }
    if (company.status !== 'approved') {
        return res.status(400).json({ error: 'Company is not approved yet' });
    }
    // Check if agent already exists
    const existingAgent = Object.values(persistentStorage_1.agents).find((a) => a.username === username && a.companyUuid === companyUuid);
    if (existingAgent) {
        return res.status(400).json({ error: 'Agent with this username already exists for this company' });
    }
    // Generate UUID
    const uuid = (0, uuid_1.v4)();
    // Store agent with pending status in persistent storage
    persistentStorage_1.agents[uuid] = {
        uuid,
        companyUuid,
        username,
        email,
        status: 'offline',
        registrationStatus: 'pending', // Set status to pending for Super Admin approval
        createdAt: new Date().toISOString()
    };
    (0, persistentStorage_1.saveAgents)();
    // Store agent credentials for later use (when approved)
    pendingAgentCredentials.push({
        uuid,
        username,
        password, // This should be hashed in production
        email,
        companyUuid,
        createdAt: new Date().toISOString()
    });
    res.json({
        message: 'Agent registration submitted successfully! Your account will be reviewed by our team and you will be notified once approved.',
        uuid,
        email,
        requiresApproval: true
    });
}));
// PUT /api/company/update-display-name (admin only, protected)
router.put('/company/update-display-name', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { displayName } = req.body;
    if (!validateString(displayName)) {
        return res.status(400).json({ error: 'Display name is required' });
    }
    const decoded = req.user;
    if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const company = persistentStorage_1.companies[decoded.companyUuid];
    if (!company) {
        return res.status(404).json({ error: 'Company not found' });
    }
    company.displayName = displayName;
    company.updatedAt = new Date().toISOString();
    res.json({
        success: true,
        message: 'Display name updated successfully',
        displayName
    });
}));
// GET /api/company/info (protected)
router.get('/company/info', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    // Check both storage locations for company
    let company = persistentStorage_1.companies[decoded.companyUuid];
    if (!company) {
        // Check for companies created by SuperAdmin
        company = Object.values(persistentStorage_1.companies).find((c) => c.uuid === decoded.companyUuid);
    }
    if (!company) {
        return res.status(404).json({ error: 'Company not found' });
    }
    res.json({
        uuid: company.uuid,
        companyName: company.companyName || company.name,
        displayName: company.displayName,
        email: company.email,
        verified: company.verified,
        createdAt: company.createdAt
    });
}));
// POST /api/widget/register
router.post('/register', (req, res) => {
    const { companyName, email } = req.body;
    if (!companyName || !email) {
        return res.status(400).json({ error: 'companyName and email are required' });
    }
    // Check if company already exists (by email)
    const existing = Object.values(persistentStorage_1.companies).find((c) => c.email === email);
    if (existing) {
        return res.json({ uuid: existing.uuid });
    }
    const uuid = (0, uuid_1.v4)();
    persistentStorage_1.companies[uuid] = {
        uuid,
        name: companyName,
        companyName,
        email,
        verified: false,
        createdAt: new Date().toISOString()
    };
    res.json({ uuid });
});
// GET /api/widget/calls/:uuid
router.get('/calls/:uuid', (req, res) => {
    const { uuid } = req.params;
    // Import calls from tempDB
    // (import at top if not already)
    // @ts-ignore
    const { calls } = require('../data/tempDB');
    if (!calls[uuid]) {
        return res.json([]);
    }
    res.json(calls[uuid]);
});
// POST /api/call/log (save call log)
router.post('/call/log', (req, res) => {
    const { companyUuid, agent, notes, disposition, duration, sessionId, tags, time } = req.body;
    if (!companyUuid || !agent || !duration) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!calls[companyUuid])
        calls[companyUuid] = [];
    calls[companyUuid].unshift({
        time: time || new Date().toISOString(),
        agent,
        notes,
        disposition,
        duration,
        sessionId,
        tags: tags || [],
    });
    res.json({ success: true });
});
// GET /api/call/logs/:companyUuid (fetch all call logs for a company)
router.get('/call/logs/:companyUuid', (req, res) => {
    const { companyUuid } = req.params;
    res.json(calls[companyUuid] || []);
});
// GET /api/agents/:companyUuid (list all agents for a company with online status)
router.get('/agents/:companyUuid', (req, res) => {
    var _a, _b;
    const { companyUuid } = req.params;
    // Get agents from both storage locations
    let agentList = Object.values(persistentStorage_1.users)
        .filter((u) => u.companyUuid === companyUuid && u.role === 'agent')
        .map((u) => ({
        username: u.username,
        role: u.role,
        online: !!(onlineAgents[companyUuid] && onlineAgents[companyUuid][u.username]),
    }));
    // Add agents from global.tempStorage (SuperAdmin-created companies)
    const globalAgents = ((_b = (_a = global.tempStorage) === null || _a === void 0 ? void 0 : _a.authUsers) === null || _b === void 0 ? void 0 : _b.filter((u) => u.companyUuid === companyUuid && u.role === 'agent')) || [];
    const globalAgentList = globalAgents.map((u) => ({
        username: u.username,
        role: u.role,
        online: !!(onlineAgents[companyUuid] && onlineAgents[companyUuid][u.username]),
    }));
    // Combine both lists, avoiding duplicates
    const combinedAgents = [...agentList];
    const safeGlobalAgentList = Array.isArray(globalAgentList) ? globalAgentList : [];
    safeGlobalAgentList.forEach((globalAgent) => {
        if (!combinedAgents.find((agent) => agent.username === globalAgent.username)) {
            combinedAgents.push(globalAgent);
        }
    });
    res.json(combinedAgents);
});
// PATCH /api/agent/:companyUuid/:username (update agent role/active)
router.patch('/agent/:companyUuid/:username', (req, res) => {
    const { companyUuid, username } = req.params;
    const { role, active } = req.body;
    const key = username + '@' + companyUuid;
    if (!persistentStorage_1.users[key])
        return res.status(404).json({ error: 'Agent not found' });
    if (role)
        persistentStorage_1.users[key].role = role;
    if (typeof active === 'boolean')
        persistentStorage_1.users[key].active = active;
    res.json({ success: true, user: persistentStorage_1.users[key] });
});
// DELETE /api/agent/:companyUuid/:username (remove agent)
router.delete('/agent/:companyUuid/:username', (req, res) => {
    const { companyUuid, username } = req.params;
    const key = username + '@' + companyUuid;
    if (!persistentStorage_1.users[key])
        return res.status(404).json({ error: 'Agent not found' });
    delete persistentStorage_1.users[key];
    res.json({ success: true });
});
// GET /api/widget/settings/:companyUuid
router.get('/settings/:companyUuid', (req, res) => {
    const { companyUuid } = req.params;
    const settings = persistentStorage_1.widgetSettings[companyUuid] || {
        text: 'Call Us',
        color: '#00e6ef',
        shape: 'round',
        img: 'https://via.placeholder.com/24',
        position: 'bottom-right',
        animation: 'none',
        dark: false,
    };
    res.json(settings);
});
// POST /api/widget/settings/:companyUuid (admin only)
router.post('/settings/:companyUuid', authMiddleware, (req, res) => {
    const { companyUuid } = req.params;
    const decoded = req.user;
    if (!decoded || decoded.companyUuid !== companyUuid || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { text, color, shape, img, position, animation, dark } = req.body;
    // Basic validation
    if (!text || !color || !shape || !position || !animation) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    persistentStorage_1.widgetSettings[companyUuid] = { text, color, shape, img, position, animation, dark: !!dark };
    res.json({ success: true, settings: persistentStorage_1.widgetSettings[companyUuid] });
});
// GET /api/widget/ivr/:companyUuid
router.get('/ivr/:companyUuid', (req, res) => {
    const { companyUuid } = req.params;
    const config = ivrConfigs[companyUuid] || {
        steps: [
            {
                prompt: 'Welcome to CallDocker! Press 1 for Sales, 2 for Support.',
                routes: {
                    '1': { prompt: 'Connecting you to Sales...' },
                    '2': { prompt: 'Connecting you to Support...' },
                    'sales': { prompt: 'Connecting you to Sales...' },
                    'support': { prompt: 'Connecting you to Support...' },
                },
                fallback: { prompt: 'Sorry, I didn\'t get that. Please type 1 for Sales or 2 for Support.' }
            }
        ]
    };
    res.json(config);
});
// POST /api/widget/ivr/:companyUuid (admin only)
router.post('/ivr/:companyUuid', authMiddleware, (req, res) => {
    const { companyUuid } = req.params;
    const decoded = req.user;
    if (!decoded || decoded.companyUuid !== companyUuid || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { steps } = req.body;
    if (!Array.isArray(steps)) {
        return res.status(400).json({ error: 'Invalid IVR config' });
    }
    ivrConfigs[companyUuid] = { steps };
    res.json({ success: true, config: ivrConfigs[companyUuid] });
});
// DEV ONLY: Create demo agent for demo company (no auth)
router.post('/demo/create-demo-agent', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyUuid, username, password } = req.body;
    if (!companyUuid || !username || !password)
        return res.status(400).json({ error: 'Missing fields' });
    // 1. Create the demo company if it doesn't exist
    let company = persistentStorage_1.companies[companyUuid];
    if (!company) {
        company = {
            uuid: companyUuid,
            name: 'Demo Company',
            email: 'demo@calldocker.com',
            status: 'approved',
            createdAt: new Date().toISOString(),
            verified: true,
            displayName: 'Demo Company',
        };
        persistentStorage_1.companies[companyUuid] = company;
        (0, persistentStorage_1.saveCompanies)();
    }
    // 2. Create the agent in users (for legacy compatibility)
    const key = username + '@' + companyUuid;
    if (!persistentStorage_1.users[key]) {
        const hashed = yield bcrypt_1.default.hash(password, 10);
        persistentStorage_1.users[key] = { username, password: hashed, companyUuid, role: 'agent' };
    }
    // 3. Add the agent to agents as online and approved
    const agentUuid = username + '-' + companyUuid;
    if (!persistentStorage_1.agents[agentUuid]) {
        persistentStorage_1.agents[agentUuid] = {
            uuid: agentUuid,
            username,
            companyUuid,
            email: 'demo-agent@calldocker.com',
            status: 'online',
            registrationStatus: 'approved',
            createdAt: new Date().toISOString(),
        };
    }
    else {
        persistentStorage_1.agents[agentUuid].status = 'online';
        persistentStorage_1.agents[agentUuid].registrationStatus = 'approved';
    }
    (0, persistentStorage_1.saveAgents)();
    res.json({
        success: true,
        company,
        agent: persistentStorage_1.agents[agentUuid],
        alreadyExists: !!persistentStorage_1.users[key] && !!persistentStorage_1.agents[agentUuid]
    });
}));
// DEV ONLY: Save widget settings without auth
router.post('/demo/settings/:companyUuid', (req, res) => {
    const { companyUuid } = req.params;
    const { text, color, shape, img, position, animation, dark } = req.body;
    if (!text || !color || !shape || !position || !animation) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    persistentStorage_1.widgetSettings[companyUuid] = { text, color, shape, img, position, animation, dark: !!dark };
    res.json({ success: true, settings: persistentStorage_1.widgetSettings[companyUuid] });
});
// DEV ONLY: Save IVR config without auth
router.post('/demo/ivr/:companyUuid', (req, res) => {
    const { companyUuid } = req.params;
    const { steps } = req.body;
    if (!Array.isArray(steps)) {
        return res.status(400).json({ error: 'Invalid IVR config' });
    }
    ivrConfigs[companyUuid] = { steps };
    res.json({ success: true, config: ivrConfigs[companyUuid] });
});
// --- Widget Availability & Contact Form Endpoints ---
// GET /api/widget/availability
router.get('/availability', (req, res) => {
    const { companyUuid } = req.query;
    // If no companyUuid provided, this is the public landing page widget
    if (!companyUuid) {
        // Check if CallDocker agents are online
        const callDockerAgents = Object.values(persistentStorage_1.agents).filter((agent) => agent.companyUuid === 'calldocker-company-uuid' &&
            agent.registrationStatus === 'approved' &&
            agent.status === 'online');
        const isOnline = callDockerAgents.length > 0;
        res.json({
            online: isOnline,
            routingType: 'public',
            availableAgents: callDockerAgents.length
        });
        return;
    }
    // If companyUuid provided, this is a company-specific widget
    const companyUuidStr = Array.isArray(companyUuid) ? companyUuid[0] : companyUuid;
    const company = persistentStorage_1.companies[companyUuidStr];
    if (!company) {
        return res.status(404).json({ error: 'Company not found' });
    }
    if (company.status !== 'approved') {
        return res.status(403).json({ error: 'Company not approved' });
    }
    // Check if this company has online agents
    const companyAgents = Object.values(persistentStorage_1.agents).filter((agent) => agent.companyUuid === companyUuidStr &&
        agent.registrationStatus === 'approved' &&
        agent.status === 'online');
    const isOnline = companyAgents.length > 0;
    res.json({
        online: isOnline,
        routingType: 'company',
        companyName: company.name,
        availableAgents: companyAgents.length
    });
});
// POST /api/widget/contact
router.post('/contact', (req, res) => {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    // Store contact message
    contactMessages.push({
        _id: (0, server_1.generateId)(),
        name,
        email,
        phone,
        message,
        timestamp: new Date().toISOString()
    });
    res.json({ success: true });
});
// POST /api/widget/route-call - Enhanced routing for soft launch
router.post('/route-call', (req, res) => {
    const { companyUuid, visitorId, pageUrl, callType = 'call', routingConfig } = req.body;
    console.log('[route-call] Incoming request:', { companyUuid, visitorId, pageUrl, callType, routingConfig });
    // Generate session ID
    const sessionId = `call-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
    const createdAt = new Date().toISOString();
    function createSession({ companyUuid, visitorId, agentId, type, status, createdAt, pageUrl, queuePosition }) {
        const session = {
            sessionId,
            companyUuid,
            visitorId,
            agentId,
            type,
            status,
            createdAt,
            pageUrl,
            queuePosition
        };
        persistentStorage_1.sessions.push(session);
        (0, persistentStorage_1.saveSessions)(); // Save to file
        console.log('[route-call] Session created:', session);
        return session;
    }
    // Find company
    const company = persistentStorage_1.companies[companyUuid];
    if (!company) {
        console.log('[route-call] Company not found:', companyUuid);
        return res.status(404).json({ success: false, error: 'Company not found' });
    }
    // Find available agents
    const availableAgents = Object.values(persistentStorage_1.agents).filter((a) => a.companyUuid === companyUuid &&
        a.status === 'online' &&
        a.registrationStatus === 'approved');
    console.log('[route-call] Available agents:', availableAgents.map((a) => a.username));
    if (availableAgents.length === 0) {
        return res.status(200).json({ success: false, error: 'No agents online' });
    }
    const assignedAgent = availableAgents[0];
    console.log('[route-call] Assigned agent:', assignedAgent.username);
    // Find agent socketId (if available)
    let agentSocketId = undefined;
    // Note: We'll need to implement socketId tracking properly
    console.log('[route-call] Agent socketId lookup:', { companyUuid, username: assignedAgent.username, agentSocketId: 'Not implemented yet' });
    // Create session
    const session = createSession({
        companyUuid,
        visitorId,
        agentId: assignedAgent.username,
        type: callType === 'call' ? 'call' : 'chat',
        status: 'ringing', // Fix: use correct union type
        createdAt: new Date().toISOString(),
        pageUrl
    });
    console.log('[route-call] Session created with type:', session.type);
    // Emit incoming-call to agent dashboard via socket.io
    const io = req.app.get('io');
    if (io && agentSocketId) {
        console.log('[route-call] Emitting incoming-call to agent with callType:', callType);
        io.to(agentSocketId).emit('incoming-call', {
            sessionId,
            companyUuid,
            visitorId,
            callType,
            pageUrl
        });
        console.log('[route-call] Emitted incoming-call to agent:', assignedAgent.username, 'socketId:', agentSocketId);
    }
    else {
        console.log('[route-call] No socketId found for agent:', assignedAgent.username);
    }
    return res.json({ success: true, sessionId, agent: assignedAgent.username });
});
// POST /api/widget/agent/status
router.post('/agent/status', (req, res) => {
    const { agentUuid, status } = req.body;
    if (!agentUuid || !status || !['online', 'offline'].includes(status)) {
        return res.status(400).json({ error: 'Invalid agent UUID or status' });
    }
    const agent = persistentStorage_1.agents[agentUuid];
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.registrationStatus !== 'approved') {
        return res.status(403).json({ error: 'Agent not approved' });
    }
    agent.status = status;
    agent.updatedAt = new Date().toISOString();
    (0, persistentStorage_1.saveAgents)();
    res.json({ success: true, agent });
});
// GET /api/widget/agent/status/:agentUuid
router.get('/agent/status/:agentUuid', (req, res) => {
    const { agentUuid } = req.params;
    const agent = persistentStorage_1.agents[agentUuid];
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({
        uuid: agent.uuid,
        username: agent.username,
        status: agent.status,
        companyUuid: agent.companyUuid,
        registrationStatus: agent.registrationStatus
    });
});
// GET /api/widget/agents/online
router.get('/agents/online', (req, res) => {
    const { companyUuid } = req.query;
    let onlineAgents;
    if (companyUuid) {
        // Get online agents for specific company
        onlineAgents = Object.values(persistentStorage_1.agents).filter((agent) => agent.companyUuid === companyUuid &&
            agent.registrationStatus === 'approved' &&
            agent.status === 'online');
    }
    else {
        // Get all online agents (for public routing)
        onlineAgents = Object.values(persistentStorage_1.agents).filter((agent) => agent.registrationStatus === 'approved' &&
            agent.status === 'online' &&
            Object.values(persistentStorage_1.companies).find((company) => company.uuid === agent.companyUuid &&
                company.status === 'approved'));
    }
    res.json({
        count: onlineAgents.length,
        agents: onlineAgents.map((agent) => ({
            uuid: agent.uuid,
            username: agent.username,
            email: agent.email,
            status: agent.status,
            companyUuid: agent.companyUuid
        }))
    });
});
// GET /api/widget/agents/:agentUuid/socket
router.get('/agents/:agentUuid/socket', (req, res) => {
    const { agentUuid } = req.params;
    const agent = persistentStorage_1.agents[agentUuid];
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    // For now, return a placeholder socketId
    // In a real implementation, you'd track socket connections
    res.json({
        agentUuid,
        socketId: null, // Placeholder - implement socket tracking later
        status: agent.status
    });
});
// POST /api/widget/calldocker-agent/create
router.post('/calldocker-agent/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, fullName, email, phone, role, skills } = req.body;
    // Validate required fields
    if (!username || !fullName || !email || !phone || !role) {
        return res.status(400).json({ error: 'Username, full name, email, phone, and role are required' });
    }
    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    // Check if username already exists for CallDocker
    const existingUser = Object.values(persistentStorage_1.users).find((u) => u.companyUuid === 'calldocker-company-uuid' && u.username === username);
    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists for CallDocker' });
    }
    // Generate password and user ID
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const userId = `cd-${Date.now()}`;
    // Create CallDocker agent user
    const newUser = {
        id: userId,
        username: username,
        fullName: fullName,
        email: email,
        phone: phone,
        role: role,
        skills: skills || ['enquiry_handling'],
        status: 'active',
        companyUuid: 'calldocker-company-uuid',
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        performance: {
            callsHandled: 0,
            avgRating: 0,
            successRate: 0
        }
    };
    // Store in users object
    persistentStorage_1.users[userId] = newUser;
    // Also store in agents for compatibility
    const agentId = `agent-${userId}`;
    persistentStorage_1.agents[agentId] = {
        uuid: userId,
        username: username,
        email: email,
        status: 'online',
        companyUuid: 'calldocker-company-uuid',
        registrationStatus: 'approved',
        createdAt: new Date().toISOString()
    };
    (0, persistentStorage_1.saveAgents)();
    console.log(`[Widget] CallDocker agent created: ${username} (${userId})`);
    res.json({
        success: true,
        message: 'CallDocker agent created successfully',
        agent: {
            id: userId,
            username: username,
            fullName: fullName,
            email: email,
            phone: phone,
            role: role,
            skills: skills || ['enquiry_handling'],
            status: 'active',
            companyUuid: 'calldocker-company-uuid',
            // Return plain text password for display
            password: password,
            createdAt: new Date().toISOString()
        }
    });
}));
// GET /api/widget/calldocker-agents - Get all CallDocker agents
router.get('/calldocker-agents', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get CallDocker agents from users object
        const callDockerAgents = Object.values(persistentStorage_1.users).filter((u) => u.companyUuid === 'calldocker-company-uuid');
        // Also get from agents for compatibility
        const tempStorageAgents = Object.values(persistentStorage_1.agents).filter((a) => a.companyUuid === 'calldocker-company-uuid');
        // Merge and format the data
        const formattedAgents = callDockerAgents.map((user) => ({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            skills: user.skills,
            performance: user.performance,
            createdAt: user.createdAt,
            companyUUID: user.companyUuid
        }));
        console.log(`[Widget] Retrieved ${formattedAgents.length} CallDocker agents`);
        res.json({
            success: true,
            agents: formattedAgents
        });
    }
    catch (error) {
        console.error('[Widget] Error fetching CallDocker agents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/widget/company-agents - Get all company agents
router.get('/company-agents', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get all non-CallDocker agents from users object
        const companyAgents = Object.values(persistentStorage_1.users).filter((u) => u.companyUuid !== 'calldocker-company-uuid');
        // Also get from agents for compatibility
        const tempStorageAgents = Object.values(persistentStorage_1.agents).filter((a) => a.companyUuid !== 'calldocker-company-uuid');
        // Merge and format the data
        const formattedAgents = companyAgents.map((user) => ({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            skills: user.skills,
            performance: user.performance,
            createdAt: user.createdAt,
            companyId: user.companyUuid,
            companyName: user.companyName || 'Unknown Company'
        }));
        console.log(`[Widget] Retrieved ${formattedAgents.length} company agents`);
        res.json({
            success: true,
            agents: formattedAgents
        });
    }
    catch (error) {
        console.error('[Widget] Error fetching company agents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/widget/calls/active - Get active calls (optionally filter by agentUuid)
router.get('/calls/active', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { agentUuid } = req.query;
        // Get active calls from calls object
        let activeCalls = Object.values(calls).filter((call) => ['waiting', 'connecting', 'active'].includes(call.status));
        if (agentUuid) {
            activeCalls = activeCalls.filter((call) => call.assignedAgent === agentUuid);
        }
        console.log(`[Widget] Retrieved ${activeCalls.length} active calls${agentUuid ? ` for agent ${agentUuid}` : ''}`);
        res.json({
            success: true,
            calls: activeCalls
        });
    }
    catch (error) {
        console.error('[Widget] Error fetching active calls:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/widget/calls/history - Get call history
router.get('/calls/history', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        // Get completed calls from calls object
        const completedCalls = Object.values(calls).flat().filter((call) => ['ended', 'missed'].includes(call.status));
        // Paginate the results
        const paginatedCalls = completedCalls.slice(offset, offset + limit);
        console.log(`[Widget] Retrieved ${paginatedCalls.length} call history records (page ${page})`);
        res.json({
            success: true,
            calls: paginatedCalls,
            total: completedCalls.length,
            page: page,
            limit: limit
        });
    }
    catch (error) {
        console.error('[Widget] Error fetching call history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/widget/calls/analytics - Get call analytics
router.get('/calls/analytics', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const period = req.query.period || '7d';
        // Calculate analytics from calls object
        const allCalls = Object.values(calls).flat();
        const totalCalls = allCalls.length;
        const completedCalls = allCalls.filter((call) => call.status === 'ended');
        const avgDuration = completedCalls.length > 0
            ? completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / completedCalls.length
            : 0;
        // Mock satisfaction and response time for now
        const satisfaction = 4.8;
        const responseTime = 45;
        console.log(`[Widget] Retrieved call analytics for period: ${period}`);
        res.json({
            success: true,
            analytics: {
                totalCalls,
                avgDuration,
                satisfaction,
                responseTime
            }
        });
    }
    catch (error) {
        console.error('[Widget] Error fetching call analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/widget/test-call (test widget functionality)
router.post('/test-call', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyUuid } = req.body;
    if (!companyUuid) {
        return res.status(400).json({ error: 'Company UUID is required' });
    }
    try {
        // Get agents for the company
        let agentList = Object.values(persistentStorage_1.users)
            .filter((u) => u.companyUuid === companyUuid && u.role === 'agent')
            .map((u) => ({
            username: u.username,
            role: u.role,
            online: !!(onlineAgents[companyUuid] && onlineAgents[companyUuid][u.username]),
        }));
        // Add agents from persistent storage (SuperAdmin-created companies)
        const globalAgents = Object.values(persistentStorage_1.users).filter((u) => u.companyUuid === companyUuid && u.role === 'agent');
        const globalAgentList = globalAgents.map((u) => ({
            username: u.username,
            role: u.role,
            online: !!(onlineAgents[companyUuid] && onlineAgents[companyUuid][u.username]),
        }));
        // Combine both lists
        const combinedAgents = [...agentList];
        const safeGlobalAgentList = Array.isArray(globalAgentList) ? globalAgentList : [];
        safeGlobalAgentList.forEach((globalAgent) => {
            if (!combinedAgents.find((agent) => agent.username === globalAgent.username)) {
                combinedAgents.push(globalAgent);
            }
        });
        // Check if any agents are online
        const onlineAgentsList = combinedAgents.filter(agent => agent.online);
        if (onlineAgentsList.length === 0) {
            return res.json({
                success: false,
                reason: 'No agents are currently online. Please ensure at least one agent is logged in to their dashboard.'
            });
        }
        // Simulate a test call being routed to a random online agent
        const randomAgent = onlineAgentsList[Math.floor(Math.random() * onlineAgentsList.length)];
        const sessionId = `test-call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Create the call object for active calls system
        const callObject = {
            id: sessionId,
            sessionId,
            companyUuid: companyUuid,
            assignedAgent: randomAgent.username,
            status: 'waiting', // This will make it appear in active calls
            type: 'test',
            startedAt: new Date().toISOString(),
            visitorInfo: {
                name: 'Test Caller',
                email: 'test@example.com',
                phone: 'Test Phone',
                pageUrl: 'Test Widget',
                userAgent: 'Test Widget'
            },
            notes: 'Test call from widget',
            tags: ['test', 'widget']
        };
        // Add to calls for active calls system
        if (!calls[companyUuid]) {
            calls[companyUuid] = [];
        }
        calls[companyUuid].unshift({
            id: sessionId,
            visitorId: `test-visitor-${Date.now()}`,
            pageUrl: 'test-page',
            status: 'waiting',
            callType: 'chat',
            priority: 'normal',
            routingType: 'company',
            companyId: companyUuid,
            sessionId,
            startTime: new Date().toISOString()
        });
        // Log the test call in the call logs
        if (!calls[companyUuid])
            calls[companyUuid] = [];
        calls[companyUuid].unshift({
            time: new Date().toISOString(),
            agent: randomAgent.username,
            notes: 'Test call from widget',
            disposition: 'test',
            duration: '0:00',
            sessionId,
            tags: ['test', 'widget'],
        });
        console.log(`[Widget] Test call created: ${sessionId} assigned to agent ${randomAgent.username}`);
        res.json({
            success: true,
            message: `Test call sent to agent ${randomAgent.username}`,
            sessionId,
            agent: randomAgent.username,
            callId: sessionId
        });
    }
    catch (error) {
        console.error('Error processing test call:', error);
        res.status(500).json({ error: 'Failed to process test call' });
    }
}));
// POST /api/agent/register - Public agent registration requiring Super Admin approval
router.post('/agent/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email, companyUuid } = req.body;
    // Validate all required fields
    if (![username, password, email, companyUuid].every((v) => validateString(v))) {
        return res.status(400).json({ error: 'All fields required' });
    }
    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    // Validate password strength
    if (!isStrongPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
    }
    // Check if company exists and is approved
    const company = persistentStorage_1.companies[companyUuid];
    if (!company) {
        return res.status(400).json({ error: 'Company not found' });
    }
    if (company.status !== 'approved') {
        return res.status(400).json({ error: 'Company is not approved yet' });
    }
    // Check if agent already exists
    const existingAgent = Object.values(persistentStorage_1.agents).find((a) => a.username === username && a.companyUuid === companyUuid);
    if (existingAgent) {
        return res.status(400).json({ error: 'Agent with this username already exists for this company' });
    }
    // Generate UUID
    const uuid = (0, uuid_1.v4)();
    // Store agent with pending status in persistent storage
    persistentStorage_1.agents[uuid] = {
        uuid,
        companyUuid,
        username,
        email,
        status: 'offline',
        registrationStatus: 'pending', // Set status to pending for Super Admin approval
        createdAt: new Date().toISOString()
    };
    (0, persistentStorage_1.saveAgents)();
    // Store agent credentials for later use (when approved)
    pendingAgentCredentials.push({
        uuid,
        username,
        password, // This should be hashed in production
        email,
        companyUuid,
        createdAt: new Date().toISOString()
    });
    res.json({
        message: 'Agent registration submitted successfully! Your account will be reviewed by our team and you will be notified once approved.',
        uuid,
        email,
        requiresApproval: true
    });
}));
// Add debug logging for form push
router.post('/form-push', (req, res) => {
    const { companyId, sessionId, from, type, fields } = req.body;
    console.log('[form-push] Request:', req.body);
    // ... existing form creation logic ...
    // Emit to widget socket
    const io = req.app.get('io');
    const onlineWidgets = global.onlineWidgets || {};
    let widgetSocketId;
    if (onlineWidgets[companyId] && onlineWidgets[companyId][sessionId]) {
        widgetSocketId = onlineWidgets[companyId][sessionId].socketId;
    }
    console.log('[form-push] Widget socketId lookup:', { companyId, sessionId, widgetSocketId });
    if (io && widgetSocketId) {
        io.to(widgetSocketId).emit('form-push', { sessionId, type, fields });
        console.log('[form-push] Emitted form-push to widget:', widgetSocketId);
    }
    else {
        console.log('[form-push] No socketId found for widget:', companyId, sessionId);
    }
    res.json({ success: true });
});
exports.default = router;
