FROM node:18.16.1-buster

# Copy your application code
COPY . ./

# Install dependencies
RUN npm install

# Start your Node.js application
CMD ["sudo", "npm", "start"]