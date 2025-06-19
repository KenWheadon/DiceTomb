// Game State
let gameState = {
  currentPlayer: 0,
  players: [],
  gameOver: false,
  turnActionTaken: false,
  shopOpen: false,
  turnCount: 0,
};

// Toast notification system
class ToastManager {
  constructor() {
    this.toastContainer = null;
    this.createContainer();
  }

  createContainer() {
    this.toastContainer = document.createElement("div");
    this.toastContainer.className = "toast-container";
    document.body.appendChild(this.toastContainer);
  }

  show(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    // Add icon based on type
    const icons = {
      info: "💬",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      explosion: "💥",
      curse: "💀",
      purchase: "🛒",
      action: "⚡",
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-message">${message}</div>
      <div class="toast-close" onclick="this.parentElement.remove()">×</div>
    `;

    this.toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("toast-show"), 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.add("toast-hide");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, duration);

    return toast;
  }

  clear() {
    if (this.toastContainer) {
      this.toastContainer.innerHTML = "";
    }
  }
}

const toastManager = new ToastManager();

class Die {
  constructor(template, id) {
    this.id = id;
    this.template = template;
    this.faces = [...template.faces];
    this.explosionChance = template.baseExplosion;
    this.rollCount = 0;
    this.lastRoll = null;
  }

  roll() {
    this.rollCount++;
    this.explosionChance += GAME_CONFIG.DICE_MECHANICS.explosionIncreasePerRoll;

    // Check for explosion
    if (Math.random() * 100 < this.explosionChance) {
      this.lastRoll = "💥";
      return { exploded: true, result: null };
    }

    const faceIndex = Math.floor(Math.random() * this.faces.length);
    const result = this.faces[faceIndex];
    this.lastRoll = result;

    return { exploded: false, result: result };
  }

  upgradeFace(oldFace, newFace) {
    const index = this.faces.indexOf(oldFace);
    if (index !== -1) {
      this.faces[index] = newFace;
      this.explosionChance += 5;
      return true;
    }
    return false;
  }

  addWildFace() {
    if (this.faces.length < GAME_CONFIG.DICE_MECHANICS.maxDiceFaces) {
      this.faces.push(SYMBOLS.WILD);
      this.explosionChance += 10;
      return true;
    }
    return false;
  }
}

class Player {
  constructor(name, id, isAI = false) {
    this.name = name;
    this.id = id;
    this.isAI = isAI;
    this.lives = GAME_CONFIG.PLAYER_DEFAULTS.startingLives;
    this.actions = GAME_CONFIG.PLAYER_DEFAULTS.startingActions;
    this.dice = [
      new Die(
        DIE_TEMPLATES[GAME_CONFIG.PLAYER_DEFAULTS.startingDiceTemplate],
        0
      ),
    ];
    this.paytables = this.initPaytables();
    this.eliminated = false;
    this.aggressionLevel = 1.0;
  }

  initPaytables() {
    const paytables = {};
    Object.keys(CURSE_EFFECTS).forEach((curse) => {
      paytables[curse] = [];
    });
    return paytables;
  }

  addCurseSymbol(symbol) {
    if (this.paytables[symbol]) {
      this.paytables[symbol].push(symbol);
      return this.paytables[symbol].length >= CURSE_EFFECTS[symbol].slotsNeeded;
    }
    return false;
  }

  triggerCursePaytable(symbol) {
    this.triggerCurseEffect(symbol);
    this.paytables[symbol] = [];
  }

  triggerCurseEffect(symbol) {
    const effect = CURSE_EFFECTS[symbol];

    switch (symbol) {
      case SYMBOLS.BONE:
        this.actions = Math.max(0, this.actions - effect.actionLoss);
        toastManager.show(
          `${this.name} triggered ${effect.name}: Lost ${effect.actionLoss} actions!`,
          "curse",
          4000
        );
        break;

      case SYMBOLS.SKULL:
        if (this.dice.length > 0) {
          const randomDie =
            this.dice[Math.floor(Math.random() * this.dice.length)];
          const randomFaceIndex = Math.floor(
            Math.random() * randomDie.faces.length
          );
          randomDie.faces[randomFaceIndex] = effect.replacementSymbol;
          toastManager.show(
            `${this.name} triggered ${effect.name}: Random die face turned to skull!`,
            "curse",
            4000
          );
        }
        break;

      case SYMBOLS.COFFIN:
        gameState.players.forEach((player) => {
          if (player.id !== this.id && !player.eliminated) {
            player.actions += effect.opponentActionGain;
          }
        });
        toastManager.show(
          `${this.name} triggered ${effect.name}: All opponents gained ${effect.opponentActionGain} actions!`,
          "curse",
          4000
        );
        break;

      case SYMBOLS.TOMB:
        this.dice.forEach((die) => {
          die.explosionChance += effect.explosionIncrease;
        });
        toastManager.show(
          `${this.name} triggered ${effect.name}: All dice explosion chance increased by ${effect.explosionIncrease}%!`,
          "curse",
          4000
        );
        break;
    }
  }

  rollSelectedDie(dieIndex) {
    if (dieIndex < 0 || dieIndex >= this.dice.length) return null;

    const die = this.dice[dieIndex];
    const rollResult = die.roll();

    if (rollResult.exploded) {
      this.lives--;

      this.dice.forEach((remainingDie) => {
        remainingDie.explosionChance +=
          GAME_CONFIG.DICE_MECHANICS.corruptionSpreadAmount;
      });

      toastManager.show(
        `💥 ${this.name}'s ${die.template.name} exploded! Lost 1 life. Remaining dice corrupted.`,
        "explosion",
        5000
      );

      if (this.lives <= 0) {
        this.eliminated = true;
        toastManager.show(
          `☠️ ${this.name} has been eliminated!`,
          "explosion",
          6000
        );
      }

      return { exploded: true, result: null };
    }

