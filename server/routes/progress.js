import express from 'express';
import Progress from '../models/Progress.js';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/progress
// @desc    Get all progress entries for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.userId }).sort({ date: -1 });
    res.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress
// @desc    Create or update a progress entry for a specific date
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { date, completedTasks, studyHours, subjects } = req.body;

    // Find if progress entry for this date already exists
    let progress = await Progress.findOne({ 
      userId: req.userId, 
      date: new Date(date) 
    });

    if (progress) {
      // Update existing entry
      progress.completedTasks = completedTasks || progress.completedTasks;
      progress.studyHours = studyHours || progress.studyHours;
      
      if (subjects && subjects.length > 0) {
        progress.subjects = subjects;
      }
      
      progress.updatedAt = Date.now();
      await progress.save();
    } else {
      // Create new entry
      progress = new Progress({
        userId: req.userId,
        date: new Date(date),
        completedTasks: completedTasks || 0,
        studyHours: studyHours || 0,
        subjects: subjects || []
      });

      await progress.save();
    }

    res.status(201).json(progress);
  } catch (error) {
    console.error('Create/update progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/progress/summary
// @desc    Get summary statistics (total tasks, study hours, streaks)
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    // Get date range filter from query params or default to last 30 days
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all progress entries in range
    const progressEntries = await Progress.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Calculate total completed tasks and study hours
    const totalTasks = progressEntries.reduce((total, entry) => total + entry.completedTasks, 0);
    const totalHours = progressEntries.reduce((total, entry) => total + entry.studyHours, 0);

    // Get tasks completed by status
    const tasks = await Task.find({ userId: req.userId });
    const tasksByStatus = {
      completed: tasks.filter(task => task.status === 'completed').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      notStarted: tasks.filter(task => task.status === 'not-started').length,
    };

    // Calculate streak (consecutive days with completed tasks)
    let streak = 0;
    // Map all dates in range to check for consecutive days
    const progressByDate = {};
    
    progressEntries.forEach(entry => {
      const dateStr = entry.date.toISOString().split('T')[0];
      progressByDate[dateStr] = entry.completedTasks > 0;
    });
    
    // Check from today backwards
    const today = new Date();
    let currentDate = new Date();
    
    while (currentDate >= startDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasProgress = progressByDate[dateStr];
      
      if (hasProgress) {
        streak++;
      } else if (currentDate < today) { // Allow today to not have progress
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }

    res.json({
      totalTasks,
      totalHours,
      averageHoursPerDay: days > 0 ? (totalHours / days) : 0,
      streak,
      tasksByStatus,
      daysTracked: progressEntries.length
    });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/progress/daily
// @desc    Get daily progress data for charts
// @access  Private
router.get('/daily', auth, async (req, res) => {
  try {
    // Get date range filter from query params or default to last 30 days
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all progress entries in range
    const progressEntries = await Progress.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Format data for charts
    const dailyData = [];
    
    // Create map of dates to progress
    const progressByDate = {};
    progressEntries.forEach(entry => {
      const dateStr = entry.date.toISOString().split('T')[0];
      progressByDate[dateStr] = {
        completedTasks: entry.completedTasks,
        studyHours: entry.studyHours
      };
    });
    
    // Fill in data for each day in range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const entry = progressByDate[dateStr] || { completedTasks: 0, studyHours: 0 };
      
      dailyData.push({
        date: formattedDate,
        completedTasks: entry.completedTasks,
        studyHours: entry.studyHours
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(dailyData);
  } catch (error) {
    console.error('Get daily progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 