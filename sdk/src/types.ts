export interface PulseOpsConfig {
  serverUrl: string;
  serviceId: string;
  serviceName: string;
  apiKey?: string;
  environment?: 'production' | 'staging' | 'development';
  version?: string;
  host?: string;
  region?: string;
  autoTrackInterval?: number; // ms, default 30000
  retryAttempts?: number;     // default 3
}

export interface MetricPayload {
  cpu: number;       // 0-100
  memory: number;    // 0-100
  latency: number;   // ms
  errorRate: number; // 0-100
}

export interface LogPayload {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

export interface DeploymentPayload {
  version: string;
  previousVersion: string;
  deployedBy: string;
  commitHash?: string;
  branch?: string;
  changelog?: string;
  metadata?: {
    environment?: string;
    region?: string;
    host?: string;
  };
}

export interface SDKResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}