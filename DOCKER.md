# Docker Setup Guide

This project includes comprehensive Docker support for both development and production environments.

## Quick Start

### Development with VS Code Dev Container (Recommended)

The easiest way to get started is using VS Code Dev Containers:

1. **Prerequisites**:
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Install [VS Code](https://code.visualstudio.com/)
   - Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Open in Dev Container**:
   - Open this project in VS Code
   - Press `F1` and select "Dev Containers: Reopen in Container"
   - Wait for the container to build and dependencies to install
   - The container will automatically forward ports 3001 (backend) and 5173 (frontend)

3. **Run the application**:
   ```bash
   # Terminal 1 - Backend
   npm run start:dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

### Development with Docker Compose

If you prefer not to use VS Code Dev Containers:

```bash
# Copy environment file
cp .env.example .env

# Edit .env and add your HEALTHIE_API_KEY

# Start development services with hot reload
docker-compose -f docker-compose.dev.yml up

# The backend will be available at http://localhost:3001
# The frontend will be available at http://localhost:5173
```

### Production Deployment

```bash
# Build and run production containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## Container Architecture

### Dev Container (.devcontainer/)

The dev container provides a complete development environment with:
- Node.js 20 LTS
- TypeScript, ts-node, NestJS CLI pre-installed
- VS Code extensions for TypeScript, ESLint, GraphQL, etc.
- Automatic port forwarding (3001, 5173)
- Persistent node_modules volumes for better performance

### Development Compose (docker-compose.dev.yml)

Runs both backend and frontend with:
- Hot reload enabled for both services
- Volume mounts for live code changes
- Separate containers for backend and frontend
- Health checks for backend service

### Production Dockerfile

Multi-stage build that:
1. Builds the NestJS backend (TypeScript → JavaScript)
2. Builds the React frontend (Vite production build)
3. Creates a minimal production image with only compiled code
4. Runs as non-root user for security

### Production Compose (docker-compose.yml)

Production-ready setup with:
- Optimized production builds
- Health checks
- Automatic restart policies
- Environment variable configuration

## Environment Variables

Create a `.env` file in the project root:

```bash
HEALTHIE_API_KEY=your_api_key_here
HEALTHIE_ENV=staging  # or 'production'
PORT=3001
```

## Docker Commands Reference

### Dev Container

```bash
# Rebuild dev container
# In VS Code: F1 → "Dev Containers: Rebuild Container"

# Or manually:
docker-compose -f .devcontainer/docker-compose.yml build
```

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml up --build
```

### Production

```bash
# Build production image
docker build -t healthie-node-playground .

# Run production container
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop and remove containers
docker-compose down

# Remove volumes as well
docker-compose down -v
```

## Troubleshooting

### Port Already in Use

If ports 3001 or 5173 are already in use:

```bash
# Find process using the port
lsof -i :3001
lsof -i :5173

# Kill the process or change ports in docker-compose files
```

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Dependencies Not Installing

```bash
# Clear volumes and rebuild
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

## Performance Tips

1. **Use Dev Containers** for the best development experience
2. **Named volumes** are used for node_modules to improve performance
3. **Cached mounts** are used for source code volumes
4. **Multi-stage builds** keep production images small

## Security Notes

- Never commit `.env` files with real API keys
- Production containers run as non-root user
- Use secrets management for production deployments
- Keep base images updated regularly

