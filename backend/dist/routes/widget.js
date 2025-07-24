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
const express_1 = require("express");
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const tempDB_1 = require("../data/tempDB");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-prod';
// Password strength regex (min 8 chars, 1 upper, 1 lower, 1 number)
function isStrongPassword(pw) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(pw);
}
const corsOrigin = process.env.CORS_ORIGIN || '*';
router.use((0, cors_1.default)({ origin: corsOrigin }));
// Rate limiter: 5 requests per minute per IP
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'Too many requests, please try again later.' },
});
function validateString(val, min = 1) {
    return typeof val === 'string' && val.length >= min;
}
function authMiddleware(req, res, next) {
    var _a;
    const token = req.body.token || ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
    if (!token)
        return res.status(401).json({ error: 'No token provided' });
    try {
        req.user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        next();
    }
    catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
}
// POST /api/company/register
router.post('/company/register', authLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyName, adminUsername, adminPassword, email } = req.body;
    if (![companyName, adminUsername, adminPassword, email].every((v) => validateString(v))) {
        return res.status(400).json({ error: 'All fields required' });
    }
    if (!isStrongPassword(adminPassword)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
    }
    const existing = Object.values(tempDB_1.companies).find((c) => c.email === email);
    if (existing)
        return res.status(400).json({ error: 'Company already exists' });
    const uuid = (0, uuid_1.v4)();
    tempDB_1.companies[uuid] = { uuid, companyName, email, createdAt: new Date().toISOString() };
    const hashed = yield bcryptjs_1.default.hash(adminPassword, 10);
    tempDB_1.users[adminUsername + '@' + uuid] = {
        username: adminUsername,
        password: hashed,
        companyUuid: uuid,
        role: 'admin',
    };
    const token = jsonwebtoken_1.default.sign({ username: adminUsername, companyUuid: uuid, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ uuid, token });
}));
// POST /api/auth/login
router.post('/auth/login', authLimiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyUuid, username, password, role } = req.body;
    if (![companyUuid, username, password, role].every((v) => validateString(v))) {
        return res.status(400).json({ error: 'All fields required' });
    }
    const user = (0, tempDB_1.findUserByCompanyAndRole)(companyUuid, username, role);
    if (!user || !(yield bcryptjs_1.default.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jsonwebtoken_1.default.sign({ username, companyUuid, role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
}));
// POST /api/agent/add (admin only, protected)
router.post('/agent/add', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { agentUsername, agentPassword } = req.body;
    if (!validateString(agentUsername) || !validateString(agentPassword)) {
        return res.status(400).json({ error: 'All fields required' });
    }
    if (!isStrongPassword(agentPassword)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
    }
    const decoded = req.user;
    if (decoded.role !== 'admin')
        return res.status(403).json({ error: 'Forbidden' });
    const key = agentUsername + '@' + decoded.companyUuid;
    if (tempDB_1.users[key])
        return res.status(400).json({ error: 'Agent already exists' });
    const hashed = yield bcryptjs_1.default.hash(agentPassword, 10);
    tempDB_1.users[key] = {
        username: agentUsername,
        password: hashed,
        companyUuid: decoded.companyUuid,
        role: 'agent',
    };
    res.json({ success: true });
}));
// POST /api/widget/register
router.post('/register', (req, res) => {
    const { companyName, email } = req.body;
    if (!companyName || !email) {
        return res.status(400).json({ error: 'companyName and email are required' });
    }
    // Check if company already exists (by email)
    const existing = Object.values(tempDB_1.companies).find((c) => c.email === email);
    if (existing) {
        return res.json({ uuid: existing.uuid });
    }
    const uuid = (0, uuid_1.v4)();
    tempDB_1.companies[uuid] = { uuid, companyName, email, createdAt: new Date().toISOString() };
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
    if (!tempDB_1.calls[companyUuid])
        tempDB_1.calls[companyUuid] = [];
    tempDB_1.calls[companyUuid].unshift({
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
    res.json(tempDB_1.calls[companyUuid] || []);
});
// GET /api/agents/:companyUuid (list all agents for a company with online status)
router.get('/agents/:companyUuid', (req, res) => {
    const { companyUuid } = req.params;
    const agentList = Object.values(tempDB_1.users)
        .filter((u) => u.companyUuid === companyUuid && u.role === 'agent')
        .map((u) => ({
        username: u.username,
        role: u.role,
        online: !!(tempDB_1.agents[companyUuid] && tempDB_1.agents[companyUuid][u.username]),
    }));
    res.json(agentList);
});
// PATCH /api/agent/:companyUuid/:username (update agent role/active)
router.patch('/agent/:companyUuid/:username', (req, res) => {
    const { companyUuid, username } = req.params;
    const { role, active } = req.body;
    const key = username + '@' + companyUuid;
    if (!tempDB_1.users[key])
        return res.status(404).json({ error: 'Agent not found' });
    if (role)
        tempDB_1.users[key].role = role;
    if (typeof active === 'boolean')
        tempDB_1.users[key].active = active;
    res.json({ success: true, user: tempDB_1.users[key] });
});
// DELETE /api/agent/:companyUuid/:username (remove agent)
router.delete('/agent/:companyUuid/:username', (req, res) => {
    const { companyUuid, username } = req.params;
    const key = username + '@' + companyUuid;
    if (!tempDB_1.users[key])
        return res.status(404).json({ error: 'Agent not found' });
    delete tempDB_1.users[key];
    res.json({ success: true });
});
// GET /api/widget/settings/:companyUuid
router.get('/settings/:companyUuid', (req, res) => {
    const { companyUuid } = req.params;
    const settings = tempDB_1.widgetSettings[companyUuid] || {
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
    tempDB_1.widgetSettings[companyUuid] = { text, color, shape, img, position, animation, dark: !!dark };
    res.json({ success: true, settings: tempDB_1.widgetSettings[companyUuid] });
});
// GET /api/widget/ivr/:companyUuid
router.get('/ivr/:companyUuid', (req, res) => {
    const { companyUuid } = req.params;
    const config = tempDB_1.ivrConfigs[companyUuid] || {
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
    tempDB_1.ivrConfigs[companyUuid] = { steps };
    res.json({ success: true, config: tempDB_1.ivrConfigs[companyUuid] });
});
exports.default = router;
