#!/bin/bash

# CallDocker Production Deployment Script
# This script helps prepare and deploy CallDocker to Render + Vercel

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${BLUE}=== $1 ===${NC}"; }

print_header "CallDocker Production Deployment Setup"

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    print_warning "You have uncommitted changes. Please commit them first."
    git status
    exit 1
fi

print_status "Creating production environment files..."

# Create backend production env file
cat > backend/.env.render << EOF
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
EOF

# Create frontend production env file
cat > frontend/dashboard/.env.production << EOF
VITE_API_URL=https://calldocker-backend.onrender.com/api
VITE_WIDGET_BASE_URL=https://your-frontend-domain.vercel.app
VITE_APP_NAME=CallDocker
EOF

print_status "Environment files created successfully!"

print_header "Deployment Steps"

echo -e "${YELLOW}Step 1: Backend Deployment (Render)${NC}"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository: kimundume/callcenterdock"
echo "4. Configure service:"
echo "   - Name: calldocker-backend"
echo "   - Environment: Node"
echo "   - Build Command: cd backend && npm install && npm run build"
echo "   - Start Command: cd backend && npm start"
echo "   - Plan: Free"
echo ""
echo "5. Add Environment Variables:"
echo "   - NODE_ENV: production"
echo "   - PORT: 10000"
echo "   - JWT_SECRET: [your-secure-jwt-secret]"
echo "   - CORS_ORIGIN: [your-vercel-frontend-url]"
echo "   - MONGODB_URI: [your-mongodb-connection-string]"
echo "   - REDIS_URL: [your-redis-connection-string]"
echo ""

echo -e "${YELLOW}Step 2: Frontend Deployment (Vercel)${NC}"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click 'New Project'"
echo "3. Import your GitHub repository: kimundume/callcenterdock"
echo "4. Configure project:"
echo "   - Framework Preset: Vite"
echo "   - Root Directory: frontend/dashboard"
echo "   - Build Command: npm run build"
echo "   - Output Directory: dist"
echo "   - Install Command: npm install"
echo ""
echo "5. Add Environment Variables:"
echo "   - VITE_API_URL: https://calldocker-backend.onrender.com/api"
echo "   - VITE_WIDGET_BASE_URL: [your-vercel-frontend-url]"
echo "   - VITE_APP_NAME: CallDocker"
echo ""

echo -e "${YELLOW}Step 3: Database Setup${NC}"
echo "1. MongoDB Atlas (Recommended):"
echo "   - Create account at https://www.mongodb.com/atlas"
echo "   - Create a free cluster"
echo "   - Get connection string"
echo "   - Add to Render environment variables"
echo ""
echo "2. Redis Cloud (Optional):"
echo "   - Create account at https://redis.com/try-free/"
echo "   - Create free database"
echo "   - Get connection string"
echo "   - Add to Render environment variables"
echo ""

echo -e "${YELLOW}Step 4: Update URLs${NC}"
echo "After deployment, update these files with your actual URLs:"
echo "1. backend/.env.render - Update CORS_ORIGIN"
echo "2. frontend/dashboard/.env.production - Update VITE_WIDGET_BASE_URL"
echo "3. render.yaml - Update CORS_ORIGIN"
echo ""

print_status "Deployment setup complete!"
print_warning "Remember to:"
echo "1. Replace placeholder values with your actual credentials"
echo "2. Set up your databases (MongoDB Atlas, Redis Cloud)"
echo "3. Update CORS settings after getting your Vercel URL"
echo "4. Test your deployment thoroughly"
echo ""
print_status "Your CallDocker application will be live at:"
echo "- Frontend: https://your-project.vercel.app"
echo "- Backend: https://calldocker-backend.onrender.com" 