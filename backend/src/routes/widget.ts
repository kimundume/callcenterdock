import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { companies, users, findUserByCompanyAndRole, calls, agents as onlineAgents, widgetSettings } from '../data/tempDB';

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

const router = Router();
const JWT_SECRET = 'secret';

router.use(cors({ origin: '*' }));

function validateString(val: string, min = 1): boolean {
  return typeof val === 'string' && val.length >= min;
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.body.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/company/register
router.post('/company/register', async (req: Request, res: Response) => {
  const { companyName, adminUsername, adminPassword, email } = req.body;
  if (![companyName, adminUsername, adminPassword, email].every((v: string) => validateString(v))) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const existing = Object.values(companies).find((c: any) => c.email === email);
  if (existing) return res.status(400).json({ error: 'Company already exists' });
  const uuid = uuidv4();
  companies[uuid] = { uuid, companyName, email, createdAt: new Date().toISOString() };
  const hashed = await bcrypt.hash(adminPassword, 10);
  users[adminUsername + '@' + uuid] = {
    username: adminUsername,
    password: hashed,
    companyUuid: uuid,
    role: 'admin',
  };
  const token = jwt.sign({ username: adminUsername, companyUuid: uuid, role: 'admin' }, JWT_SECRET);
  res.json({ uuid, token });
});

// POST /api/auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  const { companyUuid, username, password, role } = req.body;
  if (![companyUuid, username, password, role].every((v: string) => validateString(v))) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const user = findUserByCompanyAndRole(companyUuid, username, role);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username, companyUuid, role }, JWT_SECRET);
  res.json({ token });
});

// POST /api/agent/add (admin only, protected)
router.post('/agent/add', authMiddleware, async (req: Request, res: Response) => {
  const { agentUsername, agentPassword } = req.body;
  if (!validateString(agentUsername) || !validateString(agentPassword)) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const decoded = req.user;
  if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const key = agentUsername + '@' + decoded.companyUuid;
  if (users[key]) return res.status(400).json({ error: 'Agent already exists' });
  const hashed = await bcrypt.hash(agentPassword, 10);
  users[key] = {
    username: agentUsername,
    password: hashed,
    companyUuid: decoded.companyUuid,
    role: 'agent',
  };
  res.json({ success: true });
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

export default router; 