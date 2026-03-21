import mongoose, { Schema, Document } from 'mongoose';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface IIncident extends Document {
  incidentId: string;
  serviceId: string;
  serviceName: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  rootCause?: string;
  assignedTo?: string;
  correlatedDeploymentId?: string;
  affectedMetrics: {
    cpu?: number;
    memory?: number;
    latency?: number;
    errorRate?: number;
  };
  aiAnalysis?: {
    summary: string;
    suggestedFix: string;
    confidence: number;
    analyzedAt: Date;
  };
  postmortem?: string;
  runbook?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      default: () => `INC-${Date.now()}`,
    },
    serviceId: {
      type: String,
      required: true,
      index: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'closed'],
      default: 'open',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    rootCause: {
      type: String,
    },
    assignedTo: {
      type: String,
    },
    correlatedDeploymentId: {
      type: String,
    },
    affectedMetrics: {
      cpu: { type: Number },
      memory: { type: Number },
      latency: { type: Number },
      errorRate: { type: Number },
    },
    aiAnalysis: {
      summary: { type: String },
      suggestedFix: { type: String },
      confidence: { type: Number, min: 0, max: 1 },
      analyzedAt: { type: Date },
    },
    postmortem: { type: String },
    runbook: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);

export default Incident;