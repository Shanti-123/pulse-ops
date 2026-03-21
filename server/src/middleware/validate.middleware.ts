import { Request, Response, NextFunction } from 'express';

export const validateMetricPayload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { serviceId, serviceName, metrics } = req.body;

  if (!serviceId || !serviceName) {
    res.status(400).json({
      success: false,
      message: 'serviceId and serviceName are required',
    });
    return;
  }

  if (!metrics || typeof metrics !== 'object') {
    res.status(400).json({
      success: false,
      message: 'metrics object is required',
    });
    return;
  }

  next();
};