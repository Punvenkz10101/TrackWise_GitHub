import express from 'express';
import Note from '../models/Note.js';
import auth from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// @route   GET /api/notes
// @desc    Get all notes for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching notes for user:', req.userId);
    
    if (!req.userId || !isValidObjectId(req.userId)) {
      console.error('Invalid userId format:', req.userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const notes = await Note.find({ userId: req.userId }).sort({ updatedAt: -1 });
    console.log(`Found ${notes.length} notes`);
    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    console.log('Creating note:', { title, userId: req.userId });
    
    if (!req.userId || !isValidObjectId(req.userId)) {
      console.error('Invalid userId format for note creation:', req.userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const newNote = new Note({
      userId: req.userId,
      title,
      content: content || ''
    });

    const note = await newNote.save();
    console.log('Note created with ID:', note._id);
    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   GET /api/notes/:id
// @desc    Get a note by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const noteId = req.params.id;
    
    // Validate note ID format
    if (!isValidObjectId(noteId)) {
      console.error('Invalid note ID format:', noteId);
      return res.status(400).json({ message: 'Invalid note ID format' });
    }
    
    console.log(`Fetching note ${noteId} for user ${req.userId}`);
    
    const note = await Note.findOne({ _id: noteId, userId: req.userId });

    if (!note) {
      console.log(`Note ${noteId} not found or doesn't belong to user ${req.userId}`);
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, content } = req.body;
    
    // Validate note ID format
    if (!isValidObjectId(noteId)) {
      console.error('Invalid note ID format:', noteId);
      return res.status(400).json({ message: 'Invalid note ID format' });
    }
    
    console.log(`Updating note ${noteId} for user ${req.userId}`);
    
    // Build note object
    const noteFields = {};
    if (title !== undefined) noteFields.title = title;
    if (content !== undefined) noteFields.content = content;
    
    // Update updatedAt
    noteFields.updatedAt = Date.now();

    // Find note by id and check if user owns it
    let note = await Note.findOne({ _id: noteId, userId: req.userId });

    if (!note) {
      console.log(`Note ${noteId} not found or doesn't belong to user ${req.userId}`);
      return res.status(404).json({ message: 'Note not found' });
    }

    // Update note
    note = await Note.findByIdAndUpdate(
      noteId,
      { $set: noteFields },
      { new: true }
    );

    console.log(`Note ${noteId} successfully updated`);
    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const noteId = req.params.id;
    
    // Validate note ID format
    if (!isValidObjectId(noteId)) {
      console.error('Invalid note ID format:', noteId);
      return res.status(400).json({ message: 'Invalid note ID format' });
    }
    
    console.log(`Attempting to delete note ${noteId} for user ${req.userId}`);
    
    // Find note by id and check if user owns it
    const note = await Note.findOne({ _id: noteId, userId: req.userId });

    if (!note) {
      console.log(`Note ${noteId} not found or doesn't belong to user ${req.userId}`);
      return res.status(404).json({ message: 'Note not found' });
    }

    // Delete note
    await Note.findByIdAndDelete(noteId);
    console.log(`Note ${noteId} successfully deleted`);

    res.json({ message: 'Note removed' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

export default router; 