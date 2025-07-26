import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import widgetRoutes from './routes/widget';
import { registerSignalingHandlers } from './sockets/signaling';
import dotenv from 'dotenv';
import { chatSessions } from './data/tempDB';

dotenv.config();

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

registerSignalingHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 