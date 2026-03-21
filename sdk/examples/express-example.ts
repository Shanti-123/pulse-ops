import express from 'express';
import { PulseOpsSDK } from '../src/pulseops.sdk';
import os from 'os';

const app = express();
const PORT = 4000;

// Initialize PulseOps SDK
const pulseops = new PulseOpsSDK({
  serverUrl: 'http://localhost:3000',
  serviceId: 'payment-service',
  serviceName: 'Payment Service',
  environment: 'production',
  version: '1.2.0',
  host: os.hostname(),
  region: 'us-east-1',
  autoTrackInterval: 15000, // push metrics every 15s
  retryAttempts: 3,
});

// Register service on startup
const init = async () => {
  const reg = await pulseops.register();
  console.log('Service registered:', reg.success);

  // Track a deployment
  await pulseops.trackDeployment({
    version: '1.2.0',
    previousVersion: '1.1.0',
    deployedBy: 'ci-pipeline',
    commitHash: 'abc123def',
    branch: 'main',
    changelog: 'Added payment retry logic',
  });

  // Auto track system metrics every 15s
  pulseops.startAutoTracking(() => ({
    cpu: Math.random() * 100,       // replace with real os.cpus() reading
    memory: (1 - os.freemem() / os.totalmem()) * 100,
    latency: Math.random() * 500,
    errorRate: Math.random() * 2,
  }));
};

// Example route — log errors automatically
app.get('/pay', async (req, res) => {
  try {
    await pulseops.info('Payment request received', { amount: 100 });
    // ... payment logic
    res.json({ success: true });
  } catch (err) {
    await pulseops.error('Payment failed', String(err), { route: '/pay' });
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, async () => {
  console.log(`Payment service running on port ${PORT}`);
  await init();
});

// Cleanup on shutdown
process.on('SIGINT', () => {
  pulseops.stopAutoTracking();
  process.exit(0);
});