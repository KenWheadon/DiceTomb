// Game State Management
let gameState = {
  currentPlayer: 0,
  players: [],
  gameOver: false,
  turnActionTaken: false,
  shopOpen: false,
  turnCount: 0,
};

function initGame() {
  gameState = {
    currentPlayer: 0,
    players: [
      new Player("You", 0, false),
      new Player("AI Bot 1", 1, true),
      new Player("AI Bot 2", 2, true),
      new Player("AI Bot 3", 3, true),
    ],
    gameOver: false,
    turnActionTaken: false,
    shopOpen: false,
    turnCount: 0,
  };

  // Give AI players unique personalities
  gameState.players[1].aggressionLevel = 0.8; // Conservative
  gameState.players[2].aggressionLevel = 1.3; // Aggressive
  gameState.players[3].aggressionLevel = 1.0; // Balanced

  document.getElementById("gameOver").style.display = "none";
  toastManager.clear();
  toastManager.show(
    "Game started! You vs 3 AI opponents. Each player begins with 1 standard die, 3 lives, and 8 actions!",
    "success",
    5000
  );

  renderGame();
}

function checkGameEnd() {
  const alivePlayers = gameState.players.filter((p) => !p.eliminated);

  if (alivePlayers.length <= 1) {
    gameState.gameOver = true;

    const winner = alivePlayers[0];
    if (winner) {
      document.getElementById(
        "winnerText"
      ).textContent = `${winner.name} Wins!`;
      toastManager.show(
        `🏆 ${winner.name} is the last survivor!`,
        "success",
        10000
      );
    } else {
      document.getElementById("winnerText").textContent = "Everyone Died!";
      toastManager.show(
        `💀 All players have been eliminated!`,
        "explosion",
        10000
      );
    }

    document.getElementById("gameOver").style.display = "flex";
  }
}

// Initialize game on load
document.addEventListener("DOMContentLoaded", initGame);