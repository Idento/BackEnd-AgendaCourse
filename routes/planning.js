import express from 'express';
import { Router } from 'express';
import { GetPlanning, AddPlanning, DeletePlanning } from '../controllers/planningController.js';


const router = Router();

router.get('/get', GetPlanning);
router.post('/add', AddPlanning);
router.delete('/delete', DeletePlanning);

export default router;