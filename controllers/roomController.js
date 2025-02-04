import asyncHandler from 'express-async-handler';
import Room from '../models/Room.js';
import Redis from 'ioredis';

const redisClient = new Redis();
const DEFAULT_EXPIRATION = 3600;
const createRoom = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        res.status(400);
        throw new Error('Please provide both name and description for the group');
    }

 
    const groupExists = await Room.findOne({ name });

    if (groupExists) {
        res.status(400);
        throw new Error('Group with this name already exists');
    }

    const group = await Room.create({
        name,
        description,
        members: [req.user._id], 
    });

    if (group) {
        res.status(201).json({
            _id: group._id,
            name: group.name,
            description: group.description,
            members: group.members,
        });
    } else {
        res.status(400);
        throw new Error('Invalid group data');
    }
});

const getAllRooms = asyncHandler(async (req, res) => {
    redisClient.get("rooms", async (err, data) => {
        if (err) {
            console.error("Error fetching from Redis:", err);
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }

        if (data) {
            res.status(200).json(JSON.parse(data));
            console.log("cache hit");
        } else {
            console.log("cache miss");
            try {
                const groups = await Room.find().populate('members', 'username email');
                redisClient.setex("rooms", DEFAULT_EXPIRATION, JSON.stringify(groups), (err) => {
                    if (err) {
                        console.error("Error setting Redis key:", err);
                    }
                });
                res.status(200).json(groups);
            } catch (error) {
                console.error("Error fetching from database:", error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        }
    });
});

const joinRoom = asyncHandler(async (req, res) => {
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Room.findById(groupId);

    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

   
    if (group.members.includes(userId)) {
        res.status(400);
        throw new Error('You are already a member of this group');
    }

    group.members.push(userId);
    await group.save();

    res.status(200).json({
        message: 'Successfully joined the group',
        group: group,
    });
});


const leaveRoom = asyncHandler(async (req, res) => {
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Room.findById(groupId);

    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

 
    if (!group.members.includes(userId)) {
        res.status(400);
        throw new Error('You are not a member of this group');
    }

    
    group.members = group.members.filter(member => member.toString() !== userId.toString());
    await group.save();

    res.status(200).json({
        message: 'Successfully left the group',
        group: group,
    });
});

export  {  createRoom, getAllRooms, joinRoom, leaveRoom };