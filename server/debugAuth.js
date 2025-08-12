import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from './models/User.js';
import Task from './models/Task.js';
import Note from './models/Note.js';
import Reminder from './models/Reminder.js';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';
const MONGO_URI = process.env.MONGO_URI || `mongodb+srv://puneethvenkat2k25:puneethvenkat%402k25@cluster0.4n8ass6.mongodb.net/TrackWise?retryWrites=true&w=majority`;

const debugAuthentication = async () => {
  try {
    console.log('🔍 Authentication & Data Isolation Debug\n');

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check existing users
    console.log('👥 Checking existing users...');
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user._id})`);
    });
    console.log();

    // 2. Check tasks and their userId associations
    console.log('📋 Checking tasks and their userId associations...');
    const tasks = await Task.find({});
    console.log(`Found ${tasks.length} tasks:`);
    
    const tasksByUser = {};
    tasks.forEach(task => {
      const userId = task.userId ? task.userId.toString() : 'NO_USER_ID';
      if (!tasksByUser[userId]) {
        tasksByUser[userId] = [];
      }
      tasksByUser[userId].push(task.title);
    });
    
    Object.entries(tasksByUser).forEach(([userId, taskTitles]) => {
      const user = users.find(u => u._id.toString() === userId);
      const userEmail = user ? user.email : 'Unknown User';
      console.log(`   User ${userEmail} (${userId}):`);
      taskTitles.forEach(title => console.log(`     - ${title}`));
    });
    console.log();

    // 3. Check notes
    console.log('📝 Checking notes and their userId associations...');
    const notes = await Note.find({});
    console.log(`Found ${notes.length} notes:`);
    
    const notesByUser = {};
    notes.forEach(note => {
      const userId = note.userId ? note.userId.toString() : 'NO_USER_ID';
      if (!notesByUser[userId]) {
        notesByUser[userId] = [];
      }
      notesByUser[userId].push(note.title);
    });
    
    Object.entries(notesByUser).forEach(([userId, noteTitles]) => {
      const user = users.find(u => u._id.toString() === userId);
      const userEmail = user ? user.email : 'Unknown User';
      console.log(`   User ${userEmail} (${userId}):`);
      noteTitles.forEach(title => console.log(`     - ${title}`));
    });
    console.log();

    // 4. Test JWT token generation and verification
    console.log('🔑 Testing JWT token functionality...');
    
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`Testing with user: ${testUser.email}`);
      
      // Generate token
      const token = jwt.sign(
        {
          userId: testUser._id.toString(),
          name: testUser.name,
          email: testUser.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days
        },
        JWT_SECRET
      );
      
      console.log(`Generated token: ${token.substring(0, 50)}...`);
      
      // Verify token
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verification successful');
        console.log(`   userId: ${decoded.userId}`);
        console.log(`   email: ${decoded.email}`);
        console.log(`   Match with user ID: ${decoded.userId === testUser._id.toString()}`);
      } catch (error) {
        console.log('❌ Token verification failed:', error.message);
      }
    }
    console.log();

    // 5. Check for records without userId
    console.log('⚠️ Checking for records without userId...');
    
    const tasksWithoutUserId = await Task.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null },
        { userId: undefined }
      ]
    });
    
    const notesWithoutUserId = await Note.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null },
        { userId: undefined }
      ]
    });
    
    const remindersWithoutUserId = await Reminder.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null },
        { userId: undefined }
      ]
    });
    
    console.log(`Tasks without userId: ${tasksWithoutUserId.length}`);
    console.log(`Notes without userId: ${notesWithoutUserId.length}`);
    console.log(`Reminders without userId: ${remindersWithoutUserId.length}`);
    
    if (tasksWithoutUserId.length > 0 || notesWithoutUserId.length > 0 || remindersWithoutUserId.length > 0) {
      console.log('❌ Found records without userId - this will cause data sharing!');
      console.log('   Run the migration script: npm run migrate');
    } else {
      console.log('✅ All records have userId');
    }
    console.log();

    // 6. Recommendations
    console.log('💡 Recommendations:');
    if (tasksWithoutUserId.length > 0 || notesWithoutUserId.length > 0 || remindersWithoutUserId.length > 0) {
      console.log('   1. Run migration: npm run migrate');
    }
    if (users.length === 0) {
      console.log('   1. Create test users through signup');
    }
    console.log('   2. Clear browser localStorage and sessionStorage');
    console.log('   3. Create new accounts with different emails');
    console.log('   4. Check server logs for authentication flow');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

debugAuthentication();
