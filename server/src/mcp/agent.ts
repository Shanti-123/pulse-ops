import { IIncident } from '../models/incident.model';
import Incident from '../models/incident.model';
import appEmitter from '../events/event.emitter';
import { queryLogs } from './tools/query_logs';
import { checkDeployments } from './tools/check_deployment';
import { analyzeAnomaly } from './tools/analyze_anomaly';
import { draftPostmortem } from './tools/draft_postmortem';
import { suggestRunbook } from './tools/suggest_runbook';

interface AgentStep {
  incidentId: string;
  step: number;
  totalSteps: number;
  tool: string;
  status: 'running' | 'complete' | 'failed';
  summary: string;
  timestamp: Date;
}

const emitStep = (step: AgentStep): void => {
  appEmitter.emit('agent:step', step);
  console.log(`🤖 [${step.step}/${step.totalSteps}] ${step.tool} — ${step.summary}`);
};

const runAgent = async (incident: IIncident): Promise<void> => {
  const TOTAL_STEPS = 5;
  console.log(`\n🤖 MCP Agent started for incident: ${incident.incidentId}`);

  try {
    const incidentTime = incident.triggeredAt;
    const windowStart = new Date(incidentTime.getTime() - 30 * 60 * 1000);

    // Step 1 — Query logs
    emitStep({
      incidentId: incident.incidentId,
      step: 1,
      totalSteps: TOTAL_STEPS,
      tool: 'query_logs',
      status: 'running',
      summary: `Querying logs for ${incident.serviceId}...`,
      timestamp: new Date(),
    });

    const logsResult = await queryLogs({
      serviceId: incident.serviceId,
      from: windowStart,
      to: incidentTime,
      limit: 50,
    });

    emitStep({
      incidentId: incident.incidentId,
      step: 1,
      totalSteps: TOTAL_STEPS,
      tool: 'query_logs',
      status: 'complete',
      summary: logsResult.summary,
      timestamp: new Date(),
    });

    // Step 2 — Check deployments
    emitStep({
      incidentId: incident.incidentId,
      step: 2,
      totalSteps: TOTAL_STEPS,
      tool: 'check_deployments',
      status: 'running',
      summary: `Checking deployments for ${incident.serviceId}...`,
      timestamp: new Date(),
    });

    const deploymentsResult = await checkDeployments({
      serviceId: incident.serviceId,
      withinHours: 24,
    });

    emitStep({
      incidentId: incident.incidentId,
      step: 2,
      totalSteps: TOTAL_STEPS,
      tool: 'check_deployments',
      status: 'complete',
      summary: deploymentsResult.summary,
      timestamp: new Date(),
    });

    // Step 3 — Analyze anomaly
    emitStep({
      incidentId: incident.incidentId,
      step: 3,
      totalSteps: TOTAL_STEPS,
      tool: 'analyze_anomaly',
      status: 'running',
      summary: 'Running AI analysis...',
      timestamp: new Date(),
    });

    const analysisResult = await analyzeAnomaly({
      serviceId: incident.serviceId,
      serviceName: incident.serviceName,
      severity: incident.severity,
      title: incident.title,
      description: incident.description,
      affectedMetrics: incident.affectedMetrics,
      logsSummary: logsResult.summary,
      deploymentsSummary: deploymentsResult.summary,
    });

    emitStep({
      incidentId: incident.incidentId,
      step: 3,
      totalSteps: TOTAL_STEPS,
      tool: 'analyze_anomaly',
      status: analysisResult.success ? 'complete' : 'failed',
      summary: analysisResult.summary,
      timestamp: new Date(),
    });

    // Step 4 — Draft postmortem
    emitStep({
      incidentId: incident.incidentId,
      step: 4,
      totalSteps: TOTAL_STEPS,
      tool: 'draft_postmortem',
      status: 'running',
      summary: 'Drafting postmortem...',
      timestamp: new Date(),
    });

    const postmortemResult = await draftPostmortem({
      serviceId: incident.serviceId,
      serviceName: incident.serviceName,
      severity: incident.severity,
      title: incident.title,
      triggeredAt: incident.triggeredAt,
      rootCause: analysisResult.rootCause,
      suggestedFix: analysisResult.suggestedFix,
      affectedMetrics: incident.affectedMetrics,
      logsSummary: logsResult.summary,
      deploymentsSummary: deploymentsResult.summary,
    });

    emitStep({
      incidentId: incident.incidentId,
      step: 4,
      totalSteps: TOTAL_STEPS,
      tool: 'draft_postmortem',
      status: postmortemResult.success ? 'complete' : 'failed',
      summary: postmortemResult.success
        ? 'Postmortem drafted successfully'
        : 'Postmortem generation failed',
      timestamp: new Date(),
    });

    // Step 5 — Suggest runbook
    emitStep({
      incidentId: incident.incidentId,
      step: 5,
      totalSteps: TOTAL_STEPS,
      tool: 'suggest_runbook',
      status: 'running',
      summary: 'Generating runbook...',
      timestamp: new Date(),
    });

    const runbookResult = await suggestRunbook({
      serviceId: incident.serviceId,
      serviceName: incident.serviceName,
      severity: incident.severity,
      title: incident.title,
      rootCause: analysisResult.rootCause,
      affectedMetrics: incident.affectedMetrics,
    });

    emitStep({
      incidentId: incident.incidentId,
      step: 5,
      totalSteps: TOTAL_STEPS,
      tool: 'suggest_runbook',
      status: runbookResult.success ? 'complete' : 'failed',
      summary: runbookResult.success
        ? 'Runbook generated successfully'
        : 'Runbook generation failed',
      timestamp: new Date(),
    });

    // Update incident with all AI results
    const updated = await Incident.findByIdAndUpdate(
      incident._id,
      {
        status: 'investigating',
        rootCause: analysisResult.rootCause,
        aiAnalysis: {
          summary: analysisResult.summary,
          suggestedFix: analysisResult.suggestedFix,
          confidence: analysisResult.confidence,
          analyzedAt: new Date(),
        },
        postmortem: postmortemResult.postmortem,
        runbook: runbookResult.runbook,
      },
      { new: true }
    );

    console.log(`✅ MCP Agent completed for incident: ${incident.incidentId}`);

    // Broadcast completion
    appEmitter.emit('agent:complete', {
      incidentId: incident.incidentId,
      rootCause: analysisResult.rootCause,
      confidence: analysisResult.confidence,
      timestamp: new Date(),
    });

    appEmitter.emit('incident:updated', updated);

  } catch (err) {
    console.error(`❌ MCP Agent failed for ${incident.incidentId}:`, err);

    appEmitter.emit('agent:step', {
      incidentId: incident.incidentId,
      step: 0,
      totalSteps: 5,
      tool: 'agent',
      status: 'failed',
      summary: `Agent failed: ${err}`,
      timestamp: new Date(),
    });
  }
};

export const startMCPAgent = (): void => {
  appEmitter.on('incident:created', async (incident: IIncident) => {
    runAgent(incident).catch(err => {
      console.error('❌ MCP Agent unhandled error:', err);
    });
  });

  console.log('🤖 MCP Agent started');
};