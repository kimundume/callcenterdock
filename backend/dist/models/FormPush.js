"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const FormPushSchema = new mongoose_1.default.Schema({
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
exports.default = mongoose_1.default.model('FormPush', FormPushSchema);
