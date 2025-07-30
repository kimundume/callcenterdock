# CallDocker Frontend Deployment to Vercel

## Prerequisites
- GitHub repository with your code
- Vercel account (free tier available)

## Step 1: Prepare Frontend for Vercel

### 1.1 Create Vercel Configuration
Create `vercel.json` in your root directory:

```json
{
  "buildCommand": "cd frontend/dashboard && npm install && npm run build",
  "outputDirectory": "frontend/dashboard/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### 1.2 Update Frontend Environment Variables
Create `frontend/dashboard/.env.production`:

```env
VITE_API_URL=https://calldocker-backend.onrender.com/api
VITE_WIDGET_BASE_URL=https://your-frontend-domain.vercel.app
VITE_APP_NAME=CallDocker
```

### 1.3 Update Vite Configuration
Ensure `frontend/dashboard/vite.config.ts` has proper configuration:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
})
```

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `kimundume/callcenterdock`

### 2.2 Configure Project
- **Framework Preset**: Vite
- **Root Directory**: `frontend/dashboard`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.3 Environment Variables
Add these in Vercel dashboard:
- `VITE_API_URL`: `https://calldocker-backend.onrender.com/api`
- `VITE_WIDGET_BASE_URL`: `https://your-frontend-domain.vercel.app`
- `VITE_APP_NAME`: `CallDocker`

### 2.4 Deploy
Click "Deploy" and wait for deployment.

## Step 3: Custom Domain (Optional)

### 3.1 Add Custom Domain
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `calldocker.com`)
4. Configure DNS records as instructed

### 3.2 Update Environment Variables
Update `VITE_WIDGET_BASE_URL` to your custom domain.

## Step 4: Test Frontend
Your frontend will be available at: `https://your-project.vercel.app`

## Step 5: Update Backend CORS
After getting your Vercel URL, update the backend CORS settings in Render:
- `CORS_ORIGIN`: `https://your-project.vercel.app,https://calldocker.com` 