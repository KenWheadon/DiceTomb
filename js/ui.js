// UI Rendering Functions

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
                        const filled = player.paytables[curse][slotIndex];
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

    playerArea.innerHTML = createPlayerHTML(player, index);
    playersGrid.appendChild(playerArea);
  });
}

function createPlayerHTML(player, index) {
  const diceShopHTML = createDiceShopHTML(player);
  const actionsHTML = createActionsHTML(player, index);

  return `
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
              .map((die, dieIndex) => createDieHTML(die, dieIndex, player, index))
              .join("")}
        </div>
    </div>
    
    ${actionsHTML}
    ${diceShopHTML}
  `;
}

function createDieHTML(die, dieIndex, player, playerIndex) {
  const isClickable = 
    playerIndex === gameState.currentPlayer &&
    !player.isAI &&
    !gameState.turnActionTaken;

  return `
    <div class="die" onclick="rollDie(${player.id}, ${dieIndex})" 
         ${isClickable ? "" : 'style="pointer-events: none; opacity: 0.7;"'}>
        <div class="die-explosion-chance">${die.explosionChance}%</div>
        <div class="die-result">${die.lastRoll || "🎲"}</div>
        <div class="die-name">${die.template.name}</div>
    </div>
  `;
}

function createDiceShopHTML(player) {
  return `
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
                      <span class="item-explosion">${template.baseExplosion}% base</span>
                  </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function createActionsHTML(player, index) {
  if (index !== gameState.currentPlayer || player.eliminated) {
    return "";
  }

  if (player.isAI) {
    return `
      <div class="actions-panel">
          <p style="color: #4ecdc4; font-style: italic; font-size: 0.8em;">🤖 AI is thinking...</p>
      </div>
    `;
  }

  if (gameState.turnActionTaken) {
    return `
      <div class="actions-panel">
          <p style="color: #ffd93d; font-style: italic; font-size: 0.8em;">Turn action completed. Turn ending automatically...</p>
      </div>
    `;
  }

  return `
    <div class="actions-panel">
        <p style="color: #4ecdc4; margin-bottom: 8px; font-size: 0.8em;">Click a die to roll it:</p>
        
        <button class="shop-button ${
          player.canAffordAnyDie() ? "affordable" : ""
        }" 
                onclick="toggleShop()" 
                ${player.canAffordAnyDie() ? "" : "disabled"}>
            🛒 Dice Shop ${gameState.shopOpen ? "▲" : "▼"}
        </button>
    </div>
  `;
}

function toggleShop() {
  if (gameState.turnActionTaken) return;
  gameState.shopOpen = !gameState.shopOpen;
  renderGame();
}