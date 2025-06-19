# 🎲 Dice Tomb Roulette ⚰️

A thrilling dice-based survival game where players corrupt their dice for power while risking explosive consequences. Face off against 3 AI opponents in this darkly themed strategy game of risk and reward.

![Game Preview](https://via.placeholder.com/800x400/0f0f23/4ecdc4?text=🎲+Dice+Tomb+Roulette+⚰️)

## 🎯 Game Overview

**Dice Tomb Roulette** is a turn-based strategy game where players:
- Roll dice to gain actions and trigger curse effects
- Purchase increasingly powerful (and dangerous) dice
- Manage curse paytables that can devastate opponents
- Survive explosive dice corruption as the game progresses
- Outlast 3 AI opponents with unique personalities

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software required - runs entirely in browser

### Installation
1. Clone or download this repository
2. Create the folder structure:
   ```
   dice-tomb-roulette/
   ├── index.html
   ├── config.js
   ├── css/
   └── js/
   ```
3. Copy all files to their respective folders
4. Open `index.html` in your web browser
5. Start playing immediately!

## 🎮 How to Play

### Basic Gameplay
1. **Roll Dice**: Click any of your dice to roll and gain actions
2. **Buy Dice**: Use actions to purchase more powerful dice from the shop
3. **Manage Risk**: Each die has an explosion chance that increases with each roll
4. **Survive**: Be the last player standing with lives remaining

### Dice Types
- **Standard** (Free): Basic starter die with low-value faces
- **Apprentice** (5 actions): Better action values, safer option
- **Journeyman** (10 actions): Mid-game workhorse with balanced risk
- **Master** (18 actions): High-value actions with wild faces and moderate risk
- **Forbidden** (28 actions): Extreme power with extreme explosion risk

### Curse System
Fill curse paytables by rolling curse symbols:
- **🦴 Bone Curse**: Lose 4 actions when triggered
- **💀 Skull Curse**: Random die face becomes a skull
- **⚰️ Coffin Curse**: All opponents gain 2 actions
- **🏺 Tomb Curse**: All your dice gain +10% explosion chance

### Victory Conditions
- **Win**: Be the last player with lives remaining
- **Lose**: Reach 0 lives from dice explosions

## 🤖 AI Opponents

Each AI has unique behavior:
- **AI Bot 1**: Conservative player, avoids high-risk dice
- **AI Bot 2**: Aggressive player, takes more risks for power
- **AI Bot 3**: Balanced player, adapts strategy based on game state

AI difficulty scales with turn count, becoming more aggressive over time.

## 🛠️ Technical Details

### Architecture
The game uses a modular architecture for maintainability:

```
📁 Project Structure
├── index.html              # Main game page
├── config.js               # Game configuration and balance
├── css/
│   ├── base.css           # Core styles and reset
│   ├── components.css     # Reusable UI components
│   ├── game-layout.css    # Game-specific layouts
│   ├── animations.css     # All animations and effects
│   ├── toast.css         # Notification system
│   └── responsive.css    # Mobile and responsive design
└── js/
    ├── classes.js        # Core game classes (Die, Player, ToastManager)
    ├── gameState.js      # Game state management
    ├── animations.js     # Animation utilities
    ├── ui.js            # UI rendering functions
    └── gameLogic.js     # Game flow and AI logic
```

### Key Features
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: Supports reduced motion and high contrast preferences
- **Modular Code**: Easy to extend and maintain
- **Toast Notifications**: Rich feedback system for game events
- **Smooth Animations**: Polished visual experience

## ⚙️ Configuration

### Game Balance
Edit `config.js` to modify:
- Starting player stats (lives, actions, dice)
- Dice explosion mechanics and corruption spread
- AI behavior and aggression levels
- Curse effects and trigger requirements
- Animation timing and visual effects

### Example Configuration Changes
```javascript
// Make the game easier
PLAYER_DEFAULTS: {
  startingLives: 5,        // More lives
  startingActions: 8,      // More starting actions
}

// Adjust AI difficulty
AI_SETTINGS: {
  aggressionMultiplier: 0.8,  // Less aggressive AI
  maxDiceTarget: 3,           // AI buys fewer dice
}
```

## 🎨 Customization

### Adding New Dice
1. Define new die template in `config.js`:
```javascript
NEW_DIE: {
  name: "Custom Die",
  faces: ["🦴", "💀", "⑤", "⑥", "⑦", "⑧"],
  cost: 15,
  baseExplosion: 3,
  description: "Your custom die description"
}
```

2. Add to shop display in `ui.js`
3. Update AI decision logic in `gameLogic.js`

### Theming
- Modify `css/base.css` for color schemes
- Edit `css/components.css` for UI element styling
- Customize `css/animations.css` for visual effects

## 🐛 Troubleshooting

### Common Issues
| Issue | Solution |
|-------|----------|
| Game won't start | Check browser console for errors, ensure all files are in correct folders |
| Dice won't roll | Verify `classes.js` loads before other JavaScript files |
| Styling broken | Confirm CSS files are in `css/` folder with correct paths |
| Toast notifications missing | Check that `ToastManager` is initialized in `classes.js` |

### Browser Compatibility
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes following the modular architecture
4. Test thoroughly on different devices
5. Submit a pull request

### Code Style
- Use meaningful variable names
- Comment complex game logic
- Follow existing file organization patterns
- Test responsive design changes

### Suggested Improvements
- [ ] Add sound effects and music
- [ ] Implement save/load game state
- [ ] Create additional dice types and curse effects
- [ ] Add multiplayer support
- [ ] Implement achievement system
- [ ] Add difficulty levels

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 Dice Tomb Roulette

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Questions**: Ask questions in GitHub Discussions
- **Updates**: Watch the repository for new releases and updates

---

**Made with ❤️ and ☠️ by the Dice Tomb Roulette team**

*May your dice roll high and your explosions be few!*