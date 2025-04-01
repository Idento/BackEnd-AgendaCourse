import express from 'express';
import { Router } from 'express';
import { GetHomeData, DataToAdd, DeleteData } from '../controllers/homeController.js';
import { isAuthentified } from '../middlewares/sessionCheck.js';



const router = Router();

router.get('/', isAuthentified, GetHomeData);
router.post('/addData', isAuthentified, DataToAdd);
router.delete('/deleteData', isAuthentified, DeleteData);

export default router;