import express from 'express';
import { Router } from 'express';
import GetHomeData from '../controllers/home';
import AddData from '../controllers/home';
import DeleteData from '../controllers/home';


const router = Router();

router.get('/', GetHomeData);
router.post('/addData', AddData);
router.delete('/deleteData', DeleteData);

export default router;