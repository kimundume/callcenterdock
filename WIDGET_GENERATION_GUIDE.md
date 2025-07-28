# CallDocker Widget Generation & Routing Guide

## Overview

This guide explains how the CallDocker widget generation and routing system works for the soft launch with 20 companies/tenants. The system is designed to be unique, URL-based, and provide intelligent routing with fallback capabilities.

## Widget Generation System

### 1. Enhanced Widget Script Generation

The widget is generated in the Admin Dashboard with the following enhanced features:

```javascript
// Enhanced widget script with unique routing
<script>
(function() {
  // CallDocker Widget Loader - Enhanced for Soft Launch
  window.CallDockerWidget = window.CallDockerWidget || {};
  
  // Widget configuration with unique routing
  var config = {
    uuid: 'COMPANY_UUID_HERE',
    uniqueId: 'COMPANY_UUID-TIMESTAMP',
    text: 'Call Us',
    color: '#00e6ef',
    shape: 'round',
    position: 'bottom-right',
    animation: 'bounce',
    dark: false,
    image: 'https://company-logo.png',
    
    // Enhanced routing for soft launch
    routing: {
      type: 'company',           // 'company' or 'public'
      fallbackToCallDocker: true, // Route to CallDocker if no company agents
      priority: 'company-first',  // 'company-first' or 'load-balanced'
      loadBalancing: 'round-robin' // 'round-robin' or 'random'
    },
    
    // Analytics and tracking
    analytics: {
      enabled: true,
      trackPageViews: true,
      trackInteractions: true,
      companyId: 'COMPANY_UUID'
    }
  };
  
  // Create unique widget instance
  var widgetId = 'calldocker-widget-' + config.uniqueId;
  
  // Load widget script
  var script = document.createElement('script');
  script.src = 'https://calldocker.com/widget.js';
  script.async = true;
  script.onload = function() {
    if (window.CallDockerWidget.init) {
      window.CallDockerWidget.init(config, widgetId);
    }
  };
  document.head.appendChild(script);
})();
</script>
```

### 2. Unique Widget Features

Each widget is unique with:
- **Unique ID**: `companyUuid-timestamp` ensures no conflicts
- **Company-specific routing**: Routes to company's own agents first
- **Fallback capability**: Routes to CallDocker agents if company agents unavailable
- **Load balancing**: Round-robin or random agent assignment
- **Analytics tracking**: Tracks interactions per company

## Routing System

### 1. Enhanced Routing Logic

The backend routing system (`/api/widget/route-call`) supports:

#### **Company-Specific Routing**
```javascript
// Route to company's own agents first
if (companyAgents.length > 0 && priority === 'company-first') {
  return routeToCompanyAgents(company, companyAgents);
}
```

#### **Fallback to CallDocker**
```javascript
// If no company agents and fallback enabled
if (companyAgents.length === 0 && fallbackToCallDocker) {
  return routeToCallDockerAgents(company.name);
}
```

#### **Load Balancing**
```javascript
// Enhanced load balancing: round-robin or random
const loadBalancing = routingConfig?.loadBalancing || 'round-robin';
if (loadBalancing === 'round-robin') {
  // Round-robin implementation
  assignedAgent = companyAgents[agentIndex];
} else {
  // Random assignment
  assignedAgent = companyAgents[Math.floor(Math.random() * companyAgents.length)];
}
```

### 2. Routing Scenarios

#### **Scenario 1: Company with Agents Online**
```
Visitor clicks widget → Route to company agent → Company agent handles call
```

#### **Scenario 2: Company with No Agents Online**
```
Visitor clicks widget → Fallback to CallDocker agent → CallDocker agent handles call
```

#### **Scenario 3: Public Landing Page**
```
Visitor clicks widget → Route to CallDocker agent → CallDocker agent handles call
```

## Widget Customization

### 1. Visual Customization
- **Text**: Customizable button text
- **Color**: Brand colors
- **Shape**: Round, square, or custom
- **Position**: Bottom-right, bottom-left, top-right, top-left
- **Animation**: Bounce, fade, slide
- **Logo**: Company logo integration

### 2. Routing Customization
- **Priority**: Company-first or load-balanced
- **Fallback**: Enable/disable CallDocker fallback
- **Load Balancing**: Round-robin or random assignment

## Implementation for Soft Launch