    const result = rollResult.result;
    const completedPaytables = [];

    if (result === SYMBOLS.WILD) {
      let totalActions = 0;

      die.faces.forEach((face) => {
        if (face.match(/[①②③④⑤⑥⑦⑧⑩⑮]/)) {
          const actionValue = this.getActionValue(face);
          totalActions += actionValue;
        } else if (CURSE_EFFECTS[face]) {
          const isComplete = this.addCurseSymbol(face);
          if (isComplete) {
            completedPaytables.push(face);
          }
        }
      });

      this.actions += totalActions;
      toastManager.show(
        `🌟 ${this.name} rolled WILD! Gained ${totalActions} actions and added curse symbols.`,
        "success",
        4000
      );
    } else if (result.match(/[①②③④⑤⑥⑦⑧⑩⑮]/)) {
      const actionValue = this.getActionValue(result);
      this.actions += actionValue;
      toastManager.show(
        `${this.name} gained ${actionValue} actions from rolling ${result}`,
        "action",
        2500
      );
    } else if (CURSE_EFFECTS[result]) {
      const isComplete = this.addCurseSymbol(result);

      if (isComplete) {
        completedPaytables.push(result);
        toastManager.show(
          `${this.name} filled ${CURSE_EFFECTS[result].name} paytable with ${result}!`,
          "warning",
          4000
        );
      } else {
        toastManager.show(
          `${this.name} added ${result} to ${CURSE_EFFECTS[result].name} paytable`,
          "info",
          2000
        );
      }
    }

    return {
      exploded: false,
      result: result,
      completedPaytables: completedPaytables,
    };
  }

  getActionValue(symbol) {
    return GAME_CONFIG.ACTION_VALUES[symbol] || 0;
  }

  canAfford(cost) {
    return this.actions >= cost;
  }

  spendActions(amount) {
    if (this.canAfford(amount)) {
      this.actions -= amount;
      return true;
    }
    return false;
  }

  buyDie(template) {
    if (this.spendActions(template.cost)) {
      const newDie = new Die(template, this.dice.length);
      this.dice.push(newDie);
      toastManager.show(
        `${this.name} bought ${template.name} for ${template.cost} actions`,
        "purchase",
        3000
      );
      return true;
    }
    return false;
  }

  canAffordAnyDie() {
    const purchasableDice = Object.values(DIE_TEMPLATES).filter(
      (template) => template.cost > 0
    );
    const cheapestCost = Math.min(
      ...purchasableDice.map((template) => template.cost)
    );
    return this.canAfford(cheapestCost);
  }
}

