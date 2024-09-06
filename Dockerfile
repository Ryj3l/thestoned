# Stage 1: Build the application
FROM node:18 AS build
WORKDIR /usr/src/app

# Copy package files to install dependencies
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

# (Optional) Build the application (if there is a build step)
RUN npm run build || echo "No build script available"

# Stage 2: Production environment
FROM node:18-slim

# Set environment variables for production
ENV NODE_ENV=production

# Set the working directory
WORKDIR /usr/src/app

# Copy the package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the application code from the build stage
COPY --from=build /usr/src/app .

# Expose the port that the app will run on
EXPOSE 8080

# Start the application
CMD ["node", "app.js"]
