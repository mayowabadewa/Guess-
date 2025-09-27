const express = require('express');
const GameController = require('../controllers/gameController');

const router = express.Router();

// Middleware to validate session ID format (4 alphanumeric characters)
const validateSessionId = (req, res, next) => {
  const { sessionId } = req.params;
  
  if (sessionId && !/^[A-Z0-9]{4}$/i.test(sessionId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session ID format. Session ID must be 4 alphanumeric characters.'
    });
  }
  
  next();
};

// Create new game session
router.post('/create', GameController.createSession);

// Join existing game session  
router.post('/join/:sessionId', validateSessionId, GameController.joinSession);

// Get game session details
router.get('/session/:sessionId', validateSessionId, GameController.getSession);

// Set question and answer (only game master)
router.post('/session/:sessionId/question', validateSessionId, GameController.setQuestion);

// Start game (only game master)
router.post('/session/:sessionId/start', validateSessionId, GameController.startGame);

// Make a guess
router.post('/session/:sessionId/guess', validateSessionId, GameController.makeGuess);

// Get all active sessions (for debugging - remove in production)
router.get('/sessions', GameController.getAllSessions);

module.exports = router;