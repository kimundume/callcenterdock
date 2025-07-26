import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { companies, users, findUserByCompanyAndRole, calls, agents as onlineAgents, widgetSettings, ivrConfigs, pendingCompanies, findCompanyByEmail, findPendingCompanyByEmail } from '../data/tempDB';
import { EmailService } from '../services/emailService';

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-prod';

// Password strength regex (min 8 chars, 1 upper, 1 lower, 1 number)
function isStrongPassword(pw: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/.test(pw);
}

// Email validation regex
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Input validation
function validateString(str: string) {
  return typeof str === 'string' && str.trim().length > 0;
}

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// JWT middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/company/register - Now requires email verification
router.post('/company/register', authLimiter as any, async (req: Request, res: Response) => {
  const { companyName, displayName, adminUsername, adminPassword, email } = req.body;
  
  // Validate all required fields
  if (![companyName, adminUsername, adminPassword, email].every((v: string) => validateString(v))) {
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
  const existingCompany = findCompanyByEmail(email);
  if (existingCompany) {
    return res.status(400).json({ error: 'A company with this email already exists' });
  }
  
  // Check if there's already a pending registration
  const existingPending = findPendingCompanyByEmail(email);
  if (existingPending) {
    return res.status(400).json({ error: 'A registration is already pending for this email. Please check your email for verification.' });
  }
  
  // Generate UUID and verification token
  const uuid = uuidv4();
  const verificationToken = EmailService.generateToken();
  
  // Store pending registration
  pendingCompanies[uuid] = {
    uuid,
    companyName,
    displayName: displayName || companyName, // Use companyName as default display name
    email,
    adminUsername,
    adminPassword,
    verificationToken,
    createdAt: new Date().toISOString()
  };
  
  // Store verification token
  EmailService.storeToken(email, verificationToken, 'email');
  
  // Send verification email
  const emailSent = await EmailService.sendEmailVerification(email, companyName, verificationToken);
  
  if (!emailSent) {
    // Remove pending registration if email fails
    delete pendingCompanies[uuid];
    return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
  }
  
  res.json({ 
    message: 'Registration successful! Please check your email to verify your account.',
    uuid,
    email,
    requiresVerification: true
  });
});

// POST /api/company/verify-email
router.post('/company/verify-email', async (req: Request, res: Response) => {
  const { email, token } = req.body;
  
  if (!email || !token) {
    return res.status(400).json({ error: 'Email and verification token required' });
  }
  
  // Verify token
  if (!EmailService.verifyToken(email, token, 'email')) {
    return res.status(400).json({ error: 'Invalid or expired verification token' });
  }
  
  // Find pending company
  const pendingCompany = findPendingCompanyByEmail(email);
  if (!pendingCompany) {
    return res.status(404).json({ error: 'No pending registration found for this email' });
  }
  
  try {
    // Create the actual company
    companies[pendingCompany.uuid] = {
      uuid: pendingCompany.uuid,
      companyName: pendingCompany.companyName,
      displayName: pendingCompany.displayName,
      email: pendingCompany.email,
      verified: true,
      createdAt: new Date().toISOString()
    };
    
    // Create admin user
    const hashedPassword = await bcrypt.hash(pendingCompany.adminPassword, 10);
    users[pendingCompany.adminUsername + '@' + pendingCompany.uuid] = {
      username: pendingCompany.adminUsername,
      password: hashedPassword,
      companyUuid: pendingCompany.uuid,
      role: 'admin',
      email: pendingCompany.email,
      createdAt: new Date().toISOString()
    };
    
    // Remove from pending
    delete pendingCompanies[pendingCompany.uuid];
    
    // Generate JWT token
    const token = jwt.sign({ 
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
    
  } catch (error) {
    console.error('Error creating company after verification:', error);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login - Updated to support email login
router.post('/auth/login', authLimiter as any, async (req: Request, res: Response) => {
  const { email, companyUuid, username, password, role } = req.body;
  
  let uuid = companyUuid;
  let user = null;
  
  // If email is provided, find company by email
  if (email && !companyUuid) {
    const company = findCompanyByEmail(email);
    if (!company) {
      return res.status(404).json({ error: 'Company not found with this email' });
    }
    uuid = company.uuid;
  }
  
  if (!uuid || !password || !role) {
    return res.status(400).json({ error: 'Company UUID, password, and role are required' });
  }
  
  // Try to find user by username first
  if (username) {
    user = findUserByCompanyAndRole(uuid, username, role);
  }
  
  // If no user found and email provided, try to find admin by email
  if (!user && email && role === 'admin') {
    const company = findCompanyByEmail(email);
    if (company) {
      user = Object.values(users).find((u: any) => 
        u.companyUuid === company.uuid && 
        u.role === 'admin' && 
        u.email === email
      );
    }
  }
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ 
    username: user.username, 
    companyUuid: uuid, 
    role 
  }, JWT_SECRET, { expiresIn: '1h' });
  
  // Get company info for response
  const company = companies[uuid];
  
  res.json({ 
    token,
    companyUuid: uuid,
    username: user.username,
    role,
    companyName: company?.companyName,
    displayName: company?.displayName
  });
});

// POST /api/auth/forgot-password
router.post('/auth/forgot-password', authLimiter as any, async (req: Request, res: Response) => {
  const { email, companyUuid, username } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  let uuid = companyUuid;
  let user = null;
  
  // Find company by email if UUID not provided
  if (!uuid) {
    const company = findCompanyByEmail(email);
    if (!company) {
      return res.status(404).json({ error: 'No account found with this email' });
    }
    uuid = company.uuid;
  }
  
  // Find user
  if (username) {
    user = findUserByCompanyAndRole(uuid, username, 'admin');
  } else {
    // Find admin by email
    user = Object.values(users).find((u: any) => 
      u.companyUuid === uuid && 
      u.role === 'admin' && 
      u.email === email
    );
  }
  
  if (!user) {
    return res.status(404).json({ error: 'No account found with the provided information' });
  }
  
  // Generate reset token
  const resetToken = EmailService.generateToken();
  EmailService.storeToken(email, resetToken, 'password');
  
  // Send password reset email
  const emailSent = await EmailService.sendPasswordReset(email, user.username, resetToken);
  
  if (!emailSent) {
    return res.status(500).json({ error: 'Failed to send password reset email. Please try again.' });
  }
  
  res.json({ message: 'Password reset email sent. Please check your inbox.' });
});

// POST /api/auth/reset-password
router.post('/auth/reset-password', async (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;
  
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Email, token, and new password are required' });
  }
  
  // Validate password strength
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters, include upper/lowercase and a number.' });
  }
  
  // Verify token
  if (!EmailService.verifyToken(email, token, 'password')) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
  
  // Find company and user
  const company = findCompanyByEmail(email);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  
  const user = Object.values(users).find((u: any) => 
    u.companyUuid === company.uuid && 
    u.role === 'admin' && 
    u.email === email
  );
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  try {
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
});

// POST /api/auth/forgot-uuid
router.post('/auth/forgot-uuid', authLimiter as any, async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  // Find company by email
  const company = findCompanyByEmail(email);
  if (!company) {
    return res.status(404).json({ error: 'No company found with this email' });
  }
  
  // Send UUID reminder email
  const emailSent = await EmailService.sendCompanyUuidReminder(email, company.companyName, company.uuid);
  
  if (!emailSent) {
    return res.status(500).json({ error: 'Failed to send UUID reminder. Please try again.' });
  }
  
  res.json({ message: 'Company UUID reminder sent. Please check your inbox.' });
});

// POST /api/agent/add (admin only, protected) - Updated with email support
router.post('/agent/add', authMiddleware, async (req: Request, res: Response) => {
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
  
  const key = agentUsername + '@' + decoded.companyUuid;
  if (users[key]) {
    return res.status(400).json({ error: 'Agent already exists' });
  }
  
  try {
    const hashed = await bcrypt.hash(agentPassword, 10);
    users[key] = {
      username: agentUsername,
      password: hashed,
      companyUuid: decoded.companyUuid,
      role: 'agent',
      email: agentEmail,
      createdAt: new Date().toISOString()
    };
    
    // Send invitation email if email provided
    if (agentEmail) {
      const company = companies[decoded.companyUuid];
      const emailSent = await EmailService.sendAgentInvitation(
        agentEmail,
        agentUsername,
        company.companyName,
        decoded.companyUuid,
        agentPassword // Send temporary password
      );
      
      if (!emailSent) {
        console.warn('Failed to send agent invitation email');
      }
    }
    
    res.json({ 
      success: true, 
      message: agentEmail ? 'Agent created and invitation email sent' : 'Agent created successfully'
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent. Please try again.' });
  }
});

// PUT /api/company/update-display-name (admin only, protected)
router.put('/company/update-display-name', authMiddleware, async (req: Request, res: Response) => {
  const { displayName } = req.body;
  
  if (!validateString(displayName)) {
    return res.status(400).json({ error: 'Display name is required' });
  }
  
  const decoded = req.user;
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const company = companies[decoded.companyUuid];
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
});

// GET /api/company/info (protected)
router.get('/company/info', authMiddleware, async (req: Request, res: Response) => {
  const decoded = req.user;
  const company = companies[decoded.companyUuid];
  
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  
  res.json({
    uuid: company.uuid,
    companyName: company.companyName,
    displayName: company.displayName,
    email: company.email,
    verified: company.verified,
    createdAt: company.createdAt
  });
});

// POST /api/widget/register
router.post('/register', (req: Request, res: Response) => {
  const { companyName, email } = req.body;
  if (!companyName || !email) {
    return res.status(400).json({ error: 'companyName and email are required' });
  }
  // Check if company already exists (by email)
  const existing = Object.values(companies).find((c: any) => c.email === email);
  if (existing) {
    return res.json({ uuid: existing.uuid });
  }
  const uuid = uuidv4();
  companies[uuid] = { uuid, companyName, email, createdAt: new Date().toISOString() };
  res.json({ uuid });
});

// GET /api/widget/calls/:uuid
router.get('/calls/:uuid', (req: Request, res: Response) => {
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
router.post('/call/log', (req: Request, res: Response) => {
  const { companyUuid, agent, notes, disposition, duration, sessionId, tags, time } = req.body;
  if (!companyUuid || !agent || !duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!calls[companyUuid]) calls[companyUuid] = [];
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
router.get('/call/logs/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  res.json(calls[companyUuid] || []);
});

// GET /api/agents/:companyUuid (list all agents for a company with online status)
router.get('/agents/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  const agentList = Object.values(users)
    .filter((u: any) => u.companyUuid === companyUuid && u.role === 'agent')
    .map((u: any) => ({
      username: u.username,
      role: u.role,
      online: !!(onlineAgents[companyUuid] && onlineAgents[companyUuid][u.username]),
    }));
  res.json(agentList);
});

// PATCH /api/agent/:companyUuid/:username (update agent role/active)
router.patch('/agent/:companyUuid/:username', (req: Request, res: Response) => {
  const { companyUuid, username } = req.params;
  const { role, active } = req.body;
  const key = username + '@' + companyUuid;
  if (!users[key]) return res.status(404).json({ error: 'Agent not found' });
  if (role) users[key].role = role;
  if (typeof active === 'boolean') users[key].active = active;
  res.json({ success: true, user: users[key] });
});

// DELETE /api/agent/:companyUuid/:username (remove agent)
router.delete('/agent/:companyUuid/:username', (req: Request, res: Response) => {
  const { companyUuid, username } = req.params;
  const key = username + '@' + companyUuid;
  if (!users[key]) return res.status(404).json({ error: 'Agent not found' });
  delete users[key];
  res.json({ success: true });
});

// GET /api/widget/settings/:companyUuid
router.get('/settings/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  const settings = widgetSettings[companyUuid] || {
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
router.post('/settings/:companyUuid', authMiddleware, (req: Request, res: Response) => {
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
  widgetSettings[companyUuid] = { text, color, shape, img, position, animation, dark: !!dark };
  res.json({ success: true, settings: widgetSettings[companyUuid] });
});

// GET /api/widget/ivr/:companyUuid
router.get('/ivr/:companyUuid', (req: Request, res: Response) => {
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
router.post('/ivr/:companyUuid', authMiddleware, (req: Request, res: Response) => {
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
router.post('/demo/create-demo-agent', async (req: Request, res: Response) => {
  const { companyUuid, username, password } = req.body;
  if (!companyUuid || !username || !password) return res.status(400).json({ error: 'Missing fields' });
  const key = username + '@' + companyUuid;
  if (users[key]) return res.json({ success: true, alreadyExists: true });
  const hashed = await bcrypt.hash(password, 10);
  users[key] = { username, password: hashed, companyUuid, role: 'agent' };
  res.json({ success: true });
});

// DEV ONLY: Save widget settings without auth
router.post('/demo/settings/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  const { text, color, shape, img, position, animation, dark } = req.body;
  if (!text || !color || !shape || !position || !animation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  widgetSettings[companyUuid] = { text, color, shape, img, position, animation, dark: !!dark };
  res.json({ success: true, settings: widgetSettings[companyUuid] });
});
// DEV ONLY: Save IVR config without auth
router.post('/demo/ivr/:companyUuid', (req: Request, res: Response) => {
  const { companyUuid } = req.params;
  const { steps } = req.body;
  if (!Array.isArray(steps)) {
    return res.status(400).json({ error: 'Invalid IVR config' });
  }
  ivrConfigs[companyUuid] = { steps };
  res.json({ success: true, config: ivrConfigs[companyUuid] });
});

export default router; 