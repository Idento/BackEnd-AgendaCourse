import express from 'express';
import { Router } from 'express';
import { GetDriverData, GetDriverPlanning } from '../controllers/driverController.js';

const router = Router();

router.get('/get', GetDriverData);
router.get('/getdriver/:id', GetDriverPlanning);

export default router;