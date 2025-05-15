import mongoose from 'mongoose';
import User from './models/User.js';

// Configure environment variables
import dotenv from 'dotenv';
dotenv.config();

// MongoDB Connection
const dbName = 'TrackWise';
const MONGO_URI = `mongodb+srv://puneethvenkat2k25:puneethvenkat%402k25@cluster0.4n8ass6.mongodb.net/${dbName}?retryWrites=true&w=majority`;

// MongoDB connection options
const mongoOptions = {
  dbName: dbName
};

async function testConnection() {
  try {
    console.log(`Connecting to MongoDB Atlas database: ${dbName}...`);
    await mongoose.connect(MONGO_URI, mongoOptions);
    console.log(`Connected to MongoDB Atlas - Database: ${dbName}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });

    // Test User model by retrieving all users
    const users = await User.find().select('-password');
    console.log(`\nFound ${users.length} users:`);
    users.forEach(user => {
      console.log(` - ${user.name} (${user.email}) - ID: ${user._id}`);
    });

    // Test creation of a test user
    console.log('\nTesting user creation...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testUser = new User({
      name: 'Test User',
      email: testEmail,
      password: 'password123'
    });

    await testUser.save();
    console.log(`Created test user: ${testEmail} with ID: ${testUser._id}`);

    // Validate that we can find the newly created user
    const foundUser = await User.findOne({ email: testEmail });
    console.log(`Found user by email: ${foundUser ? 'Yes' : 'No'}`);

    // Test password comparison
    const isPasswordCorrect = await foundUser.comparePassword('password123');
    console.log(`Password validation: ${isPasswordCorrect ? 'Passed' : 'Failed'}`);

    // Clean up - delete the test user
    console.log('\nCleaning up...');
    await User.deleteOne({ email: testEmail });
    console.log(`Deleted test user: ${testEmail}`);

    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

// Run the test
testConnection(); 