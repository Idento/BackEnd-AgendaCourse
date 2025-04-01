import express from 'express';
import { Router } from 'express';
import { GetDriverData, GetDriverPlanning } from '../controllers/driverController.js';
import { isAuthentified } from '../middlewares/sessionCheck.js';

const router = Router();

router.get('/get', isAuthentified, GetDriverData);
router.get('/getdriver/:id', isAuthentified, GetDriverPlanning);

export default router;