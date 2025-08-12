import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';

const router = express.Router();

// Debug endpoint to check current user authentication state
router.get('/auth-info', auth, async (req, res) => {
  try {
    console.log('\n🔍 Debug: Authentication Info Request');
    console.log('Headers:', {
      authorization: req.headers.authorization ? `Bearer ${req.headers.authorization.substring(0, 20)}...` : 'None',
      'user-agent': req.headers['user-agent'],
    });
    
    console.log('Auth middleware results:');
    console.log('  req.userId:', req.userId);
    console.log('  req.user:', req.user ? {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name
    } : 'None');

    // Check if user exists in database
    const dbUser = await User.findById(req.userId);
    console.log('  Database user:', dbUser ? {
      id: dbUser._id,
      email: dbUser.email,
      name: dbUser.name,
      lastLogin: dbUser.lastLogin
    } : 'Not found');

    // Check how many tasks/notes this user has
    const taskCount = await Task.countDocuments({ userId: req.userId });
    const noteCount = await Note.countDocuments({ userId: req.userId });
    
    console.log('  User data counts:', { tasks: taskCount, notes: noteCount });

    // Return debug info
    res.json({
      success: true,
      userId: req.userId,
      user: req.user ? {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name
      } : null,
      databaseUser: dbUser ? {
        id: dbUser._id,
        email: dbUser.email,
        name: dbUser.name,
        lastLogin: dbUser.lastLogin
      } : null,
      dataCounts: {
        tasks: taskCount,
        notes: noteCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug auth-info error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      userId: req.userId || 'undefined',
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check what tasks are visible to current user
router.get('/my-tasks', auth, async (req, res) => {
  try {
    console.log('\n🔍 Debug: My Tasks Request');
    console.log('  req.userId:', req.userId);
    
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    console.log(`  Found ${tasks.length} tasks for user ${req.userId}`);
    
    tasks.forEach((task, index) => {
      console.log(`    ${index + 1}. "${task.title}" (ID: ${task._id}, UserID: ${task.userId})`);
    });

    res.json({
      success: true,
      userId: req.userId,
      taskCount: tasks.length,
      tasks: tasks.map(task => ({
        id: task._id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        userId: task.userId,
        createdAt: task.createdAt
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug my-tasks error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check ALL tasks in database (admin use only)
router.get('/all-tasks', auth, async (req, res) => {
  try {
    console.log('\n🔍 Debug: All Tasks Request (Admin)');
    console.log('  Requesting user:', req.userId);
    
    const allTasks = await Task.find({}).sort({ createdAt: -1 });
    console.log(`  Total tasks in database: ${allTasks.length}`);
    
    const tasksByUser = {};
    allTasks.forEach(task => {
      const userId = task.userId ? task.userId.toString() : 'NO_USER_ID';
      if (!tasksByUser[userId]) {
        tasksByUser[userId] = [];
      }
      tasksByUser[userId].push({
        id: task._id,
        title: task.title,
        status: task.status
      });
    });

    console.log('  Tasks by user:');
    Object.entries(tasksByUser).forEach(([userId, tasks]) => {
      console.log(`    User ${userId}: ${tasks.length} tasks`);
    });

    res.json({
      success: true,
      requestingUserId: req.userId,
      totalTasks: allTasks.length,
      tasksByUser: tasksByUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug all-tasks error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
