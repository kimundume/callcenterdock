# 🚀 Vercel Frontend Deployment Guide - CallDocker

## 📋 **Overview**

Your CallDocker frontend has **two main components** that need to be deployed:

1. **Dashboard** (`frontend/dashboard/`) - Admin interface for managing calls, agents, companies
2. **Widget** (`frontend/widget/`) - Customer-facing widget that gets embedded on client websites

---

## 🎯 **Deployment Strategy**

### **Option 1: Single Repository, Multiple Deployments (Recommended)**
- Deploy dashboard as main Vercel project
- Deploy widget as separate Vercel project
- Both share the same GitHub repository

### **Option 2: Single Vercel Project with Multiple Routes**
- Deploy everything as one Vercel project
- Use different routes for dashboard and widget

---

## 🏠 **Step 1: Deploy Dashboard to Vercel**

### **1.1 Go to Vercel Dashboard**
1. Visit: https://vercel.com/dashboard
2. Sign up/Login with your GitHub account
3. Click "New Project"

### **1.2 Import Your Repository**
1. Select your GitHub repository: `kimundume/callcenterdock`
2. Choose the `main` branch
3. Click "Import"

### **1.3 Configure Dashboard Project**

#### **Project Settings:**
- **Project Name**: `callcenterdock-dashboard` (or your preferred name)
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend/dashboard`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### **Environment Variables:**
Add these environment variables in Vercel:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://calldocker-backend.onrender.com/api` | Backend API URL |
| `VITE_WIDGET_BASE_URL` | `https://your-widget-project.vercel.app` | Widget deployment URL |
| `VITE_APP_NAME` | `CallDocker` | Application name |

### **1.4 Deploy Dashboard**
1. Click "Deploy"
2. Wait for build to complete
3. Your dashboard will be available at: `https://your-project-name.vercel.app`

---

## 🎨 **Step 2: Deploy Widget to Vercel**

### **2.1 Create New Vercel Project for Widget**
1. Go back to Vercel Dashboard
2. Click "New Project"
3. Import the same repository: `kimundume/callcenterdock`

### **2.2 Configure Widget Project**

