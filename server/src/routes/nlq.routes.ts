import { Router } from 'express';
import { naturalLanguageQuery } from '../controller/nlq.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/query', authMiddleware, naturalLanguageQuery);

export default router;