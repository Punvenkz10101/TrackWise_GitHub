import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';
const isDev = process.env.NODE_ENV !== 'production';

// Base64 url encode for Node.js (equivalent to btoa with URL safe replacements)
const base64UrlEncode = (obj) => {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

// Generate JWT token
const generateToken = (userId, name, email) => {
  try {
    return jwt.sign(
      { 
        userId, 
        name, 
        email, 
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days
      },
      JWT_SECRET
    );
  } catch (error) {
    console.error('JWT token generation error:', error);
    // Fallback for development mode if token generation fails
    if (isDev) {
      console.log('Using development fallback token');
      // Create a manual token for development purposes
      const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
      
      const payload = base64UrlEncode({
        userId, 
        name, 
        email, 
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
      });
      
      const signature = "dev_signature_only_for_development";
      
      return `${header}.${payload}.${signature}`;
    }
    throw error;
  }
};

// @route   POST /api/auth/signup
// @desc    Register a user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
    });

    // Save user to database
    await user.save();
    console.log(`New user created: ${email} (${user._id})`);

    // Generate token
    const token = generateToken(user._id, user.name, user.email);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle MongoDB duplicate key error (in case unique index catches what our check missed)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log(`User logged in: ${email} (${user._id})`);

    // Generate token
    const token = generateToken(user._id, user.name, user.email);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Provide more specific error message based on the error type
    if (error.name === 'MongoServerError') {
      return res.status(500).json({ message: 'Database error, please try again later' });
    }
    
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // The auth middleware already verified and set req.user
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    // Handle MongoDB ObjectId format errors
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 