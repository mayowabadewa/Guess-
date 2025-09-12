#!/bin/bash

# Guessing Game Setup Script
# This script sets up the complete project structure and installs dependencies

echo "🎮 Setting up Guessing Game Project..."

# Create project directory structure
echo "📁 Creating project structure..."

mkdir -p controllers
mkdir -p models  
mkdir -p routes
mkdir -p public/js
mkdir -p logs

# Create package.json file
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "guessing-game",
  "version": "1.0.0",
  "description": "A real-time multiplayer guessing game",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.4",
    "uuid": "^9.0.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "keywords": [
    "game",
    "real-time",
    "multiplayer",
    "guessing",
    "socket.io"
  ],
  "author": "Your Name",
  "license": "MIT"
}
EOF

# Install dependencies
echo "⬇️  Installing dependencies..."
npm install

# Create .gitignore
echo "🚫 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Logs
logs
*.log

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDEs and editors
/.idea
.vscode/*
*.sublime-workspace

# OS
.DS_Store
.DS_Store?
._*
Thumbs.db

# Temporary files
*.tmp
*.temp
EOF

# Create basic README if it doesn't exist
if [ ! -f README.md ]; then
    echo "📝 Creating README.md..."
    cat > README.md << 'EOF'
# Guessing Game - Real-time Multiplayer

A professional real-time multiplayer guessing game built with Express.js and Socket.io.

## Quick Start

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open browser: `http://localhost:3000`

## Features

- Real-time multiplayer gameplay
- Game master system
- Scoring and leaderboards
- 60-second time limits
- 3 attempts per player
- Automatic session cleanup

For detailed documentation, see the complete README file.
EOF
fi

# Create a simple environment configuration
echo "⚙️  Creating environment configuration..."
cat > .env.example << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=development

# Game Settings
GAME_TIME_LIMIT=60000
MAX_ATTEMPTS=3
POINTS_PER_WIN=10
EOF

echo "✅ Project setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the provided code files to their respective locations:"
echo "   - server.js (root directory)"
echo "   - controllers/gameController.js"
echo "   - controllers/socketController.js"
echo "   - models/GameSession.js"
echo "   - routes/gameRoutes.js"
echo "   - public/index.html"
echo "   - public/js/game.js"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open your browser and go to:"
echo "   http://localhost:3000"
echo ""
echo "🎉 Happy gaming!"