import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import connectDB from './config/db';
import { errorMiddleware } from './middleware/error.middleware';
import { startAnomalyDetector } from './services/anamoly.service';
import { startAlertService } from './services/alert.service';
import { startWebSocketServer } from './services/websocket.service';
import { initMCPServer } from './mcp/mcp.server';

import authRoutes from './routes/auth.routes';
import metricRoutes from './routes/metric.routes';
import incidentRoutes from './routes/incident.routes';
import deploymentRoutes from './routes/deployment.routes';
import logRoutes from './routes/log.routes';
import serviceRoutes from './routes/service.routes';
import nlqRoutes from './routes/nlq.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:4200',
      'http://localhost:4200',
      'http://localhost:4201',
    ];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'PulseOps server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/nlq', nlqRoutes);

app.use(errorMiddleware);

const start = async () => {
  await connectDB();

  const server = http.createServer(app);

  startAnomalyDetector();
  startAlertService();
  startWebSocketServer(server);
  initMCPServer();

  server.listen(PORT, () => {
    console.log(`🚀 PulseOps server running on port ${PORT}`);
  });
};

start();

export default app;