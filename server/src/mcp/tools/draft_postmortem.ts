import Groq from 'groq-sdk';

export interface DraftPostmortemInput {
  serviceId: string;
  serviceName: string;
  severity: string;
  title: string;
  triggeredAt: Date;
  rootCause: string;
  suggestedFix: string;
  affectedMetrics: {
    cpu?: number;
    memory?: number;
    latency?: number;
    errorRate?: number;
  };
  logsSummary: string;
  deploymentsSummary: string;
}

export interface DraftPostmortemOutput {
  success: boolean;
  postmortem: string;
}

export const draftPostmortem = async (
  input: DraftPostmortemInput
): Promise<DraftPostmortemOutput> => {
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are an expert SRE writing a production incident postmortem.

Incident Data:
- Service: ${input.serviceName} (${input.serviceId})
- Severity: ${input.severity}
- Title: ${input.title}
- Triggered At: ${input.triggeredAt.toISOString()}
- Root Cause: ${input.rootCause}
- Suggested Fix: ${input.suggestedFix}

Affected Metrics:
- CPU: ${input.affectedMetrics.cpu ?? 'N/A'}%
- Memory: ${input.affectedMetrics.memory ?? 'N/A'}%
- Latency: ${input.affectedMetrics.latency ?? 'N/A'}ms
- Error Rate: ${input.affectedMetrics.errorRate ?? 'N/A'}%

Logs Summary: ${input.logsSummary}
Deployments Summary: ${input.deploymentsSummary}

Write a professional postmortem report in this exact markdown structure:

## Incident Postmortem — ${input.title}

### Summary
[2-3 sentence overview]

### Timeline
[Key events with approximate times]

### Root Cause
[Detailed root cause analysis]

### Impact
[What was affected and estimated impact]

### Resolution
[Steps taken or recommended to resolve]

### Action Items
[3-5 concrete prevention steps]

### Lessons Learned
[Key takeaways for the team]`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const postmortem = response.choices[0]?.message?.content || '';
    return { success: true, postmortem };
  } catch (err) {
    return {
      success: false,
      postmortem: `Postmortem generation failed: ${err}`,
    };
  }
};