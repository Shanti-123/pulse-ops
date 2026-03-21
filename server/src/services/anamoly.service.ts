import appEmitter from '../events/event.emitter';
import Metric from '../models/metric.model';

export interface AnomalyResult {
  detected: boolean;
  serviceId: string;
  serviceName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedMetrics: {
    cpu?: number;
    memory?: number;
    latency?: number;
    errorRate?: number;
  };
}

const THRESHOLDS = {
  cpu:       { high: 75, critical: 90 },
  memory:    { high: 80, critical: 95 },
  latency:   { high: 1000, critical: 3000 },
  errorRate: { high: 5, critical: 10 },
};

const ZSCORE_THRESHOLD = 2.5;
const MIN_READINGS_FOR_ZSCORE = 5;

const checkThreshold = (
  value: number,
  high: number,
  critical: number
): 'critical' | 'high' | null => {
  if (value >= critical) return 'critical';
  if (value >= high) return 'high';
  return null;
};

const calculateZScore = (value: number, values: number[]): number => {
  if (values.length < MIN_READINGS_FOR_ZSCORE) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
};

const buildAnomalyResult = (
  serviceId: string,
  serviceName: string,
  metrics: { cpu: number; memory: number; latency: number; errorRate: number }
): AnomalyResult | null => {
  const breaches: Array<{
    metric: string;
    value: number;
    severity: 'critical' | 'high';
  }> = [];

  const cpuSeverity = checkThreshold(metrics.cpu, THRESHOLDS.cpu.high, THRESHOLDS.cpu.critical);
  if (cpuSeverity) breaches.push({ metric: 'CPU', value: metrics.cpu, severity: cpuSeverity });

  const memSeverity = checkThreshold(metrics.memory, THRESHOLDS.memory.high, THRESHOLDS.memory.critical);
  if (memSeverity) breaches.push({ metric: 'Memory', value: metrics.memory, severity: memSeverity });

  const latSeverity = checkThreshold(metrics.latency, THRESHOLDS.latency.high, THRESHOLDS.latency.critical);
  if (latSeverity) breaches.push({ metric: 'Latency', value: metrics.latency, severity: latSeverity });

  const errSeverity = checkThreshold(metrics.errorRate, THRESHOLDS.errorRate.high, THRESHOLDS.errorRate.critical);
  if (errSeverity) breaches.push({ metric: 'ErrorRate', value: metrics.errorRate, severity: errSeverity });

  if (breaches.length === 0) return null;

  const topSeverity = breaches.some(b => b.severity === 'critical') ? 'critical' : 'high';
  const metricNames = breaches.map(b => b.metric).join(', ');

  return {
    detected: true,
    serviceId,
    serviceName,
    severity: topSeverity,
    title: `${topSeverity.toUpperCase()} anomaly detected in ${serviceName}`,
    description: `Threshold breached for: ${metricNames}. ` +
      breaches.map(b => `${b.metric}=${b.value}`).join(', '),
    affectedMetrics: {
      cpu: metrics.cpu,
      memory: metrics.memory,
      latency: metrics.latency,
      errorRate: metrics.errorRate,
    },
  };
};

const detectZScoreAnomaly = async (
  serviceId: string,
  serviceName: string,
  current: { cpu: number; memory: number; latency: number; errorRate: number }
): Promise<AnomalyResult | null> => {
  const recent = await Metric.find({ serviceId })
    .sort({ timestamp: -1 })
    .limit(20);

  if (recent.length < MIN_READINGS_FOR_ZSCORE) return null;

  const cpuValues    = recent.map(m => m.metrics.cpu);
  const memValues    = recent.map(m => m.metrics.memory);
  const latValues    = recent.map(m => m.metrics.latency);
  const errValues    = recent.map(m => m.metrics.errorRate);

  const cpuZ    = calculateZScore(current.cpu, cpuValues);
  const memZ    = calculateZScore(current.memory, memValues);
  const latZ    = calculateZScore(current.latency, latValues);
  const errZ    = calculateZScore(current.errorRate, errValues);

  const spikes: Array<{ metric: string; value: number; zScore: number }> = [];

  if (Math.abs(cpuZ) > ZSCORE_THRESHOLD)
    spikes.push({ metric: 'CPU', value: current.cpu, zScore: cpuZ });
  if (Math.abs(memZ) > ZSCORE_THRESHOLD)
    spikes.push({ metric: 'Memory', value: current.memory, zScore: memZ });
  if (Math.abs(latZ) > ZSCORE_THRESHOLD)
    spikes.push({ metric: 'Latency', value: current.latency, zScore: latZ });
  if (Math.abs(errZ) > ZSCORE_THRESHOLD)
    spikes.push({ metric: 'ErrorRate', value: current.errorRate, zScore: errZ });

  if (spikes.length === 0) return null;

  const maxZ = Math.max(...spikes.map(s => Math.abs(s.zScore)));
  const severity = maxZ > 3.5 ? 'critical' : 'high';

  const description = spikes
    .map(s => `${s.metric}=${s.value} (Z-score: ${s.zScore.toFixed(2)})`)
    .join(' | ');

  return {
    detected: true,
    serviceId,
    serviceName,
    severity,
    title: `Statistical anomaly detected in ${serviceName}`,
    description: `Z-score spike detected: ${description}`,
    affectedMetrics: {
      cpu: current.cpu,
      memory: current.memory,
      latency: current.latency,
      errorRate: current.errorRate,
    },
  };
};

export const startAnomalyDetector = (): void => {
  appEmitter.on('metric:ingested', async (payload: { serviceId: string; serviceName: string; metrics: { cpu: number; memory: number; latency: number; errorRate: number } }) => {
    const { serviceId, serviceName, metrics } = payload;

    try {
      // Check 1 — threshold breach (fast, no DB needed)
      const thresholdAnomaly = buildAnomalyResult(serviceId, serviceName, metrics);
      if (thresholdAnomaly) {
        appEmitter.emit('anomaly:detected', thresholdAnomaly);
        return;
      }

      // Check 2 — Z-score statistical anomaly
      const zScoreAnomaly = await detectZScoreAnomaly(serviceId, serviceName, metrics);
      if (zScoreAnomaly) {
        appEmitter.emit('anomaly:detected', zScoreAnomaly);
      }
    } catch (err) {
      console.error('❌ AnomalyDetector error:', err);
    }
  });

  console.log('🔍 Anomaly Detector started');
};