import Log from '../../models/log.model';

export interface QueryLogsInput {
  serviceId: string;
  from?: Date;
  to?: Date;
  level?: 'info' | 'warn' | 'error' | 'debug';
  limit?: number;
}

export interface QueryLogsOutput {
  success: boolean;
  serviceId: string;
  count: number;
  logs: Array<{
    level: string;
    message: string;
    timestamp: Date;
    traceId?: string;
    stackTrace?: string;
    metadata?: Record<string, unknown>;
  }>;
  summary: string;
}

export const queryLogs = async (input: QueryLogsInput): Promise<QueryLogsOutput> => {
  try {
    const { serviceId, from, to, level, limit = 50 } = input;

    const filter: Record<string, unknown> = { serviceId };
    if (level) filter.level = level;
    if (from || to) {
      filter.timestamp = {
        ...(from && { $gte: from }),
        ...(to && { $lte: to }),
      };
    }

    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit);

    const errorCount = logs.filter(l => l.level === 'error').length;
    const warnCount = logs.filter(l => l.level === 'warn').length;

    const summary = logs.length === 0
      ? `No logs found for ${serviceId}`
      : `Found ${logs.length} logs for ${serviceId} — ${errorCount} errors, ${warnCount} warnings in the queried window`;

    return {
      success: true,
      serviceId,
      count: logs.length,
      logs: logs.map(l => ({
        level: l.level,
        message: l.message,
        timestamp: l.timestamp,
        traceId: l.traceId,
        stackTrace: l.stackTrace,
        metadata: l.metadata,
      })),
      summary,
    };
  } catch (err) {
    return {
      success: false,
      serviceId: input.serviceId,
      count: 0,
      logs: [],
      summary: `Failed to query logs: ${err}`,
    };
  }
};