FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start the application
CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/main.ts"] 