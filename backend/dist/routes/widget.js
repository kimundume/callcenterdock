"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = __importDefault(require("express"));
// Simple in-memory storage
const companies = {};
const agents = {};
const sessions = [];
// Simple save function
function saveSessions() {
    console.log('Sessions saved (in-memory)');
}
const router = express_1.default.Router();
exports.default = router;
