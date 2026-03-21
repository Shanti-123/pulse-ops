import { Router } from 'express';
import {
  createDeployment,
  getDeployments,
  getDeploymentsByService,
} from '../controller/deployment.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Only admin and engineer can create deployments
router.post('/',           authMiddleware, requireRole('admin', 'engineer'), createDeployment);
router.get('/',            authMiddleware, requireRole('admin', 'engineer'), getDeployments);
router.get('/:serviceId',  authMiddleware, requireRole('admin', 'engineer'), getDeploymentsByService);

export default router;