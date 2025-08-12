import express from 'express';
import Reminder from '../models/Reminder.js';
import auth, { requireAuth, createUserScopedQuery, createUserScopedSelector } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/schedule
// @desc    Get all reminders/schedules for current user - STRICT USER SCOPING
// @access  Private
router.get('/', auth, requireAuth, async (req, res) => {
  try {
    // Create strictly user-scoped query - NEVER accept userId from client
    const query = createUserScopedQuery(req);
    
    console.log(`🔍 GET /schedule: User ${req.user.email} (${req.userId})`);
    
    const reminders = await Reminder.find(query).sort({ date: 1 });
    
    console.log(`📅 Found ${reminders.length} reminders for user ${req.userId}`);
    
    // Security verification: Ensure all returned reminders belong to the authenticated user
    const invalidReminders = reminders.filter(reminder => reminder.userId.toString() !== req.userId);
    if (invalidReminders.length > 0) {
      console.error(`🚨 SECURITY BREACH: Found ${invalidReminders.length} reminders not belonging to user ${req.userId}`);
      throw new Error('Data isolation breach detected');
    }
    
    res.json(reminders);
  } catch (error) {
    console.error(`❌ GET /schedule error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   POST /api/schedule
// @desc    Create a new reminder/schedule - STRICT USER SCOPING
// @access  Private
router.post('/', auth, requireAuth, async (req, res) => {
  try {
    // NEVER accept userId from client - always use authenticated user
    const { title, description, date } = req.body;
    
    console.log(`📅 POST /schedule: User ${req.user.email} (${req.userId}) creating "${title}"`);
    
    // Validate required fields
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }
    
    // Create reminder with ONLY authenticated user's ID
    const reminderData = {
      userId: req.userId, // CRITICAL: Never accept this from client
      title: title.trim(),
      description: description || '',
      date: new Date(date)
    };
    
    const reminder = new Reminder(reminderData);
    await reminder.save();
    
    console.log(`✅ Created reminder "${reminder.title}" (${reminder._id}) for user ${req.userId}`);
    
    // Security verification: Ensure the created reminder has the correct userId
    if (reminder.userId.toString() !== req.userId) {
      console.error(`🚨 SECURITY BREACH: Created reminder has wrong userId: ${reminder.userId} vs ${req.userId}`);
      await Reminder.findByIdAndDelete(reminder._id); // Clean up the bad record
      throw new Error('Reminder creation security breach');
    }
    
    res.status(201).json(reminder);
  } catch (error) {
    console.error(`❌ POST /schedule error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   GET /api/schedule/:id
// @desc    Get a reminder by ID - STRICT USER SCOPING
// @access  Private
router.get('/:id', auth, requireAuth, async (req, res) => {
  try {
    const reminderId = req.params.id;
    
    console.log(`🔍 GET /schedule/${reminderId}: User ${req.user.email} (${req.userId})`);
    
    // Create user-scoped selector to prevent cross-user access
    const selector = createUserScopedSelector(req, reminderId);
    
    const reminder = await Reminder.findOne(selector);
    
    if (!reminder) {
      console.log(`❌ Reminder ${reminderId} not found for user ${req.userId} (returns 404 to prevent ID probing)`);
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    console.log(`✅ Found reminder "${reminder.title}" for user ${req.userId}`);
    res.json(reminder);
  } catch (error) {
    console.error(`❌ GET /schedule/${req.params.id} error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   PUT /api/schedule/:id
// @desc    Update a reminder - STRICT USER SCOPING
// @access  Private
router.put('/:id', auth, requireAuth, async (req, res) => {
  try {
    const reminderId = req.params.id;
    const { title, description, date } = req.body;
    
    console.log(`✏️ PUT /schedule/${reminderId}: User ${req.user.email} (${req.userId})`);
    
    // Create user-scoped selector to prevent cross-user access
    const selector = createUserScopedSelector(req, reminderId);
    
    // Prepare update data - NEVER accept userId from client
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    
    const reminder = await Reminder.findOneAndUpdate(
      selector,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!reminder) {
      console.log(`❌ Reminder ${reminderId} not found for user ${req.userId} (returns 404 to prevent ID probing)`);
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    // Security verification: Ensure the updated reminder still belongs to the authenticated user
    if (reminder.userId.toString() !== req.userId) {
      console.error(`🚨 SECURITY BREACH: Updated reminder has wrong userId: ${reminder.userId} vs ${req.userId}`);
      throw new Error('Reminder update security breach');
    }
    
    console.log(`✅ Updated reminder "${reminder.title}" for user ${req.userId}`);
    res.json(reminder);
  } catch (error) {
    console.error(`❌ PUT /schedule/${req.params.id} error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   DELETE /api/schedule/:id
// @desc    Delete a reminder - STRICT USER SCOPING
// @access  Private
router.delete('/:id', auth, requireAuth, async (req, res) => {
  try {
    const reminderId = req.params.id;
    
    console.log(`🗑️ DELETE /schedule/${reminderId}: User ${req.user.email} (${req.userId})`);
    
    // Create user-scoped selector to prevent cross-user access
    const selector = createUserScopedSelector(req, reminderId);
    
    const reminder = await Reminder.findOneAndDelete(selector);
    
    if (!reminder) {
      console.log(`❌ Reminder ${reminderId} not found for user ${req.userId} (returns 404 to prevent ID probing)`);
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    // Security verification: Ensure the deleted reminder belonged to the authenticated user
    if (reminder.userId.toString() !== req.userId) {
      console.error(`🚨 SECURITY BREACH: Deleted reminder had wrong userId: ${reminder.userId} vs ${req.userId}`);
      // Note: We already deleted it, but this shouldn't happen with proper scoping
    }
    
    console.log(`✅ Deleted reminder "${reminder.title}" for user ${req.userId}`);
    res.json({ message: 'Reminder deleted successfully', reminder: { _id: reminder._id, title: reminder.title } });
  } catch (error) {
    console.error(`❌ DELETE /schedule/${req.params.id} error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

export default router;
