import mongoose from 'mongoose';

const ChatNoteSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  author: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('ChatNote', ChatNoteSchema); 