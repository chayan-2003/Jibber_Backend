import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};


const register = asyncHandler(async (req, res) => {
    const { username, password, email } = req.body;


    if (!username || !password || !email) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }


    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    const user = await User.create({
        username,
        email,
        password: hashedPassword,
        
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
           
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});


const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;


    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

   
    const user = await User.findOne({ email });

    if (!user) {
        res.status(400);
        throw new Error('Invalid credentials');
    }


    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        res.status(400);
        throw new Error('Invalid credentials');
    }


    const token = generateToken(user._id);

   
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });

  
    res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: token,
    });
});


const logout = asyncHandler(async (req, res) => { 
    res.clearCookie('token', { path: '/' });
    res.status(200).json({
        message: 'Logged out successfully',
    });
});


const profile = asyncHandler(async (req, res) => {
    
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
        res.status(401);
        throw new Error('User not found');
    }

    
    const firstName = user.username.split(' ')[0];

    res.json({
        _id: user._id,
        username: user.username,
        email: user.email
    });
});

const checkAuthStatus = asyncHandler(async (req, res) => {
    const decoded=jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    if(decoded)
    {
        res.json({message:'User is authenticated'});
    }
    else
    {
        res.status(401);
        throw new Error('User is not authenticated');
    }
});


export  { register, login ,logout ,profile ,checkAuthStatus};