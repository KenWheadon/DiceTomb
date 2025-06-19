// Game State
let gameState = {
  currentPlayer: 0,
  players: [],
  gameOver: false,
  turnActionTaken: false,
  shopOpen: false, // Track if dice shop is open
  turnCount: 0, // Track game progression
};

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
    this.aggressionLevel = 1.0; // New: AI personality modifier
  }

  initPaytables() {
    const paytables = {};
    // Only curse paytables now
    Object.keys(CURSE_EFFECTS).forEach((curse) => {
      paytables[curse] = [];
    });
    return paytables;
  }

  addCurseSymbol(symbol) {
    if (this.paytables[symbol]) {
      this.paytables[symbol].push(symbol);

      // Return whether paytable is ready to trigger
      return this.paytables[symbol].length >= CURSE_EFFECTS[symbol].slotsNeeded;
    }
    return false;
  }

  triggerCursePaytable(symbol) {
    this.triggerCurseEffect(symbol);
    this.paytables[symbol] = []; // Clear paytable
  }

  triggerCurseEffect(symbol) {
    const effect = CURSE_EFFECTS[symbol];

    switch (symbol) {
      case SYMBOLS.BONE:
        this.actions = Math.max(0, this.actions - effect.actionLoss);
        addLog(
          `${this.name} triggered ${effect.name}: Lost ${effect.actionLoss} actions!`,
          "curse"
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
          addLog(
            `${this.name} triggered ${effect.name}: Random die face turned to skull!`,
            "curse"
          );
        }
        break;

      case SYMBOLS.COFFIN:
        gameState.players.forEach((player) => {
          if (player.id !== this.id && !player.eliminated) {
            player.actions += effect.opponentActionGain;
          }
        });
        addLog(
          `${this.name} triggered ${effect.name}: All opponents gained ${effect.opponentActionGain} actions!`,
          "curse"
        );
        break;

      case SYMBOLS.TOMB:
        this.dice.forEach((die) => {
          die.explosionChance += effect.explosionIncrease;
        });
        addLog(
          `${this.name} triggered ${effect.name}: All dice explosion chance increased by ${effect.explosionIncrease}%!`,
          "curse"
        );
        break;
    }
  }

  rollSelectedDie(dieIndex) {
    if (dieIndex < 0 || dieIndex >= this.dice.length) return null;

    const die = this.dice[dieIndex];
    const rollResult = die.roll();

    if (rollResult.exploded) {
      // Die exploded but stays in collection
      this.lives--;

      // Corruption spread
      this.dice.forEach((remainingDie) => {
        remainingDie.explosionChance +=
          GAME_CONFIG.DICE_MECHANICS.corruptionSpreadAmount;
      });

      addLog(
        `💥 ${this.name}'s ${die.template.name} exploded! Lost 1 life. Remaining dice corrupted.`,
        "explosion"
      );

      if (this.lives <= 0) {
        this.eliminated = true;
        addLog(`☠️ ${this.name} has been eliminated!`, "explosion");
      }

      return { exploded: true, result: null };
    }

    // Process roll result
    const result = rollResult.result;
    const completedPaytables = [];

    if (result === SYMBOLS.WILD) {
      // Wild gives all rewards and curses on the die
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
      addLog(
        `🌟 ${this.name} rolled WILD! Gained ${totalActions} actions and added curse symbols.`
      );
    } else if (result.match(/[①②③④⑤⑥⑦⑧⑩⑮]/)) {
      // Direct action points
      const actionValue = this.getActionValue(result);
      this.actions += actionValue;
      addLog(
        `${this.name} gained ${actionValue} actions from rolling ${result}`
      );
    } else if (CURSE_EFFECTS[result]) {
      // Curse symbol for paytable
      const isComplete = this.addCurseSymbol(result);

      if (isComplete) {
        completedPaytables.push(result);
        addLog(
          `${this.name} filled ${CURSE_EFFECTS[result].name} paytable with ${result}!`
        );
      } else {
        addLog(
          `${this.name} added ${result} to ${CURSE_EFFECTS[result].name} paytable`
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
      addLog(
        `${this.name} bought ${template.name} for ${template.cost} actions`
      );
      return true;
    }
    return false;
  }

  canAffordAnyDie() {
    // Find cheapest purchasable die
    const purchasableDice = Object.values(DIE_TEMPLATES).filter(
      (template) => template.cost > 0
    );
    const cheapestCost = Math.min(
      ...purchasableDice.map((template) => template.cost)
    );
    return this.canAfford(cheapestCost);
  }
}

// Centralized dice animation function
function animateDieRoll(playerId, dieIndex, callback) {
  const playerAreas = document.querySelectorAll(".player-area");
  const currentPlayerArea = playerAreas[playerId];
  const diceInThisArea = currentPlayerArea.querySelectorAll(".die");
  const dieElement = diceInThisArea[dieIndex];

  if (dieElement) {
    dieElement.classList.add("rolling");
    setTimeout(() => {
      dieElement.classList.remove("rolling");
      if (callback) callback();
    }, GAME_CONFIG.GAME_FLOW.animationDelays.dieRoll);
  } else {
    // Fallback if element not found
    setTimeout(() => {
      if (callback) callback();
    }, GAME_CONFIG.GAME_FLOW.animationDelays.dieRoll);
  }
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
  document.getElementById("gameLog").innerHTML =
    '<div class="log-entry">Game started! You vs 3 AI opponents. Each player begins with 1 standard die, 3 lives, and 8 actions!</div>';

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

    // Build dice shop HTML with new Journeyman tier
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

  // Close shop if open
  gameState.shopOpen = false;

  // Mark turn action as taken
  gameState.turnActionTaken = true;
  renderGame(); // Update UI to show action taken

  // Use centralized animation function
  animateDieRoll(playerId, dieIndex, () => {
    // Execute roll and immediately update display with result + paytable filling
    const result = player.rollSelectedDie(dieIndex);
    renderGame(); // Show die result and filled paytable immediately

    // Check for completed paytables after a brief pause
    if (
      result &&
      result.completedPaytables &&
      result.completedPaytables.length > 0
    ) {
      setTimeout(() => {
        // Trigger paytable effects
        result.completedPaytables.forEach((symbol) => {
          player.triggerCursePaytable(symbol);
        });
        renderGame(); // Update display after effects

        checkGameEnd();

        if (!gameState.gameOver) {
          // Continue to next turn
          setTimeout(() => {
            endTurn();
          }, GAME_CONFIG.GAME_FLOW.animationDelays.turnTransition);
        }
      }, GAME_CONFIG.GAME_FLOW.animationDelays.payTableEffect);
    } else {
      // No paytables completed, proceed directly
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
    gameState.shopOpen = false; // Close shop after purchase
    renderGame();

    checkGameEnd();

    if (!gameState.gameOver) {
      // Auto-end turn after action
      setTimeout(() => {
        endTurn();
      }, GAME_CONFIG.GAME_FLOW.animationDelays.turnTransition);
    }
  }
}

function endTurn() {
  gameState.turnActionTaken = false; // Reset for next player
  gameState.shopOpen = false; // Close shop for next player

  // Move to next active player
  do {
    gameState.currentPlayer =
      (gameState.currentPlayer + 1) % gameState.players.length;
  } while (gameState.players[gameState.currentPlayer].eliminated);

  // Increment turn counter when it returns to player 0
  if (gameState.currentPlayer === 0) {
    gameState.turnCount++;
  }

  addLog(`--- ${gameState.players[gameState.currentPlayer].name}'s turn ---`);
  renderGame();

  // If it's an AI player's turn, execute AI logic
  if (gameState.players[gameState.currentPlayer].isAI && !gameState.gameOver) {
    setTimeout(() => {
      executeAITurn();
    }, GAME_CONFIG.GAME_FLOW.animationDelays.aiThinking);
  }
}

function executeAITurn() {
  const aiPlayer = gameState.players[gameState.currentPlayer];

  if (aiPlayer.eliminated || gameState.gameOver) return;

  // Update AI aggression based on game state
  const gameProgression = Math.min(gameState.turnCount / 10, 1.0);
  const currentAggression =
    aiPlayer.aggressionLevel *
    (1 + gameProgression * GAME_CONFIG.AI_SETTINGS.aggressionMultiplier);

  // AI Decision Logic - More sophisticated
  const canBuyApprentice = aiPlayer.canAfford(DIE_TEMPLATES.APPRENTICE.cost);
  const canBuyJourneyman = aiPlayer.canAfford(DIE_TEMPLATES.JOURNEYMAN.cost);
  const canBuyMaster = aiPlayer.canAfford(DIE_TEMPLATES.MASTER.cost);
  const canBuyForbidden = aiPlayer.canAfford(DIE_TEMPLATES.FORBIDDEN.cost);

  const totalDice = aiPlayer.dice.length;
  const avgExplosionChance =
    aiPlayer.dice.reduce((sum, die) => sum + die.explosionChance, 0) /
    totalDice;

  let action = null;

  // More dynamic decision making
  if (totalDice < GAME_CONFIG.AI_SETTINGS.maxDiceTarget * currentAggression) {
    // Prioritize dice collection based on aggression and resources
    if (
      canBuyForbidden &&
      aiPlayer.actions >= 35 &&
      Math.random() <
        GAME_CONFIG.AI_SETTINGS.forbiddenDiceChance * currentAggression
    ) {
      action = () => {
        aiPlayer.buyDie(DIE_TEMPLATES.FORBIDDEN);
        addLog(`${aiPlayer.name} bought a Forbidden Die`);
      };
    } else if (
      canBuyMaster &&
      aiPlayer.actions >= GAME_CONFIG.AI_SETTINGS.masterDiceActionThreshold
    ) {
      action = () => {
        aiPlayer.buyDie(DIE_TEMPLATES.MASTER);
        addLog(`${aiPlayer.name} bought a Master Die`);
      };
    } else if (canBuyJourneyman && aiPlayer.actions >= 15) {
      action = () => {
        aiPlayer.buyDie(DIE_TEMPLATES.JOURNEYMAN);
        addLog(`${aiPlayer.name} bought a Journeyman Die`);
      };
    } else if (canBuyApprentice) {
      action = () => {
        aiPlayer.buyDie(DIE_TEMPLATES.APPRENTICE);
        addLog(`${aiPlayer.name} bought an Apprentice Die`);
      };
    }
  }

  // If no dice purchase, roll a die
  if (!action) {
    // Smarter die selection
    let bestDie = 0;
    let bestScore = -1000;

    aiPlayer.dice.forEach((die, index) => {
      // Calculate expected value
      const actionFaces = die.faces.filter(
        (face) => GAME_CONFIG.ACTION_VALUES[face]
      );
      const avgActionValue =
        actionFaces.reduce(
          (sum, face) => sum + aiPlayer.getActionValue(face),
          0
        ) / die.faces.length;

      // Risk assessment
      const explosionPenalty =
        die.explosionChance * 0.1 * (2 - currentAggression); // Aggressive AI cares less about explosion
      const score = avgActionValue - explosionPenalty;

      // Conservative AI avoids high explosion dice
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
      // Use centralized animation function for AI too
      animateDieRoll(gameState.currentPlayer, bestDie, () => {
        const result = aiPlayer.rollSelectedDie(bestDie);
        addLog(
          `${aiPlayer.name} rolled their ${aiPlayer.dice[bestDie].template.name}`
        );

        renderGame(); // Update display with roll result

        // Handle paytable completion for AI
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

    renderGame();

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
      addLog(`🏆 ${winner.name} is the last survivor!`, "explosion");
    } else {
      document.getElementById("winnerText").textContent = "Everyone Died!";
      addLog(`💀 All players have been eliminated!`, "explosion");
    }

    document.getElementById("gameOver").style.display = "flex";
  }
}

function addLog(message, type = "") {
  const gameLog = document.getElementById("gameLog");
  const logEntry = document.createElement("div");
  logEntry.className = `log-entry ${type}`;
  logEntry.textContent = message;

  gameLog.appendChild(logEntry);
  gameLog.scrollTop = gameLog.scrollHeight;
}

// Initialize game on load
document.addEventListener("DOMContentLoaded", initGame);
