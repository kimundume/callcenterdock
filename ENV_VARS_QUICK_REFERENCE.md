# 🚀 Quick Reference: Environment Variables for CallDocker Deployment

## 🔑 **Your Generated JWT Secret**
```
8aa3878375ee45ee7bd5ed9d5a1a41614dca92b83723c6d61be37a44ac7c7a64219f45c97d45669a7c7dc1bc4edb8c3de876693ec63d466bf707db5b7667db89
```

---

## ⚙️ **Render Backend Environment Variables**

| Variable | Value | Status |
|----------|-------|--------|
| `NODE_ENV` | `production` | ✅ Ready |
| `PORT` | `10000` | ✅ Ready |
| `JWT_SECRET` | `8aa3878375ee45ee7bd5ed9d5a1a41614dca92b83723c6d61be37a44ac7c7a64219f45c97d45669a7c7dc1bc4edb8c3de876693ec63d466bf707db5b7667db89` | ✅ Ready |
| `CORS_ORIGIN` | `https://[YOUR-VERCEL-URL].vercel.app,https://calldocker.com` | ⏳ Wait for Vercel |
| `MONGODB_URI` | `mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net/calldocker?retryWrites=true&w=majority` | ⏳ Setup MongoDB |
| `REDIS_URL` | `redis://[USERNAME]:[PASSWORD]@[HOST]:[PORT]` | ⏳ Setup Redis |

---

## 🌐 **Vercel Frontend Environment Variables**

| Variable | Value | Status |
|----------|-------|--------|
| `VITE_API_URL` | `https://calldocker-backend.onrender.com/api` | ✅ Ready |
| `VITE_WIDGET_BASE_URL` | `https://[YOUR-VERCEL-URL].vercel.app` | ⏳ Wait for Vercel |
| `VITE_APP_NAME` | `CallDocker` | ✅ Ready |

---

## 📋 **Deployment Checklist**

### **Phase 1: Database Setup**
- [ ] **MongoDB Atlas**
  - [ ] Create account at https://www.mongodb.com/atlas
  - [ ] Create FREE cluster
  - [ ] Create database user with password
  - [ ] Set IP whitelist to 0.0.0.0/0
  - [ ] Get connection string

- [ ] **Redis Cloud**
  - [ ] Create account at https://redis.com/try-free/
  - [ ] Create FREE database
  - [ ] Get connection string

### **Phase 2: Backend Deployment (Render)**
- [ ] Go to https://dashboard.render.com
- [ ] Create new Web Service
- [ ] Connect GitHub: `kimundume/callcenterdock`
- [ ] Set environment variables (see table above)
- [ ] Deploy

### **Phase 3: Frontend Deployment (Vercel)**
- [ ] Go to https://vercel.com/dashboard
- [ ] Import GitHub: `kimundume/callcenterdock`
- [ ] Set environment variables (see table above)
- [ ] Deploy

### **Phase 4: URL Updates**
- [ ] Get Vercel URL
- [ ] Update `CORS_ORIGIN` in Render
- [ ] Update `VITE_WIDGET_BASE_URL` in Vercel
- [ ] Redeploy both services

---

## 🔗 **Quick Links**

- **MongoDB Atlas:** https://www.mongodb.com/atlas
- **Redis Cloud:** https://redis.com/try-free/
- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your GitHub Repo:** https://github.com/kimundume/callcenterdock

---

## 🆘 **Need Help?**

1. **MongoDB Issues:** Check IP whitelist and credentials
2. **Redis Issues:** Verify connection string format
3. **CORS Issues:** Update with exact Vercel URL
4. **Build Issues:** Check TypeScript errors in terminal

---

**🎯 Next Step:** Start with MongoDB Atlas setup! 