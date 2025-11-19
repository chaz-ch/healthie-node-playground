# Development helper script for Healthie Node Playground (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Function to print colored output
function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Check if .env file exists
function Check-Env {
    if (-not (Test-Path .env)) {
        Print-Warning ".env file not found!"
        Print-Info "Creating .env from .env.example..."
        Copy-Item .env.example .env
        Print-Warning "Please edit .env and add your HEALTHIE_API_KEY"
        exit 1
    }
    
    $envContent = Get-Content .env -Raw
    if ($envContent -notmatch "HEALTHIE_API_KEY=gh_") {
        Print-Warning "HEALTHIE_API_KEY not set in .env file"
        Print-Info "Please edit .env and add your Healthie API key"
        exit 1
    }
    
    Print-Success ".env file configured"
}

# Install dependencies
function Install-Deps {
    Print-Info "Installing backend dependencies..."
    npm install
    
    Print-Info "Installing frontend dependencies..."
    Push-Location client
    npm install
    Pop-Location
    
    Print-Success "Dependencies installed"
}

# Start development servers
function Start-Dev {
    Check-Env
    
    Print-Info "Starting development servers..."
    Print-Info "Backend will run on http://localhost:3001"
    Print-Info "Frontend will run on http://localhost:5173"
    Print-Info ""
    Print-Warning "Press Ctrl+C to stop both servers"
    Print-Info ""
    
    # Start backend in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:dev"
    
    # Wait a bit for backend to start
    Start-Sleep -Seconds 3
    
    # Start frontend in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"
    
    Print-Success "Development servers started in separate windows"
}

# Start with Docker
function Start-Docker {
    Check-Env
    
    Print-Info "Starting development environment with Docker..."
    docker-compose -f docker-compose.dev.yml up
}

# Build production Docker image
function Build-Prod {
    Print-Info "Building production Docker image..."
    docker build -t healthie-node-playground:latest .
    Print-Success "Production image built successfully"
}

# Show help
function Show-Help {
    Write-Host "Healthie Node Playground - Development Helper"
    Write-Host ""
    Write-Host "Usage: .\dev.ps1 [command]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  install       Install all dependencies"
    Write-Host "  start         Start development servers (local)"
    Write-Host "  docker        Start development with Docker Compose"
    Write-Host "  build         Build production Docker image"
    Write-Host "  help          Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\dev.ps1 install    # Install dependencies"
    Write-Host "  .\dev.ps1 start      # Start local development"
    Write-Host "  .\dev.ps1 docker     # Start with Docker"
}

# Main script logic
switch ($Command.ToLower()) {
    "install" {
        Install-Deps
    }
    "start" {
        Start-Dev
    }
    "docker" {
        Start-Docker
    }
    "build" {
        Build-Prod
    }
    "help" {
        Show-Help
    }
    default {
        Print-Error "Unknown command: $Command"
        Write-Host ""
        Show-Help
        exit 1
    }
}

