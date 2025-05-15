import express from 'express';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// @route   GET /api/tasks
// @desc    Get all tasks for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching tasks for user:', req.userId);
    
    if (!req.userId || !isValidObjectId(req.userId)) {
      console.error('Invalid userId format:', req.userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    console.log(`Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, dueDate, status } = req.body;
    
    console.log('Creating task:', { title, dueDate, status, userId: req.userId });
    
    if (!req.userId || !isValidObjectId(req.userId)) {
      console.error('Invalid userId format for task creation:', req.userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const newTask = new Task({
      userId: req.userId,
      title,
      dueDate,
      status: status || 'not-started'
    });

    const task = await newTask.save();
    console.log('Task created with ID:', task._id);
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
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
    
    // Update updatedAt
    taskFields.updatedAt = Date.now();

    // Find task by id and check if user owns it
    let task = await Task.findOne({ _id: taskId, userId: req.userId });

    if (!task) {
      console.log(`Task ${taskId} not found or doesn't belong to user ${req.userId}`);
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task
    task = await Task.findByIdAndUpdate(
      taskId,
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