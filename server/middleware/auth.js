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

// Create a valid MongoDB ObjectId for development
const createDevUserId = () => {
  // Generate a valid MongoDB ObjectId
  return new mongoose.Types.ObjectId().toString();
};

// Get or create a dev user ID - stores it in memory during the server session
let DEV_USER_ID = null;

const getDevUserId = () => {
  if (!DEV_USER_ID) {
    DEV_USER_ID = createDevUserId();
    console.log(`Created development user ID: ${DEV_USER_ID}`);
  }
  return DEV_USER_ID;
};

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let decoded;
    
    // Handle development mode differently
    if (isDev) {
      try {
        // Try to decode the token, but don't validate the signature in dev mode
        const parts = token.split('.');
        if (parts.length === 3) {
          // This is a JWT-formatted token
          const payload = parts[1];
          try {
            // Base64 decode and parse as JSON
            const decodedPayload = JSON.parse(
              Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
            );
            
            // Check if it's a development token
            if (decodedPayload.email?.includes('dev@')) {
              // Use the userId from the token if it's a valid ObjectId, otherwise use DEV_USER_ID
              const userId = isValidObjectId(decodedPayload.userId) 
                ? decodedPayload.userId 
                : getDevUserId();
              
              req.userId = userId;
              req.user = {
                _id: userId,
                name: decodedPayload.name || 'Development User',
                email: decodedPayload.email
              };
              console.log(`Development mode auth: User ID ${req.userId}`);
              return next();
            }
          } catch (decodeError) {
            console.error('Error decoding token payload:', decodeError);
          }
        }
      } catch (error) {
        console.log('Development token parsing failed, falling back to normal auth:', error);
      }
    }
    
    // Production mode or fallback for dev mode
    try {
      // Verify token
      decoded = jwt.verify(token, JWT_SECRET);
      
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Ensure userId is a valid ObjectId
      if (!decoded.userId || !isValidObjectId(decoded.userId)) {
        return res.status(400).json({ message: 'Invalid user ID format in token' });
      }
      
      try {
        // Find user by ID
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }
        
        // Set user in request
        req.user = user;
        req.userId = user._id;
        
        // Update lastLogin timestamp periodically (not on every request)
        const hoursSinceLastLogin = (new Date() - new Date(user.lastLogin)) / (1000 * 60 * 60);
        if (hoursSinceLastLogin > 6) { // Update lastLogin if more than 6 hours have passed
          user.lastLogin = new Date();
          await user.save();
          console.log(`Updated lastLogin for user: ${user.email}`);
        }
        
        next();
      } catch (dbError) {
        console.error('Database error in auth middleware:', dbError);
        
        if (dbError.kind === 'ObjectId') {
          return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        return res.status(500).json({ message: 'Database error during authentication' });
      }
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      return res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export default auth; 