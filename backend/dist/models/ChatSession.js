"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ChatSessionSchema = new mongoose_1.default.Schema({
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
exports.default = mongoose_1.default.model('ChatSession', ChatSessionSchema);
