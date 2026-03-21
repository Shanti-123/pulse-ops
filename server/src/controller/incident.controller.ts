import { Request, Response } from 'express';
import Incident from '../models/incident.model';
import appEmitter from '../events/event.emitter';

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, severity, serviceId, assignedTo, page = '1', limit = '10' } = req.query;
    const filter: Record<string, unknown> = {};

    if (status)     filter.status   = status;
    if (severity)   filter.severity = severity;
    if (serviceId)  filter.serviceId = serviceId;
    if (assignedTo) filter.assignedTo = assignedTo;

    const pageNum  = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip     = (pageNum - 1) * limitNum;

    const [incidents, total] = await Promise.all([
      Incident.find(filter).sort({ triggeredAt: -1 }).skip(skip).limit(limitNum),
      Incident.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch incidents' });
  }
};

export const getIncidentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }
    res.status(200).json({ success: true, data: incident });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch incident' });
  }
};

export const updateIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }
    res.status(200).json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update incident' });
  }
};

export const resolveIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rootCause, notes } = req.body;

    if (!rootCause || !rootCause.trim()) {
      res.status(400).json({ success: false, message: 'rootCause is required to resolve incident' });
      return;
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }

    if (incident.status === 'closed') {
      res.status(400).json({ success: false, message: 'Incident is already closed' });
      return;
    }

    const descriptionUpdate = notes
      ? `${incident.description}\n\nResolution Notes: ${notes}`
      : incident.description;

    const updated = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        rootCause: rootCause.trim(),
        description: descriptionUpdate,
      },
      { new: true }
    );

    appEmitter.emit('incident:updated', updated);
    res.status(200).json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to resolve incident' });
  }
};

export const closeIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }

    if (incident.status === 'closed') {
      res.status(400).json({ success: false, message: 'Incident is already closed' });
      return;
    }

    if (incident.status !== 'resolved') {
      res.status(400).json({
        success: false,
        message: 'Incident must be resolved before closing',
      });
      return;
    }

    const updated = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    );

    appEmitter.emit('incident:updated', updated);
    res.status(200).json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to close incident' });
  }
};

export const assignIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo || typeof assignedTo !== 'string' || !assignedTo.trim()) {
      res.status(400).json({
        success: false,
        message: 'assignedTo is required',
      });
      return;
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }

    if (incident.status === 'closed') {
      res.status(400).json({
        success: false,
        message: 'Cannot assign a closed incident',
      });
      return;
    }

    const updated = await Incident.findByIdAndUpdate(
      req.params.id,
      { assignedTo: assignedTo.trim() },
      { new: true }
    );

    appEmitter.emit('incident:updated', updated);
    res.status(200).json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to assign incident' });
  }
};

export const getIncidentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, hoursBack = '24' } = req.query;
    const since = new Date(Date.now() - parseInt(hoursBack as string) * 60 * 60 * 1000);

    const filter: Record<string, unknown> = {
      triggeredAt: { $gte: since },
    };
    if (serviceId) filter.serviceId = serviceId;

    const [
      total, open, investigating, resolved, closed,
      critical, high, medium, low,
    ] = await Promise.all([
      Incident.countDocuments(filter),
      Incident.countDocuments({ ...filter, status: 'open' }),
      Incident.countDocuments({ ...filter, status: 'investigating' }),
      Incident.countDocuments({ ...filter, status: 'resolved' }),
      Incident.countDocuments({ ...filter, status: 'closed' }),
      Incident.countDocuments({ ...filter, severity: 'critical' }),
      Incident.countDocuments({ ...filter, severity: 'high' }),
      Incident.countDocuments({ ...filter, severity: 'medium' }),
      Incident.countDocuments({ ...filter, severity: 'low' }),
    ]);

    const resolvedIncidents = await Incident.find({
      ...filter,
      status: { $in: ['resolved', 'closed'] },
      resolvedAt: { $exists: true },
    }).select('triggeredAt resolvedAt');

    let avgResolutionTimeMinutes = 0;
    if (resolvedIncidents.length > 0) {
      const totalMs = resolvedIncidents.reduce((sum, inc) => {
        return sum + (inc.resolvedAt!.getTime() - inc.triggeredAt.getTime());
      }, 0);
      avgResolutionTimeMinutes = Math.round(totalMs / resolvedIncidents.length / 60000);
    }

    res.status(200).json({
      success: true,
      data: {
        period: `Last ${hoursBack} hours`,
        total,
        byStatus: { open, investigating, resolved, closed },
        bySeverity: { critical, high, medium, low },
        avgResolutionTimeMinutes,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to get incident stats' });
  }
};