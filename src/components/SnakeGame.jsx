import { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/SnakeGame.css';

const GRID_SIZE = 24;
const CANVAS_DIM = 480;
const GRID_COUNT = CANVAS_DIM / GRID_SIZE;

const SPEED_MAP = { slow: 200, normal: 120, fast: 70, extreme: 40 };

const COLOR_MAP = {
  green: { primary: '#00ff88', secondary: '#00cc6a', dark: '#006633' },
  blue: { primary: '#0099ff', secondary: '#0077cc', dark: '#003366' },
  red: { primary: '#ff4757', secondary: '#cc3341', dark: '#661118' },
  purple: { primary: '#a55eea', secondary: '#8844bb', dark: '#442255' },
  yellow: { primary: '#ffd700', secondary: '#ccac00', dark: '#665500' },
  orange: { primary: '#ff9f43', secondary: '#cc7f33', dark: '#664011' },
  pink: { primary: '#fd79a8', secondary: '#cc5588', dark: '#662233' },
  cyan: { primary: '#00d2d3', secondary: '#00aaaa', dark: '#004444' },
  white: { primary: '#ffffff', secondary: '#cccccc', dark: '#555555' },
  rainbow: { primary: '#00ff88', secondary: '#00cc6a', dark: '#006633' },
};

const THEME_CONFIGS = {
  dark: { bgPrimary: '#1a1a2e', bgSecondary: '#16213e', bgTertiary: '#0f3460', canvasBg: '#0a192f', gridOpacity: 0.05, accent: '#00ff88', foodColor: '#ff4757', specialFoodColor: '#ffd700' },
  light: { bgPrimary: '#f5f5f5', bgSecondary: '#e0e0e0', bgTertiary: '#bdbdbd', canvasBg: '#ffffff', gridOpacity: 0.1, accent: '#2196f3', foodColor: '#f44336', specialFoodColor: '#ff9800' },
  neon: { bgPrimary: '#0f0c29', bgSecondary: '#302b63', bgTertiary: '#24243e', canvasBg: '#0a0a1a', gridOpacity: 0.08, accent: '#00ffff', foodColor: '#ff00ff', specialFoodColor: '#ffff00' },
  forest: { bgPrimary: '#134e5e', bgSecondary: '#1e847f', bgTertiary: '#2d8769', canvasBg: '#0a2f25', gridOpacity: 0.06, accent: '#4ade80', foodColor: '#f87171', specialFoodColor: '#fbbf24' },
  ocean: { bgPrimary: '#0077b6', bgSecondary: '#00b4d8', bgTertiary: '#90e0ef', canvasBg: '#03045e', gridOpacity: 0.07, accent: '#00ff88', foodColor: '#ff6b6b', specialFoodColor: '#ffd93d' },
  sunset: { bgPrimary: '#ff6b6b', bgSecondary: '#ee5a6f', bgTertiary: '#c44569', canvasBg: '#2c1810', gridOpacity: 0.06, accent: '#ffd93d', foodColor: '#6bcb77', specialFoodColor: '#4d96ff' },
  space: { bgPrimary: '#0c0c1e', bgSecondary: '#1a1a3e', bgTertiary: '#2d2d5a', canvasBg: '#050510', gridOpacity: 0.04, accent: '#a855f7', foodColor: '#22d3ee', specialFoodColor: '#fbbf24' },
  cyberpunk: { bgPrimary: '#1a1a2e', bgSecondary: '#16162a', bgTertiary: '#0f0f1a', canvasBg: '#0d0d15', gridOpacity: 0.05, accent: '#f72585', foodColor: '#4cc9f0', specialFoodColor: '#f1fa8c' },
};

const DEFAULT_SETTINGS = {
  snakeColor: 'green',
  theme: 'dark',
  speed: 'normal',
  musicEnabled: false,
  sfxEnabled: true,
  gridEnabled: true,
  animationsEnabled: true,
};

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 6 + 3;
    this.speedX = (Math.random() - 0.5) * 10;
    this.speedY = (Math.random() - 0.5) * 10;
    this.life = 1;
    this.decay = Math.random() * 0.03 + 0.02;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
    this.size *= 0.98;
  }
  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${(1 << 24 | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const pauseIndicatorRef = useRef(null);
  const countdownRef = useRef(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    () => parseInt(localStorage.getItem('snakePremiumHighScore'), 10) || 0
  );
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('snakePremiumSettings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Mutable game state that must not trigger re-renders on every frame.
  const gameRef = useRef({
    snake: [{ x: 10, y: 10 }],
    food: {},
    specialFood: null,
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    highScore: parseInt(localStorage.getItem('snakePremiumHighScore'), 10) || 0,
    gameOver: false,
    isPaused: false,
    isRunning: false,
    isCountdown: false,
    animationId: null,
    lastUpdateTime: 0,
    particleEffects: [],
    rainbowHue: 0,
    glowIntensity: 0,
    glowIncreasing: true,
    shakeOffset: { x: 0, y: 0 },
    overlayAlpha: 0,
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
    localStorage.setItem('snakePremiumSettings', JSON.stringify(settings));
  }, [settings]);

  // Keep the theme's accent colour applied to the canvas border/glow.
  useEffect(() => {
    const theme = THEME_CONFIGS[settings.theme];
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      canvasEl.style.borderColor = theme.accent;
      canvasEl.style.boxShadow = `0 0 40px ${theme.accent}4d, inset 0 0 60px rgba(0, 0, 0, 0.5)`;
    }
  }, [settings.theme]);

  const playSound = useCallback((type) => {
    if (!settingsRef.current.sfxEnabled) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'eat') {
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'gameOver') {
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'countdown') {
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'newHighScore') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.3);
        }, i * 150);
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const game = gameRef.current;

    function createParticles(x, y, color, count = 25) {
      for (let i = 0; i < count; i++) {
        game.particleEffects.push(new Particle(x, y, color));
      }
    }

    function triggerShakeEffect() {
      let shakeCount = 0;
      const shakeInterval = setInterval(() => {
        game.shakeOffset.x = (Math.random() - 0.5) * 15;
        game.shakeOffset.y = (Math.random() - 0.5) * 15;
        shakeCount++;
        if (shakeCount >= 15) {
          clearInterval(shakeInterval);
          game.shakeOffset = { x: 0, y: 0 };
        }
      }, 50);
    }

    function generateFood() {
      let newFood;
      let onSnake;
      do {
        onSnake = false;
        newFood = {
          x: Math.floor(Math.random() * GRID_COUNT),
          y: Math.floor(Math.random() * GRID_COUNT),
          points: 10,
        };
        for (const segment of game.snake) {
          if (segment.x === newFood.x && segment.y === newFood.y) {
            onSnake = true;
            break;
          }
        }
      } while (onSnake);
      game.food = newFood;
    }

    function generateSpecialFood() {
      let newSpecial;
      let onSnake;
      do {
        onSnake = false;
        newSpecial = {
          x: Math.floor(Math.random() * GRID_COUNT),
          y: Math.floor(Math.random() * GRID_COUNT),
          points: 50,
          timer: 400,
        };
        for (const segment of game.snake) {
          if (
            (segment.x === newSpecial.x && segment.y === newSpecial.y) ||
            (newSpecial.x === game.food.x && newSpecial.y === game.food.y)
          ) {
            onSnake = true;
            break;
          }
        }
      } while (onSnake);
      game.specialFood = newSpecial;
    }

    function drawGrid() {
      if (!settingsRef.current.gridEnabled) return;
      const theme = THEME_CONFIGS[settingsRef.current.theme];
      ctx.strokeStyle = `rgba(255, 255, 255, ${theme.gridOpacity})`;
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
      }
    }

    function drawSnakeSegment(segment, primaryColor, darkColor, index, glow) {
      const gradient = ctx.createRadialGradient(
        segment.x * GRID_SIZE + GRID_SIZE / 2,
        segment.y * GRID_SIZE + GRID_SIZE / 2,
        0,
        segment.x * GRID_SIZE + GRID_SIZE / 2,
        segment.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2
      );
      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(1, darkColor);

      if (index === 0) {
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 20 + glow * 15;
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(
        segment.x * GRID_SIZE + 2,
        segment.y * GRID_SIZE + 2,
        GRID_SIZE - 4,
        GRID_SIZE - 4,
        8
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      if (index === 0) {
        const direction = game.direction;
        ctx.fillStyle = '#fff';
        const eyeSize = 5;
        if (direction === 'right') {
          ctx.beginPath();
          ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - 7, segment.y * GRID_SIZE + 8, eyeSize, 0, Math.PI * 2);
          ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - 7, segment.y * GRID_SIZE + GRID_SIZE - 8, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (direction === 'left') {
          ctx.beginPath();
          ctx.arc(segment.x * GRID_SIZE + 7, segment.y * GRID_SIZE + 8, eyeSize, 0, Math.PI * 2);
          ctx.arc(segment.x * GRID_SIZE + 7, segment.y * GRID_SIZE + GRID_SIZE - 8, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (direction === 'up') {
          ctx.beginPath();
          ctx.arc(segment.x * GRID_SIZE + 8, segment.y * GRID_SIZE + 7, eyeSize, 0, Math.PI * 2);
          ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - 8, segment.y * GRID_SIZE + 7, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (direction === 'down') {
          ctx.beginPath();
          ctx.arc(segment.x * GRID_SIZE + 8, segment.y * GRID_SIZE + GRID_SIZE - 7, eyeSize, 0, Math.PI * 2);
          ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - 8, segment.y * GRID_SIZE + GRID_SIZE - 7, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#000';
        if (direction === 'right') {
          ctx.beginPath();
          ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - 5, segment.y * GRID_SIZE + 8, 2, 0, Math.PI * 2);
          ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - 5, segment.y * GRID_SIZE + GRID_SIZE - 8, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (direction === 'left') {
          ctx.beginPath();
          ctx.arc(segment.x * GRID_SIZE + 9, segment.y * GRID_SIZE + 8, 2, 0, Math.PI * 2);
          ctx.arc(segment.x * GRID_SIZE + 9, segment.y * GRID_SIZE + GRID_SIZE - 8, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (direction === 'up') {
          ctx.beginPath();
          ctx.arc(segment.x * GRID_SIZE + 8, segment.y * GRID_SIZE + 5, 2, 0, Math.PI * 2);
          ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - 8, segment.y * GRID_SIZE + 5, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (direction === 'down') {
          ctx.beginPath();
          ctx.arc(segment.x * GRID_SIZE + 8, segment.y * GRID_SIZE + GRID_SIZE - 5, 2, 0, Math.PI * 2);
          ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - 8, segment.y * GRID_SIZE + GRID_SIZE - 5, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawSnake() {
      const settingsNow = settingsRef.current;

      if (settingsNow.snakeColor === 'rainbow') {
        game.rainbowHue += 2;
        if (game.rainbowHue >= 360) game.rainbowHue = 0;
      }

      if (game.glowIncreasing) {
        game.glowIntensity += 0.05;
        if (game.glowIntensity >= 1) game.glowIncreasing = false;
      } else {
        game.glowIntensity -= 0.05;
        if (game.glowIntensity <= 0.3) game.glowIncreasing = true;
      }

      game.snake.forEach((segment, index) => {
        if (settingsNow.snakeColor === 'rainbow') {
          const hue = (game.rainbowHue + index * 15) % 360;
          const color = `hsl(${hue}, 100%, 50%)`;
          const darkColor = `hsl(${hue}, 100%, 20%)`;
          drawSnakeSegment(segment, color, darkColor, index, game.glowIntensity);
        } else {
          const baseColors = COLOR_MAP[settingsNow.snakeColor];
          drawSnakeSegment(segment, baseColors.primary, baseColors.dark, index, game.glowIntensity);
        }
      });
    }

    function drawFood() {
      const theme = THEME_CONFIGS[settingsRef.current.theme];
      const time = Date.now() / 300;
      const pulse = Math.sin(time) * 2;

      const foodGradient = ctx.createRadialGradient(
        game.food.x * GRID_SIZE + GRID_SIZE / 2,
        game.food.y * GRID_SIZE + GRID_SIZE / 2,
        0,
        game.food.x * GRID_SIZE + GRID_SIZE / 2,
        game.food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 + pulse
      );
      foodGradient.addColorStop(0, theme.foodColor);
      foodGradient.addColorStop(1, adjustColor(theme.foodColor, -50));

      ctx.shadowColor = theme.foodColor;
      ctx.shadowBlur = 25;
      ctx.fillStyle = foodGradient;
      ctx.beginPath();
      ctx.arc(
        game.food.x * GRID_SIZE + GRID_SIZE / 2,
        game.food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      if (game.specialFood && Math.random() > 0.1) {
        const specialPulse = Math.sin(Date.now() / 150) * 4;
        const specialGradient = ctx.createRadialGradient(
          game.specialFood.x * GRID_SIZE + GRID_SIZE / 2,
          game.specialFood.y * GRID_SIZE + GRID_SIZE / 2,
          0,
          game.specialFood.x * GRID_SIZE + GRID_SIZE / 2,
          game.specialFood.y * GRID_SIZE + GRID_SIZE / 2,
          GRID_SIZE / 2 + specialPulse
        );
        specialGradient.addColorStop(0, theme.specialFoodColor);
        specialGradient.addColorStop(1, adjustColor(theme.specialFoodColor, -50));

        ctx.shadowColor = theme.specialFoodColor;
        ctx.shadowBlur = 40;
        ctx.fillStyle = specialGradient;
        ctx.beginPath();
        ctx.arc(
          game.specialFood.x * GRID_SIZE + GRID_SIZE / 2,
          game.specialFood.y * GRID_SIZE + GRID_SIZE / 2,
          GRID_SIZE / 2 - 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          '⭐',
          game.specialFood.x * GRID_SIZE + GRID_SIZE / 2,
          game.specialFood.y * GRID_SIZE + GRID_SIZE / 2 + 5
        );
      }
    }

    function drawParticles() {
      game.particleEffects = game.particleEffects.filter((p) => p.life > 0);
      game.particleEffects.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
    }

    function drawGameOverOverlay() {
      if (game.overlayAlpha < 0.85) {
        game.overlayAlpha += 0.02;
      }
      ctx.fillStyle = `rgba(0, 0, 0, ${game.overlayAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 42px "Segoe UI"';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255, 71, 87, ${game.overlayAlpha})`;
      ctx.fillText('💀 GAME OVER', canvas.width / 2, canvas.height / 2 - 70);

      ctx.font = '24px "Segoe UI"';
      ctx.fillStyle = `rgba(255, 255, 255, ${game.overlayAlpha})`;
      ctx.fillText(`Final Score: ${game.score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`High Score: ${game.highScore}`, canvas.width / 2, canvas.height / 2 + 40);

      if (game.overlayAlpha >= 0.8) {
        ctx.font = 'bold 20px "Segoe UI"';
        ctx.fillStyle = '#00ff88';
        ctx.fillText('Click to Play Again', canvas.width / 2, canvas.height / 2 + 100);
      }
    }

    function draw() {
      const theme = THEME_CONFIGS[settingsRef.current.theme];
      ctx.fillStyle = theme.canvasBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(game.shakeOffset.x, game.shakeOffset.y);

      drawGrid();
      drawSnake();
      drawFood();
      drawParticles();

      ctx.restore();

      if (game.gameOver) {
        drawGameOverOverlay();
      }
    }

    function showNewHighScore() {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }

    function update() {
      if (game.gameOver) {
        playSound('gameOver');
        const wasNewHighScore = game.score > game.highScore;
        if (wasNewHighScore) {
          game.highScore = game.score;
          setHighScore(game.highScore);
          localStorage.setItem('snakePremiumHighScore', game.highScore);
          setTimeout(() => {
            playSound('newHighScore');
            showNewHighScore();
          }, 500);
        }
        game.isRunning = false;
        return;
      }

      game.direction = game.nextDirection;
      const head = { x: game.snake[0].x, y: game.snake[0].y };

      switch (game.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
        default: break;
      }

      if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
        if (!game.gameOver) {
          game.gameOver = true;
          game.overlayAlpha = 0;
          triggerShakeEffect();
          const theme = THEME_CONFIGS[settingsRef.current.theme];
          createParticles(head.x * GRID_SIZE + GRID_SIZE / 2, head.y * GRID_SIZE + GRID_SIZE / 2, theme.foodColor, 50);
        }
        return;
      }

      for (let i = 1; i < game.snake.length; i++) {
        if (head.x === game.snake[i].x && head.y === game.snake[i].y) {
          if (!game.gameOver) {
            game.gameOver = true;
            game.overlayAlpha = 0;
            triggerShakeEffect();
            const theme = THEME_CONFIGS[settingsRef.current.theme];
            createParticles(head.x * GRID_SIZE + GRID_SIZE / 2, head.y * GRID_SIZE + GRID_SIZE / 2, theme.foodColor, 50);
          }
          return;
        }
      }

      game.snake.unshift(head);

      let ateFood = false;
      const theme = THEME_CONFIGS[settingsRef.current.theme];

      if (head.x === game.food.x && head.y === game.food.y) {
        game.score += game.food.points;
        setScore(game.score);
        playSound('eat');
        createParticles(game.food.x * GRID_SIZE + GRID_SIZE / 2, game.food.y * GRID_SIZE + GRID_SIZE / 2, theme.foodColor, 30);
        generateFood();
        ateFood = true;
      }

      if (game.specialFood && head.x === game.specialFood.x && head.y === game.specialFood.y) {
        game.score += game.specialFood.points;
        setScore(game.score);
        playSound('eat');
        createParticles(
          game.specialFood.x * GRID_SIZE + GRID_SIZE / 2,
          game.specialFood.y * GRID_SIZE + GRID_SIZE / 2,
          theme.specialFoodColor,
          60
        );
        game.specialFood = null;
        ateFood = true;
      }

      if (game.specialFood) {
        game.specialFood.timer--;
        if (game.specialFood.timer <= 0) {
          game.specialFood = null;
        }
      }

      if (!ateFood) {
        game.snake.pop();
      } else if (game.score > game.highScore) {
        game.highScore = game.score;
        setHighScore(game.highScore);
        localStorage.setItem('snakePremiumHighScore', game.highScore);
      }

      if (!game.specialFood && Math.random() < 0.008) {
        generateSpecialFood();
      }
    }

    function gameLoop(timestamp) {
      game.animationId = requestAnimationFrame(gameLoop);

      if (game.isPaused || game.isCountdown) {
        draw();
        return;
      }

      const gameSpeed = SPEED_MAP[settingsRef.current.speed];
      if (timestamp - game.lastUpdateTime >= gameSpeed) {
        game.lastUpdateTime = timestamp;
        update();
      }
      draw();
    }

    function startCountdown() {
      game.isCountdown = true;
      let count = 3;
      const countdownEl = countdownRef.current;
      countdownEl.style.display = 'block';

      const countInterval = setInterval(() => {
        playSound('countdown');
        if (count > 0) {
          countdownEl.textContent = String(count);
          countdownEl.style.animation = 'none';
          // eslint-disable-next-line no-unused-expressions
          countdownEl.offsetHeight;
          countdownEl.style.animation = 'countdown-pop 1s ease-out';
          count--;
        } else {
          countdownEl.textContent = 'GO!';
          countdownEl.style.animation = 'none';
          // eslint-disable-next-line no-unused-expressions
          countdownEl.offsetHeight;
          countdownEl.style.animation = 'countdown-pop 0.5s ease-out';
          setTimeout(() => {
            countdownEl.style.display = 'none';
            game.isCountdown = false;
            clearInterval(countInterval);
          }, 500);
        }
      }, 1000);
    }

    function resetGame() {
      game.snake = [{ x: 10, y: 10 }];
      game.direction = 'right';
      game.nextDirection = 'right';
      game.score = 0;
      game.gameOver = false;
      game.isPaused = false;
      game.isCountdown = false;
      game.specialFood = null;
      game.particleEffects = [];
      game.shakeOffset = { x: 0, y: 0 };
      game.overlayAlpha = 0;
      setScore(0);
      if (pauseIndicatorRef.current) pauseIndicatorRef.current.style.display = 'none';
      generateFood();
    }

    function startGame() {
      if (game.isRunning) return;
      resetGame();
      startCountdown();
      game.isRunning = true;
      game.lastUpdateTime = performance.now();
      if (!game.animationId) {
        game.animationId = requestAnimationFrame(gameLoop);
      }
    }

    function togglePause() {
      if (!game.isRunning || game.gameOver) return;
      game.isPaused = !game.isPaused;
      if (pauseIndicatorRef.current) {
        pauseIndicatorRef.current.style.display = game.isPaused ? 'block' : 'none';
      }
    }

    function restartGame() {
      if (game.animationId) {
        cancelAnimationFrame(game.animationId);
        game.animationId = null;
      }
      startGame();
    }

    // Expose the control functions to the component's event handlers.
    canvas.__snakeControls = { startGame, togglePause, restartGame };

    // Keyboard controls
    function handleKeydown(e) {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (game.direction !== 'down') game.nextDirection = 'up';
          e.preventDefault();
          break;
        case 'arrowdown':
        case 's':
          if (game.direction !== 'up') game.nextDirection = 'down';
          e.preventDefault();
          break;
        case 'arrowleft':
        case 'a':
          if (game.direction !== 'right') game.nextDirection = 'left';
          e.preventDefault();
          break;
        case 'arrowright':
        case 'd':
          if (game.direction !== 'left') game.nextDirection = 'right';
          e.preventDefault();
          break;
        case 'p':
          togglePause();
          break;
        case 'r':
          restartGame();
          break;
        default:
          break;
      }
    }
    document.addEventListener('keydown', handleKeydown);

    // Mobile touch controls
    let touchStartX = 0;
    let touchStartY = 0;
    function handleTouchStart(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
    function handleTouchEnd(e) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30 && game.direction !== 'left') game.nextDirection = 'right';
        else if (dx < -30 && game.direction !== 'right') game.nextDirection = 'left';
      } else if (dy > 30 && game.direction !== 'up') {
        game.nextDirection = 'down';
      } else if (dy < -30 && game.direction !== 'down') {
        game.nextDirection = 'up';
      }
    }
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);

    function handleCanvasClick() {
      if (game.gameOver && game.overlayAlpha >= 0.8) {
        resetGame();
        startGame();
      }
    }
    canvas.addEventListener('click', handleCanvasClick);

    // Initialize
    generateFood();
    const loadingTimeout = setTimeout(() => setLoading(false), 1500);
    const idleDrawInterval = setInterval(() => {
      if (!game.isRunning) draw();
    }, 1000 / 60);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('click', handleCanvasClick);
      clearTimeout(loadingTimeout);
      clearInterval(idleDrawInterval);
      if (game.animationId) cancelAnimationFrame(game.animationId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getControls = () => canvasRef.current?.__snakeControls;

  const handleStart = () => getControls()?.startGame();
  const handlePause = () => getControls()?.togglePause();
  const handleReset = () => getControls()?.restartGame();
  const handleDirection = (dir) => {
    const game = gameRef.current;
    const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (game.direction !== opposite[dir]) {
      game.nextDirection = dir;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const theme = THEME_CONFIGS[settings.theme];

  return (
    <div
      className="snake-page"
      style={{
        '--bg-primary': theme.bgPrimary,
        '--bg-secondary': theme.bgSecondary,
        '--bg-tertiary': theme.bgTertiary,
        '--accent': theme.accent,
        '--accent-glow': `${theme.accent}4d`,
      }}
    >
      {loading && (
        <div className="loading-screen">
          <div className="loader" />
          <div className="loading-text">Loading Snake Game Premium...</div>
        </div>
      )}

      {showCelebration && <div className="new-high-score">🏆 NEW HIGH SCORE! 🏆</div>}

      <div
        className={`settings-overlay ${settingsOpen ? 'open' : ''}`}
        onClick={() => setSettingsOpen(false)}
      />

      <div className={`settings-panel ${settingsOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-settings" onClick={() => setSettingsOpen(false)}>
            &times;
          </button>
        </div>

        <div className="settings-section">
          <h3>🐍 Snake Color</h3>
          <div className="color-grid">
            {Object.keys(COLOR_MAP).map((color) => (
              <button
                key={color}
                className={`color-btn ${settings.snakeColor === color ? 'active' : ''}`}
                style={{
                  background:
                    color === 'rainbow'
                      ? 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)'
                      : COLOR_MAP[color].primary,
                }}
                onClick={() => updateSetting('snakeColor', color)}
              />
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>🎨 Theme</h3>
          <div className="theme-grid">
            {Object.keys(THEME_CONFIGS).map((themeName) => (
              <button
                key={themeName}
                className={`theme-btn ${settings.theme === themeName ? 'active' : ''}`}
                style={{ background: THEME_CONFIGS[themeName].bgPrimary }}
                onClick={() => updateSetting('theme', themeName)}
              />
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>⚡ Speed</h3>
          <div className="speed-options">
            {Object.keys(SPEED_MAP).map((speedName) => (
              <button
                key={speedName}
                className={`option-btn ${settings.speed === speedName ? 'active' : ''}`}
                onClick={() => updateSetting('speed', speedName)}
              >
                {speedName.charAt(0).toUpperCase() + speedName.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>🔊 Sound</h3>
          <div className="toggle-row">
            <span>Music</span>
            <div
              className={`toggle-switch ${settings.musicEnabled ? 'active' : ''}`}
              onClick={() => updateSetting('musicEnabled', !settings.musicEnabled)}
            />
          </div>
          <div className="toggle-row">
            <span>Sound Effects</span>
            <div
              className={`toggle-switch ${settings.sfxEnabled ? 'active' : ''}`}
              onClick={() => updateSetting('sfxEnabled', !settings.sfxEnabled)}
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>📐 Display</h3>
          <div className="toggle-row">
            <span>Show Grid</span>
            <div
              className={`toggle-switch ${settings.gridEnabled ? 'active' : ''}`}
              onClick={() => updateSetting('gridEnabled', !settings.gridEnabled)}
            />
          </div>
          <div className="toggle-row">
            <span>Animations</span>
            <div
              className={`toggle-switch ${settings.animationsEnabled ? 'active' : ''}`}
              onClick={() => updateSetting('animationsEnabled', !settings.animationsEnabled)}
            />
          </div>
        </div>
      </div>

      <div className="game-container">
        <h1>🐍 Snake Game Premium</h1>
        <div className="game-buttons-top">
          <button className="btn btn-icon btn-secondary" onClick={() => setSettingsOpen(true)}>
            ⚙️
          </button>
          <button className="btn btn-icon btn-secondary" onClick={toggleFullscreen}>
            ⛶
          </button>
        </div>
        <div className="stats">
          <div className="stat-box">
            <div className="stat-label">Current Score</div>
            <div className="stat-value">{score}</div>
          </div>
          <div className="stat-box" id="high-score">
            <div className="stat-label">High Score</div>
            <div className="stat-value">{highScore}</div>
          </div>
        </div>
        <div className="current-stats">
          <span className="current-stat">
            Theme: <span>{settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}</span>
          </span>
          <span className="current-stat">
            Color:{' '}
            <span>{settings.snakeColor.charAt(0).toUpperCase() + settings.snakeColor.slice(1)}</span>
          </span>
          <span className="current-stat">
            Speed: <span>{settings.speed.charAt(0).toUpperCase() + settings.speed.slice(1)}</span>
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <canvas ref={canvasRef} width={CANVAS_DIM} height={CANVAS_DIM} />
          <div className="pause-indicator" ref={pauseIndicatorRef}>
            ⏸️ PAUSED
          </div>
          <div className="countdown-overlay" ref={countdownRef}>
            3
          </div>
        </div>
        <div className="game-buttons">
          <button className="btn btn-primary" onClick={handleStart}>
            Start Game
          </button>
          <button className="btn btn-secondary" onClick={handlePause}>
            Pause
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>
        <div className="controls-info">
          <p>⌨️ Desktop Controls</p>
          <div className="keys">
            <span className="key">↑ W</span>
            <span className="key">↓ S</span>
            <span className="key">← A</span>
            <span className="key">→ D</span>
            <span className="key">P Pause</span>
            <span className="key">R Restart</span>
          </div>
        </div>
        <div className="mobile-controls">
          <button className="mobile-btn" onClick={() => handleDirection('up')}>
            ↑
          </button>
          <div className="mobile-btn-row">
            <button className="mobile-btn" onClick={() => handleDirection('left')}>
              ←
            </button>
            <button className="mobile-btn" onClick={() => handleDirection('down')}>
              ↓
            </button>
            <button className="mobile-btn" onClick={() => handleDirection('right')}>
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
