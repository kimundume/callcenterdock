// Entry point for Render deployment
// This file redirects to the backend server

console.log('Starting CallDocker backend server...');

// Import and start the backend server
require('./backend/dist/server.js');

console.log('Backend server started successfully'); 