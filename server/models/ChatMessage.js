import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  message: {
    type: String,
    required: true
  }
}, { 
  timestamps: true 
});

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
export default ChatMessage; 