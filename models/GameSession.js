const { v4: uuidv4 } = require('uuid');

class GameSession {
  constructor(sessionId, masterId, masterName) {
    this.id = sessionId || uuidv4();
    this.masterId = masterId;
    this.masterName = masterName;
    this.players = new Map();
    this.status = 'waiting'; // waiting, in-progress, ended
    this.question = '';
    this.answer = '';
    this.startTime = null;
    this.timeLimit = 60000; // 60 seconds
    this.timer = null;
    this.attempts = new Map(); // playerId -> attempt count
    this.winner = null;
    this.scores = new Map(); // playerId -> score
    this.masterQueue = [];
    
    // Add game master as first player
    this.addPlayer(masterId, masterName, true);
  }

  addPlayer(playerId, playerName, isMaster = false) {
    if (this.status === 'in-progress') {
      throw new Error('Cannot join game in progress');
    }

    const player = {
      id: playerId,
      name: playerName,
      isMaster,
      score: this.scores.get(playerId) || 0,
      joinedAt: new Date()
    };

    this.players.set(playerId, player);
    this.attempts.set(playerId, 0);
    
    if (!this.scores.has(playerId)) {
      this.scores.set(playerId, 0);
    }

    // Add to master queue if not already master
    if (!isMaster && !this.masterQueue.includes(playerId)) {
      this.masterQueue.push(playerId);
    }

    return player;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    this.attempts.delete(playerId);
    
    // Remove from master queue
    const index = this.masterQueue.indexOf(playerId);
    if (index > -1) {
      this.masterQueue.splice(index, 1);
    }

    // If current master leaves, assign new master
    if (playerId === this.masterId && this.players.size > 0) {
      this.assignNewMaster();
    }

    return this.players.size === 0;
  }

  assignNewMaster() {
    if (this.masterQueue.length > 0) {
      const newMasterId = this.masterQueue.shift();
      const newMaster = this.players.get(newMasterId);
      
      if (newMaster) {
        // Update old master - add to end of queue
        const oldMaster = this.players.get(this.masterId);
        if (oldMaster) {
          oldMaster.isMaster = false;
          this.masterQueue.push(this.masterId);
        }

        // Set new master
        newMaster.isMaster = true;
        this.masterId = newMasterId;
        this.masterName = newMaster.name;
        this.status = 'waiting';
        this.resetGame();
        return true;
      }
    } else if (this.players.size > 1) {
      // If queue is empty, rebuild it with all non-master players
      this.rebuildMasterQueue();
      return this.assignNewMaster();
    }
    return false;
  }

  rebuildMasterQueue() {
    this.masterQueue = [];
    this.players.forEach((player, playerId) => {
      if (playerId !== this.masterId) {
        this.masterQueue.push(playerId);
      }
    });
    // Shuffle the queue for randomness
    this.shuffleArray(this.masterQueue);
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  canStartGame() {
    return this.players.size >= 3 && this.question && this.answer && this.status === 'waiting';
  }

  setQuestion(question, answer) {
    if (!question || !answer) {
      throw new Error('Question and answer are required');
    }
    
    if (question.trim().length < 3) {
      throw new Error('Question must be at least 3 characters long');
    }
    
    if (answer.trim().length < 1) {
      throw new Error('Answer cannot be empty');
    }

    this.question = question.trim();
    this.answer = answer.trim().toLowerCase();
  }

  startGame() {
    if (!this.canStartGame()) {
      throw new Error('Cannot start game: insufficient players or missing question/answer');
    }

    this.status = 'in-progress';
    this.startTime = new Date();
    this.winner = null;
    
    // Reset attempts for all players
    this.players.forEach((player, playerId) => {
      this.attempts.set(playerId, 0);
    });

    return true;
  }

  makeGuess(playerId, guess) {
    if (this.status !== 'in-progress') {
      throw new Error('Game is not in progress');
    }

    if (playerId === this.masterId) {
      throw new Error('Game master cannot make guesses');
    }

    const attempts = this.attempts.get(playerId) || 0;
    if (attempts >= 3) {
      throw new Error('Maximum attempts reached');
    }

    this.attempts.set(playerId, attempts + 1);

    const isCorrect = guess.trim().toLowerCase() === this.answer;
    
    if (isCorrect) {
      this.winner = this.players.get(playerId);
      this.status = 'ended';
      
      // Award points
      const currentScore = this.scores.get(playerId) || 0;
      this.scores.set(playerId, currentScore + 10);
      this.winner.score = currentScore + 10;
      
      return { isCorrect: true, winner: this.winner };
    }

    return { 
      isCorrect: false, 
      attemptsLeft: 3 - this.attempts.get(playerId),
      totalAttempts: this.attempts.get(playerId)
    };
  }

  endGame(reason = 'timeout') {
    this.status = 'ended';
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const result = {
      reason,
      winner: this.winner,
      answer: this.answer,
      scores: this.getScores()
    };

    // Automatically assign new master after a short delay
    setTimeout(() => {
      this.assignNewMaster();
    }, 100);

    return result;
  }

  resetGame() {
    this.status = 'waiting';
    this.question = '';
    this.answer = '';
    this.startTime = null;
    this.winner = null;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Reset attempts
    this.players.forEach((player, playerId) => {
      this.attempts.set(playerId, 0);
    });
  }

  getPlayersList() {
    return Array.from(this.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      isMaster: player.isMaster,
      score: this.scores.get(player.id) || 0
    }));
  }

  getScores() {
    const scores = [];
    this.players.forEach((player, playerId) => {
      scores.push({
        id: playerId,
        name: player.name,
        score: this.scores.get(playerId) || 0
      });
    });
    return scores.sort((a, b) => b.score - a.score);
  }

  getGameState() {
    return {
      id: this.id,
      status: this.status,
      question: this.status === 'in-progress' ? this.question : '',
      playerCount: this.players.size,
      players: this.getPlayersList(),
      masterId: this.masterId,
      masterName: this.masterName,
      timeLimit: this.timeLimit,
      startTime: this.startTime,
      winner: this.winner,
      scores: this.getScores()
    };
  }
}

module.exports = GameSession;