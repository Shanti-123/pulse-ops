import Groq from 'groq-sdk';

export interface AnalyzeAnomalyInput {
  serviceId: string;
  serviceName: string;
  severity: string;
  title: string;
  description: string;
  affectedMetrics: {
    cpu?: number;
    memory?: number;
    latency?: number;
    errorRate?: number;
  };
  logsSummary: string;
  deploymentsSummary: string;
}

export interface AnalyzeAnomalyOutput {
  success: boolean;
  summary: string;
  rootCause: string;
  suggestedFix: string;
  confidence: number;
}

export const analyzeAnomaly = async (
  input: AnalyzeAnomalyInput
): Promise<AnalyzeAnomalyOutput> => {
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are an expert Site Reliability Engineer (SRE) analyzing a production incident.

Incident Details:
- Service: ${input.serviceName} (${input.serviceId})
- Severity: ${input.severity}
- Title: ${input.title}
- Description: ${input.description}

Affected Metrics:
- CPU: ${input.affectedMetrics.cpu ?? 'N/A'}%
- Memory: ${input.affectedMetrics.memory ?? 'N/A'}%
- Latency: ${input.affectedMetrics.latency ?? 'N/A'}ms
- Error Rate: ${input.affectedMetrics.errorRate ?? 'N/A'}%

Recent Logs Summary:
${input.logsSummary}

Recent Deployments Summary:
${input.deploymentsSummary}

Analyze this incident and respond in this exact JSON format:
{
  "summary": "2-3 sentence summary of what is happening",
  "rootCause": "Most likely root cause based on the data",
  "suggestedFix": "Specific actionable fix to resolve the incident",
  "confidence": 0.85
}

Respond with JSON only. No markdown, no explanation.`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const raw = response.choices[0]?.message?.content || '';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

    return {
      success: true,
      summary: parsed.summary,
      rootCause: parsed.rootCause,
      suggestedFix: parsed.suggestedFix,
      confidence: parsed.confidence,
    };
  } catch (err) {
    return {
      success: false,
      summary: 'AI analysis failed',
      rootCause: 'Unable to determine root cause',
      suggestedFix: 'Manual investigation required',
      confidence: 0,
    };
  }
};  