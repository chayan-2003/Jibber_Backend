import {createRoom, getAllRooms, joinRoom, leaveRoom}  from '../controllers/roomController.js';
import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js';


const router = express.Router();
router.post('/create', verifyToken, createRoom);
router.get('/all', verifyToken, getAllRooms);
router.post('/join/:id', verifyToken, joinRoom);
router.post('/leave/:id', verifyToken, leaveRoom);
export default router;
