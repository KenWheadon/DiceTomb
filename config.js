// Game Configuration - All balanceable data
const GAME_CONFIG = {
  // Player starting stats - Give players more initial power
  PLAYER_DEFAULTS: {
    startingLives: 3,
    startingActions: 4, // Increased from 0 - players can act immediately
    startingDiceTemplate: "STANDARD",
  },

  // Dice mechanics - Faster, more exciting progression
  DICE_MECHANICS: {
    explosionIncreasePerRoll: 4, // Increased from 2 - faster escalation
    corruptionSpreadAmount: 3, // Reduced from 5 - less punishing
    maxDiceFaces: 8, // Maximum faces a die can have
  },

  // Dice face symbols
  SYMBOLS: {
    BONE: "🦴",
    SKULL: "💀",
    COFFIN: "⚰️",
    TOMB: "🏺",
    ACTION1: "①",
    ACTION2: "②",
    ACTION3: "③",
    ACTION4: "④",
    ACTION5: "⑤",
    ACTION6: "⑥",
    ACTION7: "⑦",
    ACTION8: "⑧",
    ACTION10: "⑩",
    ACTION15: "⑮",
    WILD: "🌟",
  },

  // Action values for each symbol
  ACTION_VALUES: {
    "①": 1,
    "②": 2,
    "③": 3,
    "④": 4,
    "⑤": 5,
    "⑥": 6,
    "⑦": 7,
    "⑧": 8,
    "⑩": 10,
    "⑮": 15,
  },

  // Die templates - Smoother cost progression and better balance
  DIE_TEMPLATES: {
    STANDARD: {
      name: "Standard",
      faces: ["🦴", "💀", "①", "②", "③", "③"], // Better early game value
      cost: 0,
      baseExplosion: 0,
      description: "Basic starter die",
    },
    APPRENTICE: {
      name: "Apprentice",
      faces: ["⚰️", "💀", "②", "③", "④", "④"], // More consistent value
      cost: 5, // Reduced from 6 - easier to afford
      baseExplosion: 0,
      description: "Better actions",
    },
    JOURNEYMAN: {
      // New tier for smoother progression
      name: "Journeyman",
      faces: ["🏺", "⚰️", "③", "④", "⑤", "⑥"],
      cost: 10, // Fills gap between apprentice and master
      baseExplosion: 2,
      description: "Solid mid-game die",
    },
    MASTER: {
      name: "Master",
      faces: ["🏺", "⚰️", "🌟", "⑤", "⑥", "⑧"], // Reduced power slightly
      cost: 18, // Reduced from 15 but adjusted for new tier
      baseExplosion: 5, // Increased from 0 - risk/reward
      description: "High actions with risk",
    },
    FORBIDDEN: {
      name: "Forbidden",
      faces: ["🦴", "💀", "⚰️", "🏺", "⑮", "⑩"],
      cost: 28, // Reduced from 30
      baseExplosion: 12, // Reduced from 15 - less punishing
      description: "Extreme power, extreme risk",
    },
  },

  // Curse effects configuration - More balanced effects
  CURSE_EFFECTS: {
    "🦴": {
      name: "Bone Curse",
      effect: "Lose 4 actions", // Reduced from 5
      slotsNeeded: 2,
      actionLoss: 4,
    },
    "💀": {
      name: "Skull Curse",
      effect: "Turn random die face to skull",
      slotsNeeded: 2,
      replacementSymbol: "💀",
    },
    "⚰️": {
      name: "Coffin Curse",
      effect: "All opponents gain +2 actions", // Reduced from 3
      slotsNeeded: 2,
      opponentActionGain: 2,
    },
    "🏺": {
      name: "Tomb Curse",
      effect: "All dice +10% explosion chance", // Increased from 5
      slotsNeeded: 2,
      explosionIncrease: 10,
    },
  },

  // AI behavior settings - More dynamic and interesting AI
  AI_SETTINGS: {
    maxDiceTarget: 4, // Increased from 3 - AI builds bigger collections
    riskThreshold: 20, // Reduced from 30 - AI takes more risks
    forbiddenDiceChance: 0.4, // Increased from 0.3 - more exciting
    masterDiceActionThreshold: 25, // Reduced from 40 - faster upgrades
    forbiddenDiceActionThreshold: 20, // Reduced from 30 - earlier risky plays
    aggressionMultiplier: 1.2, // New - AI gets more aggressive over time
    conservativeThreshold: 33, // New - explosion chance where AI becomes careful
  },

  // Game flow settings - Faster, more responsive
  GAME_FLOW: {
    animationDelays: {
      dieRoll: 400, // Reduced from 600 - faster rolls
      payTableEffect: 600, // Reduced from 1000 - quicker curse resolution
      turnTransition: 400, // Reduced from 800 - faster turns
      aiThinking: 600, // Reduced from 1200 - less waiting
    },
  },
};

// Legacy symbol references for backward compatibility
const SYMBOLS = GAME_CONFIG.SYMBOLS;
const DIE_TEMPLATES = GAME_CONFIG.DIE_TEMPLATES;
const CURSE_EFFECTS = GAME_CONFIG.CURSE_EFFECTS;
