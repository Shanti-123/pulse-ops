import { Router } from 'express';
import { ingestMetric, getMetrics, getLatestMetric } from '../controller/metric.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// No validateMetricPayload middleware — controller handles validation
router.post('/', ingestMetric);
router.get('/:serviceId/latest', authMiddleware, requireRole('admin', 'engineer'), getLatestMetric);
router.get('/:serviceId',        authMiddleware, requireRole('admin', 'engineer'), getMetrics);

export default router;