FROM node:18-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the API port
EXPOSE 3000

# The command that triggers the seed and starts the server
CMD ["npm", "start"]