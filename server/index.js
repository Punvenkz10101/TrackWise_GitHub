import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes - using strict versions for data isolation
import authRoutes from './routes/auth.js';
import tasksRoutes from './routes/tasks_strict.js';
import notesRoutes from './routes/notes_strict.js';
import scheduleRoutes from './routes/schedule_strict.js';
import progressRoutes from './routes/progress.js';
import debugRoutes from './routes/debug.js';
import chatbotRoutes from './routes/chatbot.js';
import roomRoutes from './routes/roomRoutes.js';

// Configure environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'] 
    : ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://127.0.0.1:8080', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
// Extract the database name to make it easier to work with
const dbName = 'TrackWise';
const MONGO_URI = process.env.MONGO_URI || `mongodb+srv://puneethvenkat2k25:puneethvenkat%402k25@cluster0.4n8ass6.mongodb.net/${dbName}?retryWrites=true&w=majority`;

// MongoDB connection options
const mongoOptions = {
  // These options are removed since they are deprecated in newer MongoDB driver versions
  // and are automatically set to true by default
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  
  // Set the database name explicitly
  dbName: dbName
};

mongoose.connect(MONGO_URI, mongoOptions)
  .then(() => {
    console.log(`Connected to MongoDB Atlas - Database: ${dbName}`);
    
    // Log the available collections to help with debugging
    mongoose.connection.db.listCollections().toArray()
      .then(collections => {
        console.log('Available collections:');
        collections.forEach(collection => {
          console.log(` - ${collection.name}`);
        });
      })
      .catch(err => console.error('Failed to list collections:', err));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error('Error details:', err);
    
    // Provide more detailed error information
    if (err.message.includes('already exists with different case')) {
      console.error(`Database case sensitivity issue detected. Ensure the database name (${dbName}) matches exactly with what exists in MongoDB Atlas.`);
      console.error('Please check your MongoDB Atlas dashboard to confirm the exact database name.');
    }
    
    // Don't exit immediately in development mode to allow for fixes
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/debug', debugRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// Room management in memory
const roomTasks = new Map();
const roomMembers = new Map();
const roomPomodoros = new Map();
const rooms = new Map();
const whiteboardStates = new Map();

// Import socket authentication
import { authenticateSocket, joinUserRoom, createUserScopedRoom, validateRoomAccess } from './socketAuth.js';

// Apply authentication middleware to all socket connections
io.use(authenticateSocket);

// Socket.IO room logic with user authentication
io.on("connection", (socket) => {
  console.log(`✅ Authenticated client connected: ${socket.user.email} (${socket.userId}) → ${socket.id}`);

  // Handle room creation (supports both personal and shared rooms)
  socket.on("createRoom", async (roomData) => {
    try {
      const { roomKey: requestedRoomKey, creator, roomType = 'shared' } = roomData;
      
      let finalRoomKey;
      
      if (roomType === 'personal') {
        // Personal rooms are user-scoped
        finalRoomKey = createUserScopedRoom(socket.userId, 'study', requestedRoomKey);
        console.log(`🏠 User ${socket.user.email} creating personal room: ${finalRoomKey}`);
      } else {
        // Shared collaborative rooms use the original key with study prefix
        finalRoomKey = `study_${requestedRoomKey}`;
        console.log(`🏠 User ${socket.user.email} creating shared room: ${finalRoomKey}`);
      }

      // Initialize room data
      if (!roomMembers.has(finalRoomKey)) {
        roomMembers.set(finalRoomKey, new Map());
      }
      if (!roomTasks.has(finalRoomKey)) {
        roomTasks.set(finalRoomKey, []);
      }
      if (!roomPomodoros.has(finalRoomKey)) {
        roomPomodoros.set(finalRoomKey, {
          running: false,
          timeLeft: 0,
          startTime: null,
          duration: 0,
          interval: null,
          sessionCount: 0,
          createdBy: socket.userId, // Track room creator
          roomType: roomType
        });
      }

      // Add creator to room members (verified user)
      roomMembers.get(finalRoomKey).set(socket.id, {
        ...creator,
        userId: socket.userId,
        authenticated: true,
        isCreator: true
      });

      socket.join(finalRoomKey);

      // Send initial room state
      io.to(finalRoomKey).emit("roomCreated", {
        roomKey: finalRoomKey,
        originalRoomKey: requestedRoomKey,
        creator: { ...creator, userId: socket.userId },
        members: [creator.username],
        tasks: [],
        roomType: roomType
      });
      
      console.log(`✅ ${roomType} room created: ${finalRoomKey} by user ${socket.userId}`);
    } catch (error) {
      console.error(`❌ Room creation error for user ${socket.userId}:`, error);
      socket.emit("error", { message: "Error creating room" });
    }
  });

  // Handle room joining (supports both personal and shared rooms)
  socket.on("joinRoom", async ({ roomKey, username }) => {
    try {
      // Convert room key to proper format if needed
      let finalRoomKey = roomKey;
      
      // If it's a raw room key (from HTTP API), convert to shared room format
      if (!roomKey.includes('_') && !roomKey.startsWith('study_')) {
        finalRoomKey = `study_${roomKey}`;
        console.log(`🔄 Converted room key: ${roomKey} → ${finalRoomKey}`);
      }
      
      // CRITICAL: Validate room access for the authenticated user
      if (!validateRoomAccess(socket, finalRoomKey)) {
        socket.emit("error", { message: "Access denied to room" });
        return;
      }
      
      console.log(`🚪 User ${socket.user.email} joining room: ${finalRoomKey}`);
      socket.join(finalRoomKey);

      // Initialize room if it doesn't exist
      if (!roomMembers.has(finalRoomKey)) {
        roomMembers.set(finalRoomKey, new Map());
      }
      if (!roomTasks.has(finalRoomKey)) {
        roomTasks.set(finalRoomKey, []);
      }
      if (!rooms.has(finalRoomKey)) {
        rooms.set(finalRoomKey, {
          timer: {
            isRunning: false,
            timeLeft: 0,
            duration: 0,
            intervalId: null
          },
          breakTimer: {
            isRunning: false,
            timeLeft: 0,
            duration: 0
          },
          breakInterval: null,
          sessionCount: 0,
          breakSessionCount: 0
        });
      }

      // Add member to room
      roomMembers.get(finalRoomKey).set(socket.id, {
        username,
        userId: socket.userId,
        authenticated: true
      });

      // Get current room state
      const members = Array.from(roomMembers.get(finalRoomKey).values());
      const tasks = roomTasks.get(finalRoomKey);
      const room = rooms.get(finalRoomKey);

      // Send current state to the joining user
      const memberUsernames = members.map(member => member.username);
      socket.emit("roomJoined", {
        roomKey: finalRoomKey,
        originalRoomKey: roomKey,
        members: memberUsernames,
        tasks,
      });

      // Notify others about new user
      io.to(finalRoomKey).emit("userJoined", { username, members: memberUsernames, userId: socket.userId });

      // Send Pomodoro state if exists
      if (room?.timer) {
        socket.emit('pomodoroState', {
          running: room.timer.isRunning,
          timeLeft: room.timer.timeLeft,
          duration: room.timer.duration,
          sessionCount: room.sessionCount || 0
        });
      }

      // Send Break state if exists
      if (room?.breakTimer) {
        socket.emit('breakState', {
          running: room.breakTimer.isRunning,
          timeLeft: room.breakTimer.timeLeft,
          duration: room.breakTimer.duration,
          sessionCount: room.breakSessionCount || 0
        });
      }
    } catch (error) {
      socket.emit("error", { message: "Error joining room" });
    }
  });

  // Handle disconnection with room cleanup
  socket.on("disconnect", () => {
    roomMembers.forEach((members, roomKey) => {
      if (members.has(socket.id)) {
        const member = members.get(socket.id);
        members.delete(socket.id);

        // Notify room about user leaving
        const username = member?.username || 'Unknown User';
        io.to(roomKey).emit("userLeft", { username });

        // Clean up empty rooms
        if (members.size === 0) {
          roomMembers.delete(roomKey);
          roomTasks.delete(roomKey);
          rooms.delete(roomKey);
          
          // Clear any running timers
          const room = rooms.get(roomKey);
          if (room?.timer?.intervalId) {
            clearInterval(room.timer.intervalId);
          }
          if (room?.breakInterval) {
            clearInterval(room.breakInterval);
          }
        }
      }
    });
  });

  // Handle messages
  socket.on("sendMessage", ({ roomKey, message, sender }) => {
    const messageData = {
      id: Date.now(),
      sender,
      content: message,
      timestamp: new Date(),
    };
    io.to(roomKey).emit("newMessage", messageData);
  });

  // Todo list handlers
  socket.on("addTask", ({ roomKey, task }) => {
    if (!roomTasks.has(roomKey)) {
      roomTasks.set(roomKey, []);
    }

    const taskData = {
      id: Date.now().toString(),
      text: task,
      completed: false,
      createdBy: socket.id,
    };

    roomTasks.get(roomKey).push(taskData);
    io.to(roomKey).emit("taskAdded", taskData);
  });

  socket.on("deleteTask", ({ roomKey, taskId }) => {
    if (roomTasks.has(roomKey)) {
      const tasks = roomTasks.get(roomKey);
      roomTasks.set(roomKey, tasks.filter(task => task.id !== taskId));
      io.to(roomKey).emit("taskDeleted", taskId);
    }
  });

  socket.on("editTask", ({ roomKey, taskId, newText }) => {
    if (roomTasks.has(roomKey)) {
      const tasks = roomTasks.get(roomKey);
      roomTasks.set(roomKey, tasks.map(task => 
        task.id === taskId ? { ...task, text: newText } : task
      ));
      io.to(roomKey).emit("taskEdited", { taskId, newText });
    }
  });

  // Pomodoro timer handlers
  socket.on("startPomodoro", ({ roomKey, duration }) => {
    let room = rooms.get(roomKey) || {
      timer: { isRunning: false, timeLeft: 0, duration: 0, intervalId: null },
      breakTimer: { isRunning: false, timeLeft: 0, duration: 0 },
      breakInterval: null,
      sessionCount: 0,
      breakSessionCount: 0
    };
    
    // Clear existing interval if any
    if (room.timer?.intervalId) {
      clearInterval(room.timer.intervalId);
    }
    
    room.timer = {
      duration: parseInt(duration),
      timeLeft: parseInt(duration),
      isRunning: true,
      intervalId: setInterval(() => {
        if (room.timer.timeLeft > 0) {
          room.timer.timeLeft--;
          io.to(roomKey).emit('pomodoroTick', {
            timeLeft: room.timer.timeLeft,
            running: true
          });
        } else {
          clearInterval(room.timer.intervalId);
          room.timer.isRunning = false;
          room.sessionCount = (room.sessionCount || 0) + 1;
          io.to(roomKey).emit('pomodoroComplete', {
            sessionCount: room.sessionCount
          });
        }
      }, 1000)
    };

    rooms.set(roomKey, room);
    io.to(roomKey).emit('pomodoroStarted', {
      running: true,
      timeLeft: room.timer.timeLeft,
      duration: room.timer.duration,
      sessionCount: room.sessionCount || 0
    });
  });

  socket.on("pausePomodoro", ({ roomKey }) => {
    const room = rooms.get(roomKey);
    if (room?.timer) {
      clearInterval(room.timer.intervalId);
      room.timer.isRunning = false;
      room.timer.intervalId = null;
      
      io.to(roomKey).emit('pomodoroPaused', {
        running: false,
        timeLeft: room.timer.timeLeft,
        sessionCount: room.sessionCount || 0
      });
    }
  });

  socket.on("resetPomodoro", ({ roomKey }) => {
    const room = rooms.get(roomKey);
    if (room?.timer) {
      clearInterval(room.timer.intervalId);
      room.timer.timeLeft = 0;
      room.timer.isRunning = false;
      room.timer.intervalId = null;
      
      io.to(roomKey).emit('pomodoroReset', {
        running: false,
        timeLeft: 0,
        sessionCount: room.sessionCount || 0
      });
    }
  });

  // Add this socket handler inside the io.on("connection") block
  socket.on("leaveRoom", ({ roomKey, username }) => {
    if (roomMembers.has(roomKey)) {
      const members = roomMembers.get(roomKey);
      const member = members.get(socket.id);
      members.delete(socket.id);
      
      // Remove user from room
      socket.leave(roomKey);
      
      // Notify others in the room
      const username = member?.username || 'Unknown User';
      io.to(roomKey).emit("userLeft", { username });
      
      // Clean up empty rooms
      if (members.size === 0) {
        roomMembers.delete(roomKey);
        roomTasks.delete(roomKey);
        
        // Clear any running timers before deleting room
        const room = rooms.get(roomKey);
        if (room?.timer?.intervalId) {
          clearInterval(room.timer.intervalId);
        }
        if (room?.breakInterval) {
          clearInterval(room.breakInterval);
        }
        rooms.delete(roomKey);
      }
    }
  });

  // Add this inside your io.on("connection", (socket) => { ... }) block
  socket.on("durationChange", ({ roomKey, newDuration }) => {
    // Broadcast the duration change to all users in the room except the sender
    socket.to(roomKey).emit("durationChange", {
      newDuration: newDuration
    });
  });

  // New event handler for time duration change
  socket.on('changeDuration', (data) => {
    let room = rooms.get(data.roomId) || {
      timer: { isRunning: false, timeLeft: 0, duration: 0, intervalId: null },
      breakTimer: { isRunning: false, timeLeft: 0, duration: 0 },
      breakInterval: null,
      sessionCount: 0,
      breakSessionCount: 0
    };
    
    // Only update if timer is not running
    if (!room.timer?.isRunning) {
      room.timer.timeLeft = data.duration * 60;
      room.timer.duration = data.duration * 60;
      rooms.set(data.roomId, room);
      
      // Broadcast the duration change to all users in the same room
      io.to(data.roomId).emit('durationUpdated', {
        duration: data.duration,
        userId: socket.id
      });
    }
  });

  // Update the break timer implementation
  socket.on("startBreak", ({ roomKey, duration }) => {
    let room = rooms.get(roomKey) || {
      timer: { isRunning: false, timeLeft: 0, duration: 0, intervalId: null },
      breakTimer: { isRunning: false, timeLeft: 0, duration: 0 },
      breakInterval: null,
      sessionCount: 0,
      breakSessionCount: 0
    };
    
    // Clear existing break interval if any
    if (room.breakInterval) {
      clearInterval(room.breakInterval);
    }
    
    room.breakTimer = {
      duration: parseInt(duration),
      timeLeft: parseInt(duration),
      isRunning: true
    };

    room.breakInterval = setInterval(() => {
      if (room.breakTimer.timeLeft > 0) {
        room.breakTimer.timeLeft--;
        io.to(roomKey).emit('breakTick', {
          timeLeft: room.breakTimer.timeLeft,
          running: true
        });
      } else {
        clearInterval(room.breakInterval);
        room.breakTimer.isRunning = false;
        room.breakSessionCount = (room.breakSessionCount || 0) + 1;
        io.to(roomKey).emit('breakComplete', {
          sessionCount: room.breakSessionCount
        });
      }
    }, 1000);

    rooms.set(roomKey, room);
    io.to(roomKey).emit('breakStarted', {
      running: true,
      timeLeft: room.breakTimer.timeLeft,
      duration: room.breakTimer.duration,
      sessionCount: room.breakSessionCount || 0
    });
  });

  socket.on("pauseBreak", ({ roomKey }) => {
    const room = rooms.get(roomKey);
    if (room?.breakTimer) {
      clearInterval(room.breakInterval);
      room.breakTimer.isRunning = false;
      
      io.to(roomKey).emit('breakTick', {
        timeLeft: room.breakTimer.timeLeft,
        running: false
      });
    }
  });

  socket.on("resetBreak", ({ roomKey }) => {
    const room = rooms.get(roomKey);
    if (room) {
      clearInterval(room.breakInterval);
      if (room.breakTimer) {
        room.breakTimer.timeLeft = 0;
        room.breakTimer.isRunning = false;
      }
      
      io.to(roomKey).emit('breakTick', {
        timeLeft: 0,
        running: false
      });
    }
  });

  // Update the break duration change handler
  socket.on('changeBreakDuration', ({ roomId, duration }) => {
    let room = rooms.get(roomId) || {
      timer: { isRunning: false, timeLeft: 0, duration: 0, intervalId: null },
      breakTimer: { isRunning: false, timeLeft: 0, duration: 0 },
      breakInterval: null,
      sessionCount: 0,
      breakSessionCount: 0
    };
    
    // Only update if break timer is not running
    if (!room.breakTimer?.isRunning) {
      room.breakTimer.timeLeft = duration * 60;
      room.breakTimer.duration = duration * 60;
      rooms.set(roomId, room);
      
      io.to(roomId).emit('breakDurationUpdated', { 
        duration,
        timeLeft: duration * 60
      });
    }
  });

  // Handle task toggling
  socket.on('toggleTask', ({ roomKey, taskId, completed }) => {
    if (roomTasks.has(roomKey)) {
      const tasks = roomTasks.get(roomKey);
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, completed } : task
      );
      roomTasks.set(roomKey, updatedTasks);
      
      // Send updated tasks to all users in the room
      io.to(roomKey).emit("tasksUpdated", {
        tasks: updatedTasks
      });
      
      // Also emit individual task toggle event
      io.to(roomKey).emit("taskToggled", { taskId, completed });
    }
  });

  // Whiteboard handlers
  socket.on('join-whiteboard-room', (roomId) => {
    socket.join(`whiteboard-${roomId}`);
    
    // Send existing whiteboard state if available
    if (whiteboardStates.has(roomId)) {
      socket.emit('canvasState', whiteboardStates.get(roomId));
    }
    
    // Emit connection status
    socket.emit('whiteboard-connected');
    
    // Get user count and emit to all users in the room
    const room = io.sockets.adapter.rooms.get(`whiteboard-${roomId}`);
    const userCount = room ? room.size : 1;
    io.to(`whiteboard-${roomId}`).emit('whiteboard-users', userCount);
  });

  socket.on('drawing', ({ roomId, x, y, drawing, color, size }) => {
    socket.to(`whiteboard-${roomId}`).emit('drawing', { x, y, drawing, color, size });
  });

  socket.on('clearCanvas', ({ roomId }) => {
    whiteboardStates.delete(roomId); // Clear stored state
    io.to(`whiteboard-${roomId}`).emit('clearCanvas');
  });

  socket.on('canvasState', ({ roomId, imageData }) => {
    whiteboardStates.set(roomId, imageData); // Store the state
    socket.to(`whiteboard-${roomId}`).emit('canvasState', imageData);
  });

  socket.on('leave-whiteboard-room', (roomId) => {
    socket.leave(`whiteboard-${roomId}`);
    
    // Update user count after leaving
    const room = io.sockets.adapter.rooms.get(`whiteboard-${roomId}`);
    const userCount = room ? room.size : 0;
    io.to(`whiteboard-${roomId}`).emit('whiteboard-users', userCount);
  });

  // Clean up when room is closed or all users leave
  socket.on('leaveRoom', ({ roomKey }) => {
    whiteboardStates.delete(roomKey);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server integrated on port ${PORT}`);
}); 