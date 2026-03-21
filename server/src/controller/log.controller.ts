import { Request, Response } from 'express';
import Log from '../models/log.model';

export const ingestLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, serviceName, level, message, metadata, traceId, spanId, stackTrace } = req.body;

    // Explicit validation — returns 400 not 500
    if (!serviceId || !serviceName) {
      res.status(400).json({
        success: false,
        message: 'serviceId and serviceName are required',
      });
      return;
    }

    if (!message) {
      res.status(400).json({
        success: false,
        message: 'message is required',
      });
      return;
    }

    const validLevels = ['info', 'warn', 'error', 'debug', 'fatal'];
    if (level && !validLevels.includes(level)) {
      res.status(400).json({
        success: false,
        message: `Invalid log level. Must be one of: ${validLevels.join(', ')}`,
      });
      return;
    }

    const log = await Log.create({
      serviceId,
      serviceName,
      level:      level      ?? 'info',
      message,
      metadata:   metadata   ?? {},
      traceId:    traceId    ?? '',
      spanId:     spanId     ?? '',
      stackTrace: stackTrace ?? '',
    });

    res.status(201).json({ success: true, data: log });
  } catch (err: any) {
    console.error('❌ ingestLog error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to ingest log',
      error: err.message,
    });
  }
};

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const { level, from, to, limit = '100' } = req.query;

    const filter: Record<string, unknown> = { serviceId };
    if (level) filter.level = level;
    if (from || to) {
      filter.timestamp = {
        ...(from && { $gte: new Date(from as string) }),
        ...(to && { $lte: new Date(to as string) }),
      };
    }

    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string));

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
};