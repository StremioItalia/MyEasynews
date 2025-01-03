# Use the official Node.js 18 base image
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json if available
COPY package*.json ./

# Install the app dependencies
RUN npm install --production

# Copy the rest of the application code to the container
COPY . .

# Set environment variable to production
ENV NODE_ENV=production

# Expose the port Hugging Face Spaces will bind to
EXPOSE 3000

# Command to start the app
CMD ["npm", "start"]
