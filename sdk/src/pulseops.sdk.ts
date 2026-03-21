import { PulseOpsConfig, MetricPayload, LogPayload, DeploymentPayload, SDKResponse } from './types';

export class PulseOpsSDK {
  private config: Required<PulseOpsConfig>;
  private autoTrackTimer?: ReturnType<typeof setInterval>;
  private metricsCollector?: () => MetricPayload;

  constructor(config: PulseOpsConfig) {
    this.config = {
      serverUrl: config.serverUrl,
      serviceId: config.serviceId,
      serviceName: config.serviceName,
      apiKey: config.apiKey || '',
      environment: config.environment || 'production',
      version: config.version || '1.0.0',
      host: config.host || 'unknown',
      region: config.region || 'us-east-1',
      autoTrackInterval: config.autoTrackInterval || 30000,
      retryAttempts: config.retryAttempts || 3,
    };
  }

  // ─── Core HTTP ───────────────────────────────────────
  private async post(
    path: string,
    body: object,
    attempt = 1
  ): Promise<SDKResponse> {
    try {
      const res = await fetch(`${this.config.serverUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json() as SDKResponse;
      return data;
    } catch (err) {
      if (attempt < this.config.retryAttempts) {
        const delay = attempt * 1000;
        await new Promise(r => setTimeout(r, delay));
        return this.post(path, body, attempt + 1);
      }
      return { success: false, message: `Request failed after ${attempt} attempts: ${err}` };
    }
  }

  // ─── Register Service ────────────────────────────────
  async register(): Promise<SDKResponse> {
    return this.post('/api/services', {
      serviceId: this.config.serviceId,
      name: this.config.serviceName,
      environment: this.config.environment,
      version: this.config.version,
      host: this.config.host,
      region: this.config.region,
    });
  }

  // ─── Track Metrics ───────────────────────────────────
  async track(metrics: MetricPayload): Promise<SDKResponse> {
    return this.post('/api/metrics', {
      serviceId: this.config.serviceId,
      serviceName: this.config.serviceName,
      metrics,
      metadata: {
        host: this.config.host,
        region: this.config.region,
        version: this.config.version,
      },
    });
  }

  // ─── Auto Track ──────────────────────────────────────
  startAutoTracking(collector: () => MetricPayload): void {
    if (this.autoTrackTimer) {
      console.warn('[PulseOps] Auto tracking already running');
      return;
    }

    this.metricsCollector = collector;

    this.autoTrackTimer = setInterval(async () => {
      try {
        const metrics = this.metricsCollector!();
        const result = await this.track(metrics);
        if (!result.success) {
          console.error('[PulseOps] Auto track failed:', result.message);
        }
      } catch (err) {
        console.error('[PulseOps] Auto track error:', err);
      }
    }, this.config.autoTrackInterval);

    console.log(`[PulseOps] Auto tracking started — interval: ${this.config.autoTrackInterval}ms`);
  }

  stopAutoTracking(): void {
    if (this.autoTrackTimer) {
      clearInterval(this.autoTrackTimer);
      this.autoTrackTimer = undefined;
      console.log('[PulseOps] Auto tracking stopped');
    }
  }

  // ─── Log ─────────────────────────────────────────────
  async log(payload: LogPayload): Promise<SDKResponse> {
    return this.post('/api/logs', {
      serviceId: this.config.serviceId,
      serviceName: this.config.serviceName,
      ...payload,
      timestamp: new Date(),
    });
  }

  // ─── Convenience log methods ─────────────────────────
  async info(message: string, metadata?: Record<string, unknown>): Promise<SDKResponse> {
    return this.log({ level: 'info', message, metadata });
  }

  async warn(message: string, metadata?: Record<string, unknown>): Promise<SDKResponse> {
    return this.log({ level: 'warn', message, metadata });
  }

  async error(message: string, stackTrace?: string, metadata?: Record<string, unknown>): Promise<SDKResponse> {
    return this.log({ level: 'error', message, stackTrace, metadata });
  }

  async debug(message: string, metadata?: Record<string, unknown>): Promise<SDKResponse> {
    return this.log({ level: 'debug', message, metadata });
  }

  // ─── Track Deployment ────────────────────────────────
  async trackDeployment(payload: DeploymentPayload): Promise<SDKResponse> {
    return this.post('/api/deployments', {
      serviceId: this.config.serviceId,
      serviceName: this.config.serviceName,
      ...payload,
      metadata: {
        environment: this.config.environment,
        region: this.config.region,
        host: this.config.host,
        ...payload.metadata,
      },
    });
  }
}

export default PulseOpsSDK;