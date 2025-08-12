import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Task from './models/Task.js';
import Note from './models/Note.js';
import Reminder from './models/Reminder.js';
import Progress from './models/Progress.js';
import ChatMessage from './models/ChatMessage.js';

dotenv.config();

const dbName = 'TrackWise';
const MONGO_URI = process.env.MONGO_URI || `mongodb+srv://puneethvenkat2k25:puneethvenkat%402k25@cluster0.4n8ass6.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: dbName });
    console.log(`✅ MongoDB Connected - Database: ${dbName}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const cleanupOrphanedRecords = async () => {
  console.log('🧹 Starting cleanup of orphaned records...\n');

  try {
    await connectDB();

    // Get all valid user IDs
    const users = await User.find({}, '_id');
    const validUserIds = users.map(user => user._id.toString());
    console.log(`Found ${validUserIds.length} valid users:`);
    validUserIds.forEach(id => console.log(`   - ${id}`));
    console.log();

    // Function to clean up a collection
    const cleanupCollection = async (Model, collectionName) => {
      console.log(`\n🔍 Cleaning up ${collectionName}...`);
      
      // Find records with invalid userIds
      const allRecords = await Model.find({});
      const orphanedRecords = allRecords.filter(record => {
        const recordUserId = record.userId ? record.userId.toString() : null;
        return !recordUserId || !validUserIds.includes(recordUserId);
      });

      console.log(`   Found ${orphanedRecords.length} orphaned records out of ${allRecords.length} total`);

      if (orphanedRecords.length > 0) {
        // Show details of orphaned records
        console.log(`   Orphaned record details:`);
        orphanedRecords.forEach(record => {
          const title = record.title || record.message || 'No title';
          const userId = record.userId ? record.userId.toString() : 'null';
          console.log(`     - "${title}" (userId: ${userId})`);
        });

        // Delete orphaned records
        const orphanedIds = orphanedRecords.map(record => record._id);
        const deleteResult = await Model.deleteMany({ _id: { $in: orphanedIds } });
        console.log(`   ✅ Deleted ${deleteResult.deletedCount} orphaned records`);
      } else {
        console.log(`   ✅ No orphaned records found`);
      }
    };

    // Clean up all collections
    await cleanupCollection(Task, 'tasks');
    await cleanupCollection(Note, 'notes');
    await cleanupCollection(Reminder, 'reminders');
    await cleanupCollection(Progress, 'progress');
    await cleanupCollection(ChatMessage, 'chat messages');

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('   All orphaned records have been removed.');
    console.log('   Only records belonging to valid users remain.');
    console.log('   Each user should now see only their own data.\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

cleanupOrphanedRecords();
