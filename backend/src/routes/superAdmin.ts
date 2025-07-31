import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Simple in-memory storage with file persistence
const DATA_DIR = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'data')
  : path.join(__dirname, '../../data');

const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

// Ensure data directory exists
function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`📁 Created data directory: ${DATA_DIR}`);
    }
  } catch (error) {
    console.error(`❌ Error creating data directory: ${error}`);
    return false;
  }
  return true;
}

// Helper functions for file operations
function readJsonFile(filePath: string, defaultValue: any = {}): any {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

function writeJsonFile(filePath: string, data: any): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved data to: ${filePath}`);
  } catch (error) {
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
function saveCompanies(): void {
  console.log(`💾 Saving ${Object.keys(companies).length} companies...`);
  writeJsonFile(COMPANIES_FILE, companies);
}

function saveUsers(): void {
  console.log(`💾 Saving ${Object.keys(users).length} users...`);
  writeJsonFile(USERS_FILE, users);
}

function saveAgents(): void {
  console.log(`💾 Saving ${Object.keys(agents).length} agents...`);
  writeJsonFile(AGENTS_FILE, agents);
}

// Helper functions
function findUserByCompanyAndRole(companyUuid: string, username: string, role: string) {
  return Object.values(users).find(
    (u: any) => u.companyUuid === companyUuid && u.username === username && u.role === role
  );
}

function findCompanyByEmail(email: string) {
  return Object.values(companies).find((c: any) => c.email === email);
}

// In-memory storage for temporary data
const pendingAdmins: any[] = [];
const pendingAgentCredentials: any[] = [];
const contactMessages: any[] = [];

const router = express.Router();

// Super Admin authentication middleware
const authenticateSuperAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // Check if the user is a super admin
    if (decoded.role !== 'super-admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    
    req.superAdmin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Super Admin login
router.post('/login', async (req, res) => {
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

    const isValidPassword = await bcrypt.compare(password, superAdminCredentials.password);
    console.log('Password validation result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        username: superAdminCredentials.username, 
        role: superAdminCredentials.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Super Admin login successful for user:', username);

    res.json({
      token,
      user: {
        username: superAdminCredentials.username,
        role: superAdminCredentials.role
      }
    });

  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all accounts (protected)
router.get('/accounts', authenticateSuperAdmin, (req, res) => {
  try {
    // Transform existing companies data to match the expected format
    const accounts = Object.values(companies).map((company: any) => ({
      id: company.uuid,
      companyName: company.name,
      email: company.email,
      status: company.suspended ? 'suspended' : (company.verified ? 'active' : 'pending'),
      createdAt: company.createdAt || new Date().toISOString(),
      lastLogin: company.lastLogin || new Date().toISOString(),
      subscription: 'pro', // Default subscription
      agents: Object.values(agents).filter((agent: any) => agent.companyUuid === company.uuid).length,
      calls: 0, // This would be calculated from call logs
      revenue: Math.floor(Math.random() * 5000) + 1000 // Mock revenue data
    }));

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get raw companies data (for debugging)
router.get('/companies', (req, res) => {
  try {
    console.log('Companies data requested:', companies);
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get raw users data (for debugging)
router.get('/users', (req, res) => {
  try {
    console.log('Users data requested:', users);
    res.json(users);
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system analytics
router.get('/analytics', authenticateSuperAdmin, (req, res) => {
  try {
    const analytics = {
      totalAccounts: Object.keys(companies).length,
      activeAccounts: Object.values(companies).filter((c: any) => c.verified && !c.suspended).length,
      suspendedAccounts: Object.values(companies).filter((c: any) => c.suspended).length,
      pendingAccounts: Object.values(companies).filter((c: any) => !c.verified).length,
      totalAgents: Object.keys(agents).length,
      totalRevenue: Object.keys(companies).length * 2500, // Mock calculation
      systemHealth: {
        backend: 'online',
        database: 'connected',
        emailService: 'configured'
      }
    };

    res.json(analytics);
  } catch (error) {
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
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Content Management Routes
router.get('/content/blog-posts', authenticateSuperAdmin, (req, res) => {
  try {
    const posts: any[] = []; // This would be loaded from persistent storage
    res.json({ posts });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/content/blog-posts', authenticateSuperAdmin, (req, res) => {
  try {
    const post = {
      id: `post-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ post });
  } catch (error) {
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
  } catch (error) {
    console.error('Get frontpage content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/content/frontpage', authenticateSuperAdmin, (req, res) => {
  try {
    const content = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({ content });
  } catch (error) {
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
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/packages', authenticateSuperAdmin, (req, res) => {
  try {
    const pkg = {
      id: `pkg-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };

    res.json({ package: pkg });
  } catch (error) {
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
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/support/tickets', authenticateSuperAdmin, (req, res) => {
  try {
    const ticket = {
      id: `TICKET-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    res.json({ ticket });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/system/config', authenticateSuperAdmin, (req, res) => {
  try {
    const config = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({ config });
  } catch (error) {
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
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users', authenticateSuperAdmin, (req, res) => {
  try {
    const user = {
      id: `user-${Date.now()}`,
      ...req.body,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    res.json({ user });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Super Admin: Pending Registrations ---

// GET /api/superadmin/pending-registrations
router.get('/pending-registrations', (req, res) => {
  const pendingCompanies = Object.values(companies).filter((c: any) => c.status === 'pending');
  const pendingAgents = Object.values(agents).filter((a: any) => a.status === 'pending');
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
      const pendingAdmin = pendingAdmins.find((pa: any) => pa.uuid === id);
      if (pendingAdmin) {
        // In a real application, you'd hash the password here
        const hashedPassword = pendingAdmin.adminPassword; // This should be bcrypt.hash() in production
        
        // Add to users array
        const adminUser = {
          uuid: uuidv4(),
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
        const index = pendingAdmins.findIndex((pa: any) => pa.uuid === id);
        if (index > -1) {
          pendingAdmins.splice(index, 1);
        }
      }
      
      return res.json({ success: true, message: 'Company approved successfully' });
    }
  } else if (type === 'agent') {
    const agent = agents[id];
    if (agent) {
      agent.registrationStatus = 'approved';
      agent.status = 'offline'; // Set initial status to offline
      saveAgents();
      
      // Create agent user from pending agent credentials
      const pendingAgentCred = pendingAgentCredentials.find((pac: any) => pac.uuid === id);
      if (pendingAgentCred) {
        // In a real application, you'd hash the password here
        const hashedPassword = pendingAgentCred.password; // This should be bcrypt.hash() in production
        
        // Add to users array
        const agentUser = {
          uuid: uuidv4(),
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
        const index = pendingAgentCredentials.findIndex((pac: any) => pac.uuid === id);
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
  } else if (type === 'agent') {
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
  const msg = contactMessages.find((m: any) => m._id === id);
  if (msg) {
    msg.handled = true;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Message not found' });
  }
});

// ===== CALL MANAGEMENT ENDPOINTS =====

// Get active calls
router.get('/calls/active', authenticateSuperAdmin, (req, res) => {
  try {
    const activeCalls: any[] = []; // This would be loaded from persistent storage
    res.json({
      success: true,
      calls: activeCalls,
      count: activeCalls.length
    });
  } catch (error) {
    console.error('Error fetching active calls:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get call history
router.get('/calls/history', authenticateSuperAdmin, (req, res) => {
  try {
    const { page = 1, limit = 20, status, agentId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const allCalls: any[] = []; // This would be loaded from persistent storage
    let filteredCalls = allCalls;

    if (status) {
      filteredCalls = filteredCalls.filter((call: any) => call.status === status);
    }

    if (agentId) {
      filteredCalls = filteredCalls.filter((call: any) => call.assignedAgent === agentId);
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error('Error fetching call analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== AGENT MANAGEMENT ENDPOINTS =====

// Get all agents with status
router.get('/agents/status', authenticateSuperAdmin, (req, res) => {
  try {
    const agentsWithStatus = Object.values(agents).map((agent: any) => {
      const company = companies[agent.companyUuid];
      
      return {
        id: agent.uuid,
        username: agent.username,
        email: agent.email,
        companyName: company?.name || 'Unknown',
        status: agent.status,
        assignedToPublic: false,
        currentCalls: 0,
        maxCalls: 5,
        availability: 'offline',
        lastActivity: agent.updatedAt || agent.createdAt,
        skills: []
      };
    });

    res.json({
      success: true,
      agents: agentsWithStatus,
      onlineCount: agentsWithStatus.filter((a: any) => a.status === 'online').length,
      totalCount: agentsWithStatus.length
    });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    res.status(500).json({ error: 'Internal server error' });
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
  } catch (error) {
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
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/superadmin/create-company - Direct company creation (bypass email verification)
router.post('/create-company', authenticateSuperAdmin, async (req, res) => {
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
    const existingCompany = Object.values(companies).find((c: any) => c.email === email);
    if (existingCompany) {
      return res.status(400).json({ error: 'A company with this email already exists' });
    }
    
    // Generate UUID
    const uuid = uuidv4();
    
    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Create company with approved status
    const newCompany = {
      uuid,
      name: companyName,
      displayName: displayName || companyName,
      email,
      verified: true,
      suspended: false,
      createdAt: new Date().toISOString(),
      status: 'approved' as const // Directly approved
    };
    
    // Add to companies object
    companies[uuid] = newCompany;
    saveCompanies(); // Save to file
    
    // Create admin user
    const adminUser = {
      uuid: uuidv4(),
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
    
    // Generate JWT token for admin
    const token = jwt.sign({ 
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
    
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 