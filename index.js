// Entry point for Render deployment
// This file redirects to the backend server

const path = require('path');
const backendServer = require('./backend/dist/server.js');

// If the backend server exports a function, call it
if (typeof backendServer === 'function') {
  backendServer();
} else {
  console.log('Backend server started successfully');
} 