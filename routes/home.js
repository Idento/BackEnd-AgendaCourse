import express from 'express';
import { Router } from 'express';
import { GetHomeData, DataToAdd, DeleteData } from '../controllers/homeController.js';



const router = Router();

router.get('/', GetHomeData);
router.post('/addData', DataToAdd);
router.delete('/deleteData', DeleteData);

export default router;