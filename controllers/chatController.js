import express from 'express';
import Chat from '../models/Chat.js';
import Redis from 'ioredis';

const redisClient = new Redis();
const DEFAULT_EXPIRATION = 3600;
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
    redisClient.get(`chat:${req.params.roomId}`, async (err, data) => {
        if (err) {
            console.error("Error fetching from Redis:", err);
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
        if(data){
            res.status(200).json(JSON.parse(data));
            console.log("cache hit");
        }
        else
        {
            console.log("cache miss");
            try {
                const chat = await Chat.find({ room: req.params.roomId }).populate('user', 'username').sort({ createdAt: 1 });
                redisClient.setex(`chat:${req.params.roomId}`, DEFAULT_EXPIRATION, JSON.stringify(chat), (err) => {
                    if (err) {
                        console.error("Error setting Redis key:", err);
                    }
                });
                res.status(200).json(chat);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        }
    });
}