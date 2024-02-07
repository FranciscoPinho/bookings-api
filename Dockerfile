FROM node:current-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY tsconfig.json ./

# Install app dependencies
RUN npm ci

# Bundle app source
COPY src ./src

# Expose port 3000
EXPOSE 3000

# Start the app
CMD npm run migrate && npm run start
