"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CannedResponseSchema = new mongoose_1.default.Schema({
    companyId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
}, { timestamps: true });
exports.default = mongoose_1.default.model('CannedResponse', CannedResponseSchema);
