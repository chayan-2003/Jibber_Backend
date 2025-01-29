import express from 'express';
import Chat from '../models/Chat.js';

export const createChat = async (req, res) => {
    const { room, message } = req.body;
    try {
        const chat = await Chat.create({
            room:room,
            user:req.user._id,
            message:message,
        });
        const populatedChat=await Chat.findById(chat._id).populate('user','username email');
        res.status(201).json(populatedChat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//get message for a group 
export const getChat = async (req, res) => {
    try {
        const chat = await Chat.find({ room: req.params.roomId }).populate('user', 'username').sort({ createdAt: 1 });
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}