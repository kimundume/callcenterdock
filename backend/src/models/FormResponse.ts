import mongoose from 'mongoose';

const FormResponseSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  formId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'FormPush' },
  from: { type: String, required: true }, // visitorId
  values: { type: Object, required: true }, // { fieldLabel: value }
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('FormResponse', FormResponseSchema); 