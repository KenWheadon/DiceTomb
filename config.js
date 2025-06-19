// Game Configuration - All balanceable data
const GAME_CONFIG = {
  // Player starting stats
  PLAYER_DEFAULTS: {
    startingLives: 3,
    startingActions: 0,
    startingDiceTemplate: "STANDARD",
  },

  // Dice mechanics
  DICE_MECHANICS: {
    explosionIncreasePerRoll: 2, // % increase per roll
    corruptionSpreadAmount: 5, // % increase when other dice explode
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

  // Die templates
  DIE_TEMPLATES: {
    STANDARD: {
      name: "Standard",
      faces: ["🦴", "💀", "①", "②", "②", "③"],
      cost: 0,
      baseExplosion: 0,
      description: "Basic starter die",
    },
    APPRENTICE: {
      name: "Apprentice",
      faces: ["⚰️", "💀", "②", "③", "④", "⑤"],
      cost: 6,
      baseExplosion: 0,
      description: "Better actions",
    },
    MASTER: {
      name: "Master",
      faces: ["🏺", "⚰️", "🌟", "⑤", "⑥", "⑩"],
      cost: 15,
      baseExplosion: 0,
      description: "High actions",
    },
    FORBIDDEN: {
      name: "Forbidden",
      faces: ["🦴", "💀", "⚰️", "🏺", "⑮", "⑩"],
      cost: 30,
      baseExplosion: 15,
      description: "Extreme power",
    },
  },

  // Curse effects configuration
  CURSE_EFFECTS: {
    "🦴": {
      name: "Bone Curse",
      effect: "Lose 5 actions",
      slotsNeeded: 2,
      actionLoss: 5,
    },
    "💀": {
      name: "Skull Curse",
      effect: "Turn random die face to skull",
      slotsNeeded: 3,
      replacementSymbol: "💀",
    },
    "⚰️": {
      name: "Coffin Curse",
      effect: "All opponents gain +3 actions",
      slotsNeeded: 2,
      opponentActionGain: 3,
    },
    "🏺": {
      name: "Tomb Curse",
      effect: "All dice +5% explosion chance",
      slotsNeeded: 3,
      explosionIncrease: 5,
    },
  },

  // AI behavior settings
  AI_SETTINGS: {
    maxDiceTarget: 3, // AI tries to get this many dice
    riskThreshold: 30, // Above this explosion %, AI is more cautious
    forbiddenDiceChance: 0.3, // Chance AI buys risky forbidden dice
    masterDiceActionThreshold: 40, // Actions needed before buying master dice
    forbiddenDiceActionThreshold: 30, // Actions needed before considering forbidden dice
  },

  // Game flow settings
  GAME_FLOW: {
    animationDelays: {
      dieRoll: 600, // ms for die roll animation
      payTableEffect: 1000, // ms delay before curse effects trigger
      turnTransition: 800, // ms delay between turns
      aiThinking: 1200, // ms for AI "thinking" time
    },
  },
};

// Legacy symbol references for backward compatibility
const SYMBOLS = GAME_CONFIG.SYMBOLS;
const DIE_TEMPLATES = GAME_CONFIG.DIE_TEMPLATES;
const CURSE_EFFECTS = GAME_CONFIG.CURSE_EFFECTS;
