# Multi-stage build for production deployment

# Stage 1: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy backend source
COPY src ./src

# Build backend
RUN npm run build

# Stage 2: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy frontend source
COPY client ./

# Build frontend
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built backend from builder
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend from builder
COPY --from=frontend-builder /app/client/dist ./client/dist

# Expose ports
EXPOSE 3001

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/main.js"]

