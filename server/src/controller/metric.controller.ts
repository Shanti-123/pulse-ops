import { Request, Response } from 'express';
import Metric from '../models/metric.model';
import appEmitter from '../events/event.emitter';

export const ingestMetric = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, serviceName, metrics, metadata } = req.body;

    // Explicit validation — returns 400 not 500
    if (!serviceId || !serviceName) {
      res.status(400).json({
        success: false,
        message: 'serviceId and serviceName are required',
      });
      return;
    }

    if (!metrics || typeof metrics !== 'object') {
      res.status(400).json({
        success: false,
        message: 'metrics object is required',
      });
      return;
    }

    const metric = await Metric.create({
      serviceId,
      serviceName,
      metrics: {
        cpu:       metrics.cpu       ?? 0,
        memory:    metrics.memory    ?? 0,
        latency:   metrics.latency   ?? 0,
        errorRate: metrics.errorRate ?? 0,
      },
      metadata: {
        host:    metadata?.host    ?? 'unknown',
        region:  metadata?.region  ?? 'us-east-1',
        version: metadata?.version ?? '1.0.0',
      },
    });

    appEmitter.emit('metric:ingested', {
      serviceId,
      serviceName,
      metrics: metric.metrics,
      metricId: metric._id,
    });

    res.status(201).json({ success: true, data: metric });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to ingest metric',
      error: err.message,
    });
  }
};

export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const { limit = '50', from, to } = req.query;

    const filter: Record<string, unknown> = { serviceId };

    if (from || to) {
      filter.timestamp = {
        ...(from && { $gte: new Date(from as string) }),
        ...(to   && { $lte: new Date(to as string)   }),
      };
    }

    const metrics = await Metric.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string));

    res.status(200).json({ success: true, count: metrics.length, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch metrics', error: err.message });
  }
};

export const getLatestMetric = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.params;

    const metric = await Metric.findOne({ serviceId }).sort({ timestamp: -1 });

    if (!metric) {
      res.status(404).json({ success: false, message: 'No metrics found for this service' });
      return;
    }

    res.status(200).json({ success: true, data: metric });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch latest metric', error: err.message });
  }
};