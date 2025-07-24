import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import widgetRoutes from './routes/widget';
import { registerSignalingHandlers } from './sockets/signaling';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.use('/api/widget', widgetRoutes);

registerSignalingHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 