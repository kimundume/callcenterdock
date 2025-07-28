#!/bin/bash

# CallDocker Deployment Script
# This script automates the deployment process for both backend and frontend

set -e  # Exit on any error

echo "🚀 Starting CallDocker Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_status "All dependencies are installed"
}

# Build backend
build_backend() {
    print_status "Building backend..."
    cd backend
    
    # Install dependencies
    npm install
    
    # Clean previous build
    npm run clean
    
    # Build TypeScript
    npm run build
    
    # Test build
    if [ -f "dist/server.js" ]; then
        print_status "Backend build successful"
    else
        print_error "Backend build failed"
        exit 1
    fi
    
    cd ..
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    cd frontend/dashboard
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    
    # Check if build was successful
    if [ -d "dist" ]; then
        print_status "Frontend build successful"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    cd ../..
}

# Deploy to Render (Backend)
deploy_backend_render() {
    print_status "Deploying backend to Render..."
    
    # This would typically involve pushing to a Git repository
    # that Render is monitoring, or using Render's CLI
    
    print_warning "Manual deployment required for Render backend"
    print_status "Steps to deploy backend to Render:"
    echo "1. Push code to your Git repository"
    echo "2. Connect repository to Render"
    echo "3. Set environment variables in Render dashboard"
    echo "4. Deploy service"
}

# Deploy to Vercel (Frontend)
deploy_frontend_vercel() {
    print_status "Deploying frontend to Vercel..."
    
    # This would typically involve using Vercel CLI
    # or pushing to a Git repository that Vercel is monitoring
    
    print_warning "Manual deployment required for Vercel frontend"
    print_status "Steps to deploy frontend to Vercel:"
    echo "1. Install Vercel CLI: npm i -g vercel"
    echo "2. Navigate to frontend/dashboard directory"
    echo "3. Run: vercel --prod"
    echo "4. Set environment variables in Vercel dashboard"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests
    cd backend
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm test
    else
        print_warning "No test script found in backend"
    fi
    cd ..
    
    # Frontend tests
    cd frontend/dashboard
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm test
    else
        print_warning "No test script found in frontend"
    fi
    cd ../..
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    # Check dependencies
    check_dependencies
    
    # Build applications
    build_backend
    build_frontend
    
    # Run tests (if available)
    run_tests
    
    # Deploy
    deploy_backend_render
    deploy_frontend_vercel
    
    print_status "Deployment process completed!"
    print_status "Next steps:"
    echo "1. Complete manual deployment to Render and Vercel"
    echo "2. Set up environment variables in both platforms"
    echo "3. Test the deployed applications"
    echo "4. Set up monitoring and analytics"
}

# Run main function
main "$@" 