import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  from: { type: String, required: true }, // 'agent' or 'visitor' or username
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('ChatMessage', ChatMessageSchema); 