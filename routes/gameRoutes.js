const express = require('express');
const GameController = require('../controllers/gameController');

const router = express.Router();

// Create a new game session
router.post('/create', GameController.createSession);

// Join an existing game session
router.post('/join/:sessionId', GameController.joinSession);

// Get game session details
router.get('/session/:sessionId', GameController.getSession);

// Set question and answer (only game master)
router.post('/session/:sessionId/question', GameController.setQuestion);

// Start game (only game master)
router.post('/session/:sessionId/start', GameController.startGame);

// Make a guess
router.post('/session/:sessionId/guess', GameController.makeGuess);

// Get all sessions (for debugging)
router.get('/sessions', GameController.getAllSessions);

module.exports = router;