#### **Project Settings:**
- **Project Name**: `callcenterdock-widget` (or your preferred name)
- **Framework Preset**: `Other` (since it's a static widget)
- **Root Directory**: `frontend/widget`
- **Build Command**: Leave empty (no build needed)
- **Output Directory**: Leave empty
- **Install Command**: Leave empty

#### **Environment Variables:**
Add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://calldocker-backend.onrender.com/api` | Backend API URL |
| `VITE_WIDGET_BASE_URL` | `https://your-widget-project.vercel.app` | Current widget URL |

### **2.3 Deploy Widget**
1. Click "Deploy"
2. Wait for deployment to complete
3. Your widget will be available at: `https://your-widget-project.vercel.app`

---

## 🔧 **Step 3: Configure Widget for Production**

### **3.1 Update Widget Configuration**

After both deployments are complete, you need to update the widget configuration:

1. **Get your widget URL** (e.g., `https://callcenterdock-widget.vercel.app`)
2. **Update the widget.js file** to point to your production backend

### **3.2 Widget Integration Code**

Your clients will embed the widget using this code:

```html
<!-- CallDocker Widget -->
<script src="https://your-widget-project.vercel.app/widget.js"></script>
<script>
  CallDocker.init({
    companyUuid: 'your-company-uuid',
    position: 'bottom-right',
    theme: 'light'
  });
</script>
```

---

## 🌐 **Step 4: Update URLs and CORS**

### **4.1 Update Dashboard Environment Variables**
1. Go to your dashboard Vercel project
2. Go to Settings → Environment Variables
3. Update `VITE_WIDGET_BASE_URL` to your widget URL

### **4.2 Update Backend CORS (Render)**
1. Go to your Render backend dashboard
2. Update environment variable `CORS_ORIGIN`:
   ```
   https://your-dashboard-project.vercel.app,https://your-widget-project.vercel.app,https://calldocker.com
   ```
3. Redeploy the backend

### **4.3 Update Widget Environment Variables**
1. Go to your widget Vercel project
2. Update `VITE_WIDGET_BASE_URL` to match the widget URL

---

## 📁 **Step 5: File Structure Verification**

### **Dashboard Structure** (`frontend/dashboard/`)
```
frontend/dashboard/
├── src/
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── index.html
```

### **Widget Structure** (`frontend/widget/`)
```
frontend/widget/
├── widget.js          # Main widget script
├── demo.html          # Demo page
└── assets/            # Widget assets
```

---

## 🔍 **Step 6: Testing Your Deployment**

### **6.1 Test Dashboard**
1. Visit your dashboard URL: `https://your-dashboard-project.vercel.app`
2. Test login functionality
3. Test admin features
4. Verify API connections

### **6.2 Test Widget**
1. Visit your widget URL: `https://your-widget-project.vercel.app/widget.js`
2. Create a test HTML page with widget integration
3. Test widget functionality
4. Verify real-time features

### **6.3 Test Integration**
1. Embed widget on a test website
2. Test call routing
3. Test agent assignment
4. Test real-time communication

---

## ⚙️ **Step 7: Advanced Configuration**

### **7.1 Custom Domain Setup (Optional)**
1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Configure DNS settings

### **7.2 Environment-Specific Deployments**
You can set up different environments:

#### **Production Environment Variables:**
```
VITE_API_URL=https://calldocker-backend.onrender.com/api
VITE_WIDGET_BASE_URL=https://your-widget-project.vercel.app
VITE_APP_NAME=CallDocker
```

#### **Development Environment Variables:**
```
VITE_API_URL=http://localhost:5001/api
VITE_WIDGET_BASE_URL=http://localhost:3000
VITE_APP_NAME=CallDocker (Dev)
```

---

## 🚨 **Step 8: Troubleshooting**

### **Common Issues:**

#### **Dashboard Build Fails:**
- Check that all React warnings are resolved
- Verify `frontend/dashboard/package.json` has correct dependencies
- Check Vite configuration

#### **Widget Not Loading:**
- Verify widget.js is accessible at the URL
- Check CORS settings in backend
- Verify environment variables are set correctly

#### **API Connection Issues:**
- Check `VITE_API_URL` is correct
- Verify backend is running on Render
- Check CORS configuration

#### **Real-time Features Not Working:**
- Verify WebSocket connections
- Check backend Socket.IO configuration
- Verify environment variables

---

## 📊 **Step 9: Monitoring and Analytics**

### **9.1 Vercel Analytics**
1. Enable Vercel Analytics in project settings
2. Monitor performance metrics
3. Track user interactions

### **9.2 Error Monitoring**
1. Set up error tracking (Sentry, LogRocket)
2. Monitor API response times
3. Track widget loading performance

---

## 🔒 **Step 10: Security Considerations**

### **10.1 Environment Variables**
- Never commit secrets to Git
- Use Vercel's environment variable system
- Rotate secrets regularly

### **10.2 CORS Configuration**
- Only allow necessary origins
- Use HTTPS in production
- Validate incoming requests

### **10.3 Widget Security**
- Validate company UUIDs
- Implement rate limiting
- Sanitize user inputs

---

## ✅ **Final Checklist**

### **Dashboard Deployment:**
- [ ] Dashboard deployed to Vercel
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Login functionality working
- [ ] API connections verified

### **Widget Deployment:**
- [ ] Widget deployed to Vercel
- [ ] Widget.js accessible
- [ ] Environment variables set
- [ ] Integration code working
- [ ] Real-time features functional

### **Integration:**
- [ ] CORS updated in backend
- [ ] URLs updated in both projects
- [ ] Cross-component communication working
- [ ] End-to-end testing completed

---

## 🎉 **Success Indicators**

Your deployment is successful when:
- ✅ Dashboard loads at `https://your-dashboard-project.vercel.app`
- ✅ Widget loads at `https://your-widget-project.vercel.app/widget.js`
- ✅ Login functionality works
- ✅ Widget integration works on test websites
- ✅ Real-time features function properly
- ✅ API connections are stable

---

## 🔗 **Quick Links**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your GitHub Repo:** https://github.com/kimundume/callcenterdock
- **Render Backend:** https://dashboard.render.com
- **MongoDB Atlas:** https://www.mongodb.com/atlas
- **Redis Cloud:** https://redis.com/try-free/

---

**🚀 You're ready to deploy CallDocker frontend to Vercel! Start with the dashboard deployment and then move to the widget.** 