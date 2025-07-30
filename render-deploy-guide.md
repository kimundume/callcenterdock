# CallDocker Backend Deployment to Render

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)

## Step 1: Prepare Backend for Render

### 1.1 Create Render-specific Environment File
Create `backend/.env.render` with production settings:

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secure-jwt-secret-key-here
CORS_ORIGIN=https://your-frontend-domain.vercel.app,https://calldocker.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
SESSION_SECRET=your-session-secret-key
COOKIE_SECRET=your-cookie-secret-key
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/calldocker
REDIS_URL=redis://username:password@redis-host:port
```

### 1.2 Update Backend Package.json
Ensure your `backend/package.json` has the correct build and start scripts:

```json
{
  "scripts": {
    "build": "npm run clean && tsc",
    "start": "node dist/server.js",
    "dev": "nodemon src/server.ts"
  }
}
```

### 1.3 Create Render Configuration
Create `render.yaml` in your root directory:

```yaml
services:
  - type: web
    name: calldocker-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        sync: false
      - key: CORS_ORIGIN
        value: https://your-frontend-domain.vercel.app
      - key: MONGODB_URI
        sync: false
      - key: REDIS_URL
        sync: false
```

## Step 2: Deploy to Render

### 2.1 Connect GitHub Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository: `kimundume/callcenterdock`

### 2.2 Configure Service
- **Name**: `calldocker-backend`
- **Environment**: `Node`
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`
- **Plan**: Free (or paid for better performance)

### 2.3 Environment Variables
Add these in Render dashboard:
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `JWT_SECRET`: Your secure JWT secret
- `CORS_ORIGIN`: Your Vercel frontend URL
- `MONGODB_URI`: Your MongoDB connection string
- `REDIS_URL`: Your Redis connection string

### 2.4 Deploy
Click "Create Web Service" and wait for deployment.

## Step 3: Database Setup

### 3.1 MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string
4. Add to Render environment variables

### 3.2 Redis Cloud (Optional)
1. Create account at [Redis Cloud](https://redis.com/try-free/)
2. Create free database
3. Get connection string
4. Add to Render environment variables

## Step 4: Test Backend
Your backend will be available at: `https://calldocker-backend.onrender.com`

Test the health endpoint: `https://calldocker-backend.onrender.com/health` 