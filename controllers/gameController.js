const GameSession = require('../models/GameSession');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for game sessions
const gameSessions = new Map();

class GameController {
  // Create a new game session
  static createSession(req, res) {
    try {
      const { playerName } = req.body;
      
      if (!playerName || playerName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Player name must be at least 2 characters long'
        });
      }

      const sessionId = uuidv4();
      const masterId = uuidv4();
      const gameSession = new GameSession(sessionId, masterId, playerName.trim());
      
      gameSessions.set(sessionId, gameSession);

      res.status(201).json({
        success: true,
        message: 'Game session created successfully',
        data: {
          sessionId: sessionId,
          playerId: masterId,
          gameState: gameSession.getGameState()
        }
      });

    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create game session'
      });
    }
  }

  // Join an existing game session
  static joinSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { playerName } = req.body;

      if (!playerName || playerName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Player name must be at least 2 characters long'
        });
      }

      const gameSession = gameSessions.get(sessionId);
      if (!gameSession) {
        return res.status(404).json({
          success: false,
          message: 'Game session not found'
        });
      }

      if (gameSession.status === 'in-progress') {
        return res.status(400).json({
          success: false,
          message: 'Cannot join game in progress'
        });
      }

      const playerId = uuidv4();
      gameSession.addPlayer(playerId, playerName.trim());

      res.status(200).json({
        success: true,
        message: 'Joined game session successfully',
        data: {
          playerId: playerId,
          gameState: gameSession.getGameState()
        }
      });

    } catch (error) {
      console.error('Error joining session:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to join game session'
      });
    }
  }

  // Get game session details
  static getSession(req, res) {
    try {
      const { sessionId } = req.params;
      
      const gameSession = gameSessions.get(sessionId);
      if (!gameSession) {
        return res.status(404).json({
          success: false,
          message: 'Game session not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          gameState: gameSession.getGameState()
        }
      });

    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get game session'
      });
    }
  }

  // Set question and answer (only game master)
  static setQuestion(req, res) {
    try {
      const { sessionId } = req.params;
      const { playerId, question, answer } = req.body;

      if (!question || !answer) {
        return res.status(400).json({
          success: false,
          message: 'Question and answer are required'
        });
      }

      const gameSession = gameSessions.get(sessionId);
      if (!gameSession) {
        return res.status(404).json({
          success: false,
          message: 'Game session not found'
        });
      }

      if (gameSession.masterId !== playerId) {
        return res.status(403).json({
          success: false,
          message: 'Only game master can set questions'
        });
      }

      if (gameSession.status === 'in-progress') {
        return res.status(400).json({
          success: false,
          message: 'Cannot change question while game is in progress'
        });
      }

      gameSession.setQuestion(question, answer);

      res.status(200).json({
        success: true,
        message: 'Question set successfully',
        data: {
          canStart: gameSession.canStartGame()
        }
      });

    } catch (error) {
      console.error('Error setting question:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to set question'
      });
    }
  }

  // Start game (only game master)
  static startGame(req, res) {
    try {
      const { sessionId } = req.params;
      const { playerId } = req.body;

      const gameSession = gameSessions.get(sessionId);
      if (!gameSession) {
        return res.status(404).json({
          success: false,
          message: 'Game session not found'
        });
      }

      if (gameSession.masterId !== playerId) {
        return res.status(403).json({
          success: false,
          message: 'Only game master can start the game'
        });
      }

      if (!gameSession.canStartGame()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot start game: need at least 3 players total (1 master + 2 players) and a question with answer'
        });
      }

      gameSession.startGame();

      res.status(200).json({
        success: true,
        message: 'Game started successfully',
        data: {
          gameState: gameSession.getGameState()
        }
      });

    } catch (error) {
      console.error('Error starting game:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to start game'
      });
    }
  }

  // Make a guess
  static makeGuess(req, res) {
    try {
      const { sessionId } = req.params;
      const { playerId, guess } = req.body;

      if (!guess || guess.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Guess cannot be empty'
        });
      }

      const gameSession = gameSessions.get(sessionId);
      if (!gameSession) {
        return res.status(404).json({
          success: false,
          message: 'Game session not found'
        });
      }

      const result = gameSession.makeGuess(playerId, guess);

      res.status(200).json({
        success: true,
        message: result.isCorrect ? 'Correct answer!' : 'Incorrect guess',
        data: {
          result: result,
          gameState: gameSession.getGameState()
        }
      });

    } catch (error) {
      console.error('Error making guess:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to make guess'
      });
    }
  }

  // Get game session by ID (for internal use)
  static getGameSession(sessionId) {
    return gameSessions.get(sessionId);
  }

  // Remove game session
  static removeGameSession(sessionId) {
    return gameSessions.delete(sessionId);
  }

  // Get all active sessions (for debugging)
  static getAllSessions(req, res) {
    try {
      const sessions = Array.from(gameSessions.keys());
      res.status(200).json({
        success: true,
        data: {
          sessionCount: sessions.length,
          sessions: sessions
        }
      });
    } catch (error) {
      console.error('Error getting all sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sessions'
      });
    }
  }
}

module.exports = GameController;