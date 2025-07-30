#!/bin/bash

# CallDocker Docker Management Script
# This script provides common Docker operations for the CallDocker application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install it and try again."
        exit 1
    fi
}

# Function to build all services
build_services() {
    print_header "Building CallDocker Services"
    check_docker
    check_docker_compose
    
    print_status "Building backend service..."
    docker-compose build backend
    
    print_status "Building frontend service..."
    docker-compose build frontend
    
    print_status "All services built successfully!"
}

# Function to start all services
start_services() {
    print_header "Starting CallDocker Services"
    check_docker
    check_docker_compose
    
    print_status "Starting all services..."
    docker-compose up -d
    
    print_status "Services started successfully!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend API: http://localhost:5001"
    print_status "Nginx Proxy: http://localhost:80"
}

# Function to stop all services
stop_services() {
    print_header "Stopping CallDocker Services"
    check_docker_compose
    
    print_status "Stopping all services..."
    docker-compose down
    
    print_status "Services stopped successfully!"
}

# Function to restart all services
restart_services() {
    print_header "Restarting CallDocker Services"
    check_docker_compose
    
    print_status "Restarting all services..."
    docker-compose restart
    
    print_status "Services restarted successfully!"
}

# Function to view logs
view_logs() {
    local service=${1:-""}
    
    if [ -z "$service" ]; then
        print_header "Viewing All Logs"
        docker-compose logs -f
    else
        print_header "Viewing $service Logs"
        docker-compose logs -f "$service"
    fi
}

# Function to check service status
check_status() {
    print_header "CallDocker Service Status"
    check_docker_compose
    
    docker-compose ps
    
    echo ""
    print_status "Health Checks:"
    
    # Check backend health
    if docker-compose exec -T backend wget -qO- http://localhost:5001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend: Healthy${NC}"
    else
        echo -e "${RED}✗ Backend: Unhealthy${NC}"
    fi
    
    # Check frontend health
    if docker-compose exec -T frontend wget -qO- http://localhost:80/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend: Healthy${NC}"
    else
        echo -e "${RED}✗ Frontend: Unhealthy${NC}"
    fi
    
    # Check MongoDB health
    if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MongoDB: Healthy${NC}"
    else
        echo -e "${RED}✗ MongoDB: Unhealthy${NC}"
    fi
    
    # Check Redis health
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis: Healthy${NC}"
    else
        echo -e "${RED}✗ Redis: Unhealthy${NC}"
    fi
}

# Function to clean up Docker resources
cleanup() {
    print_header "Cleaning Up Docker Resources"
    check_docker
    
    print_warning "This will remove all unused containers, networks, and images."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removing unused containers..."
        docker container prune -f
        
        print_status "Removing unused networks..."
        docker network prune -f
        
        print_status "Removing unused images..."
        docker image prune -f
        
        print_status "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to backup database
backup_database() {
    print_header "Backing Up Database"
    check_docker_compose
    
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    print_status "Creating MongoDB backup..."
    docker-compose exec -T mongodb mongodump --out /data/backup/$(date +%Y%m%d_%H%M%S)
    
    print_status "Creating Redis backup..."
    docker-compose exec -T redis redis-cli BGSAVE
    
    print_status "Backup completed in $backup_dir"
}

# Function to restore database
restore_database() {
    print_header "Restoring Database"
    check_docker_compose
    
    if [ -z "$1" ]; then
        print_error "Please provide backup directory path"
        echo "Usage: $0 restore <backup_directory>"
        exit 1
    fi
    
    local backup_dir="$1"
    
    if [ ! -d "$backup_dir" ]; then
        print_error "Backup directory does not exist: $backup_dir"
        exit 1
    fi
    
    print_warning "This will overwrite existing data. Are you sure? (y/N): "
    read -p "" -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restoring MongoDB data..."
        docker-compose exec -T mongodb mongorestore --drop "$backup_dir"
        
        print_status "Database restore completed!"
    else
        print_status "Restore cancelled."
    fi
}

# Function to show help
show_help() {
    echo "CallDocker Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build              Build all Docker images"
    echo "  start              Start all services"
    echo "  stop               Stop all services"
    echo "  restart            Restart all services"
    echo "  logs [service]     View logs (all services or specific service)"
    echo "  status             Check service status and health"
    echo "  cleanup            Clean up unused Docker resources"
    echo "  backup             Create database backup"
    echo "  restore <dir>      Restore database from backup"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 restore ./backups/20231201_120000"
}

# Main script logic
case "${1:-help}" in
    build)
        build_services
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs "$2"
        ;;
    status)
        check_status
        ;;
    cleanup)
        cleanup
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 