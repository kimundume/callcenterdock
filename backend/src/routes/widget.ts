// @ts-nocheck
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory storage
const companies: Record<string, any> = {};
const agents: Record<string, any> = {};
const sessions: any[] = [];

// Simple save function
function saveSessions() {
  console.log('Sessions saved (in-memory)');
}

const router = express.Router();

export default router;