import { Request, Response } from 'express';
import Deployment from '../models/deployment.model';

export const createDeployment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      serviceId,
      serviceName,
      version,
      previousVersion,
      deployedBy,
      commitHash,
      branch,
      changelog,
      rollbackReason,
      metadata,
    } = req.body;

    // Explicit validation before hitting model
    if (!serviceId || !serviceName || !version || !deployedBy) {
      res.status(400).json({
        success: false,
        message: 'serviceId, serviceName, version and deployedBy are required',
      });
      return;
    }

    const deployment = await Deployment.create({
      serviceId,
      serviceName,
      version,
      previousVersion: previousVersion ?? 'unknown',  // ← default so model doesnt throw
      deployedBy,
      commitHash:      commitHash      ?? '',
      branch:          branch          ?? 'main',
      changelog:       changelog       ?? '',
      rollbackReason:  rollbackReason  ?? '',
      metadata: {
        environment: metadata?.environment ?? 'production',
        region:      metadata?.region      ?? 'us-east-1',
        host:        metadata?.host        ?? 'unknown',
      },
      deployedAt: new Date(),
    });

    res.status(201).json({ success: true, data: deployment });
  } catch (err: any) {
    console.error('❌ createDeployment error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create deployment',
      error: err.message,
    });
  }
};

export const getDeployments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, environment, limit = '50' } = req.query;
    const filter: Record<string, unknown> = {};

    if (serviceId)   filter.serviceId            = serviceId;
    if (environment) filter['metadata.environment'] = environment;

    const deployments = await Deployment.find(filter)
      .sort({ deployedAt: -1 })
      .limit(parseInt(limit as string));

    res.status(200).json({ success: true, count: deployments.length, data: deployments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch deployments', error: err.message });
  }
};

export const getDeploymentsByService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const { limit = '20' } = req.query;

    const deployments = await Deployment.find({ serviceId })
      .sort({ deployedAt: -1 })
      .limit(parseInt(limit as string));

    res.status(200).json({ success: true, count: deployments.length, data: deployments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch deployments', error: err.message });
  }
};