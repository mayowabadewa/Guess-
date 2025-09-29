# Guessing Game - Real-time Multiplayer

A professional real-time multiplayer guessing game built with Express.js and Socket.io. Players join game sessions where one player acts as the game master, sets questions, and others compete to guess the correct answer within a time limit.

## 🎮 Game Features

- **Real-time Multiplayer**: Live gameplay with instant updates using Socket.io
- **Game Master System**: Rotating game master role with question-setting privileges
- **Scoring System**: Points awarded for correct answers with persistent scoring
- **Time Limits**: 60-second countdown for each round
- **Attempt Limits**: 3 attempts per player per round
- **Session Management**: Easy-to-share 4-character session IDs
- **Responsive Design**: Works on desktop and mobile devices
- **Auto-cleanup**: Automatic session cleanup when players leave

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project files**
   ```bash
   # If using git
   git clone <repository-url>
   cd guessing-game
   
   # Or extract the project files to a directory
   ```

2. **Run the setup script** (Linux/Mac)
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Manual setup** (Windows or if script fails)
   ```bash
   # Install dependencies
   npm install
   
   # Create necessary directories
   mkdir -p controllers models routes public/js logs
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
guessing-game/
├── server.js                 # Main server file with Express & Socket.io setup
├── package.json             # Project dependencies and scripts
├── .gitignore              # Git ignore patterns
├── setup.sh                # Automated setup script
├── controllers/
│   ├── gameController.js   # HTTP API endpoints for game operations
│   └── socketController.js # Real-time Socket.io event handlers
├── models/
│   └── GameSession.js      # Game session data model and logic
├── routes/
│   └── gameRoutes.js       # Express routes definition
├── utils/
│   └── idGenerator.js      # Unique game ID generation utilities
└── public/
    ├── index.html          # Main game interface
    └── js/
        └── game.js         # Client-side game logic and UI handling
```

## 🎯 How to Play

### For Game Masters

1. **Create a Game**: Enter your name and click "Start Game" to create a new session
2. **Share Session ID**: Give the 4-character session ID to other players
3. **Set Question**: Enter a question and answer when you have enough players
4. **Start Game**: Begin the 60-second countdown once ready
5. **Wait for Guesses**: Watch as players make their attempts
6. **Next Round**: Automatically become a regular player in the next round

### For Players

1. **Join Game**: Enter your name and the session ID, then click "Start Game"
2. **Wait for Question**: Wait for the game master to set up the round
3. **Make Guesses**: Once the game starts, you have 3 attempts to guess correctly
4. **Earn Points**: Get 10 points for each correct answer
5. **Become Master**: You might become the game master in future rounds

### Game Rules

- **Minimum Players**: Need at least 3 total players (1 master + 2 guessers)
- **Time Limit**: 60 seconds per round
- **Attempts**: Maximum 3 guesses per player per round
- **Scoring**: 10 points for correct answers
- **Master Rotation**: Winners and players take turns being the game master

## 🛠 Technical Details

### Backend Architecture

- **Express.js**: RESTful API server with middleware for security and rate limiting
- **Socket.io**: Real-time bidirectional communication for live gameplay
- **In-Memory Storage**: Game sessions stored in memory with automatic cleanup
- **UUID Generation**: Secure player IDs with readable 4-character session codes
- **Error Handling**: Comprehensive error handling and validation

### Frontend Features

- **Vanilla JavaScript**: No external frameworks, pure DOM manipulation
- **Real-time UI**: Instant updates for all game state changes
- **Responsive Design**: CSS Grid and Flexbox for mobile compatibility
- **Modern Styling**: Gradient backgrounds, animations, and smooth transitions
- **Socket Management**: Robust connection handling with reconnection logic

### Security Measures

- **Helmet.js**: Security headers and XSS protection
- **Rate Limiting**: API request throttling to prevent abuse
- **Input Validation**: Server-side validation for all user inputs
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Session Isolation**: Players can only interact with their joined sessions

## 📡 API Endpoints

### Game Management
- `POST /api/game/create` - Create new game session
- `POST /api/game/join/:sessionId` - Join existing game session
- `GET /api/game/session/:sessionId` - Get game session details

### Game Actions
- `POST /api/game/session/:sessionId/question` - Set question (master only)
- `POST /api/game/session/:sessionId/start` - Start game (master only)
- `POST /api/game/session/:sessionId/guess` - Make a guess

### Development
- `GET /api/game/sessions` - List all active sessions (debug endpoint)

## 🔌 Socket.io Events

### Client to Server
- `join-session` - Join a game session room
- `set-question` - Game master sets question and answer
- `start-game` - Game master starts the round
- `make-guess` - Player makes a guess
- `leave-session` - Explicitly leave the game
- `get-game-state` - Request current game state

### Server to Client
- `player-joined` - New player joined the session
- `player-left` / `player-disconnected` - Player left or disconnected
- `new-master-assigned` - New game master assigned
- `question-set` - Question successfully set by master
- `question-prepared` - Master has prepared a question
- `game-started` - Round started with question revealed
- `guess-result` - Result of player's guess attempt
- `player-guessed` - Another player made a guess
- `game-ended` - Round ended (correct answer or timeout)
- `game-state` - Complete game state update
- `error` - Error message from server

## 🎮 Game Flow

1. **Session Creation**: Game master creates session and receives 4-character ID
2. **Player Joining**: Players join using the session ID
3. **Question Setup**: Game master sets question and answer
4. **Game Start**: Master starts 60-second countdown
5. **Guessing Phase**: Players make up to 3 attempts each
6. **Round End**: Game ends on correct answer or timeout
7. **Master Rotation**: New master assigned automatically
8. **Next Round**: Process repeats with new master

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Game Settings (currently hardcoded, for future use)
GAME_TIME_LIMIT=60000
MAX_ATTEMPTS=3
POINTS_PER_WIN=10
```

### Customization Options

**In `models/GameSession.js`:**
- `timeLimit`: Game duration in milliseconds (default: 60000)
- `maxAttempts`: Maximum guesses per player (default: 3)
- `pointsPerWin`: Points awarded for correct answer (default: 10)

**In `utils/idGenerator.js`:**
- Session ID length and character set
- Maximum generation attempts

## 🚀 Deployment

### Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production
```bash
npm start    # Standard Node.js server
```

### Platform Deployment

**Heroku:**
```bash
# Set buildpack and environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=3000
```

**Railway/Vercel:**
- Deploy directly from repository
- Ensure `package.json` includes all dependencies
- Set NODE_ENV=production environment variable

## 🐛 Troubleshooting

### Common Issues

**"Game session not found"**
- Session IDs are case-insensitive but must be exactly 4 characters
- Sessions are cleared when all players leave

**Socket connection issues**
- Check firewall settings for WebSocket connections
- Ensure CORS is properly configured for your domain

**Players can't join game in progress**
- This is by design - players must join before the game starts
- Wait for the current round to end

**Master controls not showing**
- Refresh the page to sync game state
- Only the designated master sees question-setting controls

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=socket.io:* npm run dev
```

### Development Guidelines

- Follow existing code style and structure
- Add error handling for new features
- Test both HTTP endpoints and Socket.io events
- Update this README for significant changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


**Built with ❤️ using Express.js and Socket.io**
