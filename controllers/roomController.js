import asyncHandler from 'express-async-handler';
import Room from '../models/Room.js';

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
    const groups = await Room.find().populate('members', 'username email');

    res.status(200).json(groups);
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