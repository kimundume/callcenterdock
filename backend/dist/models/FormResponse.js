"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const FormResponseSchema = new mongoose_1.default.Schema({
    companyId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    formId: { type: mongoose_1.default.Schema.Types.ObjectId, required: true, ref: 'FormPush' },
    from: { type: String, required: true }, // visitorId
    values: { type: Object, required: true }, // { fieldLabel: value }
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });
exports.default = mongoose_1.default.model('FormResponse', FormResponseSchema);
