import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import mongoose from 'mongoose';

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
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days
    },
    JWT_SECRET
  );
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }
    
    // Handle development mode - but still use real database users
    if (isDev && email.includes('dev-')) {
      console.log(`Development mode login attempt for: ${email}`);
      // Even in dev mode, try to find the actual user first
      const devUser = await User.findOne({ email });
      if (devUser) {
        console.log(`Found existing dev user: ${devUser.email} with ID ${devUser._id}`);
        const isMatch = await devUser.comparePassword(password);
        if (isMatch) {
          devUser.lastLogin = new Date();
          await devUser.save();
          const token = generateToken(devUser);
          return res.json({
            token,
            user: { id: devUser._id, name: devUser.name, email: devUser.email }
          });
        }
      }
      // If user doesn't exist in dev mode, don't create virtual users
      return res.status(400).json({ message: 'Invalid credentials. Please signup first.' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// @route   POST /api/auth/signup
// @desc    Register a user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    
    // Handle development mode - but still use real database
    if (isDev && email.includes('dev-')) {
      console.log(`Development mode signup for: ${email}`);
      // Continue with normal signup flow even in dev mode
    }
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    user = new User({ name, email, password });
    await user.save();
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user (validate token)
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    console.log(`🔍 Token validation request for user ${req.user?.email} (${req.userId})`);
    
    // User should already be attached by auth middleware
    if (!req.user || !req.userId) {
      console.log('❌ Auth middleware failed to set user');
      return res.status(401).json({ message: 'Authentication failed.' });
    }

    // Double-check user exists in database
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      console.log(`❌ User ${req.userId} not found in database`);
      return res.status(404).json({ message: 'User not found.' });
    }

    console.log(`✅ Token validation successful for user ${user.email} (${user._id})`);
    res.json({ 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      },
      valid: true
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ message: 'Server error during token validation.' });
  }
});

export default router; 