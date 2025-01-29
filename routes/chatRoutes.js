import {createChat,getChat} from '../controllers/chatController.js';
import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', verifyToken, createChat);
router.get('/:roomId', verifyToken, getChat);
export default router;