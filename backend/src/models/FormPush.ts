import mongoose from 'mongoose';

const FormPushSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  from: { type: String, required: true }, // agent username
  type: { type: String, required: true }, // e.g. 'email', 'phone', 'custom'
  fields: [{
    label: { type: String, required: true },
    type: { type: String, required: true }, // 'text', 'email', 'number', etc.
    required: { type: Boolean, default: false }
  }],
  active: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('FormPush', FormPushSchema); 