# Build Stage
FROM node:24.18.0-alpine AS builder

WORKDIR /app

# Copy package descriptors (package-lock.json is optional if not present)
COPY package.json package-lock.json* ./

# Install package dependencies
RUN npm install

# Copy source code and build production assets
COPY . .
RUN npm run build

# Final Stage (Serve with Nginx)
FROM nginx:1.25-alpine

# Copy built static files to Nginx public folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to default server config path
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000 as configured in nginx.conf
EXPOSE 3000

# Start Nginx server in the foreground
CMD ["nginx", "-g", "daemon off;"]

