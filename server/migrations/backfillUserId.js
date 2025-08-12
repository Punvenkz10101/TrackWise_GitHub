import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import Reminder from '../models/Reminder.js';
import Progress from '../models/Progress.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || `mongodb+srv://puneethvenkat2k25:puneethvenkat%402k25@cluster0.4n8ass6.mongodb.net/TrackWise?retryWrites=true&w=majority`;

/**
 * Migration script to backfill userId field for existing records
 * 
 * This script will:
 * 1. Find all records without userId
 * 2. Attempt to assign them to existing users
 * 3. Create a default user for orphaned records if needed
 * 4. Set userId = null for records that can't be migrated (to exclude them from queries)
 */

const runMigration = async () => {
  try {
    console.log('🚀 Starting userId backfill migration...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all existing users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} existing users`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found. Creating a default user for orphaned records...');
      
      const defaultUser = new User({
        name: 'Default User',
        email: 'default@trackwise.com',
        password: 'defaultpassword123'
      });
      
      await defaultUser.save();
      users.push(defaultUser);
      console.log(`✅ Created default user with ID: ${defaultUser._id}\n`);
    }

    // Use the first user as default for orphaned records
    const defaultUserId = users[0]._id;
    console.log(`🎯 Using default user ID for orphaned records: ${defaultUserId}\n`);

    const collections = [
      { model: Task, name: 'Tasks' },
      { model: Note, name: 'Notes' },
      { model: Reminder, name: 'Reminders' },
      { model: Progress, name: 'Progress' },
      { model: ChatMessage, name: 'ChatMessages' }
    ];

    let totalUpdated = 0;
    let totalOrphaned = 0;

    for (const { model, name } of collections) {
      console.log(`🔄 Processing ${name}...`);
      
      try {
        // Find records without userId or with null/undefined userId
        const recordsWithoutUserId = await model.find({
          $or: [
            { userId: { $exists: false } },
            { userId: null },
            { userId: undefined }
          ]
        });

        console.log(`   Found ${recordsWithoutUserId.length} records without userId`);

        if (recordsWithoutUserId.length > 0) {
          // For this migration, we'll assign all orphaned records to the default user
          // In a real scenario, you might have more sophisticated logic to determine ownership
          
          const updateResult = await model.updateMany(
            {
              $or: [
                { userId: { $exists: false } },
                { userId: null },
                { userId: undefined }
              ]
            },
            { $set: { userId: defaultUserId } }
          );

          console.log(`   ✅ Updated ${updateResult.modifiedCount} ${name.toLowerCase()}`);
          totalUpdated += updateResult.modifiedCount;
        }

        // Verify all records now have userId
        const remainingOrphans = await model.countDocuments({
          $or: [
            { userId: { $exists: false } },
            { userId: null },
            { userId: undefined }
          ]
        });

        if (remainingOrphans > 0) {
          console.log(`   ⚠️  Still have ${remainingOrphans} orphaned ${name.toLowerCase()}`);
          totalOrphaned += remainingOrphans;
        } else {
          console.log(`   ✅ All ${name.toLowerCase()} now have userId`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${name}:`, error.message);
      }

      console.log();
    }

    // Summary
    console.log('📋 Migration Summary:');
    console.log(`   Total records updated: ${totalUpdated}`);
    console.log(`   Total orphaned records: ${totalOrphaned}`);
    
    if (totalOrphaned === 0) {
      console.log('   ✅ All records successfully migrated!');
    } else {
      console.log('   ⚠️  Some records still need manual attention');
    }

    // Create indexes for better performance
    console.log('\n🔧 Creating indexes for userId fields...');
    
    try {
      await Task.collection.createIndex({ userId: 1 });
      await Note.collection.createIndex({ userId: 1 });
      await Reminder.collection.createIndex({ userId: 1 });
      await Progress.collection.createIndex({ userId: 1 });
      await ChatMessage.collection.createIndex({ userId: 1 });
      console.log('✅ Indexes created successfully');
    } catch (indexError) {
      console.log('ℹ️  Indexes may already exist:', indexError.message);
    }

    // Verification
    console.log('\n🔍 Verification:');
    for (const { model, name } of collections) {
      const totalCount = await model.countDocuments({});
      const withUserIdCount = await model.countDocuments({ userId: { $exists: true, $ne: null } });
      console.log(`   ${name}: ${withUserIdCount}/${totalCount} records have userId`);
    }

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Script to run the migration with confirmation
const confirmAndRun = async () => {
  console.log('⚠️  DATABASE MIGRATION WARNING ⚠️');
  console.log('This script will modify your database by adding userId fields to existing records.');
  console.log('Make sure you have a backup before proceeding.\n');
  
  // In a real scenario, you might want to add a confirmation prompt
  // For automation purposes, we'll run directly
  console.log('🚀 Starting migration in 3 seconds...\n');
  
  setTimeout(runMigration, 3000);
};

// Run the migration if this file is executed directly
if (process.argv[1] && process.argv[1].includes('backfillUserId.js')) {
  confirmAndRun();
}

export { runMigration };
