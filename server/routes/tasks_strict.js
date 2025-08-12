import express from 'express';
import Task from '../models/Task.js';
import auth, { requireAuth, createUserScopedQuery, createUserScopedSelector } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks for current user - STRICT USER SCOPING
// @access  Private
router.get('/', auth, requireAuth, async (req, res) => {
  try {
    // Create strictly user-scoped query - NEVER accept userId from client
    const query = createUserScopedQuery(req);
    
    console.log(`🔍 GET /tasks: User ${req.user.email} (${req.userId})`);
    
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    
    console.log(`📋 Found ${tasks.length} tasks for user ${req.userId}`);
    
    // Security verification: Ensure all returned tasks belong to the authenticated user
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
// @desc    Create a new task - STRICT USER SCOPING
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
// @desc    Get a task by ID - STRICT USER SCOPING
// @access  Private
router.get('/:id', auth, requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    console.log(`🔍 GET /tasks/${taskId}: User ${req.user.email} (${req.userId})`);
    
    // Create user-scoped selector to prevent cross-user access
    const selector = createUserScopedSelector(req, taskId);
    
    const task = await Task.findOne(selector);
    
    if (!task) {
      console.log(`❌ Task ${taskId} not found for user ${req.userId} (returns 404 to prevent ID probing)`);
      return res.status(404).json({ message: 'Task not found' });
    }
    
    console.log(`✅ Found task "${task.title}" for user ${req.userId}`);
    res.json(task);
  } catch (error) {
    console.error(`❌ GET /tasks/${req.params.id} error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task - STRICT USER SCOPING
// @access  Private
router.put('/:id', auth, requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, dueDate, status } = req.body;
    
    console.log(`✏️ PUT /tasks/${taskId}: User ${req.user.email} (${req.userId})`);
    
    // Create user-scoped selector to prevent cross-user access
    const selector = createUserScopedSelector(req, taskId);
    
    // Prepare update data - NEVER accept userId from client
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (status !== undefined) updateData.status = status;
    
    const task = await Task.findOneAndUpdate(
      selector,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      console.log(`❌ Task ${taskId} not found for user ${req.userId} (returns 404 to prevent ID probing)`);
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Security verification: Ensure the updated task still belongs to the authenticated user
    if (task.userId.toString() !== req.userId) {
      console.error(`🚨 SECURITY BREACH: Updated task has wrong userId: ${task.userId} vs ${req.userId}`);
      throw new Error('Task update security breach');
    }
    
    console.log(`✅ Updated task "${task.title}" for user ${req.userId}`);
    res.json(task);
  } catch (error) {
    console.error(`❌ PUT /tasks/${req.params.id} error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task - STRICT USER SCOPING
// @access  Private
router.delete('/:id', auth, requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    console.log(`🗑️ DELETE /tasks/${taskId}: User ${req.user.email} (${req.userId})`);
    
    // Create user-scoped selector to prevent cross-user access
    const selector = createUserScopedSelector(req, taskId);
    
    const task = await Task.findOneAndDelete(selector);
    
    if (!task) {
      console.log(`❌ Task ${taskId} not found for user ${req.userId} (returns 404 to prevent ID probing)`);
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Security verification: Ensure the deleted task belonged to the authenticated user
    if (task.userId.toString() !== req.userId) {
      console.error(`🚨 SECURITY BREACH: Deleted task had wrong userId: ${task.userId} vs ${req.userId}`);
      // Note: We already deleted it, but this shouldn't happen with proper scoping
    }
    
    console.log(`✅ Deleted task "${task.title}" for user ${req.userId}`);
    res.json({ message: 'Task deleted successfully', task: { _id: task._id, title: task.title } });
  } catch (error) {
    console.error(`❌ DELETE /tasks/${req.params.id} error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

export default router;
