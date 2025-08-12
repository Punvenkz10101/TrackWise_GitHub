import jwt from 'jsonwebtoken';
import User from './models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';

/**
 * Socket.IO authentication middleware
 * Validates JWT token and sets user context for socket connections
 */
export const authenticateSocket = async (socket, next) => {
  try {
    // Get token from auth query parameter or handshake headers
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
                  socket.request.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log(`❌ Socket auth failed: No token provided for ${socket.id}`);
      return next(new Error('Authentication required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      console.log(`❌ Socket auth failed: Invalid token payload for ${socket.id}`);
      return next(new Error('Invalid token'));
    }

    // Find user in database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log(`❌ Socket auth failed: User not found for ${socket.id}`);
      return next(new Error('User not found'));
    }

    // Set user context on socket
    socket.userId = user._id.toString();
    socket.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    };

    console.log(`✅ Socket authenticated: ${user.email} (${socket.userId}) → ${socket.id}`);
    next();
  } catch (error) {
    console.error(`❌ Socket auth error for ${socket.id}:`, error.message);
    next(new Error('Authentication failed'));
  }
};

/**
 * Helper to create user-scoped room names
 * Ensures users can only join rooms they have access to
 */
export const createUserScopedRoom = (userId, roomType, roomId = null) => {
  if (roomId) {
    return `${roomType}_${userId}_${roomId}`;
  }
  return `${roomType}_${userId}`;
};

/**
 * Helper to validate user access to a room
 * Supports both user-scoped and shared collaborative rooms
 */
export const validateRoomAccess = (socket, roomName) => {
  const userId = socket.userId;
  
  if (!userId) {
    console.log(`❌ Room access denied: Socket ${socket.id} not authenticated`);
    return false;
  }

  // 1. User-scoped rooms (personal rooms) - only owner can access
  if (roomName.includes(`_${userId}_`) || roomName.endsWith(`_${userId}`)) {
    console.log(`✅ Room access granted: User ${userId} accessing personal room ${roomName}`);
    return true;
  }

  // 2. Shared study rooms (collaborative) - multiple users can join
  // These are rooms created for collaborative study sessions
  if (roomName.startsWith('study_') && !roomName.includes('_user_')) {
    console.log(`✅ Room access granted: User ${userId} accessing shared study room ${roomName}`);
    return true;
  }

  // 3. Public rooms or rooms with specific patterns
  // Add more patterns here as needed for different room types
  
  // Deny access to prevent cross-user data leakage for private rooms
  console.log(`❌ Room access denied: User ${userId} cannot access private room ${roomName}`);
  return false;
};

/**
 * Enhanced room join with user validation
 */
export const joinUserRoom = (socket, roomType, roomId = null) => {
  if (!socket.userId) {
    socket.emit('error', { message: 'Authentication required' });
    return null;
  }

  const roomName = createUserScopedRoom(socket.userId, roomType, roomId);
  socket.join(roomName);
  
  console.log(`🏠 User ${socket.user.email} joined room: ${roomName}`);
  return roomName;
};

export default {
  authenticateSocket,
  createUserScopedRoom,
  validateRoomAccess,
  joinUserRoom
};
