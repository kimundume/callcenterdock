# 🚀 Vercel Deployment Quick Reference - CallDocker

## 📋 **Deployment Summary**

| Component | URL | Status |
|-----------|-----|--------|
| **Dashboard** | `https://callcenterdock-dashboard.vercel.app` | ⏳ Deploy |
| **Widget** | `https://callcenterdock-widget.vercel.app` | ⏳ Deploy |
| **Backend** | `https://calldocker-backend.onrender.com` | ⏳ Deploy |

---

## 🏠 **Dashboard Deployment (Vite React App)**

### **Vercel Configuration:**
- **Repository**: `kimundume/callcenterdock`
- **Framework**: `Vite`
- **Root Directory**: `frontend/dashboard`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### **Environment Variables:**
```
VITE_API_URL=https://calldocker-backend.onrender.com/api
VITE_WIDGET_BASE_URL=https://callcenterdock-widget.vercel.app
VITE_APP_NAME=CallDocker
```

### **Deployment Steps:**
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import `kimundume/callcenterdock`
4. Set Root Directory to `frontend/dashboard`
5. Add environment variables
6. Deploy

---

## 🎨 **Widget Deployment (Static Files)**

### **Vercel Configuration:**
- **Repository**: `kimundume/callcenterdock`
- **Framework**: `Other`
- **Root Directory**: `frontend/widget`
- **Build Command**: (leave empty)
- **Output Directory**: (leave empty)

### **Environment Variables:**
```
VITE_API_URL=https://calldocker-backend.onrender.com/api
VITE_WIDGET_BASE_URL=https://callcenterdock-widget.vercel.app
```

### **Deployment Steps:**
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import `kimundume/callcenterdock`
4. Set Root Directory to `frontend/widget`
5. Add environment variables
6. Deploy

---

## 🔗 **Widget Integration Code**

### **For Your Clients:**
```html
<!-- CallDocker Widget -->
<script src="https://callcenterdock-widget.vercel.app/widget.js"></script>
<script>
  CallDocker.init({
    companyUuid: 'your-company-uuid',
    position: 'bottom-right',
    theme: 'light'
  });
</script>
```

### **Demo Page:**
Visit: `https://callcenterdock-widget.vercel.app/demo.html`

---

## 🌐 **URL Configuration**

### **After Both Deployments:**

1. **Update Dashboard Environment Variables:**
   - `VITE_WIDGET_BASE_URL` = `https://callcenterdock-widget.vercel.app`

2. **Update Widget Environment Variables:**
   - `VITE_WIDGET_BASE_URL` = `https://callcenterdock-widget.vercel.app`

3. **Update Backend CORS (Render):**
   ```
   CORS_ORIGIN=https://callcenterdock-dashboard.vercel.app,https://callcenterdock-widget.vercel.app,https://calldocker.com
   ```

---

## 📁 **File Structure**

### **Dashboard** (`frontend/dashboard/`)
```
├── src/
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── index.html
```

### **Widget** (`frontend/widget/`)
```
├── widget.js          # Main widget script
├── demo.html          # Demo page
└── assets/            # Widget assets
```

---

## ✅ **Testing Checklist**

### **Dashboard Testing:**
- [ ] Visit dashboard URL
- [ ] Test login functionality
- [ ] Test admin features
- [ ] Verify API connections

### **Widget Testing:**
- [ ] Visit widget.js URL
- [ ] Test widget integration
- [ ] Test real-time features
- [ ] Verify cross-origin requests

### **Integration Testing:**
- [ ] Embed widget on test site
- [ ] Test call routing
- [ ] Test agent assignment
- [ ] Test real-time communication

---

## 🚨 **Common Issues & Solutions**

### **Dashboard Build Fails:**
- Check React warnings in terminal
- Verify package.json dependencies
- Check Vite configuration

### **Widget Not Loading:**
- Verify widget.js is accessible
- Check CORS settings
- Verify environment variables

### **API Connection Issues:**
- Check VITE_API_URL is correct
- Verify backend is running
- Check CORS configuration

---

## 🔗 **Quick Links**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your GitHub Repo:** https://github.com/kimundume/callcenterdock
- **Render Backend:** https://dashboard.render.com
- **MongoDB Atlas:** https://www.mongodb.com/atlas
- **Redis Cloud:** https://redis.com/try-free/

---

## 🎯 **Deployment Order**

1. **First:** Deploy Dashboard to Vercel
2. **Second:** Deploy Widget to Vercel
3. **Third:** Update environment variables
4. **Fourth:** Update backend CORS
5. **Fifth:** Test everything

---

**🚀 Ready to deploy! Start with the dashboard deployment.** 