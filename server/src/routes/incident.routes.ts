import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  updateIncident,
  resolveIncident,
  closeIncident,
  assignIncident,
  getIncidentStats,
} from '../controller/incident.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authMiddleware, getIncidentStats);
router.get('/', authMiddleware, getIncidents);
router.get('/:id', authMiddleware, getIncidentById);
router.patch('/:id', authMiddleware, requireRole('admin', 'engineer'), updateIncident);
router.patch('/:id/resolve', authMiddleware, requireRole('admin', 'engineer'), resolveIncident);
router.patch('/:id/close', authMiddleware, requireRole('admin', 'engineer'), closeIncident);
router.patch('/:id/assign', authMiddleware, requireRole('admin', 'engineer'), assignIncident);

export default router;