// Enhanced dice animation function with better AI support
function animateDieRoll(playerId, dieIndex, callback) {
  // Force a render update first to ensure DOM is current
  renderGame();

  // Small delay to ensure DOM is updated
  setTimeout(() => {
    const playerAreas = document.querySelectorAll(".player-area");
    if (playerId >= playerAreas.length) {
      console.warn(`Player area ${playerId} not found`);
      if (callback) callback();
      return;
    }

    const currentPlayerArea = playerAreas[playerId];
    const diceInThisArea = currentPlayerArea.querySelectorAll(".die");

    if (dieIndex >= diceInThisArea.length) {
      console.warn(`Die ${dieIndex} not found in player ${playerId} area`);
      if (callback) callback();
      return;
    }

    const dieElement = diceInThisArea[dieIndex];

    if (dieElement) {
      dieElement.classList.add("rolling");

      setTimeout(() => {
        dieElement.classList.remove("rolling");
        if (callback) callback();
      }, GAME_CONFIG.GAME_FLOW.animationDelays.dieRoll);
    } else {
      console.warn(
        `Die element not found for player ${playerId}, die ${dieIndex}`
      );
      if (callback) callback();
    }
  }, 50); // Small delay to ensure DOM update
}

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

function renderGame() {
  renderCurseStatus();
  renderPlayers();
}

function renderCurseStatus() {
  const curseGrid = document.getElementById("curseGrid");
  const curseTypes = Object.keys(CURSE_EFFECTS);

  curseGrid.innerHTML = `
            <div class="curse-label">Player</div>
            ${curseTypes
              .map(
                (curse) => `
                <div class="curse-header">
                    ${curse}<br>
                    <span style="font-size: 0.8em; font-weight: normal;">${CURSE_EFFECTS[curse].name}</span>
                </div>
            `
              )
              .join("")}
            
            ${gameState.players
              .map(
                (player) => `
                <div class="player-curse-row">
                    <div class="player-curse-name ${
                      player.id === gameState.currentPlayer ? "current" : ""
                    } ${player.eliminated ? "eliminated" : ""}">
                        ${player.name}
                    </div>
                    ${curseTypes
                      .map(
                        (curse) => `
                        <div class="curse-progress">
                            ${Array(CURSE_EFFECTS[curse].slotsNeeded)
                              .fill()
                              .map((_, slotIndex) => {
                                const filled =
                                  player.paytables[curse][slotIndex];
                                const isComplete =
                                  player.paytables[curse].length >=
                                  CURSE_EFFECTS[curse].slotsNeeded;
                                return `
                                    <div class="curse-slot ${
                                      filled ? "filled" : ""
                                    } ${isComplete ? "complete" : ""}">
                                        ${filled || ""}
                                    </div>
                                `;
                              })
                              .join("")}
                        </div>
                    `
                      )
                      .join("")}
                </div>
            `
              )
              .join("")}
        `;
}

