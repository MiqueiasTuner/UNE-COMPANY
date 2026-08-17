# 1. Use Node LTS
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy dependency files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy source code
COPY . .

# 6. Build the app (runs tsc + vite build)
RUN npm run build

# 7. Install a static file server
RUN npm install -g serve

# 8. Expose port
EXPOSE 3000

# 9. Serve the built app
CMD ["serve", "-s", "dist", "-l", "3000"]
