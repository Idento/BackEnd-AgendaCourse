import express, { Router } from 'express';
import GetDrivers from '../controllers/settings';
import ModifyDrivers from '../controllers/settings';
import DeleteDrivers from '../controllers/settings';


const router = Router();

router.get('/Parametres', GetDrivers);
router.post('/Parametres/modify', ModifyDrivers);
router.delete('/Parametres/delete', DeleteDrivers);

export default router;