function renderPlayers() {
  const playersGrid = document.getElementById("playersGrid");
  playersGrid.innerHTML = "";

  gameState.players.forEach((player, index) => {
    const playerArea = document.createElement("div");
    playerArea.className = `player-area ${
      index === gameState.currentPlayer ? "active" : ""
    } ${player.eliminated ? "eliminated" : ""}`;

    const diceShopHTML = `
      <div class="dice-shop ${gameState.shopOpen ? "open" : ""}">
        <div class="shop-title">🎲 Available Dice 🎲</div>
        <div class="shop-items">
          ${["APPRENTICE", "JOURNEYMAN", "MASTER", "FORBIDDEN"]
            .map((templateName) => {
              const template = DIE_TEMPLATES[templateName];
              return `
                <div class="shop-item ${
                  player.canAfford(template.cost) ? "affordable" : ""
                }" 
                     onclick="buyDie('${templateName}')" 
                     ${
                       player.canAfford(template.cost)
                         ? ""
                         : 'style="pointer-events: none;"'
                     }>
                    <div class="item-header">
                        <div class="item-name">${template.name} Die</div>
                        <div class="item-cost">${template.cost} ⚡</div>
                    </div>
                    <div class="item-details">
                        <span>${template.description}</span>
                        <span class="item-explosion">${
                          template.baseExplosion
                        }% base</span>
                    </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;

    playerArea.innerHTML = `
                <div class="player-header">
                    <div class="player-name">${player.name}</div>
                    <div class="player-stats">
                        <div class="stat lives">❤️ ${player.lives}</div>
                        <div class="stat actions">⚡ ${player.actions}</div>
                    </div>
                </div>
                
                <div class="dice-collection">
                    <h4>Dice Collection:</h4>
                    <div class="dice-grid">
                        ${player.dice
                          .map(
                            (die, dieIndex) => `
                            <div class="die" onclick="rollDie(${
                              player.id
                            }, ${dieIndex})" 
                                 ${
                                   index === gameState.currentPlayer &&
                                   !player.isAI &&
                                   !gameState.turnActionTaken
                                     ? ""
                                     : 'style="pointer-events: none; opacity: 0.7;"'
                                 }>
                                <div class="die-explosion-chance">${
                                  die.explosionChance
                                }%</div>
                                <div class="die-result">${
                                  die.lastRoll || "🎲"
                                }</div>
                                <div class="die-name">${die.template.name}</div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
                
                ${
                  index === gameState.currentPlayer &&
                  !player.eliminated &&
                  !player.isAI
                    ? `
                    <div class="actions-panel">
                        ${
                          !gameState.turnActionTaken
                            ? `
                            <p style="color: #4ecdc4; margin-bottom: 8px; font-size: 0.8em;">Click a die to roll it:</p>
                            
                            <button class="shop-button ${
                              player.canAffordAnyDie() ? "affordable" : ""
                            }" 
                                    onclick="toggleShop()" 
                                    ${
                                      player.canAffordAnyDie() ? "" : "disabled"
                                    }>
                                🛒 Dice Shop ${gameState.shopOpen ? "▲" : "▼"}
                            </button>
                            
                            ${diceShopHTML}
                        `
                            : `
                            <p style="color: #ffd93d; font-style: italic; font-size: 0.8em;">Turn action completed. Turn ending automatically...</p>
                        `
                        }
                    </div>
                `
                    : index === gameState.currentPlayer &&
                      !player.eliminated &&
                      player.isAI
                    ? `
                    <div class="actions-panel">
                        <p style="color: #4ecdc4; font-style: italic; font-size: 0.8em;">🤖 AI is thinking...</p>
                    </div>
                `
                    : ""
                }
            `;

    playersGrid.appendChild(playerArea);
  });
}

function toggleShop() {
  if (gameState.turnActionTaken) return;
  gameState.shopOpen = !gameState.shopOpen;
  renderGame();
}

function rollDie(playerId, dieIndex) {
  if (
    playerId !== gameState.currentPlayer ||
    gameState.turnActionTaken ||
    gameState.players[playerId].isAI ||
    gameState.gameOver
  )
    return;

  const player = gameState.players[playerId];
  gameState.shopOpen = false;
  gameState.turnActionTaken = true;
  renderGame();

  animateDieRoll(playerId, dieIndex, () => {
    const result = player.rollSelectedDie(dieIndex);
    renderGame();

    if (
      result &&
      result.completedPaytables &&
      result.completedPaytables.length > 0
    ) {
      setTimeout(() => {
        result.completedPaytables.forEach((symbol) => {
          player.triggerCursePaytable(symbol);
        });
        renderGame();

        checkGameEnd();

        if (!gameState.gameOver) {
          setTimeout(() => {
            endTurn();
          }, GAME_CONFIG.GAME_FLOW.animationDelays.turnTransition);
        }
      }, GAME_CONFIG.GAME_FLOW.animationDelays.payTableEffect);
    } else {
      checkGameEnd();

      if (!gameState.gameOver) {
        setTimeout(() => {
          endTurn();
        }, GAME_CONFIG.GAME_FLOW.animationDelays.turnTransition);
      }
    }
  });
}

function buyDie(templateName) {
  if (gameState.turnActionTaken) return;

  const player = gameState.players[gameState.currentPlayer];
  const template = DIE_TEMPLATES[templateName];

  if (player.buyDie(template)) {
    gameState.turnActionTaken = true;
    gameState.shopOpen = false;
    renderGame();

    checkGameEnd();

    if (!gameState.gameOver) {
      setTimeout(() => {
        endTurn();
      }, GAME_CONFIG.GAME_FLOW.animationDelays.turnTransition);
    }
  }
}

function endTurn() {
  gameState.turnActionTaken = false;
  gameState.shopOpen = false;

  do {
    gameState.currentPlayer =
      (gameState.currentPlayer + 1) % gameState.players.length;
  } while (gameState.players[gameState.currentPlayer].eliminated);

  if (gameState.currentPlayer === 0) {
    gameState.turnCount++;
  }

  toastManager.show(
    `${gameState.players[gameState.currentPlayer].name}'s turn`,
    "info",
    2000
  );

  renderGame();

  if (gameState.players[gameState.currentPlayer].isAI && !gameState.gameOver) {
    setTimeout(() => {
      executeAITurn();
    }, GAME_CONFIG.GAME_FLOW.animationDelays.aiThinking);
  }
}

