# CallDocker Docker Build Script
# This script helps build and run the CallDocker application with Docker

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Blue = "Blue"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Write-Header {
    param([string]$Message)
    Write-Host "=== $Message ===" -ForegroundColor $Blue
}

function Test-Docker {
    try {
        docker --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Build-Services {
    Write-Header "Building CallDocker Services"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not installed or not running. Please install Docker Desktop and try again."
        Write-Host "Download from: https://www.docker.com/products/docker-desktop/"
        return
    }
    
    Write-Status "Building backend service..."
    docker build -f backend/Dockerfile -t calldocker-backend ./backend
    
    Write-Status "Building frontend service..."
    docker build -f frontend/dashboard/Dockerfile -t calldocker-frontend ./frontend/dashboard
    
    Write-Status "All services built successfully!"
}

function Start-Services {
    Write-Header "Starting CallDocker Services"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not installed or not running. Please install Docker Desktop and try again."
        return
    }
    
    Write-Status "Starting services with Docker Compose..."
    docker-compose -f docker-compose.simple.yml --env-file docker.env up -d
    
    Write-Status "Services started successfully!"
    Write-Status "Frontend: http://localhost:3000"
    Write-Status "Backend API: http://localhost:5001"
    Write-Status "MongoDB: localhost:27017"
    Write-Status "Redis: localhost:6379"
}

function Stop-Services {
    Write-Header "Stopping CallDocker Services"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not installed or not running."
        return
    }
    
    Write-Status "Stopping services..."
    docker-compose -f docker-compose.simple.yml down
    
    Write-Status "Services stopped successfully!"
}

function View-Logs {
    param([string]$Service = "")
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not installed or not running."
        return
    }
    
    if ([string]::IsNullOrEmpty($Service)) {
        Write-Header "Viewing All Logs"
        docker-compose -f docker-compose.simple.yml logs -f
    }
    else {
        Write-Header "Viewing $Service Logs"
        docker-compose -f docker-compose.simple.yml logs -f $Service
    }
}

function Check-Status {
    Write-Header "CallDocker Service Status"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not installed or not running."
        return
    }
    
    docker-compose -f docker-compose.simple.yml ps
}

function Cleanup {
    Write-Header "Cleaning Up Docker Resources"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not installed or not running."
        return
    }
    
    Write-Warning "This will remove all containers, networks, and images."
    $confirmation = Read-Host "Are you sure? (y/N)"
    
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        Write-Status "Removing containers..."
        docker-compose -f docker-compose.simple.yml down -v
        
        Write-Status "Removing images..."
        docker rmi calldocker-backend calldocker-frontend -f
        
        Write-Status "Cleanup completed!"
    }
    else {
        Write-Status "Cleanup cancelled."
    }
}

function Show-Help {
    Write-Host "CallDocker Docker Build Script"
    Write-Host ""
    Write-Host "Usage: .\docker-build.ps1 [COMMAND]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  build              Build Docker images"
    Write-Host "  start              Start all services"
    Write-Host "  stop               Stop all services"
    Write-Host "  logs [service]     View logs (all services or specific service)"
    Write-Host "  status             Check service status"
    Write-Host "  cleanup            Clean up Docker resources"
    Write-Host "  help               Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\docker-build.ps1 build"
    Write-Host "  .\docker-build.ps1 start"
    Write-Host "  .\docker-build.ps1 logs backend"
    Write-Host ""
    Write-Host "Note: Make sure Docker Desktop is installed and running."
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
    "logs" {
        View-Logs $args[1]
    }
    "status" {
        Check-Status
    }
    "cleanup" {
        Cleanup
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Write-Host ""
        Show-Help
    }
} 