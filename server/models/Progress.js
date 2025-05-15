import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  studyHours: {
    type: Number,
    default: 0
  },
  subjects: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
progressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Progress = mongoose.model('Progress', progressSchema);

export default Progress; 