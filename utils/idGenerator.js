/**
 * Generates a random 4-digit alphanumeric game ID
 * Uses uppercase letters and numbers for better readability
 * Excludes confusing characters like 0, O, 1, I, L
 * @returns {string} 4-character game ID
 */
function generateGameId() {
  // Characters that are easy to distinguish and share
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let result = '';
  
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generates a unique game ID that doesn't exist in the provided sessions map
 * @param {Map} existingSessions - Map of existing game sessions
 * @returns {string} Unique 4-character game ID
 */
function generateUniqueGameId(existingSessions) {
  let gameId;
  let attempts = 0;
  const maxAttempts = 1000; // Prevent infinite loop
  
  do {
    gameId = generateGameId();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique game ID after maximum attempts');
    }
  } while (existingSessions.has(gameId));
  
  return gameId;
}

module.exports = {
  generateGameId,
  generateUniqueGameId
};