import cors from 'cors';
import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { config } from './config.js';
import { listAvailableRooms, listRooms } from './controllers/roomController.js';
import { registerGameSocket } from './sockets/gameSocket.js';

async function bootstrap() {
  await mongoose.connect(config.mongoUri);

  const app = express();
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/rooms', listRooms);
  app.get('/api/rooms/available', listAvailableRooms);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: config.clientOrigin,
      methods: ['GET', 'POST'],
    },
  });

  registerGameSocket(io);

  server.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
