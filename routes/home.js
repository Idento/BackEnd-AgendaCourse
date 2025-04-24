import express from 'express';
import { Router } from 'express';
import { GetHomeData, DataToAdd, DeleteData, GetHomeNotes, AddHomeNote } from '../controllers/homeController.js';
import { isAuthentified } from '../middlewares/sessionCheck.js';



const router = Router();

router.get('/', isAuthentified, GetHomeData);
router.post('/addData', isAuthentified, DataToAdd);
router.post('/getNotes', isAuthentified, GetHomeNotes);
router.post('/addNote', isAuthentified, AddHomeNote);
router.delete('/deleteData', isAuthentified, DeleteData);

export default router;