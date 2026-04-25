FROM node:20-slim

# Install python3 and ffmpeg which are required by yt-dlp
RUN apt-get update && apt-get install -y python3 ffmpeg curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose the port the app runs on (Hugging Face routes port 7860 by default)
ENV PORT=7860
EXPOSE 7860

# Start the application
CMD ["npm", "start"]
