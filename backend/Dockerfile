# Multi-stage Dockerfile for NestJS Backend

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema for runtime
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Switch to non-root user
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]
