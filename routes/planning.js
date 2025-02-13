import express from 'express';
import { Router } from 'express';
import GetPlanning from '../controllers/planning';
import AddPlanning from '../controllers/planning';
import DeletePlanning from '../controllers/planning';

const router = Router();

router.get('/Plannings', GetPlanning);
router.post('/Plannings/add', AddPlanning);
router.delete('/Plannings/delete', DeletePlanning);

export default router;