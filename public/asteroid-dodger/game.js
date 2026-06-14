/* ==========================================================================
   ALTAIR ARCADE - Space Dodger Game Engine
   ========================================================================== */

// Coordinate readout simulator for header
const coordDisplay = document.getElementById('coord-readout-hud');
if (coordDisplay) {
  setInterval(() => {
    const x = (Math.random() * 1000).toFixed(2);
    const y = (Math.random() * 1000).toFixed(2);
    coordDisplay.innerText = `X: ${x} | Y: ${y}`;
  }, 2500);
}

// Generate stars for the space background room scene
function createStars() {
  const scene = document.getElementById('space-scene');
  if (!scene) return;
  const starCount = 60;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.width = star.style.height = `${Math.random() * 3}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    star.style.opacity = Math.random();
    scene.appendChild(star);
  }
}
createStars();

/* ==========================================================================
   Pixel Art Sprite Matrices
   ========================================================================== */

// Ship Color Mapping:
// 1 = Starlight White (#E1F5FE), 2 = Neon Cyan (#00F0FF), 3 = Cyber Purple (#BC00FF), 4 = Hazard Orange (#FF8A00)
const SHIP_SPRITE = [
  [0,0,0,0,0,1,1,0,0,0,0,0],
  [0,0,0,0,1,2,2,1,0,0,0,0],
  [0,0,0,1,1,2,2,1,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,2,2,1,1,1,0,0],
  [0,0,1,1,3,2,2,3,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,4,1,1,1,1,4,1,1,1],
  [1,1,4,4,2,2,2,2,4,4,1,1],
  [1,4,4,0,2,0,0,2,0,4,4,1],
  [1,4,0,0,3,0,0,3,0,0,4,1],
  [1,0,0,0,3,0,0,3,0,0,0,1]
];

const THRUST_FLAME_1 = [
  [0,0,0,0,4,0,0,4,0,0,0,0],
  [0,0,0,4,4,0,0,4,4,0,0,0]
];

const THRUST_FLAME_2 = [
  [0,0,0,4,4,0,0,4,4,0,0,0],
  [0,0,0,0,4,0,0,4,0,0,0,0]
];

// Asteroid Color Mappings:
// 1 = Outer outline (#849495), 2 = Surface body (#323539), 3 = Core/Crater shading (#1d2023 or Cyber Purple #BC00FF for alien feel)
// HP 3 (Large)
const ASTEROID_LARGE_SPRITE = [
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,2,2,2,2,1,1,0,0],
  [0,1,1,2,2,3,3,2,2,1,1,0],
  [1,1,2,2,3,3,3,3,2,2,1,1],
  [1,2,2,3,3,2,2,3,3,2,2,1],
  [1,2,3,3,2,2,2,2,3,3,2,1],
  [1,2,3,3,2,2,2,2,3,3,2,1],
  [1,2,2,3,3,3,3,3,3,2,2,1],
  [1,1,2,2,2,2,2,2,2,2,1,1],
  [0,1,1,2,2,2,2,2,2,1,1,0],
  [0,0,1,1,2,2,2,2,1,1,0,0],
  [0,0,0,1,1,1,1,1,1,0,0,0]
];

// HP 2 (Medium)
const ASTEROID_MEDIUM_SPRITE = [
  [0,0,1,1,1,1,0,0],
  [0,1,1,2,2,1,1,0],
  [1,1,2,2,3,2,1,1],
  [1,2,2,3,3,2,2,1],
  [1,2,3,3,2,2,2,1],
  [1,1,2,2,2,2,1,1],
  [0,1,1,2,2,1,1,0],
  [0,0,1,1,1,1,0,0]
];

// HP 1 (Small)
const ASTEROID_SMALL_SPRITE = [
  [0,1,1,1,1,0],
  [1,1,2,2,1,1],
  [1,2,3,2,2,1],
  [1,2,2,2,2,1],
  [1,1,2,2,1,1],
  [0,1,1,1,1,0]
];

// Draw matrix helper
function drawPixelSprite(ctx, matrix, x, y, size, colors, angle = 0) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const pixelSize = size / Math.max(rows, cols);
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.translate(-size / 2, -size / 2);
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = matrix[r][c];
      if (val !== 0) {
        ctx.fillStyle = colors[val];
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize + 0.4, pixelSize + 0.4);
      }
    }
  }
  ctx.restore();
}

/* ==========================================================================
   Game Class Definition
   ========================================================================== */

class SpaceDodgerGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Virtual resolution (game coordinates)
    this.width = 400;
    this.height = 500;

    // Entities
    this.player = null;
    this.asteroids = [];
    this.lasers = [];
    this.particles = [];
    this.stars = []; // Game background scrolling stars

    // Inputs
    this.keys = {};

    // Game state
    this.state = 'MENU'; // MENU, PLAYING, GAMEOVER, PAUSED
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('altair_arcade_hiscore')) || 0;
    this.totalHits = 0;
    this.level = 1;
    this.combo = 0;
    this.multiplier = 1.0;

    // Difficulty Settings
    this.spawnTimer = 0;
    this.baseSpawnInterval = 1600; // ms
    this.asteroidSpeedMult = 1.0;

    // Hardware element selectors
    this.joystick = document.getElementById('cabinet-joystick');
    this.btnMenu = document.getElementById('btn-menu-hw');
    this.btnStart = document.getElementById('btn-start-hw');
    this.btnShoot = document.getElementById('btn-shoot-hw');
    this.btnAudio = document.getElementById('btn-audio-hw');

    // Stats elements selectors
    this.hudHiScore = document.getElementById('hud-hi-score');
    this.hudTotalHits = document.getElementById('hud-total-hits');
    this.hudXpDisplay = document.getElementById('hud-xp-display');
    this.hudTemp = document.getElementById('hud-temp');

    // Setup listeners
    this.initListeners();
    this.initStars();

    // Initial HUD update
    this.updateHUDValues();

    // Start loop
    this.lastTime = 0;
    requestAnimationFrame((t) => this.loop(t));
  }

  // Update Left Sidebar Values
  updateHUDValues() {
    if (this.hudHiScore) this.hudHiScore.innerText = String(this.highScore).padStart(5, '0');
    if (this.hudTotalHits) this.hudTotalHits.innerText = String(this.totalHits);

    // Render start screen records
    document.getElementById('high-score-val').innerText = String(this.highScore).padStart(5, '0');
    document.getElementById('record-score-val').innerText = String(this.highScore).padStart(5, '0');

    // Update local rank score on leaderboard
    const localScore = document.getElementById('local-rank-score');
    if (localScore) localScore.innerText = String(this.highScore).padStart(5, '0');
  }

  // Setup parallax starfield inside Canvas
  initStars() {
    this.stars = [];
    const layers = [
      { count: 25, speed: 0.4, size: 1, color: '#4c556b' },
      { count: 15, speed: 0.8, size: 1.5, color: '#a0aecd' },
      { count: 8, speed: 1.5, size: 2, color: '#00F0FF' }
    ];
    layers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          speed: layer.speed,
          size: layer.size,
          color: layer.color
        });
      }
    });
  }

  // Bind Keyboard & virtual panel components
  initListeners() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;

      // Prevent browser default scrolling for gaming keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'a', 'd', 's', 'w'].includes(e.key)) {
        e.preventDefault();
      }

      // Visual cabinet hardware animation mappings
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        this.joystick.classList.add('tilt-left');
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        this.joystick.classList.add('tilt-right');
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        this.btnShoot.classList.add('pressed');
        if (this.state === 'PLAYING') this.playerShoot();
      }

      // Menu (Escape or P)
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        this.btnMenu.classList.add('pressed');
        this.togglePause();
      }

      // Start (Enter)
      if (e.key === 'Enter') {
        this.btnStart.classList.add('pressed');
        this.triggerStartAction();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        this.joystick.classList.remove('tilt-left');
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        this.joystick.classList.remove('tilt-right');
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        this.btnShoot.classList.remove('pressed');
      }
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        this.btnMenu.classList.remove('pressed');
      }
      if (e.key === 'Enter') {
        this.btnStart.classList.remove('pressed');
      }
    });

    // Virtual Joystick Mouse / Touch bindings
    let isDraggingJoystick = false;
    const handleJoystickMove = (clientX) => {
      const rect = this.joystick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const deltaX = clientX - centerX;

      if (deltaX < -15) {
        this.keys['ArrowLeft'] = true;
        this.keys['ArrowRight'] = false;
        this.joystick.className = 'joystick-base tilt-left';
      } else if (deltaX > 15) {
        this.keys['ArrowRight'] = true;
        this.keys['ArrowLeft'] = false;
        this.joystick.className = 'joystick-base tilt-right';
      } else {
        this.keys['ArrowLeft'] = false;
        this.keys['ArrowRight'] = false;
        this.joystick.className = 'joystick-base';
      }
    };

    const stopJoystickMove = () => {
      isDraggingJoystick = false;
      this.keys['ArrowLeft'] = false;
      this.keys['ArrowRight'] = false;
      this.joystick.className = 'joystick-base';
    };

    this.joystick.addEventListener('mousedown', (e) => {
      isDraggingJoystick = true;
      handleJoystickMove(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingJoystick) handleJoystickMove(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      if (isDraggingJoystick) stopJoystickMove();
    });

    // Touch support for Joystick
    this.joystick.addEventListener('touchstart', (e) => {
      isDraggingJoystick = true;
      handleJoystickMove(e.touches[0].clientX);
      e.preventDefault();
    });

    this.joystick.addEventListener('touchmove', (e) => {
      if (isDraggingJoystick) {
        handleJoystickMove(e.touches[0].clientX);
        e.preventDefault();
      }
    });

    this.joystick.addEventListener('touchend', () => {
      stopJoystickMove();
    });

    // Action button bindings
    // MENU / PAUSE
    this.btnMenu.addEventListener('click', () => {
      this.btnMenu.classList.add('pressed');
      setTimeout(() => this.btnMenu.classList.remove('pressed'), 100);
      this.togglePause();
    });

    // START
    this.btnStart.addEventListener('click', () => {
      this.btnStart.classList.add('pressed');
      setTimeout(() => this.btnStart.classList.remove('pressed'), 100);
      this.triggerStartAction();
    });

    // SHOOT
    this.btnShoot.addEventListener('click', () => {
      this.btnShoot.classList.add('pressed');
      setTimeout(() => this.btnShoot.classList.remove('pressed'), 100);
      if (this.state === 'PLAYING') this.playerShoot();
    });

    // AUDIO MUTE TOGGLE
    const toggleAudioFunc = () => {
      this.btnAudio.classList.add('pressed');
      setTimeout(() => this.btnAudio.classList.remove('pressed'), 100);
      const isMuted = window.gameAudio.toggleMute();
      this.updateAudioButtonsVisual(isMuted);
    };

    this.btnAudio.addEventListener('click', toggleAudioFunc);

    const globalMuteBtn = document.getElementById('global-mute-btn');
    if (globalMuteBtn) {
      globalMuteBtn.addEventListener('click', toggleAudioFunc);
    }

    // Start screen overlays triggers
    document.getElementById('start-game-btn').addEventListener('click', () => {
      window.gameAudio.playCoin();
      setTimeout(() => this.startGame(), 250);
    });

    document.getElementById('restart-game-btn').addEventListener('click', () => {
      window.gameAudio.playCoin();
      setTimeout(() => this.startGame(), 250);
    });

    document.getElementById('resume-game-btn').addEventListener('click', () => {
      this.togglePause();
    });

    // Insert Coin Trigger on Slot click
    const coinSlot = document.getElementById('coin-slot-trigger');
    if (coinSlot) {
      coinSlot.addEventListener('click', () => {
        window.gameAudio.playCoin();
        if (this.state === 'MENU' || this.state === 'GAMEOVER') {
          setTimeout(() => this.startGame(), 250);
        }
      });
    }
  }

  // Update Sound / Mute icons visually
  updateAudioButtonsVisual(isMuted) {
    const icon = document.getElementById('mute-icon');
    if (icon) {
      icon.innerText = isMuted ? 'volume_off' : 'volume_up';
    }
    if (isMuted) {
      this.btnAudio.classList.add('btn-disabled');
    } else {
      this.btnAudio.classList.remove('btn-disabled');
    }
  }

  triggerStartAction() {
    if (this.state === 'MENU' || this.state === 'GAMEOVER') {
      window.gameAudio.playCoin();
      setTimeout(() => this.startGame(), 250);
    } else if (this.state === 'PAUSED') {
      this.togglePause();
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pause-overlay').classList.remove('hidden');
      window.gameAudio.stopMusic();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pause-overlay').classList.add('hidden');
      window.gameAudio.startMusic();
    }
  }

  startGame() {
    this.state = 'PLAYING';

    // Reset core stats
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.multiplier = 1.0;
    this.asteroidSpeedMult = 1.0;
    this.baseSpawnInterval = 1600;

    // Clean lists
    this.asteroids = [];
    this.lasers = [];
    this.particles = [];

    // Initialize pilot ship
    this.player = new Spaceship(this.width / 2, this.height - 50);

    // Hide all panels/overlays
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');

    // Start music loop
    window.gameAudio.startMusic();
    this.updateHUDValues();
  }

  gameOver() {
    this.state = 'GAMEOVER';
    window.gameAudio.playGameOver();
    window.gameAudio.stopMusic();

    // Save record scores
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('altair_arcade_hiscore', this.highScore);
    }

    this.updateHUDValues();

    // Show Screen Overlay
    document.getElementById('final-score-val').innerText = String(this.score);
    document.getElementById('gameover-overlay').classList.remove('hidden');
  }

  playerShoot() {
    if (!this.player || this.player.isDestroyed) return;

    const now = performance.now();
    if (now - this.player.lastShootTime > this.player.shootCooldown) {
      // Fire single center laser, or dual lasers
      const l1 = new Laser(this.player.x - 8, this.player.y - 12);
      const l2 = new Laser(this.player.x + 8, this.player.y - 12);

      this.lasers.push(l1, l2);
      this.player.lastShootTime = now;

      window.gameAudio.playLaser();
    }
  }

  /* ==========================================================================
     Game Loop & Core Updates
     ========================================================================== */

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // caps dt to avoid huge jumps
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // Parallax background scrolling stars
    this.stars.forEach(star => {
      star.y += star.speed * (this.state === 'PLAYING' ? 1.5 : 0.5);
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    });

    if (this.state !== 'PLAYING') {
      // Keep running particle actions on screens
      this.particles.forEach(p => p.update(dt));
      this.particles = this.particles.filter(p => !p.isDead);
      return;
    }

    // Time-based difficulty speed increaser: speed up bit by bit over time
    this.asteroidSpeedMult += 0.005 * dt; // speed increases by 0.5% per second
    if (this.asteroidSpeedMult > 2.8) {
      this.asteroidSpeedMult = 2.8; // maximum speed multiplier limit
    }

    // Dynamic reactor temperature readout update based on current speed multiplier
    if (this.hudTemp) {
      const temp = 300 + (this.asteroidSpeedMult - 1.0) * 100;
      this.hudTemp.innerText = `${temp.toFixed(1)} K`;
      if (temp > 420) {
        this.hudTemp.className = "text-error animate-pulse font-bold";
      } else if (temp > 360) {
        this.hudTemp.className = "text-hazard-orange animate-pulse font-bold";
      } else {
        this.hudTemp.className = "text-neon-cyan animate-pulse";
      }
    }

    // 1. Spawning Asteroids (spawn frequency increases as speed multiplier increases)
    this.spawnTimer += dt * 1000;
    const currentInterval = Math.max(
      this.baseSpawnInterval / this.asteroidSpeedMult,
      450
    );
    if (this.spawnTimer >= currentInterval) {
      this.spawnAsteroid();
      this.spawnTimer = 0;
    }

    // 2. Spaceship steering logic (Accelerate / Decelerate smoothly, speed scales with difficulty multiplier)
    let steerDir = 0;
    if (this.keys['ArrowLeft'] || this.keys['a']) steerDir = -1;
    if (this.keys['ArrowRight'] || this.keys['d']) steerDir = 1;
    this.player.steer(steerDir, dt, this.asteroidSpeedMult);
    this.player.update(dt, this.width);

    // Thruster visual particle emission
    if (Math.random() < 0.35) {
      this.particles.push(new Particle(
        this.player.x,
        this.player.y + 12,
        (Math.random() - 0.5) * 15,
        50 + Math.random() * 50,
        '#00F0FF',
        0.35
      ));
    }

    // 3. Update Projectiles (lasers)
    this.lasers.forEach(laser => laser.update(dt));
    this.lasers = this.lasers.filter(laser => !laser.outOfBounds);

    // 4. Update Asteroids
    this.asteroids.forEach(asteroid => {
      asteroid.update(dt);

      // Let special zig zag asteroids drift back and forth
      if (asteroid.type === 'zigzag') {
        asteroid.x += Math.sin(asteroid.y / 20) * 1.5;
        // Clamp boundaries
        if (asteroid.x < 15) asteroid.x = 15;
        if (asteroid.x > this.width - 15) asteroid.x = this.width - 15;
      }
    });

    // Filter out missed asteroids that went off-screen
    const initialCount = this.asteroids.length;
    this.asteroids = this.asteroids.filter(ast => !ast.outOfBounds(this.height));
    const missedCount = initialCount - this.asteroids.length;
    if (missedCount > 0) {
      // Break combo when asteroid passes unpunished
      this.combo = 0;
      this.multiplier = 1.0;
    }

    // 5. Update Particles
    this.particles.forEach(p => p.update(dt));
    this.particles = this.particles.filter(p => !p.isDead);

    // 6. Collision Checking
    this.checkCollisions();
  }

  spawnAsteroid() {
    const sizeRoll = Math.random();
    let sizeClass = 'large';
    let size = 26;
    let hp = 3;

    if (sizeRoll > 0.7) {
      sizeClass = 'small';
      size = 13;
      hp = 1;
    } else if (sizeRoll > 0.45) {
      sizeClass = 'medium';
      size = 18;
      hp = 2;
    }

    // Side-drifting or zig zag asteroids introduce at level 2+
    let type = 'normal';
    if (this.level >= 2 && Math.random() < 0.25) {
      type = 'zigzag';
    }

    const x = Math.random() * (this.width - size * 2) + size;
    const y = -size - 10;

    // Speeds scale with size (smaller is faster)
    const baseSpeed = sizeClass === 'small' ? 140 : (sizeClass === 'medium' ? 95 : 65);
    const speed = baseSpeed * this.asteroidSpeedMult * (0.85 + Math.random() * 0.3);

    const ast = new Asteroid(x, y, size, hp, speed, sizeClass, type);
    this.asteroids.push(ast);
  }

  // Draw core elements onto screen
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw Parallax Star Field
    this.stars.forEach(star => {
      this.ctx.fillStyle = star.color;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw Lasers
    this.lasers.forEach(laser => laser.draw(this.ctx));

    // Draw Particles
    this.particles.forEach(p => p.draw(this.ctx));

    // Draw Spaceship Player
    if (this.player && !this.player.isDestroyed) {
      this.player.draw(this.ctx);
    }

    // Draw Asteroids
    this.asteroids.forEach(ast => ast.draw(this.ctx));

    // Draw On-Screen Canvas HUD (Score, Level, Combo)
    if (this.state === 'PLAYING' || this.state === 'PAUSED') {
      this.drawCanvasHUD();
    }
  }

  drawCanvasHUD() {
    this.ctx.save();
    this.ctx.font = "8px 'Press Start 2P', cursive";
    
    // 1. Render Score
    this.ctx.fillStyle = "#E1F5FE";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`SCORE:${String(this.score).padStart(5, '0')}`, 12, 22);

    // 2. Combo & Multiplier
    if (this.combo > 0) {
      this.ctx.fillStyle = "#00F0FF";
      this.ctx.fillText(`MULT:x${this.multiplier.toFixed(1)}`, 12, 36);
    }

    // 3. Level Banner
    this.ctx.textAlign = "right";
    this.ctx.fillStyle = "#FF8A00";
    this.ctx.fillText(`L:${this.level}`, this.width - 12, 22);

    // 4. Lives / Shields visual dots
    this.ctx.fillStyle = "#E1F5FE";
    this.ctx.fillText("SHIELD:", this.width - 66, 36);

    const shieldColors = ["#ffb4ab", "#FF8A00", "#00F0FF"];
    const shieldColor = shieldColors[this.player.lives - 1] || "#00F0FF";
    this.ctx.fillStyle = shieldColor;
    for (let i = 0; i < this.player.lives; i++) {
      this.ctx.fillRect(this.width - 55 + (i * 12), 29, 8, 8);
    }
    this.ctx.restore();
  }

  checkCollisions() {
    // 1. Lasers hitting Asteroids
    for (let l = this.lasers.length - 1; l >= 0; l--) {
      const laser = this.lasers[l];

      for (let a = this.asteroids.length - 1; a >= 0; a--) {
        const asteroid = this.asteroids[a];

        // Calculate circle distance
        const dx = laser.x - asteroid.x;
        const dy = laser.y - asteroid.y;
        const dist = Math.hypot(dx, dy);

        if (dist < asteroid.size + 4) {
          // Collision confirmed!
          this.lasers.splice(l, 1);

          asteroid.hp--;
          this.totalHits++;
          this.updateHUDValues();

          // Generate sparks
          this.spawnSparks(laser.x, laser.y, '#00F0FF', 8);

          if (asteroid.hp <= 0) {
            // Explode asteroid!
            this.explodeAsteroid(asteroid);
            this.asteroids.splice(a, 1);
          } else {
            window.gameAudio.playHit();
          }
          break; // break inner loop, laser consumed
        }
      }
    }

    // 2. Spaceship colliding with Asteroids
    if (!this.player || this.player.isDestroyed) return;

    for (let a = this.asteroids.length - 1; a >= 0; a--) {
      const asteroid = this.asteroids[a];
      const dx = this.player.x - asteroid.x;
      const dy = this.player.y - asteroid.y;
      const dist = Math.hypot(dx, dy);

      if (dist < asteroid.size + 14) {
        // Impact!
        this.asteroids.splice(a, 1);
        this.playerHit();
        break;
      }
    }
  }

  playerHit() {
    this.player.lives--;
    this.combo = 0;
    this.multiplier = 1.0;

    // Physical console feedback (shake CRT monitor)
    const bezel = document.getElementById('crt-wrapper');
    bezel.classList.remove('screen-shake');
    void bezel.offsetWidth; // trigger reflow
    bezel.classList.add('screen-shake');

    window.gameAudio.playHit();
    this.spawnSparks(this.player.x, this.player.y, '#FFb4ab', 24);

    if (this.player.lives <= 0) {
      this.player.isDestroyed = true;
      this.gameOver();
    }
  }

  explodeAsteroid(asteroid) {
    window.gameAudio.playExplosion();

    // Particle blast (colored debris based on class size)
    const color = asteroid.sizeClass === 'small' ? '#d9e2ff' : (asteroid.sizeClass === 'medium' ? '#ebb2ff' : '#ebb2ff');
    this.spawnSparks(asteroid.x, asteroid.y, color, asteroid.size * 1.5);

    // Add points based on type
    let pointVal = 100;
    if (asteroid.sizeClass === 'medium') pointVal = 200;
    if (asteroid.sizeClass === 'small') pointVal = 300;

    // Apply score additions
    const earnedScore = Math.floor(pointVal * this.multiplier);
    this.score += earnedScore;

    // Combo ramping
    this.combo++;
    this.multiplier = 1.0 + (this.combo * 0.05);
    if (this.multiplier > 5.0) this.multiplier = 5.0; // limit combo multiplier to 5x

    // Dynamic difficulty level checking
    const nextLevel = Math.floor(this.score / 1500) + 1;
    if (nextLevel > this.level) {
      this.level = nextLevel;
      window.gameAudio.playLevelUp();
      // Level up adds a one-time speed boost, capped at the max limit
      this.asteroidSpeedMult = Math.min(this.asteroidSpeedMult + 0.15, 2.8);
    }

    // Splitting logic for large/medium asteroids
    if (asteroid.sizeClass === 'large') {
      const leftAst = new Asteroid(asteroid.x - 10, asteroid.y, 18, 2, asteroid.speed * 1.15, 'medium', 'normal');
      const rightAst = new Asteroid(asteroid.x + 10, asteroid.y, 18, 2, asteroid.speed * 1.15, 'medium', 'normal');
      // Set slight diagonal velocities
      leftAst.vx = -25;
      rightAst.vx = 25;
      this.asteroids.push(leftAst, rightAst);
    } else if (asteroid.sizeClass === 'medium') {
      const leftAst = new Asteroid(asteroid.x - 6, asteroid.y, 13, 1, asteroid.speed * 1.25, 'small', 'normal');
      const rightAst = new Asteroid(asteroid.x + 6, asteroid.y, 13, 1, asteroid.speed * 1.25, 'small', 'normal');
      leftAst.vx = -40;
      rightAst.vx = 40;
      this.asteroids.push(leftAst, rightAst);
    }
  }

  spawnSparks(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 140;
      const vy = (Math.random() - 0.5) * 140;
      const lifetime = 0.4 + Math.random() * 0.4;
      this.particles.push(new Particle(x, y, vx, vy, color, lifetime));
    }
  }
}

/* ==========================================================================
   Spaceship Sprite Component
   ========================================================================== */

class Spaceship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 28; // Draw diameter

    this.vx = 0;
    this.maxSpeed = 260; // Smooth pixel speed per sec
    this.accel = 1600;
    this.friction = 0.92;
    this.radius = 12; // Circle impact hit radius

    this.lives = 3;
    this.isDestroyed = false;
    this.lastShootTime = 0;
    this.shootCooldown = 220; // ms
    
    // Animation frame timer for thrusters
    this.flameToggle = false;
    this.flameTimer = 0;
  }

  steer(dir, dt, speedMult = 1.0) {
    // Ship's acceleration and max speed scale proportionally to reaction requirements
    const currentAccel = this.accel * (1.0 + (speedMult - 1.0) * 0.5);
    const currentMaxSpeed = this.maxSpeed * (1.0 + (speedMult - 1.0) * 0.5);

    if (dir !== 0) {
      this.vx += dir * currentAccel * dt;
    } else {
      this.vx *= this.friction; // Glide decelerate
    }

    // Clamp velocities
    if (this.vx > currentMaxSpeed) this.vx = currentMaxSpeed;
    if (this.vx < -currentMaxSpeed) this.vx = -currentMaxSpeed;
  }

  update(dt, screenWidth) {
    this.x += this.vx * dt;

    // Bound clamps
    const padding = 16;
    if (this.x < padding) {
      this.x = padding;
      this.vx = 0;
    }
    if (this.x > screenWidth - padding) {
      this.x = screenWidth - padding;
      this.vx = 0;
    }

    // Flicker flame
    this.flameTimer += dt;
    if (this.flameTimer > 0.08) {
      this.flameToggle = !this.flameToggle;
      this.flameTimer = 0;
    }
  }

  draw(ctx) {
    const colors = {
      1: '#E1F5FE', // starlight-white
      2: '#00F0FF', // neon-cyan
      3: '#BC00FF', // cyber-purple
      4: '#FF8A00'  // hazard-orange
    };

    // Draw active engine fire thruster matrix
    if (this.flameToggle) {
      drawPixelSprite(ctx, THRUST_FLAME_1, this.x, this.y + 11, 28, colors, 0);
    } else {
      drawPixelSprite(ctx, THRUST_FLAME_2, this.x, this.y + 11, 28, colors, 0);
    }

    // Draw ship pixel art sprite matrix
    drawPixelSprite(ctx, SHIP_SPRITE, this.x, this.y, 28, colors, 0);
  }
}

/* ==========================================================================
   Laser Bullet Component
   ========================================================================== */

class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 480; // pixels per sec
  }

  update(dt) {
    this.y -= this.speed * dt;
  }

  get outOfBounds() {
    return this.y < -20;
  }

  draw(ctx) {
    ctx.save();
    // Retro blocky dual colored beam
    ctx.fillStyle = '#00F0FF';
    ctx.fillRect(Math.floor(this.x - 2), Math.floor(this.y - 6), 4, 12);
    ctx.fillStyle = '#E1F5FE';
    ctx.fillRect(Math.floor(this.x - 1), Math.floor(this.y - 4), 2, 8);
    ctx.restore();
  }
}

/* ==========================================================================
   Asteroid Hazard Component
   ========================================================================== */

class Asteroid {
  constructor(x, y, size, hp, speed, sizeClass, type = 'normal') {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.size = size;
    this.hp = hp;
    this.speed = speed;
    this.sizeClass = sizeClass;
    this.type = type;
    
    // Choose matrix based on size
    if (sizeClass === 'large') {
      this.matrix = ASTEROID_LARGE_SPRITE;
    } else if (sizeClass === 'medium') {
      this.matrix = ASTEROID_MEDIUM_SPRITE;
    } else {
      this.matrix = ASTEROID_SMALL_SPRITE;
    }

    // Rotation
    this.angle = 0;
    this.rotSpeed = (Math.random() - 0.5) * 1.5;
  }

  update(dt) {
    this.y += this.speed * dt;
    this.x += this.vx * dt;
    this.angle += this.rotSpeed * dt;
  }

  outOfBounds(screenHeight) {
    return this.y > screenHeight + this.size + 10;
  }

  draw(ctx) {
    const colors = {
      1: '#849495', // outline
      2: '#323539', // surface body
      3: this.hp === 3 ? '#191c1f' : (this.hp === 2 ? '#ebb2ff' : '#ffb4ab') // craters/damage colors
    };

    // Draw pixel sprite representing jagged rotating rock
    drawPixelSprite(ctx, this.matrix, this.x, this.y, this.size * 2, colors, this.angle);
  }
}

/* ==========================================================================
   Visual Particle Component
   ========================================================================== */

class Particle {
  constructor(x, y, vx, vy, color, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;

    this.initialLife = lifetime;
    this.life = lifetime;
    this.size = 2 + Math.floor(Math.random() * 2); // Blocky particle sizes
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  get isDead() {
    return this.life <= 0;
  }

  draw(ctx) {
    ctx.save();
    const ratio = this.life / this.initialLife;
    ctx.globalAlpha = ratio;
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
    ctx.restore();
  }
}

// Initialise the game client-side
window.addEventListener('DOMContentLoaded', () => {
  const game = new SpaceDodgerGame();
  window.spaceDodgerInstance = game;
});
