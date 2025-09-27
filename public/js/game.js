class GuessingGame {
    constructor() {
        this.socket = null;
        this.currentSession = null;
        this.playerId = null;
        this.playerName = null;
        this.gameTimer = null;
        this.isMaster = false;
        this.attempts = 0;
        this.maxAttempts = 3;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Screen elements
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.gameArea = document.getElementById('gameArea');
        
        // Input elements
        this.playerNameInput = document.getElementById('playerName');
        this.sessionIdInput = document.getElementById('sessionId');
        this.questionInput = document.getElementById('questionInput');
        this.answerInput = document.getElementById('answerInput');
        this.guessInput = document.getElementById('guessInput');
        
        // Button elements
        this.startGameBtn = document.getElementById('startGameBtn');
        this.guessBtn = document.getElementById('guessBtn');
        
        // Display elements
        this.messagesContainer = document.getElementById('messages');
        this.playersListContainer = document.getElementById('playersList');
        this.masterControls = document.getElementById('masterControls');
        this.playerCount = document.getElementById('playerCount');
        this.sessionInfo = document.getElementById('sessionInfo');
        this.timer = document.getElementById('timer');
        this.timeLeft = document.getElementById('timeLeft');
        this.attemptsInfo = document.getElementById('attemptsInfo');
    }

    setupEventListeners() {
        // Enter key listeners
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createOrJoinGame();
        });
        
        this.sessionIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createOrJoinGame();
        });
        
        this.questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setQuestion();
        });
        
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setQuestion();
        });
        
        this.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeGuess();
        });
    }

    async createOrJoinGame() {
        const playerName = this.playerNameInput.value.trim();
        const sessionId = this.sessionIdInput.value.trim();

        if (!playerName || playerName.length < 2) {
            this.showError('Please enter a name with at least 2 characters');
            return;
        }

        this.playerName = playerName;
        this.showLoading('Connecting to game...');

        try {
            let response;
            
            if (sessionId) {
                // Join existing session
                response = await fetch(`/api/game/join/${sessionId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerName })
                });
            } else {
                // Create new session
                response = await fetch('/api/game/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerName })
                });
            }

            const data = await response.json();

            if (data.success) {
                this.currentSession = sessionId || data.data.sessionId;
                this.playerId = data.data.playerId;
                
                this.connectSocket();
                this.switchToGameArea();
                this.updateGameState(data.data.gameState);
                
                if (!sessionId) {
                    this.addMessage(`Game session created! Share this ID with friends: ${this.currentSession}`, 'system');
                }
            } else {
                this.showError(data.message);
            }
        } catch (error) {
            console.error('Error creating/joining game:', error);
            this.showError('Failed to connect to game. Please try again.');
        }
    }

    connectSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.socket.emit('join-session', {
                sessionId: this.currentSession,
                playerId: this.playerId
            });
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.addMessage('Disconnected from server. Trying to reconnect...', 'error');
        });

        this.socket.on('error', (data) => {
            console.error('Socket error:', data);
            this.showError(data.message);
        });

        // MODIFICATION: Using a more targeted function to avoid wiping inputs
        this.socket.on('player-joined', (data) => {
            this.updatePlayerInfo(data.gameState);
            this.addMessage('A player joined the game', 'system');
        });

        // MODIFICATION: Using a more targeted function to avoid wiping inputs
        this.socket.on('player-left', (data) => {
            this.updatePlayerInfo(data.gameState);
            this.addMessage('A player left the game', 'system');
        });

        this.socket.on('new-master-assigned', (data) => {
            console.log('New master assigned:', data);
            this.updateGameState(data.gameState);
            
            if (data.gameState.masterId === this.playerId) {
                this.addMessage(`🎭 You are now the game master! Set a question to start the next round.`, 'master');
                this.questionInput.value = '';
                this.answerInput.value = '';
                this.startGameBtn.disabled = true;
            } else {
                this.addMessage(`🎭 ${data.newMaster} is now the game master`, 'system');
            }
        });

        // MODIFICATION: Added logic to clear inputs only on server confirmation
        this.socket.on('question-set', (data) => {
            this.updateGameState(data.gameState);
            this.startGameBtn.disabled = !data.canStart;
            this.addMessage('Question set! You can now start the game.', 'master');

            // Clear inputs ONLY after server confirms success
            this.questionInput.value = '';
            this.answerInput.value = '';
        });

        this.socket.on('question-prepared', (data) => {
            this.updateGameState(data.gameState);
            this.addMessage('Game master has prepared a question. Waiting to start...', 'system');
        });

        this.socket.on('game-started', (data) => {
            this.updateGameState(data.gameState);
            this.startGameTimer();
            this.addMessage(`🎮 Game started! Question: "${data.gameState.question}"`, 'system');
            this.addMessage('You have 3 attempts to guess the answer!', 'system');
            this.resetAttempts();
        });

        this.socket.on('guess-result', (data) => {
            const result = data.result;
            if (result.isCorrect) {
                this.addMessage('🎉 Correct! You won this round!', 'winner');
                this.disableGuessing();
            } else {
                this.attempts = result.totalAttempts;
                const attemptsLeft = result.attemptsLeft;
                this.addMessage(`❌ Incorrect guess. ${attemptsLeft} attempts left.`, 'player');
                this.updateAttemptsDisplay(attemptsLeft);
                
                if (attemptsLeft === 0) {
                    this.disableGuessing();
                    this.addMessage('No more attempts left. Wait for the round to end.', 'system');
                }
            }
        });

        this.socket.on('player-guessed', (data) => {
            this.addMessage(`💭 ${data.playerName} made a guess`, 'system');
        });

        this.socket.on('game-ended', (data) => {
            this.stopGameTimer();
            this.disableGuessing();
            this.updateGameState(data.gameState);
            
            if (data.reason === 'correct-answer') {
                if (data.winner) {
                    this.addMessage(`🏆 ${data.winner.name} won this round! The answer was: "${data.answer}"`, 'winner');
                }
            } else if (data.reason === 'timeout') {
                this.addMessage(`⏰ Time's up! The answer was: "${data.answer}"`, 'system');
            }
            
            this.addMessage('🔄 Preparing next round... New game master will be assigned shortly.', 'system');
        });

        this.socket.on('game-state', (data) => {
            this.updateGameState(data.gameState);
        });
    }

    switchToGameArea() {
        this.welcomeScreen.style.display = 'none';
        this.gameArea.style.display = 'flex';
        this.sessionInfo.textContent = `Session: ${this.currentSession}`;
    }
    
    // NEW FUNCTION: Only updates player list and count
    updatePlayerInfo(gameState) {
        this.playerCount.textContent = gameState.playerCount;
        this.updatePlayersList(gameState.players);
    }

    updateGameState(gameState) {
        this.isMaster = gameState.masterId === this.playerId;
        
        // Update player count and list
        this.updatePlayerInfo(gameState);
        
        // Show/hide master controls
        this.masterControls.style.display = this.isMaster ? 'block' : 'none';
        
        // Update input states based on game status
        if (gameState.status === 'in-progress') {
            this.guessInput.disabled = this.isMaster;
            this.guessBtn.disabled = this.isMaster;
            
            if (this.isMaster) {
                this.addMessage('🎭 You are the game master. Wait for players to guess!', 'master');
            }
        } else if (gameState.status === 'waiting') {
            this.guessInput.disabled = true;
            this.guessBtn.disabled = true;
            
            if (this.isMaster) {
                this.questionInput.disabled = false;
                this.answerInput.disabled = false;
            }
        } else {
            this.guessInput.disabled = true;
            this.guessBtn.disabled = true;
        }
    }

    updatePlayersList(players) {
        this.playersListContainer.innerHTML = '';
        
        players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = `player-card ${player.isMaster ? 'master' : ''}`;
            playerCard.innerHTML = `
                <i class="fas ${player.isMaster ? 'fa-crown' : 'fa-user'}"></i>
                ${player.name} 
                <span style="font-weight: bold;">(${player.score} pts)</span>
            `;
            this.playersListContainer.appendChild(playerCard);
        });
    }

    setQuestion() {
        const question = this.questionInput.value.trim();
        const answer = this.answerInput.value.trim();

        if (!question || question.length < 3) {
            this.showError('Question must be at least 3 characters long');
            return;
        }

        if (!answer || answer.length < 1) {
            this.showError('Answer cannot be empty');
            return;
        }

        this.socket.emit('set-question', {
            sessionId: this.currentSession,
            playerId: this.playerId,
            question: question,
            answer: answer
        });

        // MODIFICATION: Removed premature input clearing from here
    }

    startGame() {
        this.socket.emit('start-game', {
            sessionId: this.currentSession,
            playerId: this.playerId
        });
    }

    makeGuess() {
        const guess = this.guessInput.value.trim();

        if (!guess) {
            this.showError('Please enter a guess');
            return;
        }

        this.socket.emit('make-guess', {
            sessionId: this.currentSession,
            playerId: this.playerId,
            guess: guess
        });

        this.guessInput.value = '';
    }

    startGameTimer() {
        this.timer.style.display = 'block';
        let timeLeft = 60;
        
        this.gameTimer = setInterval(() => {
            timeLeft--;
            this.timeLeft.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                this.stopGameTimer();
            }
        }, 1000);
    }

    stopGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        this.timer.style.display = 'none';
    }

    disableGuessing() {
        this.guessInput.disabled = true;
        this.guessBtn.disabled = true;
    }

    resetAttempts() {
        this.attempts = 0;
        this.attemptsInfo.style.display = 'none';
        
        if (!this.isMaster) {
            this.guessInput.disabled = false;
            this.guessBtn.disabled = false;
        }
    }

    updateAttemptsDisplay(attemptsLeft) {
        this.attemptsInfo.style.display = 'block';
        this.attemptsInfo.textContent = `Attempts left: ${attemptsLeft}`;
    }

    addMessage(message, type = 'system') {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showError(message) {
        this.addMessage(`❌ ${message}`, 'error');
    }

    showLoading(message) {
        this.addMessage(`⏳ ${message}`, 'system');
    }

    leaveGame() {
        if (confirm('Are you sure you want to leave the game?')) {
            if (this.socket) {
                this.socket.emit('leave-session');
                this.socket.disconnect();
            }
            
            this.gameArea.style.display = 'none';
            this.welcomeScreen.style.display = 'block';
            
            this.currentSession = null;
            this.playerId = null;
            this.playerName = null;
            this.isMaster = false;
            this.attempts = 0;
            
            this.playerNameInput.value = '';
            this.sessionIdInput.value = '';
            this.messagesContainer.innerHTML = '';
            
            this.stopGameTimer();
        }
    }
}

let game;

function createOrJoinGame() {
    if (!game) game = new GuessingGame();
    game.createOrJoinGame();
}

function setQuestion() {
    if (game) game.setQuestion();
}

function startGame() {
    if (game) game.startGame();
}

function makeGuess() {
    if (game) game.makeGuess();
}

function leaveGame() {
    if (game) game.leaveGame();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Guessing Game initialized');
});