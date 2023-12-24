FROM node:14-alpine3.12

# Set working directory to backend
WORKDIR /backend

# Copy only backend files and dependencies
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./

# Expose port
EXPOSE 4000

# Start the backend application
CMD ["node", "index.js"]