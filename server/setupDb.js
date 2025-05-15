import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import User from './models/User.js';
import Task from './models/Task.js';
import Note from './models/Note.js';
import Reminder from './models/Reminder.js';
import Progress from './models/Progress.js';

// Configure environment variables
dotenv.config();

// Database name
const dbName = 'TrackWise';

// MongoDB Connection
const MONGO_URI = `mongodb+srv://puneethvenkat2k25:puneethvenkat%402k25@cluster0.4n8ass6.mongodb.net/${dbName}?retryWrites=true&w=majority`;

// MongoDB connection options
const mongoOptions = {
  dbName: dbName
};

async function setupDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, mongoOptions);
    console.log(`Connected to MongoDB Atlas - Database: ${dbName}`);

    // Log existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Existing collections:');
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });

    // Initialize collections if they don't exist
    console.log('\nInitializing collections...');
    
    // Create a sample document in each collection to ensure it exists
    // (Only if the collection is empty)
    
    // Users collection
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Creating sample user document...');
      // Create a demo user if none exists (this will be cleaned up later)
      const demoUser = new User({
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'password123'
      });
      await demoUser.save();
      console.log('Sample user created');
    } else {
      console.log('Users collection already has documents');
    }
    
    // Tasks collection
    const taskCount = await Task.countDocuments();
    if (taskCount === 0) {
      console.log('Creating sample task document...');
      // Find a user to associate with the task
      const user = await User.findOne();
      if (user) {
        const demoTask = new Task({
          userId: user._id,
          title: 'Sample Task',
          dueDate: new Date(),
          status: 'not-started'
        });
        await demoTask.save();
        console.log('Sample task created');
      }
    } else {
      console.log('Tasks collection already has documents');
    }
    
    // Notes collection
    const noteCount = await Note.countDocuments();
    if (noteCount === 0) {
      console.log('Creating sample note document...');
      // Find a user to associate with the note
      const user = await User.findOne();
      if (user) {
        const demoNote = new Note({
          userId: user._id,
          title: 'Sample Note',
          content: 'This is a sample note'
        });
        await demoNote.save();
        console.log('Sample note created');
      }
    } else {
      console.log('Notes collection already has documents');
    }
    
    // Reminders collection
    const reminderCount = await Reminder.countDocuments();
    if (reminderCount === 0) {
      console.log('Creating sample reminder document...');
      // Find a user to associate with the reminder
      const user = await User.findOne();
      if (user) {
        const demoReminder = new Reminder({
          userId: user._id,
          title: 'Sample Reminder',
          description: 'This is a sample reminder',
          date: new Date()
        });
        await demoReminder.save();
        console.log('Sample reminder created');
      }
    } else {
      console.log('Reminders collection already has documents');
    }
    
    // Progress collection
    const progressCount = await Progress.countDocuments();
    if (progressCount === 0) {
      console.log('Creating sample progress document...');
      // Find a user to associate with the progress
      const user = await User.findOne();
      if (user) {
        const demoProgress = new Progress({
          userId: user._id,
          date: new Date(),
          studyHours: 2,
          completedTasks: 1,
          subjects: [{ name: 'Sample Subject', value: 2 }]
        });
        await demoProgress.save();
        console.log('Sample progress created');
      }
    } else {
      console.log('Progress collection already has documents');
    }
    
    // Log final collections
    const finalCollections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nFinal collections:');
    finalCollections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });
    
    console.log('\nDatabase setup complete!');
  } catch (error) {
    console.error('Database setup error:', error.message);
    console.error('Error details:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the setup
setupDatabase(); 