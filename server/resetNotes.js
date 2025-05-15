import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import Note from './models/Note.js';

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

async function resetNotes() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, mongoOptions);
    console.log(`Connected to MongoDB Atlas - Database: ${dbName}`);

    // Drop the notes collection
    console.log('Attempting to drop notes collection...');
    try {
      await mongoose.connection.db.collection('notes').drop();
      console.log('Notes collection dropped successfully');
    } catch (error) {
      console.log('Notes collection may not exist or cannot be dropped:', error.message);
    }

    console.log('Creating a sample note with the updated schema...');
    
    // Create a test note with the updated schema
    const testNote = new Note({
      userId: new mongoose.Types.ObjectId(), // Valid ObjectId
      title: 'Test Note',
      // Intentionally omitting content to test if default value works
    });

    const savedNote = await testNote.save();
    console.log('Test note saved successfully:', savedNote);
    console.log('Content field:', savedNote.content);
    
    // Validate the schema
    console.log('Current Note schema:');
    const noteSchema = Note.schema.obj;
    console.log('Content field definition:', noteSchema.content);
    
    // Clean up
    await Note.deleteOne({ _id: savedNote._id });
    console.log('Test note deleted');

    console.log('Notes collection reset complete!');
  } catch (error) {
    console.error('Reset error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the reset
resetNotes(); 