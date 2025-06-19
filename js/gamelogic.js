// Game Logic and Turn Management

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

  const action = determineAIAction(aiPlayer, currentAggression);

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

function determineAIAction(aiPlayer, currentAggression) {
  const canBuyApprentice = aiPlayer.canAfford(DIE_TEMPLATES.APPRENTICE.cost);
  const canBuyJourneyman = aiPlayer.canAfford(DIE_TEMPLATES.JOURNEYMAN.cost);
  const canBuyMaster = aiPlayer.canAfford(DIE_TEMPLATES.MASTER.cost);
  const canBuyForbidden = aiPlayer.canAfford(DIE_TEMPLATES.FORBIDDEN.cost);
  const totalDice = aiPlayer.dice.length;

  // AI Decision making for dice purchases
  if (totalDice < GAME_CONFIG.AI_SETTINGS.maxDiceTarget * currentAggression) {
    if (
      canBuyForbidden &&
      aiPlayer.actions >= 35 &&
      Math.random() <
        GAME_CONFIG.AI_SETTINGS.forbiddenDiceChance * currentAggression
    ) {
      return () => aiPlayer.buyDie(DIE_TEMPLATES.FORBIDDEN);
    } else if (
      canBuyMaster &&
      aiPlayer.actions >= GAME_CONFIG.AI_SETTINGS.masterDiceActionThreshold
    ) {
      return () => aiPlayer.buyDie(DIE_TEMPLATES.MASTER);
    } else if (canBuyJourneyman && aiPlayer.actions >= 15) {
      return () => aiPlayer.buyDie(DIE_TEMPLATES.JOURNEYMAN);
    } else if (canBuyApprentice) {
      return () => aiPlayer.buyDie(DIE_TEMPLATES.APPRENTICE);
    }
  }

  // If no dice purchase, roll a die
  return createAIRollAction(aiPlayer, currentAggression);
}

function createAIRollAction(aiPlayer, currentAggression) {
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

  return () => {
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