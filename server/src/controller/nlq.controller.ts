import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import Metric from '../models/metric.model';
import Incident from '../models/incident.model';
import Log from '../models/log.model';
import Deployment from '../models/deployment.model';
import Service from '../models/service.model';

interface NLQResult {
  question: string;
  answer: string;
  data?: unknown;
  queryType: string;
}

const classifyQuestion = (question: string): string => {
  const q = question.toLowerCase();
  if (q.includes('incident') || q.includes('alert') || q.includes('outage')) return 'incidents';
  if (q.includes('metric') || q.includes('cpu') || q.includes('memory') || q.includes('latency')) return 'metrics';
  if (q.includes('log') || q.includes('error') || q.includes('warn')) return 'logs';
  if (q.includes('deploy') || q.includes('release') || q.includes('version')) return 'deployments';
  if (q.includes('service') || q.includes('health') || q.includes('status')) return 'services';
  return 'general';
};

const fetchContextData = async (queryType: string, question: string) => {
  const q = question.toLowerCase();

  const hoursBack = q.includes('last hour') ? 1
    : q.includes('last 24') || q.includes('today') ? 24
    : q.includes('last week') ? 168
    : q.includes('last month') ? 720
    : 24;

  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  switch (queryType) {
    case 'incidents': {
      const filter: Record<string, unknown> = {
        triggeredAt: { $gte: since },
      };
      if (q.includes('critical')) filter.severity = 'critical';
      if (q.includes('high')) filter.severity = 'high';
      if (q.includes('open')) filter.status = 'open';
      if (q.includes('resolved')) filter.status = 'resolved';
      if (q.includes('closed')) filter.status = 'closed';

      const total = await Incident.countDocuments(filter);
      const sample = await Incident.find(filter)
        .sort({ triggeredAt: -1 })
        .limit(3)
        .select('incidentId serviceId severity status title triggeredAt');

      return {
        data: { total, sample },
        context: `${total} incidents found`,
      };
    }

    case 'metrics': {
      const serviceMatch = question.match(/service[:\s]+([a-zA-Z0-9-_]+)/i);
      const filter: Record<string, unknown> = {
        timestamp: { $gte: since },
      };
      if (serviceMatch) filter.serviceId = serviceMatch[1];

      const total = await Metric.countDocuments(filter);
      const sample = await Metric.find(filter)
        .sort({ timestamp: -1 })
        .limit(3)
        .select('serviceId metrics timestamp');

      return {
        data: { total, sample },
        context: `${total} metric readings found`,
      };
    }

    case 'logs': {
      const filter: Record<string, unknown> = {
        timestamp: { $gte: since },
      };
      if (q.includes('error')) filter.level = 'error';
      if (q.includes('warn')) filter.level = 'warn';

      const total = await Log.countDocuments(filter);
      const sample = await Log.find(filter)
        .sort({ timestamp: -1 })
        .limit(3)
        .select('serviceId level message timestamp');

      return {
        data: { total, sample },
        context: `${total} log entries found`,
      };
    }

    case 'deployments': {
      const total = await Deployment.countDocuments({
        deployedAt: { $gte: since },
      });
      const sample = await Deployment.find({
        deployedAt: { $gte: since },
      })
        .sort({ deployedAt: -1 })
        .limit(3)
        .select('serviceId version status deployedBy deployedAt');

      return {
        data: { total, sample },
        context: `${total} deployments found`,
      };
    }

    case 'services': {
      const sample = await Service.find({})
        .sort({ name: 1 })
        .select('serviceId name environment status version');

      return {
        data: { total: sample.length, sample },
        context: `${sample.length} services registered`,
      };
    }

    default: {
      const [openCount, totalCount] = await Promise.all([
        Incident.countDocuments({ status: 'open' }),
        Incident.countDocuments({}),
      ]);
      const services = await Service.find({})
        .limit(3)
        .select('serviceId name status');

      return {
        data: { openIncidents: openCount, totalIncidents: totalCount, services },
        context: `${openCount} open incidents, ${services.length} services`,
      };
    }
  }
};

export const naturalLanguageQuery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'question is required and must be a non-empty string',
      });
      return;
    }

    if (question.length > 500) {
      res.status(400).json({
        success: false,
        message: 'question must be under 500 characters',
      });
      return;
    }

    const queryType = classifyQuestion(question);
    const { data, context } = await fetchContextData(queryType, question);

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Safely truncate data to avoid token limits
    const dataString = JSON.stringify(data, null, 2);
    const trimmedData = dataString.length > 800
      ? dataString.substring(0, 800) + '\n... (truncated)'
      : dataString;

    const prompt = `You are PulseOps AI — an observability assistant.

User asked: "${question}"

System data (${context}):
${trimmedData}

Answer in plain English, under 100 words. Be specific with numbers and names.`;

    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 256,
    });

    const answer = response.choices[0]?.message?.content || 'Unable to generate answer';

    const result: NLQResult = {
      question,
      answer,
      data,
      queryType,
    };

    res.status(200).json({ success: true, data: result });

  } catch (err: any) {
    console.error('❌ NLQ error:', err?.message || err);
    console.error('❌ NLQ status:', err?.status);
    res.status(500).json({
      success: false,
      message: 'Failed to process natural language query',
      error: err?.message,
    });
  }
};