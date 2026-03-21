import mongoose, { Schema, Document } from 'mongoose';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'fatal';

export interface ILog extends Document {
  serviceId: string;
  serviceName: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

const LogSchema = new Schema<ILog>(
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
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug', 'fatal'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    traceId: {
      type: String,
    },
    spanId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    stackTrace: {
      type: String,
    },
  },
  {
    versionKey: false,
  }
);

LogSchema.index({ serviceId: 1, timestamp: -1 });
LogSchema.index({ level: 1, timestamp: -1 });

const Log = mongoose.model<ILog>('Log', LogSchema);

export default Log;