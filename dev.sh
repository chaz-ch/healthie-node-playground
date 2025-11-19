#!/bin/bash

# Development helper script for Healthie Node Playground

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found!"
        print_info "Creating .env from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env and add your HEALTHIE_API_KEY"
        exit 1
    fi
    
    if ! grep -q "HEALTHIE_API_KEY=gh_" .env; then
        print_warning "HEALTHIE_API_KEY not set in .env file"
        print_info "Please edit .env and add your Healthie API key"
        exit 1
    fi
    
    print_success ".env file configured"
}

# Install dependencies
install_deps() {
    print_info "Installing backend dependencies..."
    npm install
    
    print_info "Installing frontend dependencies..."
    cd client && npm install && cd ..
    
    print_success "Dependencies installed"
}

# Start development servers
start_dev() {
    check_env
    
    print_info "Starting development servers..."
    print_info "Backend will run on http://localhost:3001"
    print_info "Frontend will run on http://localhost:5173"
    print_info ""
    print_warning "Press Ctrl+C to stop both servers"
    print_info ""
    
    # Start backend in background
    npm run start:dev &
    BACKEND_PID=$!
    
    # Wait a bit for backend to start
    sleep 3
    
    # Start frontend in background
    cd client && npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
}

# Start with Docker
start_docker() {
    check_env
    
    print_info "Starting development environment with Docker..."
    docker-compose -f docker-compose.dev.yml up
}

# Build production Docker image
build_prod() {
    print_info "Building production Docker image..."
    docker build -t healthie-node-playground:latest .
    print_success "Production image built successfully"
}

# Show help
show_help() {
    echo "Healthie Node Playground - Development Helper"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install       Install all dependencies"
    echo "  start         Start development servers (local)"
    echo "  docker        Start development with Docker Compose"
    echo "  build         Build production Docker image"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh install    # Install dependencies"
    echo "  ./dev.sh start      # Start local development"
    echo "  ./dev.sh docker     # Start with Docker"
}

# Main script logic
case "${1}" in
    install)
        install_deps
        ;;
    start)
        start_dev
        ;;
    docker)
        start_docker
        ;;
    build)
        build_prod
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: ${1}"
        echo ""
        show_help
        exit 1
        ;;
esac

