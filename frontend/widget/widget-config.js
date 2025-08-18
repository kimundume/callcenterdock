// CallDocker Widget Configuration
// This file can be customized for different environments

window.CALLDOCKER_CONFIG = {
  // Backend API URL - Update this for your deployment
  BACKEND_URL: 'https://callcenterdock.onrender.com',
  
  // Widget appearance
  BUTTON_COLORS: {
    call: '#007bff',
    chat: '#6c757d',
    hover: '#0056b3'
  },
  
  // Widget position
  POSITION: {
    bottom: '20px',
    right: '20px'
  },
  
  // Company UUID - Set this for your specific company
  COMPANY_UUID: 'calldocker-company-uuid',
  
  // Widget text
  TEXT: {
    callButton: 'Call Us',
    chatButton: 'Chat Us',
    connecting: 'Connecting to agent...',
    error: 'Unable to connect. Please try again later.'
  },
  
  // Features
  FEATURES: {
    enableCall: true,
    enableChat: true,
    enableMute: true,
    enableVideo: false
  }
};

// Override with custom configuration if provided
if (window.CALLDOCKER_CUSTOM_CONFIG) {
  Object.assign(window.CALLDOCKER_CONFIG, window.CALLDOCKER_CUSTOM_CONFIG);
} 