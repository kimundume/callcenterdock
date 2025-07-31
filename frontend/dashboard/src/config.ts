// Updated config - Backend endpoints fixed
export const config = {
  // Backend configuration
  backendUrl: import.meta.env.VITE_BACKEND_URL || 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:5001' 
      : 'https://callcenterdock.onrender.com'),
  
  // Socket configuration
  socketUrl: import.meta.env.VITE_SOCKET_URL || 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:5001' 
      : 'https://callcenterdock.onrender.com'),
  
  // Environment
  environment: import.meta.env.MODE || 'production',
  
  // API endpoints
  apiEndpoints: {
    superAdmin: '/api/super-admin',
    widget: '/api/widget',
    chat: '/api/chat',
    agents: '/api/agents',
    calls: '/api/calls',
    contacts: '/api/contacts',
    forms: '/api/form-push',
    responses: '/api/form-response'
  },
  
  // Debug endpoints (no auth required)
  debugEndpoints: {
    accounts: '/api/super-admin/debug/accounts',
    agents: '/api/super-admin/debug/agents',
    companies: '/api/super-admin/debug/companies',
    testLogin: '/api/super-admin/test-login',
    createTestCompany: '/api/super-admin/debug/create-test-company'
  }
};

// Make config available globally
(window as any).APP_CONFIG = config;

export default config; 