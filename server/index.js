import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import tasksRoutes from './routes/tasks.js';
import notesRoutes from './routes/notes.js';
import scheduleRoutes from './routes/schedule.js';
import progressRoutes from './routes/progress.js';

// Configure environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
// Extract the database name to make it easier to work with
const dbName = 'TrackWise';
const MONGO_URI = `mongodb+srv://puneethvenkat2k25:puneethvenkat%402k25@cluster0.4n8ass6.mongodb.net/${dbName}?retryWrites=true&w=majority`;

// MongoDB connection options
const mongoOptions = {
  // These options are removed since they are deprecated in newer MongoDB driver versions
  // and are automatically set to true by default
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  
  // Set the database name explicitly
  dbName: dbName
};

mongoose.connect(MONGO_URI, mongoOptions)
  .then(() => {
    console.log(`Connected to MongoDB Atlas - Database: ${dbName}`);
    
    // Log the available collections to help with debugging
    mongoose.connection.db.listCollections().toArray()
      .then(collections => {
        console.log('Available collections:');
        collections.forEach(collection => {
          console.log(` - ${collection.name}`);
        });
      })
      .catch(err => console.error('Failed to list collections:', err));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error('Error details:', err);
    
    // Provide more detailed error information
    if (err.message.includes('already exists with different case')) {
      console.error(`Database case sensitivity issue detected. Ensure the database name (${dbName}) matches exactly with what exists in MongoDB Atlas.`);
      console.error('Please check your MongoDB Atlas dashboard to confirm the exact database name.');
    }
    
    // Don't exit immediately in development mode to allow for fixes
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/progress', progressRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 