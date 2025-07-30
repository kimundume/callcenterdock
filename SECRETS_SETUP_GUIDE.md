# 🔐 Complete Secrets Setup Guide for CallDocker Render Deployment

## 📋 **Environment Variables Summary**

```
NODE_ENV = production
PORT = 10000
JWT_SECRET = [GENERATED_SECRET]
CORS_ORIGIN = https://your-frontend-domain.vercel.app
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/calldocker
REDIS_URL = redis://username:password@redis-host:port
```

---

## 🔑 **1. JWT_SECRET - Generate Secure Secret**

### **Method 1: Using Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Method 2: Using Online Generator**
- Go to: https://generate-secret.vercel.app/64
- Copy the generated secret

### **Method 3: Using PowerShell**
```powershell
$bytes = New-Object Byte[] 64
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[System.BitConverter]::ToString($bytes) -replace '-', ''
```

### **Your Generated JWT_SECRET:**
```
8aa3878375ee45ee7bd5ed9d5a1a41614dca92b83723c6d61be37a44ac7c7a64219f45c97d45669a7c7dc1bc4edb8c3de876693ec63d466bf707db5b7667db89
```

---

## 🗄️ **2. MONGODB_URI - MongoDB Atlas Setup**

### **Step 1: Create MongoDB Atlas Account**
1. Go to: https://www.mongodb.com/atlas
2. Click "Try Free"
3. Sign up with email or Google account

### **Step 2: Create Cluster**
1. Choose "FREE" tier (M0)
2. Select cloud provider (AWS/Google Cloud/Azure)
3. Choose region (closest to your users)
4. Click "Create Cluster"

### **Step 3: Set Up Database Access**
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and password (save these!)
5. Select "Built-in Role" → "Atlas admin"
6. Click "Add User"

### **Step 4: Set Up Network Access**
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### **Step 5: Get Connection String**
1. Go back to "Database" in left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string

### **Step 6: Format Your MONGODB_URI**
Replace the placeholder with your actual credentials:
```
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/calldocker?retryWrites=true&w=majority
```

**Example:**
```
mongodb+srv://calldocker_user:MySecurePassword123@cluster0.abc123.mongodb.net/calldocker?retryWrites=true&w=majority
```

---

## 🔴 **3. REDIS_URL - Redis Cloud Setup**

### **Step 1: Create Redis Cloud Account**
1. Go to: https://redis.com/try-free/
2. Click "Start Free"
3. Sign up with email or Google account

### **Step 2: Create Database**
1. Click "Create Database"
2. Choose "FREE" plan
3. Select cloud provider and region
4. Click "Create Database"

### **Step 3: Get Connection Details**
1. Click on your database
2. Go to "Configuration" tab
3. Copy the connection details

### **Step 4: Format Your REDIS_URL**
```
redis://username:password@host:port
```

**Example:**
```
redis://default:MyRedisPassword123@redis-12345.c123.us-east-1-4.ec2.cloud.redislabs.com:12345
```

### **Alternative: Use Redis Cloud Connection String**
Redis Cloud provides a direct connection string:
```
rediss://default:password@host:port
```

---

## 🌐 **4. CORS_ORIGIN - Frontend URL**

### **Step 1: Deploy Frontend to Vercel**
1. Go to: https://vercel.com/dashboard
2. Import your GitHub repository
3. Configure as Vite project
4. Deploy

### **Step 2: Get Your Vercel URL**
Your URL will be: `https://your-project-name.vercel.app`

### **Step 3: Set CORS_ORIGIN**
```
CORS_ORIGIN = https://your-project-name.vercel.app,https://calldocker.com
```

---

## ⚙️ **5. Complete Environment Variables Setup**

### **For Render Backend Service:**

| Variable | Value | Example |
|----------|-------|---------|
| `NODE_ENV` | `production` | `production` |
| `PORT` | `10000` | `10000` |
| `JWT_SECRET` | Generated secret | `8aa3878375ee45ee7bd5ed9d5a1a41614dca92b83723c6d61be37a44ac7c7a64219f45c97d45669a7c7dc1bc4edb8c3de876693ec63d466bf707db5b7667db89` |
| `CORS_ORIGIN` | Your Vercel URL | `https://callcenterdock.vercel.app,https://calldocker.com` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://username:password@cluster.mongodb.net/calldocker?retryWrites=true&w=majority` |
| `REDIS_URL` | Redis connection string | `redis://default:password@host:port` |

### **For Vercel Frontend:**

| Variable | Value | Example |
|----------|-------|---------|
| `VITE_API_URL` | Your Render backend URL | `https://calldocker-backend.onrender.com/api` |
| `VITE_WIDGET_BASE_URL` | Your Vercel frontend URL | `https://callcenterdock.vercel.app` |
| `VITE_APP_NAME` | App name | `CallDocker` |

---

## 🚀 **6. Step-by-Step Deployment Process**

### **Phase 1: Set Up Databases**
1. ✅ Create MongoDB Atlas account and cluster
2. ✅ Create Redis Cloud account and database
3. ✅ Generate JWT secret

### **Phase 2: Deploy Backend to Render**
1. Go to https://dashboard.render.com
2. Create new Web Service
3. Connect GitHub repository
4. Configure environment variables
5. Deploy

### **Phase 3: Deploy Frontend to Vercel**
1. Go to https://vercel.com/dashboard
2. Import GitHub repository
3. Configure environment variables
4. Deploy

### **Phase 4: Update URLs**
1. Get your Vercel URL
2. Update CORS_ORIGIN in Render
3. Update VITE_API_URL in Vercel
4. Redeploy both services

---

## 🔒 **7. Security Best Practices**

### **Password Requirements:**
- MongoDB: At least 8 characters, mix of letters, numbers, symbols
- Redis: At least 8 characters, mix of letters, numbers, symbols
- JWT: Use the generated 64-byte hex string

### **Connection Security:**
- MongoDB: Uses SSL/TLS by default
- Redis: Uses SSL/TLS (rediss://) for production
- JWT: Store securely, never commit to Git

### **Environment Variables:**
- Never commit secrets to Git
- Use Render's environment variable system
- Rotate secrets regularly

---

## 🆘 **8. Troubleshooting**

### **Common Issues:**

**MongoDB Connection Failed:**
- Check username/password
- Verify IP whitelist (0.0.0.0/0)
- Ensure cluster is running

**Redis Connection Failed:**
- Check username/password
- Verify connection string format
- Ensure database is active

**CORS Errors:**
- Update CORS_ORIGIN with exact Vercel URL
- Include protocol (https://)
- Redeploy backend after changes

**JWT Errors:**
- Ensure JWT_SECRET is set correctly
- Check for extra spaces or characters
- Verify secret is at least 32 characters

---

## 📞 **9. Support Resources**

- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Redis Cloud:** https://docs.redis.com/
- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs

---

## ✅ **10. Final Checklist**

- [ ] JWT_SECRET generated and copied
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB user created with password
- [ ] MongoDB IP whitelist configured
- [ ] MongoDB connection string formatted
- [ ] Redis Cloud database created
- [ ] Redis connection string copied
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] All environment variables set
- [ ] CORS_ORIGIN updated with Vercel URL
- [ ] Application tested and working

---

**🎉 You're ready to deploy CallDocker to production!** 