function executeAITurn() {
  const aiPlayer = gameState.players[gameState.currentPlayer];

  if (aiPlayer.eliminated || gameState.gameOver) return;

  const gameProgression = Math.min(gameState.turnCount / 10, 1.0);
  const currentAggression =
    aiPlayer.aggressionLevel *
    (1 + gameProgression * GAME_CONFIG.AI_SETTINGS.aggressionMultiplier);

  const canBuyApprentice = aiPlayer.canAfford(DIE_TEMPLATES.APPRENTICE.cost);
  const canBuyJourneyman = aiPlayer.canAfford(DIE_TEMPLATES.JOURNEYMAN.cost);
  const canBuyMaster = aiPlayer.canAfford(DIE_TEMPLATES.MASTER.cost);
  const canBuyForbidden = aiPlayer.canAfford(DIE_TEMPLATES.FORBIDDEN.cost);

  const totalDice = aiPlayer.dice.length;

  let action = null;

  // AI Decision making
  if (totalDice < GAME_CONFIG.AI_SETTINGS.maxDiceTarget * currentAggression) {
    if (
      canBuyForbidden &&
      aiPlayer.actions >= 35 &&
      Math.random() <
        GAME_CONFIG.AI_SETTINGS.forbiddenDiceChance * currentAggression
    ) {
      action = () => {
        aiPlayer.buyDie(DIE_TEMPLATES.FORBIDDEN);
      };
    } else if (
      canBuyMaster &&
      aiPlayer.actions >= GAME_CONFIG.AI_SETTINGS.masterDiceActionThreshold
    ) {
      action = () => {
        aiPlayer.buyDie(DIE_TEMPLATES.MASTER);
      };
    } else if (canBuyJourneyman && aiPlayer.actions >= 15) {
      action = () => {
        aiPlayer.buyDie(DIE_TEMPLATES.JOURNEYMAN);
      };
    } else if (canBuyApprentice) {
      action = () => {
        aiPlayer.buyDie(DIE_TEMPLATES.APPRENTICE);
      };
    }
  }

  // If no dice purchase, roll a die
  if (!action) {
    let bestDie = 0;
    let bestScore = -1000;

    aiPlayer.dice.forEach((die, index) => {
      const actionFaces = die.faces.filter(
        (face) => GAME_CONFIG.ACTION_VALUES[face]
      );
      const avgActionValue =
        actionFaces.reduce(
          (sum, face) => sum + aiPlayer.getActionValue(face),
          0
        ) / die.faces.length;

      const explosionPenalty =
        die.explosionChance * 0.1 * (2 - currentAggression);
      let score = avgActionValue - explosionPenalty;

      if (
        die.explosionChance > GAME_CONFIG.AI_SETTINGS.conservativeThreshold &&
        currentAggression < 1.0
      ) {
        score *= 0.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestDie = index;
      }
    });

    action = () => {
      // First update the display to ensure DOM is current
      renderGame();

      // Use the animation system for AI dice
      animateDieRoll(gameState.currentPlayer, bestDie, () => {
        const result = aiPlayer.rollSelectedDie(bestDie);
        renderGame();

        if (
          result &&
          result.completedPaytables &&
          result.completedPaytables.length > 0
        ) {
          setTimeout(() => {
            result.completedPaytables.forEach((symbol) => {
              aiPlayer.triggerCursePaytable(symbol);
            });
            renderGame();
          }, GAME_CONFIG.GAME_FLOW.animationDelays.payTableEffect);
        }
      });
    };
  }

  // Execute the chosen action
  if (action) {
    gameState.turnActionTaken = true;
    action();

    checkGameEnd();

    if (!gameState.gameOver) {
      setTimeout(() => {
        endTurn();
      }, GAME_CONFIG.GAME_FLOW.animationDelays.aiThinking);
    }
  }
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
