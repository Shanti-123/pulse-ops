import Groq from 'groq-sdk';

export interface SuggestRunbookInput {
  serviceId: string;
  serviceName: string;
  severity: string;
  title: string;
  rootCause: string;
  affectedMetrics: {
    cpu?: number;
    memory?: number;
    latency?: number;
    errorRate?: number;
  };
}

export interface SuggestRunbookOutput {
  success: boolean;
  runbook: string;
}

export const suggestRunbook = async (
  input: SuggestRunbookInput
): Promise<SuggestRunbookOutput> => {
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are an expert SRE writing an emergency runbook for a production incident.

Incident:
- Service: ${input.serviceName} (${input.serviceId})
- Severity: ${input.severity}
- Title: ${input.title}
- Root Cause: ${input.rootCause}

Affected Metrics:
- CPU: ${input.affectedMetrics.cpu ?? 'N/A'}%
- Memory: ${input.affectedMetrics.memory ?? 'N/A'}%
- Latency: ${input.affectedMetrics.latency ?? 'N/A'}ms
- Error Rate: ${input.affectedMetrics.errorRate ?? 'N/A'}%

Write a step-by-step emergency runbook in this exact markdown structure:

## Emergency Runbook — ${input.title}

### Severity
${input.severity.toUpperCase()}

### Immediate Actions (First 5 Minutes)
[Numbered steps to take immediately]

### Investigation Steps
[Numbered diagnostic steps]

### Resolution Steps
[Numbered fix steps]

### Escalation
[When and who to escalate to]

### Rollback Procedure
[Steps to rollback if fix fails]

### Verification
[How to confirm the incident is resolved]`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const runbook = response.choices[0]?.message?.content || '';
    return { success: true, runbook };
  } catch (err) {
    return {
      success: false,
      runbook: `Runbook generation failed: ${err}`,
    };
  }
};