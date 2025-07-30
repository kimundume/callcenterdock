# CallDocker Production Deployment Script (PowerShell)
# This script helps prepare and deploy CallDocker to Render + Vercel

param(
    [switch]$Setup,
    [switch]$Help
)

function Write-Status { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Header { param([string]$Message) Write-Host "=== $Message ===" -ForegroundColor Blue }

if ($Help) {
    Write-Host "CallDocker Production Deployment Script"
    Write-Host ""
    Write-Host "Usage: .\deploy-production.ps1 [-Setup] [-Help]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Setup    Create production environment files"
    Write-Host "  -Help     Show this help message"
    exit 0
}

Write-Header "CallDocker Production Deployment Setup"

# Check if git is clean
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning "You have uncommitted changes. Please commit them first."
    git status
    exit 1
}

if ($Setup) {
    Write-Status "Creating production environment files..."

    # Create backend production env file
    @"
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
"@ | Out-File -FilePath "backend\.env.render" -Encoding UTF8

    # Create frontend production env file
    @"
VITE_API_URL=https://calldocker-backend.onrender.com/api
VITE_WIDGET_BASE_URL=https://your-frontend-domain.vercel.app
VITE_APP_NAME=CallDocker
"@ | Out-File -FilePath "frontend\dashboard\.env.production" -Encoding UTF8

    Write-Status "Environment files created successfully!"
}

Write-Header "Deployment Steps"

Write-Host "Step 1: Backend Deployment (Render)" -ForegroundColor Yellow
Write-Host "1. Go to https://dashboard.render.com"
Write-Host "2. Click 'New +' → 'Web Service'"
Write-Host "3. Connect your GitHub repository: kimundume/callcenterdock"
Write-Host "4. Configure service:"
Write-Host "   - Name: calldocker-backend"
Write-Host "   - Environment: Node"
Write-Host "   - Build Command: cd backend && npm install && npm run build"
Write-Host "   - Start Command: cd backend && npm start"
Write-Host "   - Plan: Free"
Write-Host ""
Write-Host "5. Add Environment Variables:"
Write-Host "   - NODE_ENV: production"
Write-Host "   - PORT: 10000"
Write-Host "   - JWT_SECRET: [your-secure-jwt-secret]"
Write-Host "   - CORS_ORIGIN: [your-vercel-frontend-url]"
Write-Host "   - MONGODB_URI: [your-mongodb-connection-string]"
Write-Host "   - REDIS_URL: [your-redis-connection-string]"
Write-Host ""

Write-Host "Step 2: Frontend Deployment (Vercel)" -ForegroundColor Yellow
Write-Host "1. Go to https://vercel.com/dashboard"
Write-Host "2. Click 'New Project'"
Write-Host "3. Import your GitHub repository: kimundume/callcenterdock"
Write-Host "4. Configure project:"
Write-Host "   - Framework Preset: Vite"
Write-Host "   - Root Directory: frontend/dashboard"
Write-Host "   - Build Command: npm run build"
Write-Host "   - Output Directory: dist"
Write-Host "   - Install Command: npm install"
Write-Host ""
Write-Host "5. Add Environment Variables:"
Write-Host "   - VITE_API_URL: https://calldocker-backend.onrender.com/api"
Write-Host "   - VITE_WIDGET_BASE_URL: [your-vercel-frontend-url]"
Write-Host "   - VITE_APP_NAME: CallDocker"
Write-Host ""

Write-Host "Step 3: Database Setup" -ForegroundColor Yellow
Write-Host "1. MongoDB Atlas (Recommended):"
Write-Host "   - Create account at https://www.mongodb.com/atlas"
Write-Host "   - Create a free cluster"
Write-Host "   - Get connection string"
Write-Host "   - Add to Render environment variables"
Write-Host ""
Write-Host "2. Redis Cloud (Optional):"
Write-Host "   - Create account at https://redis.com/try-free/"
Write-Host "   - Create free database"
Write-Host "   - Get connection string"
Write-Host "   - Add to Render environment variables"
Write-Host ""

Write-Host "Step 4: Update URLs" -ForegroundColor Yellow
Write-Host "After deployment, update these files with your actual URLs:"
Write-Host "1. backend\.env.render - Update CORS_ORIGIN"
Write-Host "2. frontend\dashboard\.env.production - Update VITE_WIDGET_BASE_URL"
Write-Host "3. render.yaml - Update CORS_ORIGIN"
Write-Host ""

Write-Status "Deployment setup complete!"
Write-Warning "Remember to:"
Write-Host "1. Replace placeholder values with your actual credentials"
Write-Host "2. Set up your databases (MongoDB Atlas, Redis Cloud)"
Write-Host "3. Update CORS settings after getting your Vercel URL"
Write-Host "4. Test your deployment thoroughly"
Write-Host ""
Write-Status "Your CallDocker application will be live at:"
Write-Host "- Frontend: https://your-project.vercel.app"
Write-Host "- Backend: https://calldocker-backend.onrender.com" 