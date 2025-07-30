# CallDocker Docker Management Script (PowerShell)
# This script provides common Docker operations for the CallDocker application

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Service = ""
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    param([string]$Message)
    Write-Host "=== $Message ===" -ForegroundColor Blue
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if docker-compose is available
function Test-DockerCompose {
    try {
        docker-compose --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to build all services
function Build-Services {
    Write-Header "Building CallDocker Services"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not installed. Please install it and try again."
        exit 1
    }
    
    Write-Status "Building backend service..."
    docker-compose build backend
    
    Write-Status "Building frontend service..."
    docker-compose build frontend
    
    Write-Status "All services built successfully!"
}

# Function to start all services
function Start-Services {
    Write-Header "Starting CallDocker Services"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not installed. Please install it and try again."
        exit 1
    }
    
    Write-Status "Starting all services..."
    docker-compose up -d
    
    Write-Status "Services started successfully!"
    Write-Status "Frontend: http://localhost:3000"
    Write-Status "Backend API: http://localhost:5001"
    Write-Status "Nginx Proxy: http://localhost:80"
}

# Function to stop all services
function Stop-Services {
    Write-Header "Stopping CallDocker Services"
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not installed. Please install it and try again."
        exit 1
    }
    
    Write-Status "Stopping all services..."
    docker-compose down
    
    Write-Status "Services stopped successfully!"
}

# Function to restart all services
function Restart-Services {
    Write-Header "Restarting CallDocker Services"
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not installed. Please install it and try again."
        exit 1
    }
    
    Write-Status "Restarting all services..."
    docker-compose restart
    
    Write-Status "Services restarted successfully!"
}

# Function to view logs
function View-Logs {
    param([string]$ServiceName = "")
    
    if ([string]::IsNullOrEmpty($ServiceName)) {
        Write-Header "Viewing All Logs"
        docker-compose logs -f
    }
    else {
        Write-Header "Viewing $ServiceName Logs"
        docker-compose logs -f $ServiceName
    }
}

# Function to check service status
function Check-Status {
    Write-Header "CallDocker Service Status"
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not installed. Please install it and try again."
        exit 1
    }
    
    docker-compose ps
    
    Write-Host ""
    Write-Status "Health Checks:"
    
    # Check backend health
    try {
        docker-compose exec -T backend wget -qO- http://localhost:5001/health | Out-Null
        Write-Host "✓ Backend: Healthy" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Backend: Unhealthy" -ForegroundColor Red
    }
    
    # Check frontend health
    try {
        docker-compose exec -T frontend wget -qO- http://localhost:80/health | Out-Null
        Write-Host "✓ Frontend: Healthy" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Frontend: Unhealthy" -ForegroundColor Red
    }
    
    # Check MongoDB health
    try {
        docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" | Out-Null
        Write-Host "✓ MongoDB: Healthy" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ MongoDB: Unhealthy" -ForegroundColor Red
    }
    
    # Check Redis health
    try {
        docker-compose exec -T redis redis-cli ping | Out-Null
        Write-Host "✓ Redis: Healthy" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Redis: Unhealthy" -ForegroundColor Red
    }
}

# Function to clean up Docker resources
function Cleanup-Docker {
    Write-Header "Cleaning Up Docker Resources"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker and try again."
        exit 1
    }
    
    Write-Warning "This will remove all unused containers, networks, and images."
    $confirmation = Read-Host "Are you sure? (y/N)"
    
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        Write-Status "Removing unused containers..."
        docker container prune -f
        
        Write-Status "Removing unused networks..."
        docker network prune -f
        
        Write-Status "Removing unused images..."
        docker image prune -f
        
        Write-Status "Cleanup completed!"
    }
    else {
        Write-Status "Cleanup cancelled."
    }
}

# Function to backup database
function Backup-Database {
    Write-Header "Backing Up Database"
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not installed. Please install it and try again."
        exit 1
    }
    
    $backupDir = "./backups/$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    Write-Status "Creating MongoDB backup..."
    docker-compose exec -T mongodb mongodump --out /data/backup/$(Get-Date -Format 'yyyyMMdd_HHmmss')
    
    Write-Status "Creating Redis backup..."
    docker-compose exec -T redis redis-cli BGSAVE
    
    Write-Status "Backup completed in $backupDir"
}

# Function to restore database
function Restore-Database {
    param([string]$BackupDir)
    
    Write-Header "Restoring Database"
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not installed. Please install it and try again."
        exit 1
    }
    
    if ([string]::IsNullOrEmpty($BackupDir)) {
        Write-Error "Please provide backup directory path"
        Write-Host "Usage: .\docker-scripts.ps1 restore <backup_directory>"
        exit 1
    }
    
    if (-not (Test-Path $BackupDir)) {
        Write-Error "Backup directory does not exist: $BackupDir"
        exit 1
    }
    
    Write-Warning "This will overwrite existing data. Are you sure? (y/N): "
    $confirmation = Read-Host
    
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        Write-Status "Restoring MongoDB data..."
        docker-compose exec -T mongodb mongorestore --drop $BackupDir
        
        Write-Status "Database restore completed!"
    }
    else {
        Write-Status "Restore cancelled."
    }
}

# Function to show help
function Show-Help {
    Write-Host "CallDocker Docker Management Script (PowerShell)"
    Write-Host ""
    Write-Host "Usage: .\docker-scripts.ps1 [COMMAND] [SERVICE]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  build              Build all Docker images"
    Write-Host "  start              Start all services"
    Write-Host "  stop               Stop all services"
    Write-Host "  restart            Restart all services"
    Write-Host "  logs [service]     View logs (all services or specific service)"
    Write-Host "  status             Check service status and health"
    Write-Host "  cleanup            Clean up unused Docker resources"
    Write-Host "  backup             Create database backup"
    Write-Host "  restore <dir>      Restore database from backup"
    Write-Host "  help               Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\docker-scripts.ps1 build"
    Write-Host "  .\docker-scripts.ps1 start"
    Write-Host "  .\docker-scripts.ps1 logs backend"
    Write-Host "  .\docker-scripts.ps1 restore ./backups/20231201_120000"
}

# Main script logic
switch ($Command.ToLower()) {
    "build" {
        Build-Services
    }
    "start" {
        Start-Services
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        Restart-Services
    }
    "logs" {
        View-Logs $Service
    }
    "status" {
        Check-Status
    }
    "cleanup" {
        Cleanup-Docker
    }
    "backup" {
        Backup-Database
    }
    "restore" {
        Restore-Database $Service
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Write-Host ""
        Show-Help
        exit 1
    }
} 