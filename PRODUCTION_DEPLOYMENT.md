# CallDocker Production Deployment Guide

## Overview
This guide covers the deployment of CallDocker to production environments using Vercel (frontend) and Render (backend) for the soft launch with 20 companies/tenants.

## Prerequisites
- Node.js 18+ installed
- Git repository set up
- Vercel account
- Render account
- Domain name (optional but recommended)

## Architecture
```
Frontend (Vercel) → Backend (Render) → Database (In-memory for now)
     ↓                    ↓
  Widget.js ←→ Socket.io ←→ Agent Dashboard
```

## Phase 1: Backend Deployment (Render)

### 1.1 Prepare Backend for Production
```bash
cd backend
npm install
npm run build
```

### 1.2 Deploy to Render
1. **Create Render Account**: Sign up at [render.com](https://render.com)
2. **Create New Web Service**:
   - Connect your Git repository
   - Select the backend directory
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Set environment: `Node`

### 1.3 Environment Variables (Render)
Set these in your Render dashboard:
```env
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secure-jwt-secret-key-here
CORS_ORIGIN=https://calldocker.com,https://www.calldocker.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
SESSION_SECRET=your-session-secret-key
COOKIE_SECRET=your-cookie-secret-key
```

### 1.4 Backend Health Check
After deployment, test these endpoints:
- `https://your-app.onrender.com/health`
- `https://your-app.onrender.com/test`
- `https://your-app.onrender.com/api/widget/calldocker-agents`

## Phase 2: Frontend Deployment (Vercel)

### 2.1 Prepare Frontend for Production
```bash
cd frontend/dashboard
npm install
npm run build
```

### 2.2 Deploy to Vercel
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend/dashboard
   vercel --prod
   ```

### 2.3 Environment Variables (Vercel)
Set these in your Vercel dashboard:
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_WIDGET_BASE_URL=https://calldocker.com
VITE_APP_NAME=CallDocker
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_MONITORING=true
VITE_ENABLE_DEBUG_MODE=false
```

## Phase 3: Domain Setup (Optional)

### 3.1 Custom Domain
1. **Backend Domain**: `api.calldocker.com`
2. **Frontend Domain**: `calldocker.com`
3. **Widget Domain**: `widget.calldocker.com`

### 3.2 SSL Certificates
- Vercel provides automatic SSL
- Render provides automatic SSL
- Ensure HTTPS is enforced

## Phase 4: Company Creation for Soft Launch

### 4.1 Super Admin Setup
1. **Access Super Admin Dashboard**: `https://calldocker.com/super-admin`
2. **Login Credentials**:
   - Username: `superadmin`
   - Password: `password`

### 4.2 Create 20 Companies
Use the "Create New Company" button in the Super Admin dashboard:

**Company Template**:
```json
{
  "companyName": "Company Name",
  "displayName": "Display Name",
  "email": "admin@company.com",
  "adminUsername": "admin",
  "adminPassword": "SecurePassword123!",
  "adminEmail": "admin@company.com"
}
```

**Sample Companies for Testing**:
1. TechCorp Solutions
2. Digital Marketing Pro
3. E-commerce Express
4. Healthcare Connect
5. Financial Services Plus
6. Education Hub
7. Real Estate Pro
8. Legal Services
9. Consulting Group
10. Retail Solutions
11. Manufacturing Hub
12. Logistics Pro
13. Hospitality Services
14. Automotive Solutions
15. Construction Pro
16. Insurance Services
17. Travel Agency
18. Fitness Center
19. Beauty Salon
20. Restaurant Group

### 4.3 Company Onboarding Process
1. **Create Company** (Super Admin)
2. **Generate Widget Code** (Company Admin)
3. **Add Agents** (Company Admin)
4. **Test Widget** (Company Admin)
5. **Deploy to Website** (Company)

## Phase 5: Testing Checklist

### 5.1 Backend Testing
- [ ] Health check endpoint
- [ ] Agent creation
- [ ] Call routing
- [ ] Chat functionality
- [ ] Form push
- [ ] Socket.io connections

### 5.2 Frontend Testing
- [ ] Super Admin dashboard
- [ ] Company admin dashboard
- [ ] Agent dashboard
- [ ] Widget functionality
- [ ] Landing page
- [ ] Responsive design

### 5.3 Integration Testing
- [ ] Widget to agent communication
- [ ] Call routing to correct agent
- [ ] Form push and response
- [ ] Chat sessions
- [ ] Real-time updates

## Phase 6: Monitoring and Analytics

### 6.1 Application Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Render Logs**: Backend monitoring
- **Error Tracking**: Consider Sentry integration

### 6.2 Business Metrics
- Active companies
- Daily active agents
- Call volume
- Chat sessions
- Form submissions

## Phase 7: Security Considerations

### 7.1 API Security
- Rate limiting enabled
- CORS properly configured
- JWT token validation
- Input validation

### 7.2 Data Security
- HTTPS enforced
- Secure headers
- Environment variables protected
- No sensitive data in logs

## Phase 8: Scaling Considerations

### 8.1 Current Limitations
- In-memory storage (data lost on restart)
- Single server instance
- No database persistence

### 8.2 Future Improvements
- Database integration (PostgreSQL/MongoDB)
- Redis for session management
- Load balancing
- CDN for static assets

## Troubleshooting

### Common Issues
1. **CORS Errors**: Check CORS_ORIGIN environment variable
2. **Socket.io Issues**: Ensure WebSocket connections are allowed
3. **Build Failures**: Check Node.js version compatibility
4. **Environment Variables**: Verify all required variables are set

### Support
- Check Render logs for backend issues
- Check Vercel logs for frontend issues
- Monitor browser console for client-side errors

## Next Steps After Launch
1. **Database Migration**: Move from in-memory to persistent storage
2. **Email Service**: Implement email verification
3. **Payment Integration**: Add billing system
4. **Advanced Analytics**: Implement detailed reporting
5. **Mobile App**: Develop mobile agent dashboard
6. **API Documentation**: Create developer portal

## Emergency Procedures
1. **Rollback**: Use Git tags for version control
2. **Backup**: Regular database backups (when implemented)
3. **Monitoring**: Set up alerts for critical failures
4. **Support**: Establish customer support process 