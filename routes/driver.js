import express from 'express';
import { Router } from 'express';
import { GetDriverData, GetDriverPlanning, GetDriverPlanningByDate } from '../controllers/driverController.js';
import { isAuthentified } from '../middlewares/sessionCheck.js';

const router = Router();

router.get('/get', isAuthentified, GetDriverData);
router.get('/getdriver/:id', isAuthentified, GetDriverPlanning);
router.post('/getdriverplanning/:id', isAuthentified, GetDriverPlanningByDate);

export default router;