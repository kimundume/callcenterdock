// Updated main.tsx - Backend endpoints fixed
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './style.css'
import config from './config.ts'

// Set global configuration
(window as any).BACKEND_URL = config.backendUrl;
(window as any).SOCKET_URL = config.socketUrl;
(window as any).APP_CONFIG = config;

console.log('🚀 App starting with config:', {
  environment: config.environment,
  backendUrl: config.backendUrl,
  socketUrl: config.socketUrl
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 
