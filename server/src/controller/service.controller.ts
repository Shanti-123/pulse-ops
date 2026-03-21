import { Request, Response } from 'express';
import Service from '../models/service.model';

export const registerService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, name, environment, version, description, host, region } = req.body;

    if (!serviceId || !name) {
      res.status(400).json({ success: false, message: 'serviceId and name are required' });
      return;
    }

    // Check duplicate
    const existing = await Service.findOne({ serviceId, isDeleted: false });
    if (existing) {
      res.status(409).json({ success: false, message: `Service "${serviceId}" already registered` });
      return;
    }

    const service = await Service.create({
      serviceId, name, environment, version, description, host, region,
    });

    res.status(201).json({ success: true, data: service });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ success: false, message: 'Service ID already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to register service', error: err.message });
  }
};

export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { environment, status } = req.query;
    const filter: Record<string, unknown> = {
      isDeleted: false,
    };

    if (environment) filter.environment = environment;
    if (status) filter.status = status;

    const services = await Service.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: services.length, data: services });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findOne({
      serviceId: req.params.serviceId,
      isDeleted: false,
    });
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }
    res.status(200).json({ success: true, data: service });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch service' });
  }
};

export const updateServiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = ['healthy', 'degraded', 'down', 'unknown'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status value' });
      return;
    }

    const service = await Service.findOneAndUpdate(
      { serviceId: req.params.serviceId, isDeleted: false },
      { status, lastSeenAt: new Date() },
      { new: true }
    );

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.status(200).json({ success: true, data: service });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update service status' });
  }
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findOneAndUpdate(
      { serviceId: req.params.serviceId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
};