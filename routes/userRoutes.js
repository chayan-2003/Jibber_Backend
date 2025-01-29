import verifyToken from '../middlewares/authMiddleware.js';
import {register, login ,logout ,profile ,checkAuthStatus} from '../controllers/userController.js';
import express from 'express';


const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile',verifyToken, profile);
router.get('/auth/check', verifyToken, checkAuthStatus);

export default router;