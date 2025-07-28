"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ChatNoteSchema = new mongoose_1.default.Schema({
    companyId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    author: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });
exports.default = mongoose_1.default.model('ChatNote', ChatNoteSchema);
