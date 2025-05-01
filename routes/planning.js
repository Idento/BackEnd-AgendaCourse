import express from 'express';
import { Router } from 'express';
import { GetPlanning, AddPlanning, DeletePlanning, GetPlanningNotes, AddPlanningNotes, GetPlanningNextDates } from '../controllers/planningController.js';
import { isAuthentified } from '../middlewares/sessionCheck.js';


const router = Router();

router.get('/get', isAuthentified, GetPlanning);
router.post('/getByDate', isAuthentified, GetPlanningNextDates);
router.post('/getNotes', isAuthentified, GetPlanningNotes);
router.post('/addNote', isAuthentified, AddPlanningNotes);
router.post('/add', isAuthentified, AddPlanning);
router.delete('/delete', isAuthentified, DeletePlanning);

export default router;