import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
} from '../controller/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refreshToken);
router.post('/logout',   authMiddleware, logout);

export default router;