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

// Global toast manager instance
const toastManager = new ToastManager();

// Die class
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

// Player class
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