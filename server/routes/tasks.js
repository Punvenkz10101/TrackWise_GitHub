import express from 'express';
import Task from '../models/Task.js';
import auth, { requireAuth, createUserScopedQuery, createUserScopedSelector, validateObjectId } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks for current user
// @access  Private
router.get('/', auth, requireAuth, async (req, res) => {
  try {
    // Create strictly user-scoped query - NEVER accept userId from client
    const query = createUserScopedQuery(req);
    
    console.log(`🔍 GET /tasks: User ${req.user.email} (${req.userId})`);
    
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    
    console.log(`📋 Found ${tasks.length} tasks for user ${req.userId}`);
    
    // Verify all returned tasks belong to the authenticated user (security check)
    const invalidTasks = tasks.filter(task => task.userId.toString() !== req.userId);
    if (invalidTasks.length > 0) {
      console.error(`🚨 SECURITY BREACH: Found ${invalidTasks.length} tasks not belonging to user ${req.userId}`);
      throw new Error('Data isolation breach detected');
    }
    
    res.json(tasks);
  } catch (error) {
    console.error(`❌ GET /tasks error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', auth, requireAuth, async (req, res) => {
  try {
    // NEVER accept userId from client - always use authenticated user
    const { title, dueDate, status } = req.body;
    
    console.log(`📝 POST /tasks: User ${req.user.email} (${req.userId}) creating "${title}"`);
    
    // Validate required fields
    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Title and due date are required' });
    }
    
    // Create task with ONLY authenticated user's ID
    const taskData = {
      userId: req.userId, // CRITICAL: Never accept this from client
      title: title.trim(),
      dueDate: new Date(dueDate),
      status: status || 'not-started'
    };
    
    const task = new Task(taskData);
    await task.save();
    
    console.log(`✅ Created task "${task.title}" (${task._id}) for user ${req.userId}`);
    
    // Security verification: Ensure the created task has the correct userId
    if (task.userId.toString() !== req.userId) {
      console.error(`🚨 SECURITY BREACH: Created task has wrong userId: ${task.userId} vs ${req.userId}`);
      await Task.findByIdAndDelete(task._id); // Clean up the bad record
      throw new Error('Task creation security breach');
    }
    
    res.status(201).json(task);
  } catch (error) {
    console.error(`❌ POST /tasks error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a task by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Validate task ID format
    if (!isValidObjectId(taskId)) {
      console.error('Invalid task ID format:', taskId);
      return res.status(400).json({ message: 'Invalid task ID format' });
    }
    
    console.log(`Fetching task ${taskId} for user ${req.userId}`);
    
    const task = await Task.findOne({ _id: taskId, userId: req.userId });

    if (!task) {
      console.log(`Task ${taskId} not found or doesn't belong to user ${req.userId}`);
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, dueDate, status } = req.body;
    
    // Validate task ID format
    if (!isValidObjectId(taskId)) {
      console.error('Invalid task ID format:', taskId);
      return res.status(400).json({ message: 'Invalid task ID format' });
    }
    
    console.log(`Updating task ${taskId} for user ${req.userId}`);
    
    // Build task object
    const taskFields = {};
    if (title !== undefined) taskFields.title = title;
    if (dueDate !== undefined) taskFields.dueDate = dueDate;
    if (status !== undefined) taskFields.status = status;

    // Find task by id and check if user owns it
    let task = await Task.findOne({ _id: taskId, userId: req.userId });

    if (!task) {
      console.log(`Task ${taskId} not found or doesn't belong to user ${req.userId}`);
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task - ensure we filter by userId for security
    task = await Task.findOneAndUpdate(
      { _id: taskId, userId: req.userId },
      { $set: taskFields },
      { new: true }
    );

    console.log(`Task ${taskId} successfully updated`);
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Validate task ID format
    if (!isValidObjectId(taskId)) {
      console.error('Invalid task ID format:', taskId);
      return res.status(400).json({ message: 'Invalid task ID format' });
    }
    
    console.log(`Attempting to delete task ${taskId} for user ${req.userId}`);
    
    // Find task by id and check if user owns it
    const task = await Task.findOne({ _id: taskId, userId: req.userId });

    if (!task) {
      console.log(`Task ${taskId} not found or doesn't belong to user ${req.userId}`);
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete task
    await Task.findByIdAndDelete(taskId);
    console.log(`Task ${taskId} successfully deleted`);

    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

export default router; 