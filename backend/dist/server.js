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
exports.generateId = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const widget_1 = __importDefault(require("./routes/widget"));
const superAdmin_1 = __importDefault(require("./routes/superAdmin"));
const signaling_1 = require("./sockets/signaling");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path")); // Added for serving static files
const persistentStorage_1 = require("./data/persistentStorage");
dotenv_1.default.config();
// MongoDB connection (commented out to use temporary storage)
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/calldocker';
// mongoose.connect(MONGODB_URI)
// .then(() => console.log('MongoDB connected'))
// .catch(err => {
//   console.error('MongoDB connection error:', err);
//   console.log('Trying to continue without MongoDB...');
// });
console.log('Using persistent storage for data');
global.tempStorage = {
    callQueue: {},
    calls: {},
    chatSessions: {},
    sessions: [],
    companies: [],
    agents: [],
    users: [],
    pendingAdmins: [],
    pendingAgentCredentials: [],
    contactMessages: [],
    authUsers: []
};
// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
exports.generateId = generateId;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
// Expose io on app for use in routes
app.set('io', io);
// CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'https://calldocker.netlify.app',
        'https://callcenterdock.onrender.com',
        'https://*.netlify.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use('/api/widget', widget_1.default);
app.use('/api/super-admin', superAdmin_1.default);
app.get('/test', (req, res) => res.send('Test OK'));
// --- Chat REST Endpoints (MVP, placeholder) ---
app.post('/api/chat/send', (req, res) => {
    const { sessionId, message, from } = req.body;
    if (!sessionId || !message || !from) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const msg = {
        message,
        from,
        timestamp: new Date().toISOString(),
    };
    if (!persistentStorage.chatSessions[sessionId]) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    persistentStorage.chatSessions[sessionId].messages.push(msg);
    // Broadcast to all in session via Socket.IO
    io.to(sessionId).emit('chat:message', Object.assign(Object.assign({}, msg), { sessionId }));
    res.json({ success: true });
});
app.get('/api/chat/session/:id', (req, res) => {
    const sessionId = req.params.id;
    if (!persistentStorage.chatSessions[sessionId]) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, session: persistentStorage.chatSessions[sessionId] });
});
// Canned Responses API (multi-tenant) - Using persistent storage
app.get('/api/canned-responses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const responses = persistentStorage.cannedResponses.filter(r => r.companyId === companyId);
        res.json(responses);
    }
    catch (error) {
        console.error('Error fetching canned responses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/api/canned-responses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId, category, title, message } = req.body;
        if (!companyId || !category || !title || !message)
            return res.status(400).json({ error: 'All fields required' });
        const response = {
            _id: generateId(),
            companyId,
            category,
            title,
            message,
            createdAt: new Date().toISOString()
        };
        persistentStorage.cannedResponses.push(response);
        res.json(response);
    }
    catch (error) {
        console.error('Error creating canned response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.put('/api/canned-responses/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { category, title, message } = req.body;
        const responseIndex = persistentStorage.cannedResponses.findIndex(r => r._id === id);
        if (responseIndex === -1)
            return res.status(404).json({ error: 'Not found' });
        persistentStorage.cannedResponses[responseIndex] = Object.assign(Object.assign({}, persistentStorage.cannedResponses[responseIndex]), { category,
            title,
            message, updatedAt: new Date().toISOString() });
        res.json(persistentStorage.cannedResponses[responseIndex]);
    }
    catch (error) {
        console.error('Error updating canned response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.delete('/api/canned-responses/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const responseIndex = persistentStorage.cannedResponses.findIndex(r => r._id === id);
        if (responseIndex === -1)
            return res.status(404).json({ error: 'Not found' });
        persistentStorage.cannedResponses.splice(responseIndex, 1);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting canned response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Chat Sessions API (multi-tenant) - Using persistent storage
app.get('/api/chat-sessions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const sessions = persistentStorage.chatSessions.filter((s) => s.companyId === companyId);
        res.json(sessions);
    }
    catch (error) {
        console.error('Error fetching chat sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/api/chat-sessions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId, sessionId, visitorId, pageUrl, startedAt } = req.body;
        if (!companyId || !sessionId || !visitorId)
            return res.status(400).json({ error: 'companyId, sessionId, visitorId required' });
        const session = {
            _id: generateId(),
            companyId,
            sessionId,
            visitorId,
            pageUrl: pageUrl || '',
            startedAt: startedAt || new Date().toISOString(),
            status: 'active'
        };
        persistentStorage.chatSessions.push(session);
        res.json(session);
    }
    catch (error) {
        console.error('Error creating chat session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.put('/api/chat-sessions/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const update = req.body;
        const sessionIndex = persistentStorage.chatSessions.findIndex((s) => s._id === id);
        if (sessionIndex === -1)
            return res.status(404).json({ error: 'Not found' });
        persistentStorage.chatSessions[sessionIndex] = Object.assign(Object.assign(Object.assign({}, persistentStorage.chatSessions[sessionIndex]), update), { updatedAt: new Date().toISOString() });
        res.json(persistentStorage.chatSessions[sessionIndex]);
    }
    catch (error) {
        console.error('Error updating chat session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/api/chat-sessions/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const session = persistentStorage.chatSessions.find((s) => s._id === id);
        if (!session)
            return res.status(404).json({ error: 'Not found' });
        res.json(session);
    }
    catch (error) {
        console.error('Error fetching chat session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Chat Notes API (multi-tenant) - Using persistent storage
app.get('/api/chat-notes/:sessionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId } = req.query;
        const { sessionId } = req.params;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const notes = persistentStorage.chatNotes.filter(n => n.companyId === companyId && n.sessionId === sessionId);
        res.json(notes);
    }
    catch (error) {
        console.error('Error fetching chat notes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/api/chat-notes/:sessionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId, author, text } = req.body;
        const { sessionId } = req.params;
        if (!companyId || !author || !text)
            return res.status(400).json({ error: 'companyId, author, text required' });
        const note = {
            _id: generateId(),
            companyId,
            sessionId,
            author,
            text,
            timestamp: new Date().toISOString()
        };
        persistentStorage.chatNotes.push(note);
        res.json(note);
    }
    catch (error) {
        console.error('Error creating chat note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Chat Message Persistence Endpoints - Using persistent storage
app.post('/api/chat-messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId, sessionId, from, message, timestamp } = req.body;
        if (!companyId || !sessionId || !from || !message)
            return res.status(400).json({ error: 'Missing required fields' });
        const msg = {
            _id: generateId(),
            companyId,
            sessionId,
            from,
            message,
            timestamp: timestamp || new Date().toISOString()
        };
        persistentStorage.chatMessages.push(msg);
        res.json(msg);
    }
    catch (error) {
        console.error('Error creating chat message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/api/chat-messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId, sessionId } = req.query;
        if (!companyId || !sessionId)
            return res.status(400).json({ error: 'companyId and sessionId required' });
        const messages = persistentStorage.chatMessages
            .filter(m => m.companyId === companyId && m.sessionId === sessionId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        res.json(messages);
    }
    catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// --- Form Push Endpoints ---
app.post('/api/form-push', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId, sessionId, from, type, fields } = req.body;
        console.log('Form push request:', { companyId, sessionId, from, type, fields });
        if (!companyId || !sessionId || !from || !type || !fields) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Use temporary storage instead of MongoDB
        const form = {
            _id: generateId(),
            companyId,
            sessionId,
            from,
            type,
            fields,
            active: true,
            timestamp: new Date().toISOString()
        };
        persistentStorage.formPushes.push(form);
        console.log('Form created successfully (temp storage):', form);
        // Real-time: emit to session room
        io.to(sessionId).emit('form:push', form);
        res.json(form);
    }
    catch (error) {
        console.error('Form push error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        });
    }
}));
app.get('/api/form-push', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId, sessionId } = req.query;
    if (!companyId || !sessionId)
        return res.status(400).json({ error: 'companyId and sessionId required' });
    // Use temporary storage instead of MongoDB
    const forms = persistentStorage.formPushes.filter(f => f.companyId === companyId && f.sessionId === sessionId && f.active).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(forms);
}));
// --- Form Response Endpoints ---
app.post('/api/form-response', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId, sessionId, formId, from, values } = req.body;
        if (!companyId || !sessionId || !formId || !from || !values) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Use temporary storage instead of MongoDB
        const response = {
            _id: generateId(),
            companyId,
            sessionId,
            formId,
            from,
            values,
            timestamp: new Date().toISOString()
        };
        persistentStorage.formResponses.push(response);
        // Mark form as inactive (one-time forms)
        const formIndex = persistentStorage.formPushes.findIndex(f => f._id === formId);
        if (formIndex !== -1) {
            persistentStorage.formPushes[formIndex].active = false;
        }
        // Also save as a chat message so it appears in chat history
        const formMessage = {
            _id: generateId(),
            companyId,
            sessionId,
            message: `📋 **Form Submitted**\n${Object.entries(values).map(([field, value]) => `**${field}:** ${value}`).join('\n')}`,
            from: 'visitor',
            timestamp: new Date().toISOString(),
            type: 'form-response'
        };
        persistentStorage.chatMessages.push(formMessage);
        // Auto-create/update contact if form contains email or phone
        let contactCreated = null;
        const email = values['Email Address'] || values['Email'] || values['email'];
        const phone = values['Phone Number'] || values['Phone'] || values['phone'];
        const firstName = values['Full Name'] ? values['Full Name'].split(' ')[0] : values['First Name'] || values['firstName'];
        const lastName = values['Full Name'] ? values['Full Name'].split(' ').slice(1).join(' ') : values['Last Name'] || values['lastName'];
        const company = values['Company'] || values['company'];
        if (email || phone) {
            // Check if contact already exists
            let existingContact = null;
            if (email) {
                existingContact = persistentStorage.contacts.find(c => c.companyId === companyId && c.email === email);
            }
            if (!existingContact && phone) {
                existingContact = persistentStorage.contacts.find(c => c.companyId === companyId && c.phone === phone);
            }
            if (existingContact) {
                // Update existing contact
                existingContact.firstName = firstName || existingContact.firstName;
                existingContact.lastName = lastName || existingContact.lastName;
                existingContact.company = company || existingContact.company;
                existingContact.email = email || existingContact.email;
                existingContact.phone = phone || existingContact.phone;
                existingContact.updatedAt = new Date().toISOString();
                // Add form interaction
                existingContact.interactions.push({
                    _id: generateId(),
                    type: 'form',
                    sessionId,
                    timestamp: new Date().toISOString(),
                    status: 'completed'
                });
                contactCreated = existingContact;
                console.log('Contact updated from form submission:', existingContact);
            }
            else {
                // Create new contact
                const contact = {
                    _id: generateId(),
                    companyId,
                    email,
                    phone,
                    firstName,
                    lastName,
                    company,
                    tags: [],
                    notes: [],
                    interactions: [{
                            _id: generateId(),
                            type: 'form',
                            sessionId,
                            timestamp: new Date().toISOString(),
                            status: 'completed'
                        }],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                persistentStorage.contacts.push(contact);
                contactCreated = contact;
                console.log('New contact created from form submission:', contact);
            }
        }
        console.log('Form response created successfully (temp storage):', response);
        console.log('Form message saved to chat:', formMessage);
        // Real-time: emit to session room
        io.to(sessionId).emit('form:response', response);
        io.to(sessionId).emit('chat:message', formMessage);
        // Include contact info in response if created/updated
        res.json(Object.assign(Object.assign({}, response), { contactCreated }));
    }
    catch (error) {
        console.error('Form response error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
app.get('/api/form-response', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId, sessionId } = req.query;
    if (!companyId || !sessionId)
        return res.status(400).json({ error: 'companyId and sessionId required' });
    try {
        // Use temporary storage instead of MongoDB
        const responses = persistentStorage.formResponses
            .filter(r => r.companyId === companyId && r.sessionId === sessionId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        res.json(responses);
    }
    catch (error) {
        console.error('Error fetching form responses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// --- Agents API Endpoint ---
app.get('/api/agents/:companyUuid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyUuid } = req.params;
    try {
        // For now, return a mock agent list since we don't have a proper Agent model yet
        // In production, this would query the database for agents in the company
        const mockAgents = [
            {
                id: 'agent1',
                name: 'Agent 1',
                online: true,
                companyUuid: companyUuid,
                lastSeen: new Date().toISOString()
            }
        ];
        res.json(mockAgents);
    }
    catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Use the file-based persistent storage
const persistentStorage = persistentStorage_1.persistentStorage;
// Add sample data for testing
persistentStorage.calls = [
    {
        id: 'call-001',
        visitorId: 'visitor-123',
        pageUrl: 'http://localhost:5173/',
        status: 'waiting',
        assignedAgent: 'agent-001',
        startTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        callType: 'chat',
        priority: 'normal',
        routingType: 'public',
        companyId: 'company-001',
        sessionId: 'session-001'
    },
    {
        id: 'call-002',
        visitorId: 'visitor-456',
        pageUrl: 'http://localhost:5173/demo',
        status: 'active',
        assignedAgent: 'agent-002',
        startTime: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        callType: 'chat',
        priority: 'normal',
        routingType: 'company',
        companyId: 'company-002',
        sessionId: 'session-002'
    },
    {
        id: 'call-003',
        visitorId: 'visitor-789',
        pageUrl: 'http://localhost:5173/',
        status: 'ended',
        assignedAgent: 'agent-001',
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        endTime: new Date(Date.now() - 3540000).toISOString(), // 59 minutes ago
        duration: 360, // 6 minutes
        callType: 'chat',
        priority: 'normal',
        routingType: 'public',
        companyId: 'company-001',
        sessionId: 'session-003'
    }
];
persistentStorage.agentAssignments = [
    {
        id: 'assignment-001',
        agentId: 'agent-001',
        assignedToPublic: true,
        maxCalls: 5,
        currentCalls: 1,
        skills: ['sales', 'support'],
        availability: 'available',
        lastActivity: new Date().toISOString()
    },
    {
        id: 'assignment-002',
        agentId: 'agent-002',
        assignedToPublic: false,
        maxCalls: 3,
        currentCalls: 1,
        skills: ['technical', 'billing'],
        availability: 'busy',
        lastActivity: new Date().toISOString()
    }
];
persistentStorage.callAnalytics = [
    {
        id: 'analytics-001',
        agentId: 'agent-001',
        callsHandled: 15,
        avgDuration: 420, // 7 minutes
        satisfaction: 4.5,
        responseTime: 45, // seconds
        date: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 'analytics-002',
        agentId: 'agent-002',
        callsHandled: 12,
        avgDuration: 380, // 6.3 minutes
        satisfaction: 4.8,
        responseTime: 32, // seconds
        date: new Date(Date.now() - 86400000).toISOString()
    }
];
// Add sample data for sessions
persistentStorage.sessions = [
    {
        sessionId: 'session-001',
        companyUuid: 'company-001',
        visitorId: 'visitor-123',
        agentId: 'agent-001',
        type: 'call',
        status: 'active',
        createdAt: new Date(Date.now() - 300000).toISOString(),
        startedAt: new Date(Date.now() - 300000).toISOString()
    },
    {
        sessionId: 'session-002',
        companyUuid: 'company-002',
        visitorId: 'visitor-456',
        agentId: 'agent-002',
        type: 'call',
        status: 'active',
        createdAt: new Date(Date.now() - 600000).toISOString(),
        startedAt: new Date(Date.now() - 600000).toISOString()
    },
    {
        sessionId: 'session-003',
        companyUuid: 'company-001',
        visitorId: 'visitor-789',
        agentId: 'agent-001',
        type: 'call',
        status: 'ended',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        endedAt: new Date(Date.now() - 3540000).toISOString()
    }
];
// Make persistentStorage globally accessible for socket handlers
global.persistentStorage = persistentStorage;
// --- Chat Sessions API Endpoint ---
app.post('/api/chat-sessions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId, sessionId, visitorId, pageUrl, startedAt } = req.body;
        if (!companyId || !sessionId || !visitorId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Use temporary storage instead of MongoDB
        const session = {
            _id: generateId(),
            companyId,
            sessionId,
            visitorId,
            pageUrl: pageUrl || '',
            startedAt: startedAt || new Date().toISOString(),
            status: 'active'
        };
        persistentStorage.chatSessions.push(session);
        console.log('Chat session created successfully (temp storage):', session);
        res.json(session);
    }
    catch (error) {
        console.error('Chat session creation error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
app.get('/api/chat-sessions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId } = req.query;
    if (!companyId)
        return res.status(400).json({ error: 'companyId required' });
    try {
        // Use temporary storage instead of MongoDB
        const sessions = persistentStorage.chatSessions.filter((s) => s.companyId === companyId);
        res.json(sessions);
    }
    catch (error) {
        console.error('Error fetching chat sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// --- Chat Messages API Endpoint ---
app.post('/api/chat-messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId, sessionId, message, from, timestamp } = req.body;
        if (!companyId || !sessionId || !message || !from) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Use temporary storage instead of MongoDB
        const chatMessage = {
            _id: generateId(),
            companyId,
            sessionId,
            message,
            from,
            timestamp: timestamp || new Date().toISOString()
        };
        persistentStorage.chatMessages.push(chatMessage);
        console.log('Chat message created successfully (temp storage):', chatMessage);
        res.json(chatMessage);
    }
    catch (error) {
        console.error('Chat message creation error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
app.get('/api/chat-messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId, sessionId } = req.query;
    if (!companyId || !sessionId)
        return res.status(400).json({ error: 'companyId and sessionId required' });
    try {
        // Use temporary storage instead of MongoDB
        const messages = persistentStorage.chatMessages
            .filter((m) => m.companyId === companyId && m.sessionId === sessionId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        res.json(messages);
    }
    catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// --- CRM Contact Management API Endpoints ---
// Create or update contact
app.post('/api/contacts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { companyId, email, phone, firstName, lastName, company } = req.body;
        if (!companyId) {
            return res.status(400).json({ error: 'companyId is required' });
        }
        // Check if contact already exists by email or phone
        let existingContact = null;
        if (email) {
            existingContact = persistentStorage.contacts.find(c => c.companyId === companyId && c.email === email);
        }
        if (!existingContact && phone) {
            existingContact = persistentStorage.contacts.find(c => c.companyId === companyId && c.phone === phone);
        }
        if (existingContact) {
            // Update existing contact
            existingContact.firstName = firstName || existingContact.firstName;
            existingContact.lastName = lastName || existingContact.lastName;
            existingContact.company = company || existingContact.company;
            existingContact.email = email || existingContact.email;
            existingContact.phone = phone || existingContact.phone;
            existingContact.updatedAt = new Date().toISOString();
            console.log('Contact updated successfully (temp storage):', existingContact);
            res.json(existingContact);
        }
        else {
            // Create new contact
            const contact = {
                _id: generateId(),
                companyId,
                email,
                phone,
                firstName,
                lastName,
                company,
                tags: [],
                notes: [],
                interactions: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            persistentStorage.contacts.push(contact);
            console.log('Contact created successfully (temp storage):', contact);
            res.json(contact);
        }
    }
    catch (error) {
        console.error('Contact creation/update error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// Get all contacts for a company
app.get('/api/contacts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId, search } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    try {
        let contacts = persistentStorage.contacts.filter(c => c.companyId === companyId);
        // Apply search filter if provided
        if (search) {
            const searchLower = search.toString().toLowerCase();
            contacts = contacts.filter(c => (c.email && c.email.toLowerCase().includes(searchLower)) ||
                (c.phone && c.phone.includes(search.toString())) ||
                (c.firstName && c.firstName.toLowerCase().includes(searchLower)) ||
                (c.lastName && c.lastName.toLowerCase().includes(searchLower)) ||
                (c.company && c.company.toLowerCase().includes(searchLower)));
        }
        // Sort by most recent interaction
        contacts.sort((a, b) => {
            const aLastInteraction = a.interactions.length > 0 ?
                Math.max(...a.interactions.map(i => new Date(i.timestamp).getTime())) : 0;
            const bLastInteraction = b.interactions.length > 0 ?
                Math.max(...b.interactions.map(i => new Date(i.timestamp).getTime())) : 0;
            return bLastInteraction - aLastInteraction;
        });
        res.json(contacts);
    }
    catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get specific contact
app.get('/api/contacts/:contactId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { contactId } = req.params;
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    try {
        const contact = persistentStorage.contacts.find(c => c._id === contactId && c.companyId === companyId);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    }
    catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Add note to contact
app.post('/api/contacts/:contactId/notes', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contactId } = req.params;
        const { companyId, content, agentId } = req.body;
        if (!companyId || !content || !agentId) {
            return res.status(400).json({ error: 'companyId, content, and agentId are required' });
        }
        const contact = persistentStorage.contacts.find(c => c._id === contactId && c.companyId === companyId);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        const note = {
            _id: generateId(),
            content,
            agentId,
            timestamp: new Date().toISOString()
        };
        contact.notes.push(note);
        contact.updatedAt = new Date().toISOString();
        console.log('Note added to contact successfully:', note);
        res.json(note);
    }
    catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Add interaction to contact
app.post('/api/contacts/:contactId/interactions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contactId } = req.params;
        const { companyId, type, sessionId, duration, status } = req.body;
        if (!companyId || !type || !sessionId) {
            return res.status(400).json({ error: 'companyId, type, and sessionId are required' });
        }
        const contact = persistentStorage.contacts.find(c => c._id === contactId && c.companyId === companyId);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        const interaction = {
            _id: generateId(),
            type,
            sessionId,
            timestamp: new Date().toISOString(),
            duration,
            status: status || 'completed'
        };
        contact.interactions.push(interaction);
        contact.updatedAt = new Date().toISOString();
        console.log('Interaction added to contact successfully:', interaction);
        res.json(interaction);
    }
    catch (error) {
        console.error('Error adding interaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Update contact tags
app.put('/api/contacts/:contactId/tags', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contactId } = req.params;
        const { companyId, tags } = req.body;
        if (!companyId || !Array.isArray(tags)) {
            return res.status(400).json({ error: 'companyId and tags array are required' });
        }
        const contact = persistentStorage.contacts.find(c => c._id === contactId && c.companyId === companyId);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        contact.tags = tags;
        contact.updatedAt = new Date().toISOString();
        console.log('Contact tags updated successfully:', contact.tags);
        res.json(contact);
    }
    catch (error) {
        console.error('Error updating contact tags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
(0, signaling_1.registerSignalingHandlers)(io);
// Make io instance available to routes
app.set('io', io);
// Serve widget files
app.get('/widget.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path_1.default.join(__dirname, '../../../frontend/widget/widget.js'));
});
app.get('/widget-config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path_1.default.join(__dirname, '../../../frontend/widget/widget-config.js'));
});
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
