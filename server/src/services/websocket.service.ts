import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import appEmitter from '../events/event.emitter';
import Metric from '../models/metric.model';

interface WSClient {
  ws: WebSocket;
  isAlive: boolean;
  userId: string;
  role: string;
}

interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

let clients: Set<WSClient> = new Set();

const broadcast = (event: string, data: unknown): void => {
  const message = JSON.stringify({ event, data, timestamp: new Date() });
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
};

const sendToClient = (client: WSClient, event: string, data: unknown): void => {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({ event, data, timestamp: new Date() }));
  }
};

const extractToken = (req: IncomingMessage): string | null => {
  // Token from query string: ws://localhost:3000?token=xxx
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const queryToken = url.searchParams.get('token');
  if (queryToken) return queryToken;

  // Token from Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

const verifyToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
  } catch {
    return null;
  }
};

// Push latest metrics every 5 seconds
const startMetricsBroadcast = (): void => {
  setInterval(async () => {
    if (clients.size === 0) return;

    try {
      // Get distinct serviceIds with recent metrics
      const recentMetrics = await Metric.aggregate([
        {
          $group: {
            _id: '$serviceId',
            latest: { $last: '$$ROOT' },
          },
        },
        { $limit: 20 },
      ]);

      if (recentMetrics.length > 0) {
        broadcast('metrics:update', {
          services: recentMetrics.map(m => ({
            serviceId: m._id,
            metrics: m.latest.metrics,
            timestamp: m.latest.timestamp,
          })),
        });
      }
    } catch (err) {
      console.error('❌ Metrics broadcast error:', err);
    }
  }, 5000);
};

export const startWebSocketServer = (server: Server): void => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // JWT Authentication
    const token = extractToken(req);

    if (!token) {
      ws.send(JSON.stringify({
        event: 'error',
        data: { message: 'Authentication required — provide token as query param or Authorization header' },
      }));
      ws.close(1008, 'Unauthorized');
      return;
    }

    const payload = verifyToken(token);

    if (!payload) {
      ws.send(JSON.stringify({
        event: 'error',
        data: { message: 'Invalid or expired token' },
      }));
      ws.close(1008, 'Unauthorized');
      return;
    }

    const client: WSClient = {
      ws,
      isAlive: true,
      userId: payload.id,
      role: payload.role,
    };

    clients.add(client);
    console.log(`🔌 WS client connected — user: ${payload.email} role: ${payload.role} — total: ${clients.size}`);

    // Send connected confirmation
    sendToClient(client, 'connected', {
      message: 'Connected to PulseOps WebSocket',
      userId: payload.id,
      role: payload.role,
    });

    ws.on('pong', () => { client.isAlive = true; });

    ws.on('close', () => {
      clients.delete(client);
      console.log(`🔌 WS client disconnected — total: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket client error:', err);
      clients.delete(client);
    });
  });

  // Heartbeat — remove dead connections every 30s
  const heartbeat = setInterval(() => {
    clients.forEach((client) => {
      if (!client.isAlive) {
        client.ws.terminate();
        clients.delete(client);
        return;
      }
      client.isAlive = false;
      client.ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));

  // ─── App Event Listeners ──────────────────────────────

  appEmitter.on('incident:created', (incident) => {
    broadcast('incident:created', incident);
  });

  appEmitter.on('incident:updated', (incident) => {
    broadcast('incident:updated', incident);
  });

  appEmitter.on('anomaly:detected', (anomaly) => {
    broadcast('anomaly:detected', anomaly);
  });

  appEmitter.on('metric:ingested', (metric) => {
    broadcast('metric:ingested', metric);
  });

  // AI agent step streaming
  appEmitter.on('agent:step', (step) => {
    broadcast('agent:step', step);
  });

  appEmitter.on('agent:complete', (result) => {
    broadcast('agent:complete', result);
  });

  // Start metric push every 5 seconds
  startMetricsBroadcast();

  console.log('🌐 WebSocket Server started');
};