import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
  }]
}, { 
  timestamps: true 
});

const Progress = mongoose.model('Progress', progressSchema);

export default Progress; 