import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import widgetRoutes from './routes/widget';
import { registerSignalingHandlers } from './sockets/signaling';
import dotenv from 'dotenv';
import { chatSessions } from './data/tempDB';
import mongoose from 'mongoose';
import CannedResponse from './models/CannedResponse';
import ChatSession from './models/ChatSession';
import ChatNote from './models/ChatNote';
import ChatMessage from './models/ChatMessage';
import FormPush from './models/FormPush';
import FormResponse from './models/FormResponse';

dotenv.config();

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/widget', widgetRoutes);

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
  if (!chatSessions[sessionId]) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  chatSessions[sessionId].messages.push(msg);
  // Broadcast to all in session via Socket.IO
  io.to(sessionId).emit('chat:message', { ...msg, sessionId });
  res.json({ success: true });
});

app.get('/api/chat/session/:id', (req, res) => {
  const sessionId = req.params.id;
  if (!chatSessions[sessionId]) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({ success: true, session: chatSessions[sessionId] });
});

// Canned Responses API (multi-tenant) - Using temporary storage
app.get('/api/canned-responses', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    
    const responses = tempStorage.cannedResponses.filter(r => r.companyId === companyId);
    res.json(responses);
  } catch (error) {
    console.error('Error fetching canned responses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/canned-responses', async (req, res) => {
  try {
    const { companyId, category, title, message } = req.body;
    if (!companyId || !category || !title || !message) return res.status(400).json({ error: 'All fields required' });
    
    const response = {
      _id: generateId(),
      companyId,
      category,
      title,
      message,
      createdAt: new Date().toISOString()
    };
    
    tempStorage.cannedResponses.push(response);
    res.json(response);
  } catch (error) {
    console.error('Error creating canned response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/canned-responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, message } = req.body;
    
    const responseIndex = tempStorage.cannedResponses.findIndex(r => r._id === id);
    if (responseIndex === -1) return res.status(404).json({ error: 'Not found' });
    
    tempStorage.cannedResponses[responseIndex] = {
      ...tempStorage.cannedResponses[responseIndex],
      category,
      title,
      message,
      updatedAt: new Date().toISOString()
    };
    
    res.json(tempStorage.cannedResponses[responseIndex]);
  } catch (error) {
    console.error('Error updating canned response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/canned-responses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const responseIndex = tempStorage.cannedResponses.findIndex(r => r._id === id);
    if (responseIndex === -1) return res.status(404).json({ error: 'Not found' });
    
    tempStorage.cannedResponses.splice(responseIndex, 1);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting canned response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat Sessions API (multi-tenant) - Using temporary storage
app.get('/api/chat-sessions', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    
    const sessions = tempStorage.chatSessions.filter(s => s.companyId === companyId);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat-sessions', async (req, res) => {
  try {
    const { companyId, sessionId, visitorId, pageUrl, startedAt } = req.body;
    if (!companyId || !sessionId || !visitorId) return res.status(400).json({ error: 'companyId, sessionId, visitorId required' });
    
    const session = {
      _id: generateId(),
      companyId,
      sessionId,
      visitorId,
      pageUrl: pageUrl || '',
      startedAt: startedAt || new Date().toISOString(),
      status: 'active'
    };
    
    tempStorage.chatSessions.push(session);
    res.json(session);
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/chat-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    
    const sessionIndex = tempStorage.chatSessions.findIndex(s => s._id === id);
    if (sessionIndex === -1) return res.status(404).json({ error: 'Not found' });
    
    tempStorage.chatSessions[sessionIndex] = {
      ...tempStorage.chatSessions[sessionIndex],
      ...update,
      updatedAt: new Date().toISOString()
    };
    
    res.json(tempStorage.chatSessions[sessionIndex]);
  } catch (error) {
    console.error('Error updating chat session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/chat-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = tempStorage.chatSessions.find(s => s._id === id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat Notes API (multi-tenant) - Using temporary storage
app.get('/api/chat-notes/:sessionId', async (req, res) => {
  try {
    const { companyId } = req.query;
    const { sessionId } = req.params;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    
    const notes = tempStorage.chatNotes.filter(n => n.companyId === companyId && n.sessionId === sessionId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching chat notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat-notes/:sessionId', async (req, res) => {
  try {
    const { companyId, author, text } = req.body;
    const { sessionId } = req.params;
    if (!companyId || !author || !text) return res.status(400).json({ error: 'companyId, author, text required' });
    
    const note = {
      _id: generateId(),
      companyId,
      sessionId,
      author,
      text,
      timestamp: new Date().toISOString()
    };
    
    tempStorage.chatNotes.push(note);
    res.json(note);
  } catch (error) {
    console.error('Error creating chat note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat Message Persistence Endpoints - Using temporary storage
app.post('/api/chat-messages', async (req, res) => {
  try {
    const { companyId, sessionId, from, message, timestamp } = req.body;
    if (!companyId || !sessionId || !from || !message) return res.status(400).json({ error: 'Missing required fields' });
    
    const msg = {
      _id: generateId(),
      companyId,
      sessionId,
      from,
      message,
      timestamp: timestamp || new Date().toISOString()
    };
    
    tempStorage.chatMessages.push(msg);
    res.json(msg);
  } catch (error) {
    console.error('Error creating chat message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/chat-messages', async (req, res) => {
  try {
    const { companyId, sessionId } = req.query;
    if (!companyId || !sessionId) return res.status(400).json({ error: 'companyId and sessionId required' });
    
    const messages = tempStorage.chatMessages
      .filter(m => m.companyId === companyId && m.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Form Push Endpoints ---
app.post('/api/form-push', async (req, res) => {
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

    tempStorage.formPushes.push(form);
    console.log('Form created successfully (temp storage):', form);

    // Real-time: emit to session room
    io.to(sessionId).emit('form:push', form);
    res.json(form);
  } catch (error) {
    console.error('Form push error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
});

app.get('/api/form-push', async (req, res) => {
  const { companyId, sessionId } = req.query;
  if (!companyId || !sessionId) return res.status(400).json({ error: 'companyId and sessionId required' });
  const forms = await FormPush.find({ companyId, sessionId, active: true }).sort({ timestamp: -1 });
  res.json(forms);
});

// --- Form Response Endpoints ---
app.post('/api/form-response', async (req, res) => {
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

    tempStorage.formResponses.push(response);

    // Mark form as inactive (one-time forms)
    const formIndex = tempStorage.formPushes.findIndex(f => f._id === formId);
    if (formIndex !== -1) {
      tempStorage.formPushes[formIndex].active = false;
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

    tempStorage.chatMessages.push(formMessage);

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
        existingContact = tempStorage.contacts.find(c => c.companyId === companyId && c.email === email);
      }
      if (!existingContact && phone) {
        existingContact = tempStorage.contacts.find(c => c.companyId === companyId && c.phone === phone);
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
          type: 'form' as const,
          sessionId,
          timestamp: new Date().toISOString(),
          status: 'completed'
        });

        contactCreated = existingContact;
        console.log('Contact updated from form submission:', existingContact);
      } else {
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
            type: 'form' as const,
            sessionId,
            timestamp: new Date().toISOString(),
            status: 'completed'
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        tempStorage.contacts.push(contact);
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
    res.json({
      ...response,
      contactCreated
    });
  } catch (error) {
    console.error('Form response error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/form-response', async (req, res) => {
  const { companyId, sessionId } = req.query;
  if (!companyId || !sessionId) return res.status(400).json({ error: 'companyId and sessionId required' });

  try {
    // Use temporary storage instead of MongoDB
    const responses = tempStorage.formResponses
      .filter(r => r.companyId === companyId && r.sessionId === sessionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(responses);
  } catch (error) {
    console.error('Error fetching form responses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Agents API Endpoint ---
app.get('/api/agents/:companyUuid', async (req, res) => {
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
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MongoDB connection (commented out to use temporary storage)
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/calldocker';
// mongoose.connect(MONGODB_URI)
// .then(() => console.log('MongoDB connected'))
// .catch(err => {
//   console.error('MongoDB connection error:', err);
//   console.log('Trying to continue without MongoDB...');
// });
console.log('Using temporary in-memory storage for development');

// Temporary storage interface
interface TempStorage {
  formPushes: Array<{
    _id: string;
    companyId: string;
    sessionId: string;
    from: string;
    type: string;
    fields: any[];
    active: boolean;
    timestamp: string;
  }>;
  formResponses: Array<{
    _id: string;
    companyId: string;
    sessionId: string;
    formId: string;
    from: string;
    values: any;
    timestamp: string;
  }>;
  chatMessages: Array<{
    _id: string;
    companyId: string;
    sessionId: string;
    message: string;
    from: string;
    timestamp: string;
    type?: string;
  }>;
  chatSessions: Array<{
    _id: string;
    companyId: string;
    sessionId: string;
    visitorId: string;
    pageUrl: string;
    startedAt: string;
    status: string;
    updatedAt?: string;
  }>;
  cannedResponses: any[];
  chatNotes: any[];
  contacts: Array<{
    _id: string;
    companyId: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    tags: string[];
    notes: Array<{
      _id: string;
      content: string;
      agentId: string;
      timestamp: string;
    }>;
    interactions: Array<{
      _id: string;
      type: 'call' | 'chat' | 'form';
      sessionId: string;
      timestamp: string;
      duration?: number;
      status: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Initialize temporary storage with sample data
const tempStorage: TempStorage = {
  formPushes: [],
  formResponses: [],
  chatMessages: [],
  chatSessions: [
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      sessionId: 'chat-001',
      visitorId: 'visitor-001',
      pageUrl: 'https://example.com/products',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'active'
    },
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      sessionId: 'chat-002',
      visitorId: 'visitor-002',
      pageUrl: 'https://example.com/support',
      startedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'active'
    },
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      sessionId: 'chat-003',
      visitorId: 'visitor-003',
      pageUrl: 'https://example.com/pricing',
      startedAt: new Date(Date.now() - 1800000).toISOString(),
      status: 'active'
    }
  ],
  cannedResponses: [
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      category: 'Greetings',
      title: 'Welcome Message',
      message: 'Hello! Welcome to our support team. How can I assist you today?',
      createdAt: new Date().toISOString()
    },
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      category: 'Greetings',
      title: 'Thank You',
      message: 'Thank you for contacting us! Is there anything else I can help you with?',
      createdAt: new Date().toISOString()
    },
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      category: 'Technical',
      title: 'Password Reset',
      message: 'I can help you reset your password. Please check your email for the reset link.',
      createdAt: new Date().toISOString()
    },
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      category: 'Sales',
      title: 'Pricing Information',
      message: 'Our pricing starts at $29/month. Would you like me to send you our detailed pricing guide?',
      createdAt: new Date().toISOString()
    }
  ],
  chatNotes: [
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      sessionId: 'chat-001',
      author: 'admin',
      text: 'Customer seems interested in our premium plan',
      timestamp: new Date(Date.now() - 3000000).toISOString()
    },
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      sessionId: 'chat-002',
      author: 'admin',
      text: 'Technical issue with login - escalated to dev team',
      timestamp: new Date(Date.now() - 6000000).toISOString()
    }
  ],
  contacts: [
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      company: 'Tech Corp',
      tags: ['premium', 'interested'],
      notes: [
        {
          _id: generateId(),
          content: 'Interested in enterprise plan',
          agentId: 'admin',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      interactions: [
        {
          _id: generateId(),
          type: 'chat',
          sessionId: 'chat-001',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed'
        }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      _id: generateId(),
      companyId: 'demo-company-001',
      email: 'jane.smith@acme.com',
      firstName: 'Jane',
      lastName: 'Smith',
      company: 'Acme Inc',
      tags: ['support', 'technical'],
      notes: [
        {
          _id: generateId(),
          content: 'Has recurring login issues',
          agentId: 'admin',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      interactions: [
        {
          _id: generateId(),
          type: 'chat',
          sessionId: 'chat-002',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'completed'
        }
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    }
  ]
};

// Make tempStorage globally accessible for socket handlers
(global as any).tempStorage = tempStorage;

// --- Chat Sessions API Endpoint ---
app.post('/api/chat-sessions', async (req, res) => {
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

    tempStorage.chatSessions.push(session);
    console.log('Chat session created successfully (temp storage):', session);
    res.json(session);
  } catch (error) {
    console.error('Chat session creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/chat-sessions', async (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'companyId required' });

  try {
    // Use temporary storage instead of MongoDB
    const sessions = tempStorage.chatSessions
      .filter(s => s.companyId === companyId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Chat Messages API Endpoint ---
app.post('/api/chat-messages', async (req, res) => {
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

    tempStorage.chatMessages.push(chatMessage);
    console.log('Chat message created successfully (temp storage):', chatMessage);
    res.json(chatMessage);
  } catch (error) {
    console.error('Chat message creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/chat-messages', async (req, res) => {
  const { companyId, sessionId } = req.query;
  if (!companyId || !sessionId) return res.status(400).json({ error: 'companyId and sessionId required' });

  try {
    // Use temporary storage instead of MongoDB
    const messages = tempStorage.chatMessages
      .filter(m => m.companyId === companyId && m.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- CRM Contact Management API Endpoints ---

// Create or update contact
app.post('/api/contacts', async (req, res) => {
  try {
    const { companyId, email, phone, firstName, lastName, company } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    // Check if contact already exists by email or phone
    let existingContact = null;
    if (email) {
      existingContact = tempStorage.contacts.find(c => c.companyId === companyId && c.email === email);
    }
    if (!existingContact && phone) {
      existingContact = tempStorage.contacts.find(c => c.companyId === companyId && c.phone === phone);
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
    } else {
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

      tempStorage.contacts.push(contact);
      console.log('Contact created successfully (temp storage):', contact);
      res.json(contact);
    }
  } catch (error) {
    console.error('Contact creation/update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all contacts for a company
app.get('/api/contacts', async (req, res) => {
  const { companyId, search } = req.query;
  
  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' });
  }

  try {
    let contacts = tempStorage.contacts.filter(c => c.companyId === companyId);

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toString().toLowerCase();
      contacts = contacts.filter(c => 
        (c.email && c.email.toLowerCase().includes(searchLower)) ||
        (c.phone && c.phone.includes(search.toString())) ||
        (c.firstName && c.firstName.toLowerCase().includes(searchLower)) ||
        (c.lastName && c.lastName.toLowerCase().includes(searchLower)) ||
        (c.company && c.company.toLowerCase().includes(searchLower))
      );
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
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific contact
app.get('/api/contacts/:contactId', async (req, res) => {
  const { contactId } = req.params;
  const { companyId } = req.query;

  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' });
  }

  try {
    const contact = tempStorage.contacts.find(c => c._id === contactId && c.companyId === companyId);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add note to contact
app.post('/api/contacts/:contactId/notes', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { companyId, content, agentId } = req.body;

    if (!companyId || !content || !agentId) {
      return res.status(400).json({ error: 'companyId, content, and agentId are required' });
    }

    const contact = tempStorage.contacts.find(c => c._id === contactId && c.companyId === companyId);
    
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
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add interaction to contact
app.post('/api/contacts/:contactId/interactions', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { companyId, type, sessionId, duration, status } = req.body;

    if (!companyId || !type || !sessionId) {
      return res.status(400).json({ error: 'companyId, type, and sessionId are required' });
    }

    const contact = tempStorage.contacts.find(c => c._id === contactId && c.companyId === companyId);
    
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
  } catch (error) {
    console.error('Error adding interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contact tags
app.put('/api/contacts/:contactId/tags', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { companyId, tags } = req.body;

    if (!companyId || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'companyId and tags array are required' });
    }

    const contact = tempStorage.contacts.find(c => c._id === contactId && c.companyId === companyId);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    contact.tags = tags;
    contact.updatedAt = new Date().toISOString();

    console.log('Contact tags updated successfully:', contact.tags);
    res.json(contact);
  } catch (error) {
    console.error('Error updating contact tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

registerSignalingHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 