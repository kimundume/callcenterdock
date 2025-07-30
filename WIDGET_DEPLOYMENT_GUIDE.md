# 🚀 CallDocker Widget Deployment Guide

## 🎯 **Overview**

The CallDocker widget is a JavaScript file that gets embedded on client websites to enable voice calls and chat functionality. This guide covers how to deploy it properly and ensure it works in production.

---

## 📋 **Current Issues Fixed**

### ✅ **Before (Hardcoded URLs - BROKEN)**
```javascript
const BACKEND_URL = 'http://localhost:5001'; // ❌ Only works locally
fetch('/api/widget/route-call', ...) // ❌ Relative path fails
```

### ✅ **After (Dynamic URLs - PRODUCTION READY)**
```javascript
const getBackendUrl = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5001'; // ✅ Development
  }
  return 'https://calldocker-backend.onrender.com'; // ✅ Production
};
fetch(BACKEND_URL + '/api/widget/route-call', ...) // ✅ Full URL
```

---

## 🚀 **Deployment Steps**

### **Step 1: Deploy Widget Files to Vercel**

1. **Create a new Vercel project for the widget:**
   ```bash
   # Go to Vercel Dashboard
   # Click "New Project"
   # Import: kimundume/callcenterdock
   # Root Directory: frontend/widget
   # Framework: Other
   ```

2. **Vercel Configuration:**
   - **Project Name**: `callcenterdock-widget`
   - **Root Directory**: `frontend/widget`
   - **Build Command**: `echo "No build needed"`
   - **Output Directory**: `.`
   - **Install Command**: `echo "No install needed"`

3. **Environment Variables:**
   ```
   VITE_BACKEND_URL=https://calldocker-backend.onrender.com
   ```

### **Step 2: Update Widget URLs**

After deployment, your widget will be available at:
```
https://callcenterdock-widget.vercel.app/widget.js
https://callcenterdock-widget.vercel.app/widget-config.js
```

### **Step 3: Test Widget Embedding**

Create a test HTML file to verify the widget works:

```html
<!DOCTYPE html>
<html>
<head>
    <title>CallDocker Widget Test</title>
</head>
<body>
    <h1>Test Page</h1>
    <p>This page has the CallDocker widget embedded.</p>
    
    <!-- Load widget configuration -->
    <script src="https://callcenterdock-widget.vercel.app/widget-config.js"></script>
    
    <!-- Load main widget -->
    <script src="https://callcenterdock-widget.vercel.app/widget.js"></script>
    
    <!-- Set company UUID -->
    <script>
        window.CALLDOCKER_COMPANY_UUID = 'your-company-uuid';
    </script>
</body>
</html>
```

---

## 🔧 **Configuration Options**

### **1. Basic Configuration**
```html
<script>
    // Set your company UUID
    window.CALLDOCKER_COMPANY_UUID = 'your-company-uuid';
</script>
```

### **2. Advanced Configuration**
```html
<script>
    // Custom configuration
    window.CALLDOCKER_CUSTOM_CONFIG = {
        BACKEND_URL: 'https://your-custom-backend.com',
        COMPANY_UUID: 'your-company-uuid',
        BUTTON_COLORS: {
            call: '#ff6b6b',
            chat: '#4ecdc4'
        },
        TEXT: {
            callButton: 'Contact Sales',
            chatButton: 'Live Chat'
        }
    };
</script>
```

### **3. Multiple Companies**
```html
<script>
    // Different widget for different pages
    if (window.location.hostname === 'company1.com') {
        window.CALLDOCKER_COMPANY_UUID = 'company1-uuid';
    } else if (window.location.hostname === 'company2.com') {
        window.CALLDOCKER_COMPANY_UUID = 'company2-uuid';
    }
</script>
```

---

## 🌐 **CORS Configuration**

### **Backend CORS Settings (Render)**
Make sure your backend allows requests from client websites:

```javascript
// In your backend CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://callcenterdock-dashboard.vercel.app',
    'https://callcenterdock-widget.vercel.app',
    // Add your client domains here
    'https://client1.com',
    'https://client2.com'
  ],
  credentials: true
}));
```

---

## 🔍 **Testing Checklist**

### **Development Testing**
- [ ] Widget loads on localhost
- [ ] Call button works
- [ ] Chat button works
- [ ] Socket.IO connects
- [ ] API calls succeed

### **Production Testing**
- [ ] Widget loads on production domain
- [ ] HTTPS connections work
- [ ] CORS errors resolved
- [ ] Socket.IO connects over HTTPS
- [ ] API calls work from client domains

### **Client Website Testing**
- [ ] Widget loads on client website
- [ ] No console errors
- [ ] Buttons appear correctly
- [ ] Calls/chat initiate properly
- [ ] No CORS issues

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: CORS Errors**
```
Access to fetch at 'https://backend.com/api/widget/route-call' 
from origin 'https://client.com' has been blocked by CORS policy
```

**Solution**: Update backend CORS configuration to include client domains.

### **Issue 2: Socket.IO Connection Fails**
```
WebSocket connection to 'wss://backend.com/socket.io/' failed
```

**Solution**: Ensure backend supports WebSocket upgrades and HTTPS.

### **Issue 3: Widget Not Loading**
```
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
```

**Solution**: Check widget URL is correct and accessible.

### **Issue 4: API Calls Return 404**
```
GET https://backend.com/api/widget/route-call 404
```

**Solution**: Verify API endpoints exist and are properly configured.

---

## 📞 **Client Integration Examples**

### **WordPress Integration**
```php
// Add to your WordPress theme's footer.php
function add_calldocker_widget() {
    ?>
    <script src="https://callcenterdock-widget.vercel.app/widget-config.js"></script>
    <script src="https://callcenterdock-widget.vercel.app/widget.js"></script>
    <script>
        window.CALLDOCKER_COMPANY_UUID = '<?php echo get_option('calldocker_company_uuid'); ?>';
    </script>
    <?php
}
add_action('wp_footer', 'add_calldocker_widget');
```

### **Shopify Integration**
```liquid
<!-- Add to your Shopify theme's layout/theme.liquid -->
<script src="https://callcenterdock-widget.vercel.app/widget-config.js"></script>
<script src="https://callcenterdock-widget.vercel.app/widget.js"></script>
<script>
    window.CALLDOCKER_COMPANY_UUID = '{{ settings.calldocker_company_uuid }}';
</script>
```

### **React/Next.js Integration**
```jsx
// Add to your React app
useEffect(() => {
  // Load widget scripts
  const configScript = document.createElement('script');
  configScript.src = 'https://callcenterdock-widget.vercel.app/widget-config.js';
  document.head.appendChild(configScript);

  const widgetScript = document.createElement('script');
  widgetScript.src = 'https://callcenterdock-widget.vercel.app/widget.js';
  document.head.appendChild(widgetScript);

  // Set company UUID
  window.CALLDOCKER_COMPANY_UUID = process.env.NEXT_PUBLIC_CALLDOCKER_COMPANY_UUID;
}, []);
```

---

## 🎉 **Success Metrics**

After deployment, you should see:
- ✅ Widget loads on client websites
- ✅ No console errors
- ✅ Calls and chat initiate successfully
- ✅ Real-time communication works
- ✅ Cross-origin requests succeed

---

## 📞 **Support**

If you encounter issues:
1. Check browser console for errors
2. Verify backend is running and accessible
3. Confirm CORS configuration
4. Test with the provided test HTML file
5. Check network tab for failed requests 