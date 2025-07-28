import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateId } from '../server';

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

    const isValidPassword = await bcrypt.compare(password, superAdminCredentials.password);
    if (!isValidPassword) {
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
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    // Transform existing companies data to match the expected format
    const accounts = tempStorage.companies.map((company: any) => ({
      id: company.uuid,
      companyName: company.name,
      email: company.email,
      status: company.suspended ? 'suspended' : (company.verified ? 'active' : 'pending'),
      createdAt: company.createdAt || new Date().toISOString(),
      lastLogin: company.lastLogin || new Date().toISOString(),
      subscription: 'pro', // Default subscription
      agents: tempStorage.agents.filter((agent: any) => agent.companyUuid === company.uuid).length,
      calls: 0, // This would be calculated from call logs
      revenue: Math.floor(Math.random() * 5000) + 1000 // Mock revenue data
    }));

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suspend account
router.put('/accounts/:id/suspend', authenticateSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }
    
    // Find and update the company status
    const company = tempStorage.companies.find((c: any) => c.uuid === id);
    if (!company) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Add suspended status to company
    company.suspended = true;
    
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
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }
    
    // Find and update the company status
    const company = tempStorage.companies.find((c: any) => c.uuid === id);
    if (!company) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Remove suspended status from company
    company.suspended = false;
    
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
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }
    
    // Find and remove the company
    const companyIndex = tempStorage.companies.findIndex((c: any) => c.uuid === id);
    if (companyIndex === -1) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Remove company and related data
    tempStorage.companies.splice(companyIndex, 1);
    
    // Remove related agents
    tempStorage.agents = tempStorage.agents.filter((agent: any) => agent.companyUuid !== id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system analytics
router.get('/analytics', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    const analytics = {
      totalAccounts: tempStorage.companies.length,
      activeAccounts: tempStorage.companies.filter((c: any) => c.verified && !c.suspended).length,
      suspendedAccounts: tempStorage.companies.filter((c: any) => c.suspended).length,
      pendingAccounts: tempStorage.companies.filter((c: any) => !c.verified).length,
      totalAgents: tempStorage.agents.length,
      totalRevenue: tempStorage.companies.length * 2500, // Mock calculation
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
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    const posts = tempStorage.blogPosts || [];
    res.json({ posts });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/content/blog-posts', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    if (!tempStorage.blogPosts) {
      tempStorage.blogPosts = [];
    }

    const post = {
      id: `post-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tempStorage.blogPosts.push(post);
    res.json({ post });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/content/frontpage', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    const content = tempStorage.frontpageContent || {
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
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    tempStorage.frontpageContent = {
      ...tempStorage.frontpageContent,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({ content: tempStorage.frontpageContent });
  } catch (error) {
    console.error('Update frontpage content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Package Management Routes
router.get('/packages', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
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
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/packages', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    if (!tempStorage.packages) {
      tempStorage.packages = [];
    }

    const pkg = {
      id: `pkg-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };

    tempStorage.packages.push(pkg);
    res.json({ package: pkg });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer Care Routes
router.get('/support/tickets', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
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
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/support/tickets', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    if (!tempStorage.supportTickets) {
      tempStorage.supportTickets = [];
    }

    const ticket = {
      id: `TICKET-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    tempStorage.supportTickets.push(ticket);
    res.json({ ticket });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Advanced Analytics Routes
router.get('/analytics/advanced', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
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
        openTickets: tempStorage.supportTickets?.filter((t: any) => t.status === 'open').length || 0,
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
    const tempStorage = (global as any).tempStorage;
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
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/system/config', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    tempStorage.systemConfig = {
      ...tempStorage.systemConfig,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({ config: tempStorage.systemConfig });
  } catch (error) {
    console.error('Update system config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Management Routes
router.get('/users', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
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
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    if (!tempStorage.users) {
      tempStorage.users = [];
    }

    const user = {
      id: `user-${Date.now()}`,
      ...req.body,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    tempStorage.users.push(user);
    res.json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Management Routes
router.get('/api-keys', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
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
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api-keys', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
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
  } catch (error) {
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
  const { type, id } = req.body;
  
  if (type === 'company') {
    const company = global.tempStorage.companies.find(c => c.uuid === id);
    if (company) {
      company.status = 'approved';
      company.verified = true;
      
      // Create admin user from pending admin credentials
      const pendingAdmin = global.tempStorage.pendingAdmins?.find(pa => pa.uuid === id);
      if (pendingAdmin) {
        // In a real application, you'd hash the password here
        const hashedPassword = pendingAdmin.adminPassword; // This should be bcrypt.hash() in production
        
        // Add to users array (you'll need to create this in tempStorage)
        global.tempStorage.authUsers = global.tempStorage.authUsers || [];
        global.tempStorage.authUsers.push({
          uuid: generateId(),
          username: pendingAdmin.adminUsername,
          password: hashedPassword,
          companyUuid: id,
          role: 'admin',
          email: pendingAdmin.email,
          createdAt: new Date().toISOString()
        });
        
        // Remove from pending admins
        global.tempStorage.pendingAdmins = global.tempStorage.pendingAdmins?.filter(pa => pa.uuid !== id) || [];
      }
      
      return res.json({ success: true, message: 'Company approved successfully' });
    }
  } else if (type === 'agent') {
    const agent = global.tempStorage.agents.find(a => a.uuid === id);
    if (agent) {
      agent.registrationStatus = 'approved';
      agent.status = 'offline'; // Set initial status to offline
      
      // Create agent user from pending agent credentials
      const pendingAgentCred = global.tempStorage.pendingAgentCredentials?.find(pac => pac.uuid === id);
      if (pendingAgentCred) {
        // In a real application, you'd hash the password here
        const hashedPassword = pendingAgentCred.password; // This should be bcrypt.hash() in production
        
        // Add to authUsers array
        global.tempStorage.authUsers = global.tempStorage.authUsers || [];
        global.tempStorage.authUsers.push({
          uuid: generateId(),
          username: pendingAgentCred.username,
          password: hashedPassword,
          companyUuid: pendingAgentCred.companyUuid,
          role: 'agent',
          email: pendingAgentCred.email,
          createdAt: new Date().toISOString()
        });
        
        // Remove from pending agent credentials
        global.tempStorage.pendingAgentCredentials = global.tempStorage.pendingAgentCredentials?.filter(pac => pac.uuid !== id) || [];
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
  } else if (type === 'agent') {
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
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    const activeCalls = tempStorage.calls.filter((call: any) => 
      ['waiting', 'connecting', 'active'].includes(call.status)
    );

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
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    const { page = 1, limit = 20, status, agentId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let filteredCalls = tempStorage.calls;

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
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    const { id } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID required' });
    }

    const call = tempStorage.calls.find((c: any) => c.id === id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Check if agent exists and is available
    const agent = tempStorage.agents.find((a: any) => a.uuid === agentId);
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
  } catch (error) {
    console.error('Error assigning call:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update call status
router.put('/calls/:id/status', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }

    const call = tempStorage.calls.find((c: any) => c.id === id);
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
  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get call analytics
router.get('/calls/analytics', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
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

    const recentCalls = tempStorage.calls.filter((call: any) => 
      new Date(call.startTime) >= startDate
    );

    const analytics = {
      totalCalls: recentCalls.length,
      activeCalls: recentCalls.filter((c: any) => c.status === 'active').length,
      avgDuration: recentCalls.length > 0 
        ? recentCalls.reduce((sum: number, call: any) => sum + (call.duration || 0), 0) / recentCalls.length 
        : 0,
      callsByStatus: {
        waiting: recentCalls.filter((c: any) => c.status === 'waiting').length,
        active: recentCalls.filter((c: any) => c.status === 'active').length,
        ended: recentCalls.filter((c: any) => c.status === 'ended').length,
        missed: recentCalls.filter((c: any) => c.status === 'missed').length
      },
      callsByType: {
        chat: recentCalls.filter((c: any) => c.callType === 'chat').length,
        voice: recentCalls.filter((c: any) => c.callType === 'voice').length
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
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    const agentsWithStatus = tempStorage.agents.map((agent: any) => {
      const assignment = tempStorage.agentAssignments.find((a: any) => a.agentId === agent.uuid);
      const company = tempStorage.companies.find((c: any) => c.uuid === agent.companyUuid);
      
      return {
        id: agent.uuid,
        username: agent.username,
        email: agent.email,
        companyName: company?.name || 'Unknown',
        status: agent.status,
        assignedToPublic: assignment?.assignedToPublic || false,
        currentCalls: assignment?.currentCalls || 0,
        maxCalls: assignment?.maxCalls || 5,
        availability: assignment?.availability || 'offline',
        lastActivity: assignment?.lastActivity || agent.updatedAt || agent.createdAt,
        skills: assignment?.skills || []
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
    const tempStorage = (global as any).tempStorage;
    if (!tempStorage) {
      return res.status(500).json({ error: 'Storage not available' });
    }

    const { id } = req.params;
    const { assignedToPublic, maxCalls, skills } = req.body;

    let assignment = tempStorage.agentAssignments.find((a: any) => a.agentId === id);
    
    if (!assignment) {
      assignment = {
        id: generateId(),
        agentId: id,
        assignedToPublic: assignedToPublic || false,
        maxCalls: maxCalls || 5,
        currentCalls: 0,
        skills: skills || [],
        availability: 'available',
        lastActivity: new Date().toISOString()
      };
      tempStorage.agentAssignments.push(assignment);
    } else {
      if (assignedToPublic !== undefined) assignment.assignedToPublic = assignedToPublic;
      if (maxCalls !== undefined) assignment.maxCalls = maxCalls;
      if (skills !== undefined) assignment.skills = skills;
      assignment.lastActivity = new Date().toISOString();
    }

    res.json({
      success: true,
      message: 'Agent assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Error updating agent assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent performance
router.get('/agents/:id/performance', authenticateSuperAdmin, (req, res) => {
  try {
    const tempStorage = (global as any).tempStorage;
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

    const agentCalls = tempStorage.calls.filter((call: any) => 
      call.assignedAgent === id && new Date(call.startTime) >= startDate
    );

    const performance = {
      callsHandled: agentCalls.filter((c: any) => c.status === 'ended').length,
      avgDuration: agentCalls.length > 0 
        ? agentCalls.reduce((sum: number, call: any) => sum + (call.duration || 0), 0) / agentCalls.length 
        : 0,
      responseTime: 0, // This would be calculated from call logs
      satisfaction: 4.5, // Mock satisfaction rating
      totalCalls: agentCalls.length,
      missedCalls: agentCalls.filter((c: any) => c.status === 'missed').length
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

export default router; 