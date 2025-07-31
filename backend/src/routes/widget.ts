// @ts-nocheck
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { companies, agents, sessions, saveSessions } from '../data/persistentStorage';

const router = express.Router();

export default router;