import mongoose from 'mongoose';

const ChatSessionSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, unique: true },
  visitorId: { type: String, required: true },
  pageUrl: { type: String },
  startedAt: { type: Date, default: Date.now },
  tags: [String],
  assignedAgent: { type: String },
  escalated: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });

export default mongoose.model('ChatSession', ChatSessionSchema); 