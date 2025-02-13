import express from 'express';
import { Router } from 'express';
import { GetDriverData, GetDriverPlanning } from '../controllers/driver';

const router = Router();

router.get('/Planningsdeschauffeurs', GetDriverData);
router.get('/Planningsdeschauffeurs/:id', GetDriverPlanning);

export default router;