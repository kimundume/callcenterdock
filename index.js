// Entry point for Render deployment
// This file redirects to the backend server

console.log('Starting CallDocker backend server...');

// Simply require the backend server - it will start automatically
require('./backend/dist/server.js');

console.log('Backend server started successfully'); 