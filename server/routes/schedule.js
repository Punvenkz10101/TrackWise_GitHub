import express from 'express';
import Reminder from '../models/Reminder.js';
import auth from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// @route   GET /api/schedule
// @desc    Get all reminders for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching reminders for user:', req.userId);
    
    if (!req.userId || !isValidObjectId(req.userId)) {
      console.error('Invalid userId format:', req.userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const reminders = await Reminder.find({ userId: req.userId }).sort({ date: 1 });
    console.log(`Found ${reminders.length} reminders`);
    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   POST /api/schedule
// @desc    Create a new reminder
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, date } = req.body;
    
    console.log('Creating reminder:', { title, date, userId: req.userId });
    
    if (!req.userId || !isValidObjectId(req.userId)) {
      console.error('Invalid userId format for reminder creation:', req.userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const newReminder = new Reminder({
      userId: req.userId,
      title,
      description: description || '',
      date
    });

    const reminder = await newReminder.save();
    console.log('Reminder created with ID:', reminder._id);
    res.status(201).json(reminder);
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   GET /api/schedule/:id
// @desc    Get a reminder by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const reminderId = req.params.id;
    
    // Validate reminder ID format
    if (!isValidObjectId(reminderId)) {
      console.error('Invalid reminder ID format:', reminderId);
      return res.status(400).json({ message: 'Invalid reminder ID format' });
    }
    
    console.log(`Fetching reminder ${reminderId} for user ${req.userId}`);
    
    const reminder = await Reminder.findOne({ _id: reminderId, userId: req.userId });

    if (!reminder) {
      console.log(`Reminder ${reminderId} not found or doesn't belong to user ${req.userId}`);
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json(reminder);
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// @route   PUT /api/schedule/:id
// @desc    Update a reminder
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const reminderId = req.params.id;
    const { title, description, date } = req.body;
    
    // Validate reminder ID format
    if (!isValidObjectId(reminderId)) {
      console.error('Invalid reminder ID format:', reminderId);
      return res.status(400).json({ message: 'Invalid reminder ID format' });
    }
    
    console.log(`Updating reminder ${reminderId} for user ${req.userId}`);
    
    // Build reminder object
    const reminderFields = {};
    if (title !== undefined) reminderFields.title = title;
    if (description !== undefined) reminderFields.description = description;
    if (date !== undefined) reminderFields.date = date;
    
    // Update updatedAt
    reminderFields.updatedAt = Date.now();

    // Find reminder by id and check if user owns it
    let reminder = await Reminder.findOne({ _id: reminderId, userId: req.userId });

    if (!reminder) {
      console.log(`Reminder ${reminderId} not found or doesn't belong to user ${req.userId}`);
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Update reminder
    reminder = await Reminder.findByIdAndUpdate(
      reminderId,
      { $set: reminderFields },
      { new: true }
    );

    console.log(`Reminder ${reminderId} successfully updated`);
    res.json(reminder);
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// @route   DELETE /api/schedule/:id
// @desc    Delete a reminder
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const reminderId = req.params.id;
    
    // Validate reminder ID format
    if (!isValidObjectId(reminderId)) {
      console.error('Invalid reminder ID format:', reminderId);
      return res.status(400).json({ message: 'Invalid reminder ID format' });
    }
    
    console.log(`Attempting to delete reminder ${reminderId} for user ${req.userId}`);
    
    // Find reminder by id and check if user owns it
    const reminder = await Reminder.findOne({ _id: reminderId, userId: req.userId });

    if (!reminder) {
      console.log(`Reminder ${reminderId} not found or doesn't belong to user ${req.userId}`);
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Delete reminder
    await Reminder.findByIdAndDelete(reminderId);
    console.log(`Reminder ${reminderId} successfully deleted`);

    res.json({ message: 'Reminder removed' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

export default router; 