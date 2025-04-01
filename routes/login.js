import express from 'express';
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { login, logout, sessionInfo } from '../controllers/connectController.js';
import { isAuthentified } from '../middlewares/sessionCheck.js';

const router = Router();

router.post('/login', authenticate, login);
router.post('/logout', isAuthentified, logout);
router.get('/session', isAuthentified, sessionInfo);

export default router;