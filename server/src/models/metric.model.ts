import mongoose, { Schema, Document } from 'mongoose';

export interface IMetric extends Document {
  serviceId: string;
  serviceName: string;
  timestamp: Date;
  metrics: {
    cpu: number;
    memory: number;
    latency: number;
    errorRate: number;
  };
  metadata: {
    host: string;
    region: string;
    version: string;
  };
}

const MetricSchema = new Schema<IMetric>(
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
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    metrics: {
      cpu: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      memory: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      latency: {
        type: Number,
        required: true,
        min: 0,
      },
      errorRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    },
    metadata: {
      host: { type: String, default: 'unknown' },
      region: { type: String, default: 'us-east-1' },
      version: { type: String, default: '1.0.0' },
    },
  },
  {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'serviceId',
      granularity: 'seconds',
    },
    autoCreate: false,
    versionKey: false,
  }
);

const Metric = mongoose.model<IMetric>('Metric', MetricSchema);

export default Metric;