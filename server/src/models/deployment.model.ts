import mongoose, { Schema, Document } from 'mongoose';

export type DeploymentStatus = 'success' | 'failed' | 'rolling-back' | 'rolled-back';

export interface IDeployment extends Document {
  serviceId: string;
  serviceName: string;
  version: string;
  previousVersion: string;
  status: DeploymentStatus;
  deployedBy: string;
  deployedAt: Date;
  completedAt?: Date;
  commitHash?: string;
  branch?: string;
  changelog?: string;
  rollbackReason?: string;
  metadata: {
    environment: string;
    region: string;
    host: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema = new Schema<IDeployment>(
  {
    serviceId: {
      type: String,
      required: true,
      index: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
    },
    previousVersion: {
      type: String,
      required: false,   // ← change from true to false
      default: 'unknown',
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'rolling-back', 'rolled-back'],
      default: 'success',
    },
    deployedBy: {
      type: String,
      required: true,
    },
    deployedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    commitHash: {
      type: String,
    },
    branch: {
      type: String,
      default: 'main',
    },
    changelog: {
      type: String,
    },
    rollbackReason: {
      type: String,
    },
    metadata: {
      environment: { type: String, default: 'production' },
      region: { type: String, default: 'us-east-1' },
      host: { type: String, default: 'unknown' },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Deployment = mongoose.model<IDeployment>('Deployment', DeploymentSchema);

export default Deployment;