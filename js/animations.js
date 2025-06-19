// Animation System

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

// Additional animation utilities can be added here
function animatePlayerElimination(playerId) {
  const playerAreas = document.querySelectorAll(".player-area");
  if (playerId < playerAreas.length) {
    const playerArea = playerAreas[playerId];
    playerArea.classList.add("elimination-animation");
    
    setTimeout(() => {
      playerArea.classList.remove("elimination-animation");
    }, 1000);
  }
}

function animateCurseEffect(playerId, curseType) {
  const playerAreas = document.querySelectorAll(".player-area");
  if (playerId < playerAreas.length) {
    const playerArea = playerAreas[playerId];
    playerArea.classList.add(`curse-effect-${curseType}`);
    
    setTimeout(() => {
      playerArea.classList.remove(`curse-effect-${curseType}`);
    }, 2000);
  }
}

function animateShopToggle() {
  const shops = document.querySelectorAll(".dice-shop");
  shops.forEach(shop => {
    if (shop.classList.contains("open")) {
      shop.style.maxHeight = shop.scrollHeight + "px";
    } else {
      shop.style.maxHeight = "0px";
    }
  });
}