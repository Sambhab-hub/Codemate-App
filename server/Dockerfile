# Production Dockerfile for CodeMate Server
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start"]
