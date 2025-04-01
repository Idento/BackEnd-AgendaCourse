import express from 'express';
import { Router } from 'express';
import { DeleteDatabdd } from '../controllers/bddmanager.js';

const router = Router();

router.delete('/delete', DeleteDatabdd);


export default router;