### 1. Creating Widgets for 20 Companies

```javascript
// Example: Creating widget for Company A
const companyAWidget = {
  uuid: 'company-a-uuid-123',
  uniqueId: 'company-a-uuid-123-1753707121834',
  text: 'Get Support',
  color: '#FF6B35',
  shape: 'round',
  position: 'bottom-right',
  routing: {
    type: 'company',
    fallbackToCallDocker: true,
    priority: 'company-first',
    loadBalancing: 'round-robin'
  }
};

// Example: Creating widget for Company B
const companyBWidget = {
  uuid: 'company-b-uuid-456',
  uniqueId: 'company-b-uuid-456-1753707121835',
  text: 'Chat with Us',
  color: '#4ECDC4',
  shape: 'square',
  position: 'bottom-left',
  routing: {
    type: 'company',
    fallbackToCallDocker: true,
    priority: 'company-first',
    loadBalancing: 'random'
  }
};
```

### 2. URL-Based Routing

Each widget is tied to a specific company UUID:

```javascript
// Widget loads with company UUID
script.src = 'https://calldocker.com/widget.js?uuid=COMPANY_UUID';

// Backend routes based on UUID
POST /api/widget/route-call
{
  "companyUuid": "COMPANY_UUID",
  "visitorId": "visitor-123",
  "pageUrl": "https://company-website.com",
  "routingConfig": {
    "fallbackToCallDocker": true,
    "priority": "company-first",
    "loadBalancing": "round-robin"
  }
}
```

### 3. Analytics and Tracking

Each widget tracks:
- **Page views**: Which pages visitors view
- **Interactions**: Widget clicks, chat sessions
- **Routing**: Which agents handle calls
- **Fallbacks**: When CallDocker agents are used

## Deployment Configuration

### 1. Production Environment
```bash
# Environment variables for production
VITE_WIDGET_BASE_URL=https://calldocker.com
VITE_API_URL=https://calldocker-backend.onrender.com/api
```

### 2. Widget Base URL
```javascript
const getWidgetBaseUrl = () => {
  // Use env variable if set (for Vercel/production)
  if (import.meta.env.VITE_WIDGET_BASE_URL) {
    return import.meta.env.VITE_WIDGET_BASE_URL;
  }
  // Use window.location.origin for local/dev
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  // Fallback to production domain
  return 'https://calldocker.com';
};
```

## Testing the System

### 1. Test Scenarios

#### **Test Company Widget**
1. Create company via SuperAdmin dashboard
2. Generate widget script
3. Embed on test website
4. Test routing to company agents
5. Test fallback to CallDocker agents

#### **Test Public Widget**
1. Visit landing page
2. Click widget
3. Verify routing to CallDocker agents

### 2. Load Testing
- Test with multiple concurrent visitors
- Verify load balancing works
- Test fallback scenarios

## Monitoring and Analytics

### 1. Call Routing Analytics
- Track which companies use fallback
- Monitor agent availability
- Analyze routing patterns

### 2. Widget Performance
- Track widget load times
- Monitor interaction rates
- Analyze conversion rates

## Security Considerations

### 1. Widget Security
- Unique UUIDs prevent conflicts
- Company-specific routing isolation
- Rate limiting on API endpoints

### 2. Data Privacy
- Visitor data isolated by company
- Secure agent assignment
- Encrypted communication

## Troubleshooting

### 1. Common Issues

#### **Widget Not Loading**
- Check widget base URL
- Verify company UUID is valid
- Check browser console for errors

#### **Routing Issues**
- Verify company agents are online
- Check fallback configuration
- Monitor backend logs

#### **Agent Assignment Issues**
- Check agent status (online/offline)
- Verify agent registration
- Check load balancing configuration

### 2. Debug Information
```javascript
// Enable debug mode in widget config
var config = {
  // ... other config
  debug: true,
  logLevel: 'verbose'
};
```

## Conclusion

The enhanced widget generation and routing system provides:

1. **Unique Widgets**: Each company gets a unique, customizable widget
2. **Intelligent Routing**: Routes to company agents first, falls back to CallDocker
3. **Load Balancing**: Distributes calls among available agents
4. **Analytics**: Tracks performance and usage patterns
5. **Scalability**: Supports multiple companies and agents

This system is ready for the soft launch with 20 companies and can scale to support hundreds of companies in production. 