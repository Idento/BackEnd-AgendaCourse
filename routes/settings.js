import express, { Router } from 'express';
import { GetDrivers, ModifyDrivers, DeleteDrivers, AddDrivers } from '../controllers/settingsController.js';



const router = Router();

router.get('/get', GetDrivers);
router.post('/add', AddDrivers);
router.post('/modify', ModifyDrivers);
router.delete('/delete', DeleteDrivers);

export default router;