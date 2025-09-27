const GameController = require('./gameController');

function handleSocketConnections(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join game session
    socket.on('join-session', (data) => {
      try {
        const { sessionId, playerId } = data;
        
        const gameSession = GameController.getGameSession(sessionId);
        if (!gameSession) {
          socket.emit('error', { message: 'Game session not found' });
          return;
        }

        // Join socket room
        socket.join(sessionId);
        socket.sessionId = sessionId;
        socket.playerId = playerId;

        // Notify all players in the session
        io.to(sessionId).emit('player-joined', {
          gameState: gameSession.getGameState()
        });

        console.log(`Player ${playerId} joined session ${sessionId}`);

      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Start game
    socket.on('start-game', (data) => {
      try {
        const { sessionId, playerId } = data;
        
        const gameSession = GameController.getGameSession(sessionId);
        if (!gameSession) {
          socket.emit('error', { message: 'Game session not found' });
          return;
        }

        if (gameSession.masterId !== playerId) {
          socket.emit('error', { message: 'Only game master can start the game' });
          return;
        }

        if (gameSession.players.size < 3) {
          socket.emit('error', { message: 'Need at least 3 players to start the game (1 master + 2 players)' });
          return;
        }

        if (!gameSession.canStartGame()) {
          socket.emit('error', { message: 'Cannot start game: need question with answer and at least 3 players total' });
          return;
        }

        gameSession.startGame();

        // Set up game timer
        gameSession.timer = setTimeout(() => {
          const result = gameSession.endGame('timeout');
          io.to(sessionId).emit('game-ended', {
            reason: 'timeout',
            winner: null,
            answer: result.answer,
            gameState: gameSession.getGameState()
          });

          // Handle master assignment after a delay
          setTimeout(() => {
            const masterAssignment = gameSession.prepareNextRound();
            if (masterAssignment.success) {
              io.to(sessionId).emit('new-master-assigned', {
                newMaster: masterAssignment.newMaster,
                gameState: gameSession.getGameState()
              });
            }
          }, 3000);
        }, gameSession.timeLimit);

        // Notify all players
        io.to(sessionId).emit('game-started', {
          gameState: gameSession.getGameState()
        });

        console.log(`Game started in session ${sessionId}`);

      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: error.message || 'Failed to start game' });
      }
    });

    // Set question
    socket.on('set-question', (data) => {
      try {
        const { sessionId, playerId, question, answer } = data;
        
        const gameSession = GameController.getGameSession(sessionId);
        if (!gameSession) {
          socket.emit('error', { message: 'Game session not found' });
          return;
        }

        if (gameSession.masterId !== playerId) {
          socket.emit('error', { message: 'Only game master can set questions' });
          return;
        }

        gameSession.setQuestion(question, answer);

        // Notify game master that question is set
        socket.emit('question-set', {
          canStart: gameSession.canStartGame(),
          gameState: gameSession.getGameState()
        });

        // Notify other players that master has prepared a question
        socket.to(sessionId).emit('question-prepared', {
          gameState: gameSession.getGameState()
        });

        console.log(`Question set in session ${sessionId} by master ${gameSession.masterName}`);

      } catch (error) {
        console.error('Error setting question:', error);
        socket.emit('error', { message: error.message || 'Failed to set question' });
      }
    });

    // Make guess
    socket.on('make-guess', (data) => {
      try {
        const { sessionId, playerId, guess } = data;
        
        const gameSession = GameController.getGameSession(sessionId);
        if (!gameSession) {
          socket.emit('error', { message: 'Game session not found' });
          return;
        }

        if (gameSession.status !== 'in-progress') {
          socket.emit('error', { message: 'Game is not in progress' });
          return;
        }

        const result = gameSession.makeGuess(playerId, guess);
        const player = gameSession.players.get(playerId);

        // Notify the player who made the guess
        socket.emit('guess-result', {
          result: result,
          gameState: gameSession.getGameState()
        });

        // Notify other players about the guess (without revealing if it's correct)
        socket.to(sessionId).emit('player-guessed', {
          playerName: player.name,
          gameState: gameSession.getGameState()
        });

        // If correct answer, end game and notify everyone
        if (result.isCorrect) {
          // Clear timer
          if (gameSession.timer) {
            clearTimeout(gameSession.timer);
            gameSession.timer = null;
          }

          const endResult = gameSession.endGame('correct-answer');

          io.to(sessionId).emit('game-ended', {
            reason: 'correct-answer',
            winner: result.winner,
            answer: gameSession.answer,
            gameState: gameSession.getGameState()
          });

          // Handle master assignment after a delay
          setTimeout(() => {
            const masterAssignment = gameSession.prepareNextRound();
            if (masterAssignment.success) {
              io.to(sessionId).emit('new-master-assigned', {
                newMaster: masterAssignment.newMaster,
                gameState: gameSession.getGameState()
              });
              
              console.log(`New master assigned in session ${sessionId}: ${masterAssignment.newMaster}`);
            } else {
              console.log(`Failed to assign new master in session ${sessionId}`);
            }
          }, 3000);

          console.log(`Player ${playerId} won in session ${sessionId}`);
        }

      } catch (error) {
        console.error('Error making guess:', error);
        socket.emit('error', { message: error.message || 'Failed to make guess' });
      }
    });

    // Leave session - explicit leave
    socket.on('leave-session', () => {
      handlePlayerLeaving(socket, io, false); // false = explicit leave
    });

    // Handle disconnect - automatic disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      handlePlayerLeaving(socket, io, true); // true = disconnect
    });

    // Get current game state
    socket.on('get-game-state', (data) => {
      try {
        const { sessionId } = data;
        const gameSession = GameController.getGameSession(sessionId);
        
        if (gameSession) {
          socket.emit('game-state', {
            gameState: gameSession.getGameState()
          });
        } else {
          socket.emit('error', { message: 'Game session not found' });
        }
      } catch (error) {
        console.error('Error getting game state:', error);
        socket.emit('error', { message: 'Failed to get game state' });
      }
    });
  });
}

