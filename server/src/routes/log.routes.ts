import { Router } from 'express';
import { ingestLog, getLogs } from '../controller/log.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// SDK pushes logs without auth — no token needed
router.post('/', ingestLog);

// Only admin and engineer can read logs
router.get('/',            authMiddleware, requireRole('admin', 'engineer'), getLogs);
router.get('/:serviceId',  authMiddleware, requireRole('admin', 'engineer'), getLogs);

export default router;