import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Handling registration
const register = asyncHandler(async (req, res) => {
    const { username, password, email } = req.body;

    // Validation logic
    if (!username || !password || !email) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
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

// Login Functionality
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
        res.status(400);
        throw new Error('Invalid credentials');
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        res.status(400);
        throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken(user._id);

    // Set the cookie with additional options
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        sameSite: 'lax', // Options: 'lax', 'strict', 'none'
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
        path: '/', // Cookie is accessible throughout the site
    });

    // Respond with user data and token
    res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: token,
    });
});

//logout functionality 
const logout = asyncHandler(async (req, res) => { 
    res.clearCookie('token', { path: '/' });
    res.status(200).json({
        message: 'Logged out successfully',
    });
});
//user profile 

const profile = asyncHandler(async (req, res) => {
    // Access the authenticated user's information
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Extract the first name from the username
    const firstName = user.username.split(' ')[0];

    res.json({
        _id: user._id,
        username: user.username,
        email: user.email
    });
});
//chedk user auth status
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

//exporting the functions

export  { register, login ,logout ,profile ,checkAuthStatus};