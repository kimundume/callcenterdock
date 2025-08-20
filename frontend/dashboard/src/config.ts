// Centralized configuration for backend URLs
export const getBackendUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }
  
  // Production: Use Render backend URL
  return 'https://callcenterdock.onrender.com';
};

export const getSocketUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }
  
  // Production: Use Render backend URL
  return 'https://callcenterdock.onrender.com';
};

// API endpoints
export const API_ENDPOINTS = {
  SUPER_ADMIN: `${getBackendUrl()}/api/super-admin`,
  WIDGET: `${getBackendUrl()}/api/widget`,
  AGENTS: `${getBackendUrl()}/api/agents`,
  CHAT: `${getBackendUrl()}/api/chat`,
  FORM: `${getBackendUrl()}/api/form`,
  CONTACTS: `${getBackendUrl()}/api/contacts`,
  CANNED_RESPONSES: `${getBackendUrl()}/api/canned-responses`,
  CHAT_SESSIONS: `${getBackendUrl()}/api/chat-sessions`,
  CHAT_MESSAGES: `${getBackendUrl()}/api/chat-messages`,
  CHAT_NOTES: `${getBackendUrl()}/api/chat-notes`,
  FORM_PUSH: `${getBackendUrl()}/api/form-push`,
  FORM_RESPONSE: `${getBackendUrl()}/api/form-response`,
};

// Socket.IO URL
export const SOCKET_URL = getSocketUrl();

console.log('🔧 Backend Configuration:', {
  environment: window.location.hostname === 'localhost' ? 'development' : 'production',
  backendUrl: getBackendUrl(),
  socketUrl: getSocketUrl()
});

// FORCE DEPLOY v2.1.2 - Audio Fix - ${new Date().toISOString()} 