import mongoose, { Schema, Document } from 'mongoose';

export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type ServiceEnvironment = 'production' | 'staging' | 'development';

export interface IService extends Document {
  serviceId: string;
  name: string;
  description?: string;
  environment: ServiceEnvironment;
  status: ServiceStatus;
  version: string;
  host?: string;
  region?: string;
  tags?: string[];
  lastSeenAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    serviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    environment: {
      type: String,
      enum: ['production', 'staging', 'development'],
      default: 'production',
    },
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'down', 'unknown'],
      default: 'unknown',
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    host: {
      type: String,
    },
    region: {
      type: String,
      default: 'us-east-1',
    },
    tags: {
      type: [String],
      default: [],
    },
    lastSeenAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Service = mongoose.model<IService>('Service', ServiceSchema);

export default Service;