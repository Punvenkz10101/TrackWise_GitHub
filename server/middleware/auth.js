import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';
const isDev = process.env.NODE_ENV !== 'production';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

// Development helper functions removed - using real database users only

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log(`❌ Auth failed: No token provided for ${req.method} ${req.path}`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      // Verify token with strict validation
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (!decoded || !decoded.userId) {
        console.log(`❌ Auth failed: Invalid token payload for ${req.method} ${req.path}`);
        return res.status(401).json({ message: 'Invalid token payload' });
      }
      
      // Ensure userId is a valid ObjectId
      if (!isValidObjectId(decoded.userId)) {
        console.log(`❌ Auth failed: Invalid userId format "${decoded.userId}" for ${req.method} ${req.path}`);
        return res.status(400).json({ message: 'Invalid user ID format in token' });
      }
      
      // Find user by ID to ensure they still exist
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        console.log(`❌ Auth failed: User not found for ID "${decoded.userId}" for ${req.method} ${req.path}`);
        return res.status(401).json({ message: 'User not found' });
      }
      
      // CRITICAL: Set both user object and userId string for consistent access
      req.user = user;
      req.userId = user._id.toString();
      req.authenticatedUserId = user._id.toString(); // Backup reference
      
      // Log successful authentication with request context
      console.log(`✅ Auth: ${user.email} (${req.userId}) → ${req.method} ${req.path}`);
      
      // Update lastLogin timestamp periodically (not on every request)
      const hoursSinceLastLogin = (new Date() - new Date(user.lastLogin)) / (1000 * 60 * 60);
      if (hoursSinceLastLogin > 6) {
        user.lastLogin = new Date();
        await user.save();
        console.log(`📅 Updated lastLogin for user: ${user.email}`);
      }
      
      next();
    } catch (jwtError) {
      console.error(`❌ JWT error for ${req.method} ${req.path}:`, jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token signature' });
      }
      
      return res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    console.error(`❌ Auth middleware error for ${req.method} ${req.path}:`, error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Additional helper function to ensure user authentication for strict routes
export const requireAuth = (req, res, next) => {
  if (!req.user?._id || !req.userId || !req.authenticatedUserId) {
    console.log(`❌ RequireAuth failed: Missing user data for ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized - valid user required' });
  }
  next();
};

// Helper to validate ObjectId format
export const validateObjectId = (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  return true;
};

// Helper to create user-scoped queries - NEVER accept userId from client
export const createUserScopedQuery = (req, baseQuery = {}) => {
  if (!req.userId) {
    throw new Error('No authenticated user ID available for scoped query');
  }
  return { ...baseQuery, userId: req.userId };
};

// Helper for user-scoped updates/deletes - prevents cross-user access
export const createUserScopedSelector = (req, id) => {
  if (!req.userId) {
    throw new Error('No authenticated user ID available for scoped selector');
  }
  if (!validateObjectId(id)) {
    throw new Error('Invalid document ID format');
  }
  return { _id: id, userId: req.userId };
};

export default auth; 