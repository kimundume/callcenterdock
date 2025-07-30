# CallDocker Docker Deployment Guide 🐳

This guide covers how to deploy CallDocker using Docker and Docker Compose for both development and production environments.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- 10GB free disk space

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd call-docker

# Create environment file
cp .env.example .env
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
MONGO_INITDB_DATABASE=calldocker

# Redis Configuration
REDIS_PASSWORD=your-redis-password

# JWT and Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key
COOKIE_SECRET=your-cookie-secret-key

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:80,https://yourdomain.com
```

### 3. Build and Run

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **Nginx Proxy**: http://localhost:80

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Frontend      │    │   Backend       │
│   (Port 80)     │◄──►│   (Port 3000)   │◄──►│   (Port 5001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │    │   Redis         │    │   WebSocket     │
│   (Port 27017)  │    │   (Port 6379)   │    │   Connections   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Service Details

### Backend Service
- **Image**: Node.js 18 Alpine
- **Port**: 5001
- **Features**: 
  - TypeScript compilation
  - Multi-stage build
  - Health checks
  - Non-root user execution

### Frontend Service
- **Image**: Nginx Alpine
- **Port**: 3000 (mapped to 80 internally)
- **Features**:
  - React build optimization
  - Static file serving
  - Gzip compression
  - Security headers

### Database Services
- **MongoDB**: Document database for user data
- **Redis**: Caching and session storage
- **Persistent volumes**: Data survives container restarts

### Nginx Proxy
- **Load balancing**: Routes traffic to appropriate services
- **SSL termination**: HTTPS support (configure for production)
- **Rate limiting**: API protection
- **WebSocket support**: Real-time communication

## 🛠️ Development Workflow

### 1. Development Mode

```bash
# Start services with development configuration
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs for specific service
docker-compose logs -f backend

# Execute commands in running container
docker-compose exec backend npm run dev
docker-compose exec frontend sh
```

### 2. Hot Reloading

For development with hot reloading:

```bash
# Create development override file
cat > docker-compose.dev.yml << EOF
version: '3.8'
services:
  backend:
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev
    environment:
      - NODE_ENV=development
  frontend:
    volumes:
      - ./frontend/dashboard:/app
      - /app/node_modules
    command: npm run dev
    environment:
      - NODE_ENV=development
EOF

# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## 🚀 Production Deployment

### 1. Production Environment Setup

```bash
# Create production environment file
cp .env.example .env.production

# Edit production environment variables
nano .env.production
```

### 2. Production Build

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. SSL Configuration

For HTTPS in production:

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Add your SSL certificates
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem

# Uncomment SSL configuration in nginx/nginx.conf
```

### 4. Database Backup

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out /data/backup/$(date +%Y%m%d)

# Backup Redis
docker-compose exec redis redis-cli BGSAVE
```

## 📊 Monitoring and Logs

### 1. Service Health Checks

```bash
# Check service status
docker-compose ps

# View health check results
docker-compose exec backend wget -qO- http://localhost:5001/health
docker-compose exec frontend wget -qO- http://localhost:80/health
```

### 2. Log Management

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# View logs with timestamps
docker-compose logs -f -t backend
```

### 3. Resource Monitoring

```bash
# Monitor container resources
docker stats

# Monitor specific container
docker stats calldocker-backend calldocker-frontend
```

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique passwords for all services
- Rotate secrets regularly

### 2. Network Security
- Use internal Docker networks
- Expose only necessary ports
- Implement rate limiting

### 3. Container Security
- Run containers as non-root users
- Keep base images updated
- Scan images for vulnerabilities

```bash
# Scan images for vulnerabilities
docker scan calldocker-backend
docker scan calldocker-frontend
```

## 🧹 Maintenance

### 1. Regular Updates

```bash
# Update base images
docker-compose pull

# Rebuild services
docker-compose build --no-cache

# Restart services
docker-compose restart
```

### 2. Cleanup

```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a
```

### 3. Database Maintenance

```bash
# MongoDB maintenance
docker-compose exec mongodb mongosh --eval "db.repairDatabase()"

# Redis maintenance
docker-compose exec redis redis-cli FLUSHDB
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :5001
   
   # Change ports in docker-compose.yml
   ports:
     - "5002:5001"  # Change external port
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   docker stats
   
   # Increase Docker memory limit in Docker Desktop
   ```

3. **Database Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Test connection
   docker-compose exec backend node -e "console.log('DB connection test')"
   ```

4. **Build Failures**
   ```bash
   # Clean build cache
   docker-compose build --no-cache
   
   # Check Dockerfile syntax
   docker-compose config
   ```

### Debug Commands

```bash
# Enter running container
docker-compose exec backend sh
docker-compose exec frontend sh

# View container details
docker inspect calldocker-backend

# Check network connectivity
docker-compose exec backend ping frontend
docker-compose exec backend ping mongodb
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Scale with load balancer
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

### Load Balancer Configuration

Create `docker-compose.scale.yml`:

```yaml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Docker Guide](https://docs.mongodb.com/manual/installation/)
- [Redis Docker Guide](https://redis.io/topics/quickstart)

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Docker and service logs
3. Consult the application documentation
4. Create an issue in the repository

---

**Happy Dockerizing! 🐳✨** 