// Centralized function to handle player leaving - prevents double notifications
function handlePlayerLeaving(socket, io, isDisconnect = false) {
  try {
    // Prevent double processing if already handled
    if (socket.isLeaving) {
      return;
    }
    socket.isLeaving = true;

    if (socket.sessionId && socket.playerId) {
      const gameSession = GameController.getGameSession(socket.sessionId);
      if (gameSession) {
        const wasCurrentMaster = gameSession.masterId === socket.playerId;
        const playerName = gameSession.players.get(socket.playerId)?.name || 'Unknown Player';
        const isEmpty = gameSession.removePlayer(socket.playerId);
        
        if (isEmpty) {
          // Delete session if no players left
          GameController.removeGameSession(socket.sessionId);
          console.log(`Session ${socket.sessionId} deleted - no players left`);
        } else {
          // Notify remaining players
          const eventType = isDisconnect ? 'player-disconnected' : 'player-left';
          io.to(socket.sessionId).emit(eventType, {
            playerName: playerName,
            gameState: gameSession.getGameState()
          });

          // If the master left and a new one was assigned, notify players
          if (wasCurrentMaster && gameSession.masterId !== socket.playerId) {
            io.to(socket.sessionId).emit('new-master-assigned', {
              newMaster: gameSession.masterName,
              gameState: gameSession.getGameState()
            });
          }
        }
      }
      
      socket.leave(socket.sessionId);
      const actionType = isDisconnect ? 'disconnected from' : 'left';
      console.log(`Player ${socket.playerId} ${actionType} session ${socket.sessionId}`);
    }
  } catch (error) {
    console.error('Error handling player leaving:', error);
  }
}

module.exports = { handleSocketConnections };