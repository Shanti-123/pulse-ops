import Deployment from '../../models/deployment.model';

export interface CheckDeploymentsInput {
  serviceId: string;
  withinHours?: number;
}

export interface CheckDeploymentsOutput {
  success: boolean;
  serviceId: string;
  count: number;
  recentDeployments: Array<{
    version: string;
    previousVersion: string;
    status: string;
    deployedBy: string;
    deployedAt: Date;
    commitHash?: string;
    branch?: string;
    changelog?: string;
  }>;
  hasRecentFailure: boolean;
  summary: string;
}

export const checkDeployments = async (
  input: CheckDeploymentsInput
): Promise<CheckDeploymentsOutput> => {
  try {
    const { serviceId, withinHours = 24 } = input;

    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);

    const deployments = await Deployment.find({
      serviceId,
      deployedAt: { $gte: since },
    }).sort({ deployedAt: -1 });

    const hasRecentFailure = deployments.some(
      d => d.status === 'failed' || d.status === 'rolled-back'
    );

    let summary = '';
    if (deployments.length === 0) {
      summary = `No deployments found for ${serviceId} in the last ${withinHours} hours`;
    } else {
      const latest = deployments[0];
      summary = `${deployments.length} deployment(s) in last ${withinHours}h. ` +
        `Latest: v${latest.version} by ${latest.deployedBy} — status: ${latest.status}.` +
        (hasRecentFailure ? ' ⚠️ Recent failure or rollback detected.' : '');
    }

    return {
      success: true,
      serviceId,
      count: deployments.length,
      recentDeployments: deployments.map(d => ({
        version: d.version,
        previousVersion: d.previousVersion,
        status: d.status,
        deployedBy: d.deployedBy,
        deployedAt: d.deployedAt,
        commitHash: d.commitHash,
        branch: d.branch,
        changelog: d.changelog,
      })),
      hasRecentFailure,
      summary,
    };
  } catch (err) {
    return {
      success: false,
      serviceId: input.serviceId,
      count: 0,
      recentDeployments: [],
      hasRecentFailure: false,
      summary: `Failed to check deployments: ${err}`,
    };
  }
};