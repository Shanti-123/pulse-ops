import { Router } from 'express';
import {
  registerService,
  getServices,
  getServiceById,
  updateServiceStatus,
  deleteService,
} from '../controller/service.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// SDK registers service without auth
router.post('/', registerService);
// All authenticated users can view services
router.get('/', authMiddleware, getServices);
router.get('/:serviceId', authMiddleware, getServiceById);
// Only engineers and admins can update status
router.patch('/:serviceId/status', authMiddleware, requireRole('admin', 'engineer'), updateServiceStatus);
// Only admins can delete
router.delete('/:serviceId', authMiddleware, requireRole('admin'), deleteService);

export default router;