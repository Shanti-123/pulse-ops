import appEmitter from '../events/event.emitter';
import Incident from '../models/incident.model';
import Deployment from '../models/deployment.model';
import { AnomalyResult } from './anamoly.service';

const cooldownMap = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000;

const isOnCooldown = (serviceId: string): boolean => {
  const last = cooldownMap.get(serviceId);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
};

const findCorrelatedDeployment = async (
  serviceId: string
): Promise<string | undefined> => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const deployment = await Deployment.findOne({
    serviceId,
    deployedAt: { $gte: since },
  }).sort({ deployedAt: -1 });

  return deployment?._id?.toString();
};

export const startAlertService = (): void => {
  appEmitter.on('anomaly:detected', async (anomaly: AnomalyResult) => {
    try {
      if (isOnCooldown(anomaly.serviceId)) {
        console.log(`⏳ Cooldown active for ${anomaly.serviceId} — skipping incident creation`);
        return;
      }

      // Check for correlated deployment
      const correlatedDeploymentId = await findCorrelatedDeployment(anomaly.serviceId);

      const incident = await Incident.create({
        serviceId: anomaly.serviceId,
        serviceName: anomaly.serviceName,
        severity: anomaly.severity,
        status: 'open',
        title: anomaly.title,
        description: anomaly.description,
        triggeredAt: new Date(),
        affectedMetrics: anomaly.affectedMetrics,
        ...(correlatedDeploymentId && { correlatedDeploymentId }),
      });

      cooldownMap.set(anomaly.serviceId, Date.now());

      console.log(`🚨 Incident created: ${incident.incidentId} — ${incident.title}`);
      if (correlatedDeploymentId) {
        console.log(`🔗 Correlated with deployment: ${correlatedDeploymentId}`);
      }

      appEmitter.emit('incident:created', incident);
    } catch (err) {
      console.error('❌ AlertService error:', err);
    }
  });

  console.log('🚨 Alert Service started');
};