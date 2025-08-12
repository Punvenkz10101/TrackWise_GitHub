import express from 'express';
import Note from '../models/Note.js';
import auth, { requireAuth, createUserScopedQuery, createUserScopedSelector } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notes
// @desc    Get all notes for current user - STRICT USER SCOPING
// @access  Private
router.get('/', auth, requireAuth, async (req, res) => {
  try {
    // Create strictly user-scoped query - NEVER accept userId from client
    const query = createUserScopedQuery(req);
    
    console.log(`🔍 GET /notes: User ${req.user.email} (${req.userId})`);
    
    const notes = await Note.find(query).sort({ createdAt: -1 });
    
    console.log(`📝 Found ${notes.length} notes for user ${req.userId}`);
    
    // Security verification: Ensure all returned notes belong to the authenticated user
    const invalidNotes = notes.filter(note => note.userId.toString() !== req.userId);
    if (invalidNotes.length > 0) {
      console.error(`🚨 SECURITY BREACH: Found ${invalidNotes.length} notes not belonging to user ${req.userId}`);
      throw new Error('Data isolation breach detected');
    }
    
    res.json(notes);
  } catch (error) {
    console.error(`❌ GET /notes error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   POST /api/notes
// @desc    Create a new note - STRICT USER SCOPING
// @access  Private
router.post('/', auth, requireAuth, async (req, res) => {
  try {
    // NEVER accept userId from client - always use authenticated user
    const { title, content } = req.body;
    
    console.log(`📝 POST /notes: User ${req.user.email} (${req.userId}) creating "${title}"`);
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Create note with ONLY authenticated user's ID
    const noteData = {
      userId: req.userId, // CRITICAL: Never accept this from client
      title: title.trim(),
      content: content || ''
    };
    
    const note = new Note(noteData);
    await note.save();
    
    console.log(`✅ Created note "${note.title}" (${note._id}) for user ${req.userId}`);
    
    // Security verification: Ensure the created note has the correct userId
    if (note.userId.toString() !== req.userId) {
      console.error(`🚨 SECURITY BREACH: Created note has wrong userId: ${note.userId} vs ${req.userId}`);
      await Note.findByIdAndDelete(note._id); // Clean up the bad record
      throw new Error('Note creation security breach');
    }
    
    res.status(201).json(note);
  } catch (error) {
    console.error(`❌ POST /notes error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   GET /api/notes/:id
// @desc    Get a note by ID - STRICT USER SCOPING
// @access  Private
router.get('/:id', auth, requireAuth, async (req, res) => {
  try {
    const noteId = req.params.id;
    
    console.log(`🔍 GET /notes/${noteId}: User ${req.user.email} (${req.userId})`);
    
    // Create user-scoped selector to prevent cross-user access
    const selector = createUserScopedSelector(req, noteId);
    
    const note = await Note.findOne(selector);
    
    if (!note) {
      console.log(`❌ Note ${noteId} not found for user ${req.userId} (returns 404 to prevent ID probing)`);
      return res.status(404).json({ message: 'Note not found' });
    }
    
    console.log(`✅ Found note "${note.title}" for user ${req.userId}`);
    res.json(note);
  } catch (error) {
    console.error(`❌ GET /notes/${req.params.id} error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update a note - STRICT USER SCOPING
// @access  Private
router.put('/:id', auth, requireAuth, async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, content } = req.body;
    
    console.log(`✏️ PUT /notes/${noteId}: User ${req.user.email} (${req.userId})`);
    
    // Create user-scoped selector to prevent cross-user access
    const selector = createUserScopedSelector(req, noteId);
    
    // Prepare update data - NEVER accept userId from client
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    
    const note = await Note.findOneAndUpdate(
      selector,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!note) {
      console.log(`❌ Note ${noteId} not found for user ${req.userId} (returns 404 to prevent ID probing)`);
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Security verification: Ensure the updated note still belongs to the authenticated user
    if (note.userId.toString() !== req.userId) {
      console.error(`🚨 SECURITY BREACH: Updated note has wrong userId: ${note.userId} vs ${req.userId}`);
      throw new Error('Note update security breach');
    }
    
    console.log(`✅ Updated note "${note.title}" for user ${req.userId}`);
    res.json(note);
  } catch (error) {
    console.error(`❌ PUT /notes/${req.params.id} error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete a note - STRICT USER SCOPING
// @access  Private
router.delete('/:id', auth, requireAuth, async (req, res) => {
  try {
    const noteId = req.params.id;
    
    console.log(`🗑️ DELETE /notes/${noteId}: User ${req.user.email} (${req.userId})`);
    
    // Create user-scoped selector to prevent cross-user access
    const selector = createUserScopedSelector(req, noteId);
    
    const note = await Note.findOneAndDelete(selector);
    
    if (!note) {
      console.log(`❌ Note ${noteId} not found for user ${req.userId} (returns 404 to prevent ID probing)`);
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Security verification: Ensure the deleted note belonged to the authenticated user
    if (note.userId.toString() !== req.userId) {
      console.error(`🚨 SECURITY BREACH: Deleted note had wrong userId: ${note.userId} vs ${req.userId}`);
      // Note: We already deleted it, but this shouldn't happen with proper scoping
    }
    
    console.log(`✅ Deleted note "${note.title}" for user ${req.userId}`);
    res.json({ message: 'Note deleted successfully', note: { _id: note._id, title: note.title } });
  } catch (error) {
    console.error(`❌ DELETE /notes/${req.params.id} error for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

export default router;
