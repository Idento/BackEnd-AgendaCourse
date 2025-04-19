import express, { Router } from 'express';
import { GetDrivers, ModifyDrivers, DeleteDrivers, AddDrivers, DeleteAccount, GetHistoryData, ModifyAccount } from '../controllers/settingsController.js';
import { isAuthAndAdmin, isAuthentified } from '../middlewares/sessionCheck.js';
import { createUser, changePassword, regenPassword, CheckUserName } from '../controllers/userController.js';
import { getUsers } from '../controllers/userController.js';



const router = Router();

router.get('/get', isAuthentified, GetDrivers);
router.get('/getUser', isAuthentified, getUsers);
router.post('/getHistory', isAuthentified, GetHistoryData);
router.post('/CheckName', isAuthentified, CheckUserName)
router.post('/add', isAuthentified, AddDrivers);
router.post('/modify', isAuthentified, ModifyDrivers);
router.post('/modifyAccount', isAuthentified, ModifyAccount);
router.post('/changePassword', isAuthentified, changePassword);
router.post('/regeneratePassword', isAuthAndAdmin, regenPassword);
router.post('/addAccount', isAuthAndAdmin, createUser);
router.delete('/delete', isAuthentified, DeleteDrivers);
router.delete('/deleteAccount', isAuthAndAdmin, DeleteAccount);

export default router;