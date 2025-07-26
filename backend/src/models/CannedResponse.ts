import mongoose from 'mongoose';

const CannedResponseSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('CannedResponse', CannedResponseSchema); 