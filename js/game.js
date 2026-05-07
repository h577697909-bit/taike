(function () {


  const SKINS = {
    classic: { label: 'Classic', primary: '#22c55e', dark: '#15803d', accent: '#d9f99d', glow: '#67e8f9', effect: 'clean' },
    crimson: { label: 'Crimson Raider', primary: '#ef4444', dark: '#991b1b', accent: '#fecaca', glow: '#fb7185', effect: 'ember' },
    frost: { label: 'Frost Breaker', primary: '#38bdf8', dark: '#0f766e', accent: '#cffafe', glow: '#67e8f9', effect: 'frost' },
    royal: { label: 'Royal Vanguard', primary: '#8b5cf6', dark: '#5b21b6', accent: '#ede9fe', glow: '#c4b5fd', effect: 'pulse' },
    obsidian: { label: 'Obsidian Phantom', primary: '#334155', dark: '#020617', accent: '#e2e8f0', glow: '#94a3b8', effect: 'shadow' },
    aurora: { label: 'Aurora Overdrive', primary: '#06b6d4', dark: '#164e63', accent: '#67e8f9', glow: '#2dd4bf', effect: 'aurora' }
  };

  const BOSS_ROSTER = [
    { key: 'overlord', label: 'Overlord Mk-II', hp: 320, speed: 0.84, color: '#f97316', glow: '#fdba74', cooldown: 920, score: 1800, spread: 3 },
    { key: 'hydra', label: 'Hydra Siege', hp: 388, speed: 0.88, color: '#fb7185', glow: '#fda4af', cooldown: 860, score: 2200, spread: 5 },
    { key: 'titan', label: 'Titan Core', hp: 460, speed: 0.8, color: '#a78bfa', glow: '#c4b5fd', cooldown: 820, score: 2600, spread: 5 }
  ];

  const GAME_STATES = Object.freeze({ BOOT: 'boot', READY: 'ready', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover' });

  const WEAPON_CONFIG = {
    cannon: { key: 'cannon', label: 'Cannon', cooldown: 210, damage: 18, bulletSpeed: 10.8, bulletSize: 8, spread: 0, projectiles: 1, shake: 2.8, sound: 'shoot', pierce: 1 },
    burst: { key: 'burst', label: 'Burst', cooldown: 270, damage: 12, bulletSpeed: 10.4, bulletSize: 7, spread: 0.18, projectiles: 3, shake: 3.2, sound: 'burst', pierce: 1 },
    rail: { key: 'rail', label: 'Railgun', cooldown: 430, damage: 36, bulletSpeed: 13.5, bulletSize: 10, spread: 0, projectiles: 1, shake: 4.2, sound: 'rail', pierce: 3 }
  };

  const WEAPON_DROP_SEQUENCE = ['shield','rapid','coin','repair','burst','rail'];

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function rand(min, max) { return Math.random() * (max - min) + min; }

  function create(game) {
    function pushParticle(x, y, color, power, opts) {
      const angle = opts && Number.isFinite(opts.angle) ? opts.angle : Math.random() * Math.PI * 2;
      const speed = rand(opts && opts.minSpeed ? opts.minSpeed : 1.2, opts && opts.maxSpeed ? opts.maxSpeed : 4.2) * (power || 1);
      const life = rand(opts && opts.minLife ? opts.minLife : 0.18, opts && opts.maxLife ? opts.maxLife : 0.42);
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: rand(opts && opts.minRadius ? opts.minRadius : 1.5, opts && opts.maxRadius ? opts.maxRadius : 3.8),
        life,
        maxLife: life,
        color: color || '#f8fafc',
        drag: opts && opts.drag ? opts.drag : 0.91
      });
    }

    return {
      hit(x, y, color, power) {
        const impactPower = clamp(power || 1, 0.4, 3.2);
        const count = Math.max(10, Math.floor(impactPower * 13));
        for (let i = 0; i < count; i += 1) pushParticle(x, y, color, impactPower);
        game.addShockwave(x, y, color || '#f8fafc', 0.18, 36 + impactPower * 24);
        game.addShake(2.6 + impactPower * 2.1);
      },

      impact(x, y, color, power) {
        const impactPower = clamp(power || 0.7, 0.35, 2.8);
        const count = Math.max(6, Math.floor(impactPower * 9));
        for (let i = 0; i < count; i += 1) {
          pushParticle(x, y, color || '#cbd5e1', impactPower, {
            minSpeed: 0.6,
            maxSpeed: 2.8,
            minLife: 0.14,
            maxLife: 0.32,
            minRadius: 1.2,
            maxRadius: 3.2,
            drag: 0.88
          });
        }
        game.addShockwave(x, y, color || '#cbd5e1', 0.14, 24 + impactPower * 20);
        game.addShake(1.2 + impactPower * 1.4);
      },

      kill(x, y, color, power, scoreLabel) {
        const killPower = clamp(power || 1.4, 0.8, 3.4);
        const count = Math.max(22, Math.floor(killPower * 22));
        for (let i = 0; i < count; i += 1) {
          pushParticle(x, y, color || '#fb7185', killPower, {
            minSpeed: 1.5,
            maxSpeed: 5.8,
            minLife: 0.26,
            maxLife: 0.68,
            minRadius: 1.8,
            maxRadius: 5.6,
            drag: 0.93
          });
        }
        game.addExplosion(x, y, color || '#fb7185', killPower);
        game.addShockwave(x, y, color || '#fb7185', 0.48, killPower > 2 ? 150 : 86);
        game.addScorePopup(scoreLabel || '+100', x, y - 18, killPower > 2 ? '#fbbf24' : '#facc15');
        game.addShake(killPower > 2 ? 12 : 7);
      }
    };
  }

  window.TankGameEffects = { create };
})();
(function () {
  const TILE = 52;
  const MAP_COLS = 20;
  const MAP_ROWS = 13;
  const MAP_OFFSET_Y = 8;
  const PLAYER_SIZE = 38;
  const ENEMY_SIZE = 38;
  const BASE_SIZE = 38;

  
const LEVELS = [
    { enemyCount: 7, spawnGap: 1.38, dropBoost: 0.00, map: [
      '....................','..B....F......F...B.','.....WW......WW.....','...F......S.....F...','..B....BB....BB.....','..............F.....','....BB..........BB..','.....F....SS....F...','..W.....BB..BB...W..','......S......S......','...BB......FF...BB..','........BB..........','.......B....B.......']},
    { enemyCount: 10, spawnGap: 1.22, dropBoost: 0.015, map: [
      '....................','...S....F....F...S..','..BB....WW..WW......','.....F......B.......','..B...........B.....','.W..............W...','....BB....SS....BB..','......F.............','..S.....B....B...S..','....WW..........WW..','..BB......FF......B.','......B....BB.......','.......BB....B......']},
    { enemyCount: 1, spawnGap: 1.0, dropBoost: 0.0155, map: [
      '....................','.....F........F.....','....................','...F............F...','....................','..........S.........','....................','....F............F..','....................','..........S.........','....................','.....F........F.....','.......B....B.......']},
    { enemyCount: 12, spawnGap: 1.12, dropBoost: 0.01555, map: [
      '....................','..F...BB......BB.F..','.....WW........WW...','...S..............S.','......F........F....','..BB......SS......B.','..............F.....','.....BB......BB.....','.W........WW......W.','....S............S..','......BB....BB......','........FF..........','.......B....B.......']},
    { enemyCount: 13, spawnGap: 1.08, dropBoost: 0.0155, map: [
      '....................','..S....W......W...S.','...BB......BB.......','......F........F....','.W...............W..','....BB..........BB..','........WWWW........','.....F....BB....F...','..BB......SS......B.','....S............S..','......BB....BB......','........FF..........','.......B....B.......']},
    { enemyCount: 1, spawnGap: 1.0, dropBoost: 0.0155, map: [
      '....................','....F..........F....','....................','....................','..F..............F..','....................','....................','....................','..F..............F..','....................','....................','....F..........F....','.......B....B.......']},
    { enemyCount: 14, spawnGap: 1.00, dropBoost: 0.0155, map: [
      '....................','..F..............F..','.....B........B.....','....................','...W............W...','.......F....F.......','....................','....B..........B....','....................','..F.....S..S.....F..','......BB....BB......','....................','.......B....B.......']},
    { enemyCount: 15, spawnGap: 0.96, dropBoost: 0.0155, map: [
      '....................','.B....F......F....B.','....S..........S....','..........W.........','..F..............F..','......BB....BB......','....................','......S......S......','..F..............F..','..........W.........','....BB........BB....','....F..........F....','.......B....B.......']},
    { enemyCount: 1, spawnGap: 1.0, dropBoost: 0.0155, map: [
      '....................','....................','....F..........F....','....................','......S......S......','....................','..F..............F..','....................','......S......S......','....................','....F..........F....','....................','.......B....B.......']},
    { enemyCount: 16, spawnGap: 0.94, dropBoost: 0.01555, map: [
      '....................','....................','..F....B....B....F..','....................','....W..........W....','....................','......S......S......','....................','....B..........B....','....................','..F....B....B....F..','....................','.......B....B.......']},
    { enemyCount: 18, spawnGap: 0.92, dropBoost: 0.0155, map: [
      '....................','...F............F...','.....B....B....B....','....................','..W..............W..','........SS..........','....................','..........SS........','..W..............W..','....................','....B....B....B.....','...F............F...','.......B....B.......']},
    { enemyCount: 1, spawnGap: 1.0, dropBoost: 0.0155, map: [
      '....................','....................','....F..........F....','....................','....................','.......S....S.......','....................','....................','.......S....S.......','....................','....F..........F....','....................','.......B....B.......']}
  ];
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function rectsCollide(a, b) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
  function hexToRgba(hex, alpha) {
    const value = String(hex || '#ffffff').replace('#', '');
    const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value.padEnd(6, '0').slice(0, 6);
    const int = parseInt(full, 16);
    return 'rgba(' + ((int >> 16) & 255) + ',' + ((int >> 8) & 255) + ',' + (int & 255) + ',' + alpha + ')';
  }
  function makeTile(col, row, type) {
    const x = col * TILE; const y = MAP_OFFSET_Y + row * TILE;
    const base = { col, row, x, y, width: TILE, height: TILE, type, blocking: false, bulletBlocking: false, destructible: false, hp: 1 };
    if (type === 'brick') { base.blocking = true; base.bulletBlocking = true; base.destructible = true; base.hp = 2; }
    else if (type === 'steel') { base.blocking = true; base.bulletBlocking = true; base.hp = 999; }
    else if (type === 'water') { base.blocking = true; base.bulletBlocking = false; base.hp = 999; }
    return base;
  }


  const SKINS = {
    classic: { label: 'Classic', primary: '#22c55e', dark: '#15803d', accent: '#d9f99d', glow: '#67e8f9', effect: 'clean' },
    crimson: { label: 'Crimson Raider', primary: '#ef4444', dark: '#991b1b', accent: '#fecaca', glow: '#fb7185', effect: 'ember' },
    frost: { label: 'Frost Breaker', primary: '#38bdf8', dark: '#0f766e', accent: '#cffafe', glow: '#67e8f9', effect: 'frost' },
    royal: { label: 'Royal Vanguard', primary: '#8b5cf6', dark: '#5b21b6', accent: '#ede9fe', glow: '#c4b5fd', effect: 'pulse' },
    obsidian: { label: 'Obsidian Phantom', primary: '#334155', dark: '#020617', accent: '#e2e8f0', glow: '#94a3b8', effect: 'shadow' },
    aurora: { label: 'Aurora Overdrive', primary: '#06b6d4', dark: '#164e63', accent: '#67e8f9', glow: '#2dd4bf', effect: 'aurora' }
  };

  const BOSS_ROSTER = [
    { key: 'overlord', label: 'Overlord Mk-II', hp: 320, speed: 0.84, color: '#f97316', glow: '#fdba74', cooldown: 920, score: 1800, spread: 3 },
    { key: 'hydra', label: 'Hydra Siege', hp: 388, speed: 0.88, color: '#fb7185', glow: '#fda4af', cooldown: 860, score: 2200, spread: 5 },
    { key: 'titan', label: 'Titan Core', hp: 460, speed: 0.8, color: '#a78bfa', glow: '#c4b5fd', cooldown: 820, score: 2600, spread: 5 }
  ];

  const GAME_STATES = Object.freeze({ BOOT: 'boot', READY: 'ready', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover' });

  const WEAPON_CONFIG = {
    cannon: { key: 'cannon', label: 'Cannon', cooldown: 210, damage: 18, bulletSpeed: 10.8, bulletSize: 8, spread: 0, projectiles: 1, shake: 2.8, sound: 'shoot', pierce: 1 },
    burst: { key: 'burst', label: 'Burst', cooldown: 270, damage: 12, bulletSpeed: 10.4, bulletSize: 7, spread: 0.18, projectiles: 3, shake: 3.2, sound: 'burst', pierce: 1 },
    rail: { key: 'rail', label: 'Railgun', cooldown: 430, damage: 36, bulletSpeed: 13.5, bulletSize: 10, spread: 0, projectiles: 1, shake: 4.2, sound: 'rail', pierce: 3 }
  };

  const WEAPON_DROP_SEQUENCE = ['shield','rapid','coin','repair','burst','rail'];

  const TankGameModule = {
    canvas: null, ctx: null, animationId: null, state: GAME_STATES.BOOT, score: 0, stage: 1, fps: 60, keys: {}, bullets: [], enemyBullets: [], enemies: [], tiles: [], particles: [], trails: [], flashes: [], spawnIndicators: [], shockwaves: [], scorePopups: [], drops: [], effects: null, player: null, base: null, enemySpawnedInStage: 0, enemyDefeatedInStage: 0, totalEnemiesForStage: 10, enemySpawnCooldown: 0, lastFrameTime: 0, lastShotTime: 0, freezeFrames: 0, screenShake: 0, screenShakePower: 0, pulse: 0, onUpdate: function () {}, onGameOver: function () {}, audioCtx: null, currentMusicGain: null, skin: SKINS.classic, currentWeapon: WEAPON_CONFIG.cannon, pendingShots: [], touchInput: { active: false, x: 0, y: 0, shooting: false }, bossSpawnedInStage: false, bossIntroTimer: 0, activeBossName: '', survivalTime: 0,
    init(canvas, callbacks) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.effects = window.TankGameEffects ? window.TankGameEffects.create(this) : null; this.onUpdate = callbacks && callbacks.onUpdate ? callbacks.onUpdate : function () {}; this.onGameOver = callbacks && callbacks.onGameOver ? callbacks.onGameOver : function () {}; this.bindEvents(); this.refreshSkin(); this.refreshWeapon(); this.prepareLevel(); this.setState(GAME_STATES.READY); this.publishUpdate(); this.render(); },
    bindEvents() {
      window.addEventListener('keydown', (event) => { const key = event.key.toLowerCase(); this.keys[key] = true; if (event.code === 'Space') { event.preventDefault(); this.shoot(); } if (key === 'p') { if (this.state === GAME_STATES.PLAYING) this.pause(); else if (this.state === GAME_STATES.PAUSED) this.resume(); } });
      window.addEventListener('keyup', (event) => { this.keys[event.key.toLowerCase()] = false; });
      window.addEventListener('pointerdown', () => this.initAudio(), { once: true });
    },
    getCurrentLevel() { return LEVELS[(this.stage - 1) % LEVELS.length]; },
    isBossStage() { return this.stage % 3 === 0; },
    getBossTemplate() { return BOSS_ROSTER[(Math.floor(this.stage / 3) - 1 + BOSS_ROSTER.length) % BOSS_ROSTER.length]; },
    getPlayerSpawnY() { return MAP_OFFSET_Y + TILE * 9 + 8; },
    normalizeStage(stage) { const safe = Number(stage || 1); return Number.isFinite(safe) ? Math.max(1, Math.min(12, Math.floor(safe))) : 1; },

    getEnemyFireControl() {
      const t = this.survivalTime || 0;
      if (t < 60) return { label: 'Warmup', multiplier: 1, bossMultiplier: 1 };
      if (t < 300) return { label: 'Pressure Up', multiplier: 0.94, bossMultiplier: 0.95 };
      return { label: 'Veteran Pace', multiplier: 0.88, bossMultiplier: 0.9 };
    },
    refreshSkin() {
      const inv = window.TankGame && window.TankGame.auth ? window.TankGame.auth.getInventory() : { selectedSkin: 'classic' };
      this.skin = SKINS[inv.selectedSkin] || SKINS.classic;
      return this.skin;
    },
    getSkinLabel() { return this.skin.label; },
    refreshWeapon() {
      const inv = window.TankGame && window.TankGame.auth ? window.TankGame.auth.getInventory() : { selectedWeapon: 'cannon' };
      this.currentWeapon = WEAPON_CONFIG[inv.selectedWeapon] || WEAPON_CONFIG.cannon;
      return this.currentWeapon;
    },
    setWeapon(key) {
      // Weapons are now run-time drops only. Picking up a weapon changes the active gun
      // for the current run without writing it as a permanent/manual selection.
      this.currentWeapon = WEAPON_CONFIG[key] || WEAPON_CONFIG.cannon;
      this.addMuzzleFlash(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.currentWeapon.key === 'rail' ? '#93c5fd' : '#f472b6');
      this.publishUpdate();
    },
    setState(nextState) {
      const allowed = {
        [GAME_STATES.BOOT]: [GAME_STATES.READY],
        [GAME_STATES.READY]: [GAME_STATES.PLAYING],
        [GAME_STATES.PLAYING]: [GAME_STATES.PAUSED, GAME_STATES.GAMEOVER, GAME_STATES.READY],
        [GAME_STATES.PAUSED]: [GAME_STATES.PLAYING, GAME_STATES.GAMEOVER, GAME_STATES.READY],
        [GAME_STATES.GAMEOVER]: [GAME_STATES.READY, GAME_STATES.PLAYING]
      };
      if (this.state === nextState) return true;
      if (!allowed[this.state] || allowed[this.state].indexOf(nextState) === -1) return false;
      this.state = nextState;
      return true;
    },
    setTouchVector(x, y) {
      this.touchInput.active = true;
      this.touchInput.x = clamp(Number(x || 0), -1, 1);
      this.touchInput.y = clamp(Number(y || 0), -1, 1);
    },
    clearTouchVector() {
      this.touchInput.active = false;
      this.touchInput.x = 0;
      this.touchInput.y = 0;
    },
    setTouchShooting(active) {
      this.touchInput.shooting = !!active;
      if (active) this.shoot();
    },
    buildTiles() {
      const tiles = []; const map = this.getCurrentLevel().map;
      map.forEach((line, row) => line.split('').forEach((cell, col) => {
        if (cell === 'B') tiles.push(makeTile(col, row, 'brick'));
        if (cell === 'S') tiles.push(makeTile(col, row, 'steel'));
        if (cell === 'W') tiles.push(makeTile(col, row, 'water'));
        if (cell === 'F') tiles.push(makeTile(col, row, 'forest'));
      }));
      const baseCol = 9; const baseRow = 12;
      tiles.push(makeTile(baseCol - 1, baseRow, 'brick')); tiles.push(makeTile(baseCol, baseRow - 1, 'brick')); tiles.push(makeTile(baseCol + 1, baseRow, 'brick')); tiles.push(makeTile(baseCol + 1, baseRow - 1, 'brick')); tiles.push(makeTile(baseCol - 1, baseRow - 1, 'brick'));
      return tiles;
    },
    createPlayer() {
      const accessibility = document.body.classList.contains('accessibility-mode');
      return { x: this.canvas.width / 2 - PLAYER_SIZE / 2, y: this.getPlayerSpawnY(), width: PLAYER_SIZE, height: PLAYER_SIZE, speed: accessibility ? 4.25 : 3.85, hp: 100, maxHp: 100, lives: 3, cooldown: 210, baseCooldown: 210, direction: 'up', hitFlash: 0, velocityX: 0, velocityY: 0, invincibleTimer: 1.8, respawnTimer: 0, treads: 0, rapidFireTimer: 0, shieldTimer: 0 };
    },
    prepareLevel(resetStage, startStage) {
      this.refreshSkin(); this.player = this.createPlayer(); this.base = { x: this.canvas.width / 2 - BASE_SIZE / 2, y: MAP_OFFSET_Y + TILE * 12 + 6, width: BASE_SIZE, height: BASE_SIZE, alive: true, hitFlash: 0 };
      this.score = resetStage ? 0 : this.score; this.stage = resetStage ? this.normalizeStage(startStage) : this.stage; this.survivalTime = resetStage ? 0 : this.survivalTime; this.totalEnemiesForStage = this.isBossStage() ? 1 : this.getCurrentLevel().enemyCount; this.enemySpawnedInStage = 0; this.enemyDefeatedInStage = 0; this.enemySpawnCooldown = 0.5; this.bullets = []; this.enemyBullets = []; this.enemies = []; this.tiles = this.buildTiles(); this.pendingShots = []; if (resetStage) this.currentWeapon = WEAPON_CONFIG.cannon;
      this.placeEntitySafely(this.player, this.player.x, this.player.y); this.particles = []; this.trails = []; this.flashes = []; this.spawnIndicators = []; this.shockwaves = []; this.scorePopups = []; this.drops = []; this.screenShake = 0; this.screenShakePower = 0; this.freezeFrames = 0; this.pulse = 0; this.lastFrameTime = 0; this.lastShotTime = 0; this.touchInput = { active: false, x: 0, y: 0, shooting: false }; this.bossSpawnedInStage = false; this.bossIntroTimer = this.isBossStage() ? 2.4 : 0; this.activeBossName = this.isBossStage() ? this.getBossTemplate().label : ''; this.setState(GAME_STATES.READY); if (this.isBossStage()) this.addAnnouncement('WARNING // ' + this.activeBossName, '#fb7185'); this.publishUpdate();
    },
    start(startStage) { cancelAnimationFrame(this.animationId); this.initAudio(); this.prepareLevel(true, startStage); this.setState(GAME_STATES.PLAYING); this.playMusicPulse(); this.loop(0); },
    pause() { if (this.state !== GAME_STATES.PLAYING) return; this.setState(GAME_STATES.PAUSED); cancelAnimationFrame(this.animationId); this.publishUpdate(); this.render(); },
    resume() { if (this.state !== GAME_STATES.PAUSED) return; this.setState(GAME_STATES.PLAYING); this.loop(performance.now()); },
    nextStage() { const stageReward = 25 + this.stage * 6; window.TankGame.auth.addCoins(stageReward); this.addAnnouncement('ZONE CLEAR +' + stageReward + ' CREDITS', '#facc15'); if (window.TankGame.auth.isGuest && window.TankGame.auth.isGuest() && this.stage >= 1) { this.setState(GAME_STATES.PAUSED); this.playSound('stage'); this.publishUpdate(); if (window.TankGame.ui && window.TankGame.ui.showGuestStageGate) window.TankGame.ui.showGuestStageGate(); return; } this.stage += 1; this.totalEnemiesForStage = this.isBossStage() ? 1 : this.getCurrentLevel().enemyCount; this.enemySpawnedInStage = 0; this.enemyDefeatedInStage = 0; this.enemySpawnCooldown = 0.9; this.bullets = []; this.enemyBullets = []; this.enemies = []; this.spawnIndicators = []; this.tiles = this.buildTiles(); this.drops = []; this.base.alive = true; this.player.x = this.canvas.width / 2 - PLAYER_SIZE / 2; this.player.y = this.getPlayerSpawnY(); this.placeEntitySafely(this.player, this.player.x, this.player.y); this.player.hp = this.player.maxHp; this.player.invincibleTimer = 1.4; this.bossSpawnedInStage = false; this.bossIntroTimer = this.isBossStage() ? 2.4 : 0; this.activeBossName = this.isBossStage() ? this.getBossTemplate().label : ''; this.addAnnouncement(this.isBossStage() ? ('BOSS STAGE // ' + this.activeBossName) : ('STAGE ' + this.stage), this.isBossStage() ? '#fb7185' : '#67e8f9'); this.addShockwave(this.canvas.width / 2, this.canvas.height / 2, '#67e8f9', 0.9, 180); this.playSound('stage'); this.publishUpdate(); },
    addAnnouncement(text, color) { this.flashes.push({ announcement: true, text, x: this.canvas.width / 2, y: 72, radius: 0, life: 1.2, maxLife: 1.2, color: color || '#67e8f9' }); },
    addScorePopup(text, x, y, color) {
      this.scorePopups.push({ text: String(text || '+100'), x, y, vy: -34, life: 0.78, maxLife: 0.78, color: color || '#facc15' });
    },
    playSoundHook(kind, payload) {
      if (window.TankGameSoundHooks && typeof window.TankGameSoundHooks.emit === 'function') {
        window.TankGameSoundHooks.emit(kind, payload || {});
      }
    },
    emitHitFeedback(x, y, color, power) {
      if (this.effects && typeof this.effects.hit === 'function') {
        this.effects.hit(x, y, color, power);
        return;
      }
      const count = Math.max(10, Math.floor((power || 1) * 12));
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(1.2, 4.2) * (power || 1);
        const life = rand(0.18, 0.42);
        this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: rand(1.5, 3.8), life, maxLife: life, color: color || '#f8fafc', drag: 0.91 });
      }
      this.addShockwave(x, y, color || '#f8fafc', 0.18, 36 + (power || 1) * 24);
      this.addShake(2.6 + (power || 1) * 2.1);
    },
    emitKillFeedback(enemy, label) {
      const x = enemy.x + enemy.width / 2;
      const y = enemy.y + enemy.height / 2;
      if (this.effects && typeof this.effects.kill === 'function') {
        this.effects.kill(x, y, enemy.color, enemy.isBoss ? 2.6 : 1.4, label);
        return;
      }
      this.addExplosion(x, y, enemy.color, enemy.isBoss ? 2.8 : 1.9);
      this.addShockwave(x, y, enemy.glow || enemy.color, 0.48, enemy.isBoss ? 150 : 86);
      this.addScorePopup(label || '+100', x, y - 18, enemy.isBoss ? '#fbbf24' : '#facc15');
      this.addShake(enemy.isBoss ? 12 : 7);
    },
    emitBulletImpactFeedback(x, y, color, power) {
      if (this.effects && typeof this.effects.impact === 'function') {
        this.effects.impact(x, y, color, power);
        return;
      }
      this.emitHitFeedback(x, y, color || '#cbd5e1', Math.max(0.45, power || 0.7));
    },
    addShake(power) { this.screenShake = Math.max(this.screenShake, 7); this.screenShakePower = Math.max(this.screenShakePower, power); },
    addFreeze(frames) { this.freezeFrames = Math.max(this.freezeFrames, frames || 0); },
    addMuzzleFlash(x, y, color) { this.flashes.push({ x, y, radius: 18, life: 0.12, maxLife: 0.12, color }); },
    addShockwave(x, y, color, life, maxRadius) { this.shockwaves.push({ x, y, color, life: life || 0.35, maxLife: life || 0.35, maxRadius: maxRadius || 72 }); },
    addExplosion(x, y, color, intensity) { const count = Math.max(8, Math.floor(intensity * 15)); for (let i = 0; i < count; i++) { const angle = Math.random() * Math.PI * 2; const speed = rand(0.7, 2.8) * intensity; const life = rand(0.22, 0.55); this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: rand(1.8, 4.5), life, maxLife: life, color, drag: 0.97 }); } this.addShockwave(x, y, color, 0.28, 58 + intensity * 35); },
    addTrail(x, y, color, radius) { this.trails.push({ x, y, radius, life: 0.18, maxLife: 0.18, color }); },
    createBoss() {
      const template = this.getBossTemplate();
      const size = 52;
      const x = this.canvas.width / 2 - size / 2;
      const y = MAP_OFFSET_Y + 18;
      const boss = { x, y, width: size, height: size, speed: template.speed + this.stage * 0.02, hp: template.hp + this.stage * 18, maxHp: template.hp + this.stage * 18, cooldown: Math.max(420, template.cooldown - this.stage * 8), scoreValue: template.score + this.stage * 120, kind: template.key, color: template.color, glow: template.glow, direction: 'down', lastShot: rand(0, 300), hitFlash: 0, aiTurnTimer: rand(0.28, 0.55), bobSeed: Math.random() * Math.PI * 2, treads: 0, isBoss: true, spread: template.spread, chargeTimer: 1.8, label: template.label, repathTimer: 0, repathTargetX: x, repathTargetY: y };
      this.placeEntitySafely(boss, x, y);
      this.spawnIndicators.push({ x: boss.x + size / 2, y: boss.y + size / 2, life: 1.2, maxLife: 1.2, color: template.color });
      this.enemies.push(boss);
      this.bossSpawnedInStage = true;
      this.activeBossName = template.label;
      this.enemySpawnedInStage = this.totalEnemiesForStage;
      this.addAnnouncement('BOSS INBOUND', template.color);
      this.addShake(5.5);
      this.playSound('bossAlarm');
    },
    spawnEnemy() {
      if (this.isBossStage()) {
        if (!this.bossSpawnedInStage && !this.enemies.some((enemy) => enemy.isBoss)) this.createBoss();
        return;
      }
      const highContrast = document.body.classList.contains('high-contrast');
      const types = [
        { key: 'scout', hp: 26, speed: 1.8 + this.stage * 0.04, color: highContrast ? '#ffff00' : '#fb7185', score: 100, cooldown: 980 },
        { key: 'assault', hp: 40, speed: 1.45 + this.stage * 0.03, color: highContrast ? '#00ffff' : '#f59e0b', score: 160, cooldown: 1200 },
        { key: 'elite', hp: 54, speed: 1.2 + this.stage * 0.02, color: highContrast ? '#ffffff' : '#a78bfa', score: 240, cooldown: 860 }
      ];
      const type = types[Math.min(types.length - 1, Math.floor(Math.random() * Math.min(3, 1 + Math.floor(this.stage / 2))))];
      const spawnColumns = [1, 5, 10, 14, 18]; const col = spawnColumns[Math.floor(Math.random() * spawnColumns.length)]; const spawnX = col * TILE + TILE / 2 - ENEMY_SIZE / 2;
      const enemy = { x: spawnX, y: MAP_OFFSET_Y + 10, width: ENEMY_SIZE, height: ENEMY_SIZE, speed: type.speed, hp: type.hp, maxHp: type.hp, cooldown: type.cooldown, scoreValue: type.score, kind: type.key, color: type.color, direction: 'down', lastShot: rand(0, 800), hitFlash: 0, aiTurnTimer: rand(0.5, 1.2), bobSeed: Math.random() * Math.PI * 2, treads: 0, isBoss: false, strafeDir: Math.random() > 0.5 ? 1 : -1, attackBias: rand(0.2, 0.9) };
      this.placeEntitySafely(enemy, spawnX, MAP_OFFSET_Y + 10);
      this.spawnIndicators.push({ x: enemy.x + ENEMY_SIZE / 2, y: enemy.y + ENEMY_SIZE / 2, life: 0.55, maxLife: 0.55, color: type.color });
      this.enemies.push(enemy);
      this.enemySpawnedInStage += 1;
    },
    getBlockingTiles(rect, forBullets) { return this.tiles.filter((tile) => (forBullets ? tile.bulletBlocking : tile.blocking) && rectsCollide(rect, tile)); },
    isRectBlocked(rect) { return this.getBlockingTiles(rect, false).length || (this.base.alive && rectsCollide(rect, this.base)); },
    isRectBlockedForEntity(rect, entity) {
      if (!entity || !entity.isBoss) return this.isRectBlocked(rect);
      const blockers = this.tiles.filter((tile) => tile.blocking && tile.type === 'steel' && rectsCollide(rect, tile));
      return blockers.length || (this.base.alive && rectsCollide(rect, this.base));
    },
    placeEntitySafely(entity, preferredX, preferredY) {
      const attempts = [
        [0,0],[0,-TILE],[-TILE,0],[TILE,0],[0,TILE],[-TILE,-TILE],[TILE,-TILE],[-TILE,TILE],[TILE,TILE],[-TILE*2,0],[TILE*2,0],[0,-TILE*2],[0,TILE*2]
      ];
      for (const [ox, oy] of attempts) {
        const rect = { x: clamp(preferredX + ox, 0, this.canvas.width - entity.width), y: clamp(preferredY + oy, MAP_OFFSET_Y, this.canvas.height - entity.height), width: entity.width, height: entity.height };
        if (!this.isRectBlockedForEntity(rect, entity)) { entity.x = rect.x; entity.y = rect.y; return true; }
      }
      entity.x = clamp(preferredX, 0, this.canvas.width - entity.width);
      entity.y = clamp(preferredY, MAP_OFFSET_Y, this.canvas.height - entity.height);
      return false;
    },
    tryMoveAxis(entity, axis, amount) {
      if (!amount) return false;
      const next = { x: entity.x, y: entity.y, width: entity.width, height: entity.height };
      if (axis === 'x') next.x = clamp(entity.x + amount, 0, this.canvas.width - entity.width);
      else next.y = clamp(entity.y + amount, MAP_OFFSET_Y, this.canvas.height - entity.height);
      if (!this.isRectBlockedForEntity(next, entity)) { entity.x = next.x; entity.y = next.y; return true; }
      return false;
    },
    moveEntity(entity, moveX, moveY) {
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(moveX), Math.abs(moveY)) / 4));
      const stepX = moveX / steps;
      const stepY = moveY / steps;
      let movedX = false;
      let movedY = false;
      for (let i = 0; i < steps; i += 1) {
        movedX = this.tryMoveAxis(entity, 'x', stepX) || movedX;
        movedY = this.tryMoveAxis(entity, 'y', stepY) || movedY;
        if (!movedX && Math.abs(stepX) > 0.15 && Math.abs(stepY) > 0.15) {
          this.tryMoveAxis(entity, 'y', Math.sign(stepY) * 2.2) || this.tryMoveAxis(entity, 'y', -Math.sign(stepY) * 2.2);
        }
        if (!movedY && Math.abs(stepX) > 0.15 && Math.abs(stepY) > 0.15) {
          this.tryMoveAxis(entity, 'x', Math.sign(stepX) * 2.2) || this.tryMoveAxis(entity, 'x', -Math.sign(stepX) * 2.2);
        }
      }
      return movedX || movedY;
    },
    hasLineOfSight(from, to) {
      const startX = from.x + from.width / 2;
      const startY = from.y + from.height / 2;
      const endX = to.x + to.width / 2;
      const endY = to.y + to.height / 2;
      const dx = endX - startX;
      const dy = endY - startY;
      const distance = Math.hypot(dx, dy) || 1;
      const steps = Math.max(6, Math.ceil(distance / 24));
      for (let i = 1; i < steps; i += 1) {
        const probe = { x: startX + dx * (i / steps) - 6, y: startY + dy * (i / steps) - 6, width: 12, height: 12 };
        if (this.tiles.some((tile) => tile.bulletBlocking && rectsCollide(probe, tile))) return false;
      }
      return true;
    },
    queuePlayerShot(direction, angleOffset, delay) {
      this.pendingShots.push({ direction, angleOffset: angleOffset || 0, delay: delay || 0 });
    },
    updatePendingShots(deltaSeconds) {
      if (!this.pendingShots.length) return;
      this.pendingShots.forEach((shot) => { shot.delay -= deltaSeconds; });
      const ready = this.pendingShots.filter((shot) => shot.delay <= 0);
      this.pendingShots = this.pendingShots.filter((shot) => shot.delay > 0);
      ready.forEach((shot) => this.firePlayerProjectile(shot.direction, shot.angleOffset || 0));
    },
    rotateVelocity(vx, vy, angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { vx: vx * cos - vy * sin, vy: vx * sin + vy * cos };
    },
    applySkinImpactFx(x, y) {
      if (this.skin.effect === 'ember') this.addExplosion(x, y, '#fb7185', 0.72);
      if (this.skin.effect === 'frost') this.addExplosion(x, y, '#67e8f9', 0.6);
      if (this.skin.effect === 'pulse') this.addShockwave(x, y, '#a78bfa', 0.22, 34);
      if (this.skin.effect === 'aurora') this.addShockwave(x, y, '#2dd4bf', 0.2, 40);
      if (this.skin.effect === 'shadow') this.addTrail(x, y, '#94a3b8', 8);
    },
    firePlayerProjectile(direction, angleOffset) {
      let x = this.player.x + this.player.width / 2 - 4; let y = this.player.y - 14;
      if (direction === 'down') y = this.player.y + this.player.height - 2;
      if (direction === 'left') { x = this.player.x - 14; y = this.player.y + this.player.height / 2 - 4; }
      if (direction === 'right') { x = this.player.x + this.player.width - 2; y = this.player.y + this.player.height / 2 - 4; }
      const bullet = this.createBullet(this.player, x, y, direction, false);
      const rotated = this.rotateVelocity(bullet.vx, bullet.vy, angleOffset || 0);
      bullet.vx = rotated.vx; bullet.vy = rotated.vy;
      this.bullets.push(bullet);
      this.addMuzzleFlash(x + bullet.width / 2, y + bullet.height / 2, this.skin.glow);
      this.applySkinImpactFx(x + bullet.width / 2, y + bullet.height / 2);
    },
    getEscapeVectors(entity, targetX, targetY) {
      const dx = targetX - entity.x;
      const dy = targetY - entity.y;
      const primary = Math.abs(dx) > Math.abs(dy)
        ? [[Math.sign(dx) || 1, 0], [0, Math.sign(dy) || 1]]
        : [[0, Math.sign(dy) || 1], [Math.sign(dx) || 1, 0]];
      return [
        ...primary,
        [-primary[0][0] || -1, -primary[0][1] || 0],
        [-primary[1][0] || 0, -primary[1][1] || -1],
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
    },
    attemptEntityUnstick(entity, targetX, targetY) {
      const vectors = this.getEscapeVectors(entity, targetX, targetY);
      const radii = entity && entity.isBoss ? [10, 16, 24, 34, 46, 62, 84, 108, 136] : [8, 12, 16, 22, 28, 36, 46, 58];
      for (const radius of radii) {
        for (const [vx, vy] of vectors) {
          const next = {
            x: clamp(entity.x + vx * radius, 0, this.canvas.width - entity.width),
            y: clamp(entity.y + vy * radius, MAP_OFFSET_Y, this.canvas.height - entity.height),
            width: entity.width,
            height: entity.height
          };
          if (!this.isRectBlockedForEntity(next, entity)) {
            entity.x = next.x;
            entity.y = next.y;
            return true;
          }
        }
      }
      if (entity && entity.isBoss) {
        const spot = this.findNearestFreeSpot(entity, targetX, targetY);
        if (spot) {
          entity.x = spot.x;
          entity.y = spot.y;
          return true;
        }
      }
      return false;
    },
    findNearestFreeSpot(entity, targetX, targetY) {
      const points = [];
      const anchorX = clamp(targetX, 0, this.canvas.width - entity.width);
      const anchorY = clamp(targetY, MAP_OFFSET_Y, this.canvas.height - entity.height);
      for (let gy = MAP_OFFSET_Y; gy <= this.canvas.height - entity.height; gy += Math.max(18, TILE / 2)) {
        for (let gx = 0; gx <= this.canvas.width - entity.width; gx += Math.max(18, TILE / 2)) {
          const rect = { x: gx, y: gy, width: entity.width, height: entity.height };
          if (!this.isRectBlockedForEntity(rect, entity)) {
            const dist = Math.hypot(anchorX - gx, anchorY - gy);
            points.push({ x: gx, y: gy, dist });
          }
        }
      }
      points.sort((a, b) => a.dist - b.dist);
      return points[0] || null;
    },
    clearNearbyBricksForBoss(entity) {
      const centerX = entity.x + entity.width / 2;
      const centerY = entity.y + entity.height / 2;
      let cleared = false;
      this.tiles.forEach((tile) => {
        if (tile.type !== 'brick') return;
        const tileCenterX = tile.x + tile.width / 2;
        const tileCenterY = tile.y + tile.height / 2;
        const dist = Math.hypot(tileCenterX - centerX, tileCenterY - centerY);
        if (dist <= TILE * 0.95) {
          tile.hp = 0;
          cleared = true;
        }
      });
      if (cleared) this.tiles = this.tiles.filter((tile) => !(tile.type === 'brick' && tile.hp <= 0));
      return cleared;
    },
    movePlayer(deltaSeconds) {
      if (this.player.respawnTimer > 0) return;
      let moveX = 0, moveY = 0;
      if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
      if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
      if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
      if (this.touchInput.active) {
        if (Math.abs(this.touchInput.x) > Math.abs(moveX)) moveX = this.touchInput.x;
        if (Math.abs(this.touchInput.y) > Math.abs(moveY)) moveY = this.touchInput.y;
      }
      const absX = Math.abs(moveX);
      const absY = Math.abs(moveY);
      if (absX > 0.08 || absY > 0.08) {
        if (absX >= absY) this.player.direction = moveX >= 0 ? 'right' : 'left';
        else this.player.direction = moveY >= 0 ? 'down' : 'up';
      }
      const magnitude = Math.hypot(moveX, moveY) || 1;
      if (magnitude > 1) { moveX /= magnitude; moveY /= magnitude; }
      const targetVX = moveX * this.player.speed; const targetVY = moveY * this.player.speed;
      this.player.velocityX += (targetVX - this.player.velocityX) * 0.26;
      this.player.velocityY += (targetVY - this.player.velocityY) * 0.26;
      const moved = this.moveEntity(this.player, this.player.velocityX, this.player.velocityY);
      if (!moved) { this.player.velocityX *= 0.42; this.player.velocityY *= 0.42; }
      this.player.treads += (Math.abs(this.player.velocityX) + Math.abs(this.player.velocityY)) * deltaSeconds * 4;
    },
    createBullet(owner, x, y, direction, isEnemy) {
      const weapon = !isEnemy ? (this.currentWeapon || WEAPON_CONFIG.cannon) : null;
      const bulletSize = isEnemy ? 8 : (weapon.bulletSize || 8);
      const skinBulletMap = {
        clean: { color: '#f8fafc', glow: this.skin.glow },
        ember: { color: '#fed7aa', glow: '#fb7185' },
        frost: { color: '#dffaff', glow: '#67e8f9' },
        pulse: { color: '#ede9fe', glow: '#c4b5fd' },
        shadow: { color: '#cbd5e1', glow: '#94a3b8' },
        aurora: { color: '#ccfbf1', glow: '#2dd4bf' }
      };
      const skinShot = skinBulletMap[this.skin.effect] || skinBulletMap.clean;
      const bullet = {
        width: direction === 'left' || direction === 'right' ? (bulletSize * 1.8) : bulletSize,
        height: direction === 'left' || direction === 'right' ? bulletSize : (bulletSize * 1.8),
        speed: isEnemy ? 5.5 + this.stage * 0.06 : weapon.bulletSpeed,
        damage: isEnemy ? 16 : weapon.damage,
        x, y, direction, from: isEnemy ? 'enemy' : 'player',
        color: isEnemy ? '#ffd1dc' : skinShot.color, glow: isEnemy ? '#fb7185' : skinShot.glow, dead: false,
        pierce: isEnemy ? 1 : (weapon.pierce || 1), weaponKey: isEnemy ? 'enemy' : weapon.key, skinEffect: isEnemy ? '' : this.skin.effect
      };
      if (direction === 'up') { bullet.vx = 0; bullet.vy = -bullet.speed; }
      if (direction === 'down') { bullet.vx = 0; bullet.vy = bullet.speed; }
      if (direction === 'left') { bullet.vx = -bullet.speed; bullet.vy = 0; }
      if (direction === 'right') { bullet.vx = bullet.speed; bullet.vy = 0; }
      return bullet;
    },
    shoot() {
      if (this.state !== GAME_STATES.PLAYING || this.player.respawnTimer > 0) return;
      const now = performance.now();
      this.player.cooldown = this.player.rapidFireTimer > 0 ? Math.max(90, this.currentWeapon.cooldown * 0.6) : this.currentWeapon.cooldown;
      if (now - this.lastShotTime < this.player.cooldown) return;
      if (this.currentWeapon.key === 'burst') {
        this.queuePlayerShot(this.player.direction, 0, 0);
        this.queuePlayerShot(this.player.direction, -this.currentWeapon.spread, 0.045);
        this.queuePlayerShot(this.player.direction, this.currentWeapon.spread, 0.09);
      } else if (this.currentWeapon.key === 'rail') {
        this.queuePlayerShot(this.player.direction, 0, 0);
        this.addShake(this.currentWeapon.shake + 1.5);
      } else {
        this.queuePlayerShot(this.player.direction, 0, 0);
      }
      this.addShake(this.currentWeapon.shake);
      this.lastShotTime = now;
      this.playSound(this.currentWeapon.sound);
    },
    enemyTryShoot(enemy, timestamp) {
      const fireControl = this.getEnemyFireControl();
      const cooldownWindow = enemy.cooldown * (enemy.isBoss ? fireControl.bossMultiplier : fireControl.multiplier);
      if (timestamp - enemy.lastShot < cooldownWindow) return;
      const canSee = this.hasLineOfSight(enemy, this.player);
      if (!enemy.isBoss && !canSee && Math.abs(enemy.x - this.player.x) > 380) return;
      let direction = enemy.direction; const dx = this.player.x - enemy.x; const dy = this.player.y - enemy.y;
      if (Math.abs(dx) > Math.abs(dy)) direction = dx > 0 ? 'right' : 'left'; else direction = dy > 0 ? 'down' : 'up'; enemy.direction = direction;
      let x = enemy.x + enemy.width / 2 - 4; let y = enemy.y - 14; if (direction === 'down') y = enemy.y + enemy.height - 2; if (direction === 'left') { x = enemy.x - 14; y = enemy.y + enemy.height / 2 - 4; } if (direction === 'right') { x = enemy.x + enemy.width - 2; y = enemy.y + enemy.height / 2 - 4; }
      const mainBullet = this.createBullet(enemy, x, y, direction, true);
      this.enemyBullets.push(mainBullet);
      if (enemy.isBoss) {
        const spread = enemy.spread || 3;
        for (let i = 0; i < spread; i++) {
          const spreadBullet = this.createBullet(enemy, x, y, direction, true);
          const offset = (i - (spread - 1) / 2) * 1.05;
          if (direction === 'up' || direction === 'down') spreadBullet.vx += offset;
          else spreadBullet.vy += offset;
          spreadBullet.width = spreadBullet.height = 10;
          spreadBullet.glow = enemy.glow || enemy.color;
          this.enemyBullets.push(spreadBullet);
        }
        this.addAnnouncement(enemy.label || 'BOSS FIRE', enemy.color);
        this.playSound('bossShot');
      } else {
        this.playSound('enemyShoot');
      }
      this.addMuzzleFlash(x + 4, y + 4, enemy.glow || enemy.color); enemy.lastShot = timestamp;
    },
    moveEnemy(enemy, deltaSeconds, timestamp) {
      enemy.aiTurnTimer -= deltaSeconds;
      enemy.stuckTimer = Math.max(0, enemy.stuckTimer || 0);
      if (enemy.isBoss) {
        enemy.chargeTimer = Math.max(0, (enemy.chargeTimer || 0) - deltaSeconds);
        enemy.repathTimer = Math.max(0, enemy.repathTimer || 0);
        const bossLanes = [
          { x: this.canvas.width * 0.18, y: MAP_OFFSET_Y + TILE * 2.0 },
          { x: this.canvas.width * 0.50, y: MAP_OFFSET_Y + TILE * 2.7 },
          { x: this.canvas.width * 0.78, y: MAP_OFFSET_Y + TILE * 3.8 },
          { x: this.canvas.width * 0.28, y: MAP_OFFSET_Y + TILE * 6.2 },
          { x: this.canvas.width * 0.66, y: MAP_OFFSET_Y + TILE * 7.1 }
        ];
        const nearTarget = Math.hypot((enemy.repathTargetX || enemy.x) - enemy.x, (enemy.repathTargetY || enemy.y) - enemy.y) < 28;
        if (enemy.aiTurnTimer <= 0 || enemy.repathTimer <= 0 || nearTarget || enemy.repathTargetX === undefined) {
          const lane = bossLanes[Math.floor(Math.random() * bossLanes.length)];
          enemy.repathTargetX = clamp(lane.x - enemy.width / 2 + rand(-TILE, TILE), 0, this.canvas.width - enemy.width);
          enemy.repathTargetY = clamp(lane.y - enemy.height / 2 + rand(-TILE * 0.6, TILE * 0.6), MAP_OFFSET_Y + 8, this.base.y - enemy.height - TILE * 0.6);
          const dx = enemy.repathTargetX - enemy.x;
          const dy = enemy.repathTargetY - enemy.y;
          enemy.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          enemy.aiTurnTimer = rand(0.42, 0.86);
          enemy.repathTimer = rand(0.9, 1.6);
        }
        const dx = enemy.repathTargetX - enemy.x;
        const dy = enemy.repathTargetY - enemy.y;
        const travel = Math.hypot(dx, dy) || 1;
        const baseSpeed = enemy.speed * (enemy.chargeTimer <= 0 ? 1.10 : 0.88);
        const moveX = (dx / travel) * baseSpeed;
        const moveY = (dy / travel) * baseSpeed;
        const moved = this.moveEntity(enemy, moveX, moveY);
        if (!moved) {
          enemy.stuckTimer += deltaSeconds;
          enemy.aiTurnTimer = 0;
          enemy.repathTimer = 0;
          if (enemy.stuckTimer > 0.12) this.clearNearbyBricksForBoss(enemy);
          let freed = this.attemptEntityUnstick(enemy, enemy.repathTargetX, enemy.repathTargetY);
          if (!freed && enemy.stuckTimer > 0.22) {
            const lane = bossLanes[Math.floor(Math.random() * bossLanes.length)];
            const spot = this.findNearestFreeSpot(enemy, lane.x - enemy.width / 2, lane.y - enemy.height / 2);
            if (spot) { enemy.x = spot.x; enemy.y = spot.y; freed = true; }
          }
          if (freed) enemy.stuckTimer = 0;
        } else {
          enemy.stuckTimer = 0;
        }
        if (enemy.chargeTimer <= 0) {
          this.addMuzzleFlash(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.glow || enemy.color);
          enemy.chargeTimer = rand(2.3, 3.8);
        }
        enemy.treads += baseSpeed * deltaSeconds * 2.5;
      } else {
        if (enemy.aiTurnTimer <= 0 || !enemy.direction) {
          const directions = ['up', 'down', 'left', 'right'];
          enemy.direction = directions[Math.floor(Math.random() * directions.length)];
          enemy.aiTurnTimer = rand(0.8, 1.65);
        }
        const speed = enemy.speed * (enemy.kind === 'scout' ? 1.08 : enemy.kind === 'elite' ? 0.9 : 0.96);
        let moveX = 0, moveY = 0;
        if (enemy.direction === 'up') moveY = -speed;
        if (enemy.direction === 'down') moveY = speed;
        if (enemy.direction === 'left') moveX = -speed;
        if (enemy.direction === 'right') moveX = speed;
        const moved = this.moveEntity(enemy, moveX, moveY);
        if (!moved) {
          enemy.stuckTimer += deltaSeconds;
          const directions = ['up', 'down', 'left', 'right'].filter((dir) => dir !== enemy.direction);
          enemy.direction = directions[Math.floor(Math.random() * directions.length)];
          enemy.aiTurnTimer = rand(0.35, 0.8);
          if (enemy.stuckTimer > 0.18) {
            this.attemptEntityUnstick(enemy, enemy.x + rand(-TILE * 2, TILE * 2), enemy.y + rand(-TILE * 2, TILE * 2));
            enemy.stuckTimer = 0;
          }
        } else {
          enemy.stuckTimer = 0;
        }
        enemy.treads += speed * deltaSeconds * 3;
      }
      enemy.hitFlash = Math.max(0, enemy.hitFlash - deltaSeconds * 5); this.enemyTryShoot(enemy, timestamp);
    },
    resolveBulletStep(bullet) {
      if (bullet.dead) return;
      if (bullet.from === 'player') {
        for (const enemy of this.enemies) {
          if (!bullet.dead && enemy.hp > 0 && rectsCollide(bullet, enemy)) {
            this.hitEnemy(enemy, bullet);
            if (bullet.pierce > 1 && enemy.hp > 0) bullet.dead = false;
          }
        }
        if (!bullet.dead && this.base.alive && rectsCollide(bullet, this.base)) bullet.dead = true;
      } else {
        if (!bullet.dead && rectsCollide(bullet, this.player)) {
          bullet.dead = true;
          this.damagePlayer(bullet.damage || 16, bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
        }
        if (!bullet.dead && this.base.alive && rectsCollide(bullet, this.base)) {
          bullet.dead = true;
          this.hitBase(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
        }
      }
      for (const tile of this.tiles) {
        if (!bullet.dead && tile.bulletBlocking && rectsCollide(bullet, tile)) {
          this.damageTile(tile, bullet, bullet.weaponKey === 'rail' ? 2 : 1);
          if (bullet.weaponKey === 'rail' && tile.type === 'brick' && tile.hp <= 0 && bullet.pierce > 1) {
            bullet.pierce -= 1;
            bullet.dead = false;
          }
        }
      }
    },
    moveBulletWithSweep(bullet) {
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(bullet.vx), Math.abs(bullet.vy)) / 5));
      const stepX = bullet.vx / steps;
      const stepY = bullet.vy / steps;
      for (let i = 0; i < steps && !bullet.dead; i += 1) {
        bullet.x += stepX;
        bullet.y += stepY;
        this.addTrail(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.glow, bullet.from === 'player' ? (bullet.skinEffect === 'aurora' ? 9 : bullet.skinEffect === 'shadow' ? 8 : 6) : 5);
        this.resolveBulletStep(bullet);
      }
    },
    updateBullets(deltaSeconds) {
      this.bullets.forEach((bullet) => this.moveBulletWithSweep(bullet));
      this.enemyBullets.forEach((bullet) => this.moveBulletWithSweep(bullet));
      const aliveBullet = (bullet) => bullet.y + bullet.height > -40 && bullet.y < this.canvas.height + 40 && bullet.x + bullet.width > -40 && bullet.x < this.canvas.width + 40 && !bullet.dead;
      this.bullets = this.bullets.filter(aliveBullet);
      this.enemyBullets = this.enemyBullets.filter(aliveBullet);
      this.player.invincibleTimer = Math.max(0, this.player.invincibleTimer - deltaSeconds); this.player.respawnTimer = Math.max(0, this.player.respawnTimer - deltaSeconds); this.player.hitFlash = Math.max(0, this.player.hitFlash - deltaSeconds * 4.5); this.base.hitFlash = Math.max(0, this.base.hitFlash - deltaSeconds * 4); this.player.rapidFireTimer = Math.max(0, this.player.rapidFireTimer - deltaSeconds); this.player.shieldTimer = Math.max(0, this.player.shieldTimer - deltaSeconds);
    },
    damageTile(tile, bullet, damage) {
      bullet.dead = true;
      const impactX = bullet.x + bullet.width / 2;
      const impactY = bullet.y + bullet.height / 2;
      if (tile.type === 'brick') {
        tile.hp -= damage || 1;
        this.emitBulletImpactFeedback(impactX, impactY, '#f59e0b', 0.82);
      } else if (tile.type === 'steel') {
        this.emitBulletImpactFeedback(impactX, impactY, '#cbd5e1', 0.55);
      }
      this.playSoundHook('impact', { x: impactX, y: impactY, tile: tile.type });
      this.playSound('hit');
    },
    maybeSpawnDrop(x, y, forceType) {
      const levelDropBoost = Number((this.getCurrentLevel() && this.getCurrentLevel().dropBoost) || 0);
      if (!forceType && Math.random() > Math.min(0.62, 0.32 + levelDropBoost)) return;
      const pool = ['coin', 'repair', 'shield', 'rapid'];
      if (this.stage > 1) pool.push('bomb');
      if (this.stage > 1) pool.push('burst');
      if (this.stage > 3) pool.push('rail');
      const type = forceType || pool[Math.floor(Math.random() * pool.length)];
      this.drops.push({ x: x - 12, y: y - 12, width: 24, height: 24, type, life: 10 });
    },
    hitEnemy(enemy, bullet) {
      bullet.dead = true;
      const damage = bullet.from === 'player' ? Number(bullet.damage || (enemy.isBoss ? 14 : 18)) : 0;
      const impactX = bullet.x + bullet.width / 2;
      const impactY = bullet.y + bullet.height / 2;
      enemy.hp -= damage;

      if (bullet.pierce > 1) {
        bullet.pierce -= 1;
        if (bullet.pierce > 0 && enemy.hp > 0) bullet.dead = false;
      }

      enemy.hitFlash = 1;
      this.score += enemy.isBoss ? 28 : 16;
      this.addFreeze(enemy.isBoss ? 3 : 2);
      this.emitHitFeedback(impactX, impactY, enemy.isBoss ? (enemy.glow || enemy.color) : this.skin.glow, enemy.isBoss ? 1.35 : 1);
      this.applySkinImpactFx(impactX, impactY);
      this.playSoundHook('hit', { x: impactX, y: impactY, enemyType: enemy.kind, boss: !!enemy.isBoss, damage });
      this.playSound(enemy.isBoss ? 'bossHit' : 'hit');

      if (enemy.hp <= 0) {
        const popupLabel = enemy.isBoss ? ('+' + enemy.scoreValue) : '+100';
        this.score += enemy.scoreValue;
        enemy.defeatedCounted = true;
        this.enemyDefeatedInStage += 1;
        this.addFreeze(enemy.isBoss ? 8 : 4);
        this.emitKillFeedback(enemy, popupLabel);
        this.addAnnouncement((enemy.isBoss ? 'BOSS DOWN +' : '+') + enemy.scoreValue, enemy.color);
        this.maybeSpawnDrop(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.isBoss ? 'bomb' : null);
        if (enemy.isBoss) {
          window.TankGame.auth.addCoins(85);
          this.addAnnouncement('+420CREDITS', '#facc15');
        } else if (Math.random() > 0.72) {
          window.TankGame.auth.addCoins(6);
          this.addAnnouncement('+28', '#facc15');
        }
        this.playSoundHook('kill', { x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2, enemyType: enemy.kind, boss: !!enemy.isBoss, score: enemy.scoreValue });
        this.playSound(enemy.isBoss ? 'bossDown' : 'explode');
      }
    },
    damagePlayer(amount, hitX, hitY) {
      if (this.player.invincibleTimer > 0 || this.player.respawnTimer > 0 || this.player.shieldTimer > 0) return;
      this.player.hp = Math.max(0, this.player.hp - amount); this.player.hitFlash = 1; this.addFreeze(3); this.emitHitFeedback(hitX, hitY, '#fb7185', 1.45); this.playSoundHook('player-hit', { x: hitX, y: hitY, amount }); this.playSound('playerHit');
      if (this.player.hp <= 0) { this.player.lives -= 1; if (this.player.lives >= 0) { if (this.player.lives === 0) return this.endGame(); this.player.hp = this.player.maxHp; this.player.x = this.canvas.width / 2 - PLAYER_SIZE / 2; this.player.y = this.getPlayerSpawnY(); this.placeEntitySafely(this.player, this.player.x, this.player.y); this.player.invincibleTimer = 1.8; this.player.respawnTimer = 0.35; this.addAnnouncement('RESPAWN', '#67e8f9'); } }
    },
    hitBase(hitX, hitY) { if (!this.base.alive) return; this.base.alive = false; this.base.hitFlash = 1; this.addFreeze(8); this.emitBulletImpactFeedback(hitX, hitY, '#f97316', 2.4); this.addExplosion(hitX, hitY, '#f97316', 2.4); this.addAnnouncement('BASE LOST', '#fb7185'); this.playSound('baseDown'); this.endGame(); },
    endGame() { this.setState(GAME_STATES.GAMEOVER); cancelAnimationFrame(this.animationId); this.publishUpdate(); this.render(); this.playSound('gameOver'); this.onGameOver({ score: this.score, stage: this.stage, kills: this.enemyDefeatedInStage, bossKills: (this.isBossStage() && this.enemyDefeatedInStage >= 1) ? 1 : 0 }); },
    collectDrop(drop) {
      if (drop.type === 'coin') { window.TankGame.auth.addCoins(18); this.addAnnouncement('+18 CREDITS', '#facc15'); }
      else if (drop.type === 'repair') { this.player.hp = clamp(this.player.hp + 25, 0, this.player.maxHp); this.addAnnouncement('REPAIR', '#22c55e'); }
      else if (drop.type === 'shield') { this.player.shieldTimer = 6; this.addAnnouncement('SHIELD', '#67e8f9'); }
      else if (drop.type === 'rapid') { this.player.rapidFireTimer = 6; this.addAnnouncement('RAPID', '#c084fc'); }
      else if (drop.type === 'bomb') { this.killAllEnemies(); this.addAnnouncement('EMP', '#f59e0b'); }
      else if (drop.type === 'burst') { this.setWeapon('burst'); this.addAnnouncement('WEAPON DROP // BURST', '#f472b6'); }
      else if (drop.type === 'rail') { this.setWeapon('rail'); this.addAnnouncement('WEAPON DROP // RAIL', '#93c5fd'); }
      this.addShockwave(drop.x + 12, drop.y + 12, '#facc15', 0.35, 42); this.playSound('pickup');
    },
    killAllEnemies() {
      this.enemies.forEach((enemy) => { this.score += enemy.scoreValue; this.enemyDefeatedInStage += 1; this.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 1.5); });
      this.enemies = []; this.enemyBullets = []; this.addShake(10); this.playSound('explode');
    },
    useInventoryItem(itemKey) {
      if (this.state !== GAME_STATES.PLAYING) { this.addAnnouncement('START GAME FIRST', '#facc15'); return; }
      if (itemKey === 'repair') this.player.hp = clamp(this.player.hp + 35, 0, this.player.maxHp);
      if (itemKey === 'shield') this.player.shieldTimer = 6;
      if (itemKey === 'rapid') this.player.rapidFireTimer = 6;
      if (itemKey === 'bomb') this.killAllEnemies();
      this.playSound('pickup'); this.publishUpdate();
    },
    handleCollisions() {
      this.enemies.forEach((enemy) => {
        if (rectsCollide(enemy, this.player)) {
          enemy.hp = 0;
          this.damagePlayer(28, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          this.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 1.6);
          if (!enemy.defeatedCounted) { enemy.defeatedCounted = true; this.enemyDefeatedInStage += 1; }
        }
        if (this.base.alive && rectsCollide(enemy, this.base)) {
          enemy.hp = 0;
          if (!enemy.defeatedCounted) { enemy.defeatedCounted = true; this.enemyDefeatedInStage += 1; }
          this.hitBase(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        }
      });
      this.enemies.forEach((enemy) => {
        if (enemy.hp <= 0 && !enemy.defeatedCounted) {
          enemy.defeatedCounted = true;
          this.enemyDefeatedInStage += 1;
        }
      });
      this.drops.forEach((drop) => { if (rectsCollide(drop, this.player)) { drop.life = 0; this.collectDrop(drop); } });
      this.tiles = this.tiles.filter((tile) => !(tile.type === 'brick' && tile.hp <= 0));
      this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
      this.drops = this.drops.filter((drop) => drop.life > 0);
      if (this.enemyDefeatedInStage >= this.totalEnemiesForStage && this.enemies.length === 0 && this.state === GAME_STATES.PLAYING) this.nextStage();
    },
    updateStageSpawner(deltaSeconds) {
      const level = this.getCurrentLevel();
      if (this.bossIntroTimer > 0) return;
      if (this.isBossStage()) {
        if (this.bossSpawnedInStage || this.enemies.some((enemy) => enemy.isBoss)) return;
        this.enemySpawnCooldown -= deltaSeconds;
        if (this.enemySpawnCooldown <= 0) { this.spawnEnemy(); this.enemySpawnCooldown = 999; }
        return;
      }
      if (this.enemySpawnedInStage >= this.totalEnemiesForStage) return;
      const progress = Math.max(0, this.enemySpawnedInStage + this.enemyDefeatedInStage);
      const maxActiveEnemies = clamp(1 + Math.floor(progress / 4), 1, 4);
      if (this.enemies.length >= maxActiveEnemies) return;
      this.enemySpawnCooldown -= deltaSeconds;
      if (this.enemySpawnCooldown <= 0) {
        this.spawnEnemy();
        const stagePressure = Math.min(0.16, this.stage * 0.014);
        const earlyExtraDelay = this.enemySpawnedInStage < 3 ? 0.9 : this.enemySpawnedInStage < 7 ? 0.45 : 0.18;
        this.enemySpawnCooldown = Math.max(0.9, level.spawnGap + earlyExtraDelay - stagePressure);
      }
    },
    updateEffects(deltaSeconds) {
      this.particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vx *= p.drag; p.vy *= p.drag; p.life -= deltaSeconds; });
      this.trails.forEach((t) => { t.life -= deltaSeconds; t.radius += 8 * deltaSeconds; });
      this.flashes.forEach((f) => { f.life -= deltaSeconds; f.radius += 120 * deltaSeconds; });
      this.spawnIndicators.forEach((item) => { item.life -= deltaSeconds; });
      this.shockwaves.forEach((w) => { w.life -= deltaSeconds; });
      this.scorePopups.forEach((s) => { s.life -= deltaSeconds; s.y += s.vy * deltaSeconds; s.vy *= 0.95; });
      this.drops.forEach((drop) => { drop.life -= deltaSeconds; drop.y += Math.sin(this.pulse * 5 + drop.x) * 0.12; });
      this.particles = this.particles.filter((p) => p.life > 0); this.trails = this.trails.filter((t) => t.life > 0); this.flashes = this.flashes.filter((f) => f.life > 0); this.spawnIndicators = this.spawnIndicators.filter((i) => i.life > 0); this.shockwaves = this.shockwaves.filter((w) => w.life > 0); this.scorePopups = this.scorePopups.filter((s) => s.life > 0); this.drops = this.drops.filter((d) => d.life > 0); this.screenShake = Math.max(0, this.screenShake - deltaSeconds * 38); this.screenShakePower *= 0.88; this.pulse += deltaSeconds * 2.2;
    },
    update(timestamp) {
      const delta = this.lastFrameTime ? Math.min(32, timestamp - this.lastFrameTime) : 16.67; const deltaSeconds = delta / 1000; this.survivalTime += deltaSeconds; const previousBossIntro = this.bossIntroTimer; this.bossIntroTimer = Math.max(0, this.bossIntroTimer - deltaSeconds); if (previousBossIntro > 0 && this.bossIntroTimer === 0 && this.isBossStage()) { this.enemySpawnCooldown = 0.05; this.addAnnouncement('ENGAGE // ' + this.activeBossName, '#fbbf24'); }
      if (this.freezeFrames > 0) { this.freezeFrames -= 1; this.updateEffects(deltaSeconds * 0.45); this.lastFrameTime = timestamp; this.publishUpdate(); return; }
      this.movePlayer(deltaSeconds); if (this.touchInput.shooting) this.shoot(); this.updatePendingShots(deltaSeconds); this.updateBullets(deltaSeconds); this.updateStageSpawner(deltaSeconds); this.enemies.forEach((enemy) => this.moveEnemy(enemy, deltaSeconds, timestamp)); this.handleCollisions(); this.updateEffects(deltaSeconds); if (delta > 0) this.fps = Math.round(1000 / delta); this.lastFrameTime = timestamp; this.publishUpdate();
    },
    
drawBackground() { const ctx = this.ctx; const contrast = document.body.classList.contains('high-contrast'); const pulseGlow = (Math.sin(this.pulse) + 1) / 2; ctx.clearRect(0,0,this.canvas.width,this.canvas.height); const bg = ctx.createLinearGradient(0,0,0,this.canvas.height); bg.addColorStop(0, contrast ? '#000' : '#06101d'); bg.addColorStop(0.44, contrast ? '#090909' : '#0b1627'); bg.addColorStop(1, contrast ? '#0f0f0f' : '#101d32'); ctx.fillStyle = bg; ctx.fillRect(0,0,this.canvas.width,this.canvas.height); const glowA = ctx.createRadialGradient(180,110,10,180,110,320); glowA.addColorStop(0, contrast ? 'rgba(255,255,255,0.10)' : 'rgba(56,189,248,' + (0.14 + pulseGlow * 0.05) + ')'); glowA.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = glowA; ctx.fillRect(0,0,this.canvas.width,this.canvas.height); const glowB = ctx.createRadialGradient(780,540,10,780,540,280); glowB.addColorStop(0, contrast ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,' + (0.12 + pulseGlow * 0.04) + ')'); glowB.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = glowB; ctx.fillRect(0,0,this.canvas.width,this.canvas.height); ctx.fillStyle = 'rgba(255,255,255,0.02)'; for (let i = 0; i < 26; i++) { const x = (i * 137) % this.canvas.width; const y = (i * 79) % this.canvas.height; ctx.fillRect(x, y, 2, 2); } ctx.strokeStyle = contrast ? 'rgba(255,255,255,0.14)' : 'rgba(148,163,184,0.07)'; ctx.lineWidth = 1; for (let x = 0; x < this.canvas.width; x += TILE) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,this.canvas.height); ctx.stroke(); } for (let y = MAP_OFFSET_Y; y < this.canvas.height; y += TILE) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(this.canvas.width,y); ctx.stroke(); } ctx.fillStyle = 'rgba(15,23,42,0.28)'; for (let row = 0; row < MAP_ROWS; row++) { for (let col = 0; col < MAP_COLS; col++) { if ((row + col) % 2 === 0) ctx.fillRect(col*TILE+4, MAP_OFFSET_Y + row*TILE + 4, TILE-8, TILE-8); } } },

drawArenaFrame() { const ctx = this.ctx; ctx.save(); ctx.strokeStyle = 'rgba(103,232,249,0.22)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, MAP_OFFSET_Y + 1.5, this.canvas.width - 3, TILE * MAP_ROWS - 3); const corners = [[10,MAP_OFFSET_Y+10],[this.canvas.width-10,MAP_OFFSET_Y+10],[10,TILE*MAP_ROWS-2],[this.canvas.width-10,TILE*MAP_ROWS-2]]; ctx.strokeStyle = 'rgba(125,211,252,0.4)'; corners.forEach(([x,y],i)=>{ctx.beginPath(); if (i<2){ctx.moveTo(x+(i===0?26:-26),y); ctx.lineTo(x,y); ctx.lineTo(x,y+26);} else {ctx.moveTo(x+(i===2?26:-26),y); ctx.lineTo(x,y); ctx.lineTo(x,y-26);} ctx.stroke();}); ctx.restore(); },

drawTile(tile) { const ctx = this.ctx; if (tile.type === 'brick') { const opacity = clamp(tile.hp / 2, 0.35, 1); const grad = ctx.createLinearGradient(tile.x,tile.y,tile.x,tile.y+tile.height); grad.addColorStop(0, 'rgba(251,191,36,' + opacity + ')'); grad.addColorStop(0.52, 'rgba(180,83,9,' + opacity + ')'); grad.addColorStop(1, 'rgba(120,53,15,' + opacity + ')'); ctx.fillStyle = grad; ctx.fillRect(tile.x+4,tile.y+4,tile.width-8,tile.height-8); ctx.strokeStyle = 'rgba(255,255,255,0.10)'; for (let y = tile.y + 10; y < tile.y + tile.height - 8; y += 10) { ctx.beginPath(); ctx.moveTo(tile.x + 8, y); ctx.lineTo(tile.x + tile.width - 8, y); ctx.stroke(); } for (let x = tile.x + 12; x < tile.x + tile.width - 10; x += 14) { ctx.beginPath(); ctx.moveTo(x, tile.y + 8); ctx.lineTo(x - 5, tile.y + 18); ctx.stroke(); } if (tile.hp <= 1) { ctx.strokeStyle = 'rgba(15,23,42,0.28)'; ctx.beginPath(); ctx.moveTo(tile.x + 18, tile.y + 10); ctx.lineTo(tile.x + 28, tile.y + 20); ctx.lineTo(tile.x + 16, tile.y + 34); ctx.stroke(); } } if (tile.type === 'steel') { const grad = ctx.createLinearGradient(tile.x,tile.y,tile.x+tile.width,tile.y+tile.height); grad.addColorStop(0, 'rgba(226,232,240,0.82)'); grad.addColorStop(0.48, 'rgba(100,116,139,0.88)'); grad.addColorStop(1, 'rgba(51,65,85,0.96)'); ctx.fillStyle = grad; ctx.fillRect(tile.x+5,tile.y+5,tile.width-10,tile.height-10); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(tile.x+8,tile.y+8,tile.width-16,tile.height-16); ctx.strokeStyle = 'rgba(15,23,42,0.26)'; ctx.beginPath(); ctx.moveTo(tile.x + 10, tile.y + tile.height / 2); ctx.lineTo(tile.x + tile.width - 10, tile.y + tile.height / 2); ctx.moveTo(tile.x + tile.width / 2, tile.y + 10); ctx.lineTo(tile.x + tile.width / 2, tile.y + tile.height - 10); ctx.stroke(); } if (tile.type === 'water') { const grad = ctx.createLinearGradient(tile.x,tile.y,tile.x,tile.y+tile.height); grad.addColorStop(0, 'rgba(56,189,248,0.18)'); grad.addColorStop(1, 'rgba(14,116,144,0.32)'); ctx.fillStyle = grad; ctx.fillRect(tile.x+2,tile.y+2,tile.width-4,tile.height-4); ctx.strokeStyle = 'rgba(125,211,252,0.24)'; for (let i=0;i<3;i++){ const waveY = tile.y + 10 + i * 12 + Math.sin(this.pulse * 2.2 + tile.col + i) * 2; ctx.beginPath(); ctx.moveTo(tile.x + 8, waveY); ctx.quadraticCurveTo(tile.x + tile.width / 2, waveY - 4, tile.x + tile.width - 8, waveY); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(tile.x + 8, tile.y + 8, tile.width - 22, 5); } if (tile.type === 'forest') { ctx.fillStyle = 'rgba(34,197,94,0.12)'; ctx.fillRect(tile.x,tile.y,tile.width,tile.height); for (let i=0;i<4;i++){ const cx = tile.x + 10 + i * 10; const cy = tile.y + 18 + (i % 2) * 8; ctx.fillStyle = i % 2 ? 'rgba(74,222,128,0.55)' : 'rgba(34,197,94,0.45)'; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(21,128,61,0.85)'; ctx.fillRect(cx - 2, cy + 4, 4, 10); } ctx.strokeStyle = 'rgba(187,247,208,0.12)'; ctx.beginPath(); ctx.moveTo(tile.x + 6, tile.y + tile.height - 10); ctx.lineTo(tile.x + tile.width - 8, tile.y + 8); ctx.stroke(); } },

drawBase() { const ctx = this.ctx; const x = this.base.x; const y = this.base.y; ctx.save(); ctx.fillStyle = 'rgba(15,23,42,0.55)'; ctx.fillRect(x-10,y-8,this.base.width+20,this.base.height+16); ctx.shadowBlur = 18; ctx.shadowColor = this.base.alive ? 'rgba(250,204,21,0.45)' : 'rgba(239,68,68,0.45)'; const flashColor = this.base.hitFlash > 0 ? '#fff' : (this.base.alive ? '#fbbf24' : '#6b7280'); ctx.fillStyle = flashColor; ctx.fillRect(x+8,y+8,this.base.width-16,this.base.height-16); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(15,23,42,0.9)'; ctx.lineWidth = 4; ctx.strokeRect(x+8,y+8,this.base.width-16,this.base.height-16); ctx.fillStyle = '#0f172a'; ctx.font = 'bold 18px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(this.base.alive ? '★' : '×', x + this.base.width / 2, y + this.base.height / 2 + 6); if (this.base.alive) { const r = 28 + Math.sin(this.pulse * 4) * 3; ctx.strokeStyle = 'rgba(250,204,21,0.28)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + this.base.width / 2, y + this.base.height / 2, r, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = 'rgba(125,211,252,0.18)'; ctx.beginPath(); ctx.arc(x + this.base.width / 2, y + this.base.height / 2, r + 10, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); } ctx.restore(); },
drawTank(tank, isPlayer) {
      const ctx = this.ctx; const contrast = document.body.classList.contains('high-contrast'); const flash = isPlayer ? this.player.hitFlash : tank.hitFlash || 0; const shieldAlpha = isPlayer && (this.player.invincibleTimer > 0 || this.player.shieldTimer > 0) ? 0.25 + Math.sin(this.pulse * 8) * 0.08 : 0; const isBoss = !!tank.isBoss; const baseColor = flash > 0 ? '#ffffff' : (isPlayer ? (contrast ? '#00ffff' : this.skin.primary) : tank.color); const bodyX = tank.x; const bodyY = tank.y; const wobble = Math.sin(this.pulse * (isBoss ? 1.1 : 1.6) + (tank.bobSeed || 0)) * (isBoss ? 1.2 : 0.8);
      ctx.save(); ctx.translate(0, wobble);
      if (isPlayer && this.skin.effect !== 'clean') { ctx.shadowBlur = 20; ctx.shadowColor = this.skin.glow; ctx.strokeStyle = hexToRgba(this.skin.glow, 0.26); ctx.lineWidth = this.skin.effect === 'pulse' ? 3.5 : 2.5; ctx.beginPath(); ctx.arc(bodyX + tank.width / 2, bodyY + tank.height / 2, tank.width * (this.skin.effect === 'pulse' ? 0.86 : 0.78), 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
      ctx.fillStyle = isBoss ? 'rgba(249,115,22,0.18)' : 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(bodyX + tank.width / 2, bodyY + tank.height + (isBoss ? 10 : 7), tank.width * (isBoss ? 0.56 : 0.44), isBoss ? 10 : 7, 0, 0, Math.PI * 2); ctx.fill();
      const treadOffset = Math.sin((tank.treads || 0) * 8) * 1.6;
      const treadColor = isBoss ? '#7c2d12' : (isPlayer ? this.skin.dark : '#334155');
      ctx.fillStyle = treadColor; ctx.fillRect(bodyX - (isBoss ? 1 : 0), bodyY + 7, isBoss ? 18 : 10, tank.height - 14); ctx.fillRect(bodyX + tank.width - (isBoss ? 17 : 10), bodyY + 7, isBoss ? 18 : 10, tank.height - 14);
      ctx.fillStyle = flash > 0 ? '#fff' : (isBoss ? (tank.glow || '#fdba74') : '#f8fafc');
      for (let i = 0; i < 4; i++) { const y = bodyY + 12 + i * (isBoss ? 13 : 9) + treadOffset; ctx.fillRect(bodyX + (isBoss ? 2 : 1), y, isBoss ? 14 : 8, isBoss ? 4 : 3); ctx.fillRect(bodyX + tank.width - (isBoss ? 16 : 9), y, isBoss ? 14 : 8, isBoss ? 4 : 3); }
      const body = ctx.createLinearGradient(bodyX,bodyY,bodyX+tank.width,bodyY+tank.height); body.addColorStop(0, baseColor); body.addColorStop(1, isPlayer ? this.skin.dark : (isBoss ? '#7c2d12' : '#1e293b')); ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(bodyX + (isBoss ? 10 : 8), bodyY + (isBoss ? 8 : 6), tank.width - (isBoss ? 20 : 16), tank.height - (isBoss ? 16 : 12), isBoss ? 20 : 14); ctx.fill();
      ctx.strokeStyle = isBoss ? 'rgba(255,237,213,0.35)' : 'rgba(255,255,255,0.12)'; ctx.lineWidth = isBoss ? 3 : 2; ctx.stroke();
      ctx.fillStyle = isBoss ? 'rgba(255,248,220,0.18)' : hexToRgba(isPlayer ? this.skin.accent : '#ffffff', 0.18); ctx.beginPath(); ctx.roundRect(bodyX + (isBoss ? 18 : 14), bodyY + (isBoss ? 16 : 14), tank.width - (isBoss ? 36 : 28), tank.height - (isBoss ? 34 : 28), 12); ctx.fill();
      const turretRadius = isBoss ? 20 : 12; ctx.fillStyle = flash > 0 ? '#fff' : (isBoss ? '#fcd34d' : (isPlayer ? this.skin.accent : '#e2e8f0')); ctx.beginPath(); ctx.arc(bodyX + tank.width / 2, bodyY + tank.height / 2, turretRadius, 0, Math.PI * 2); ctx.fill();
      if (isBoss) { ctx.beginPath(); ctx.moveTo(bodyX + tank.width / 2 - 22, bodyY + 10); ctx.lineTo(bodyX + tank.width / 2, bodyY - 6); ctx.lineTo(bodyX + tank.width / 2 + 22, bodyY + 10); ctx.closePath(); ctx.fillStyle = '#fde68a'; ctx.fill(); }
      let barrelX = bodyX + tank.width / 2 - 4, barrelY = bodyY - 8, barrelW = isBoss ? 14 : 8, barrelH = isBoss ? 52 : 28;
      if (tank.direction === 'down') { barrelY = bodyY + tank.height / 2; }
      if (tank.direction === 'left') { barrelX = bodyX - (isBoss ? 28 : 18); barrelY = bodyY + tank.height / 2 - (isBoss ? 7 : 4); barrelW = isBoss ? 52 : 28; barrelH = isBoss ? 14 : 8; }
      if (tank.direction === 'right') { barrelX = bodyX + tank.width / 2; barrelY = bodyY + tank.height / 2 - (isBoss ? 7 : 4); barrelW = isBoss ? 52 : 28; barrelH = isBoss ? 14 : 8; }
      const barrel = ctx.createLinearGradient(barrelX,barrelY,barrelX+barrelW,barrelY+barrelH); barrel.addColorStop(0, '#f8fafc'); barrel.addColorStop(1, contrast ? '#ffffff' : (isBoss ? '#fdba74' : '#94a3b8')); ctx.fillStyle = barrel; ctx.fillRect(barrelX, barrelY, barrelW, barrelH);
      if (isPlayer) { ctx.fillStyle = hexToRgba(this.skin.glow, 0.4); if (this.currentWeapon && this.currentWeapon.key === 'rail') ctx.fillRect(barrelX, barrelY, barrelW, barrelH); }
      if (shieldAlpha > 0) { ctx.strokeStyle = hexToRgba(this.skin.glow, shieldAlpha); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bodyX + tank.width / 2, bodyY + tank.height / 2, tank.width * 0.68, 0, Math.PI * 2); ctx.stroke(); }
      if (!isPlayer) { const hpRatio = clamp(tank.hp / tank.maxHp, 0, 1); ctx.fillStyle = 'rgba(15,23,42,0.68)'; ctx.fillRect(tank.x, tank.y - (isBoss ? 18 : 12), tank.width, isBoss ? 8 : 5); ctx.fillStyle = isBoss ? '#fb7185' : tank.kind === 'elite' ? '#a78bfa' : tank.kind === 'assault' ? '#f59e0b' : '#fb7185'; ctx.fillRect(tank.x, tank.y - (isBoss ? 18 : 12), tank.width * hpRatio, isBoss ? 8 : 5); if (isBoss) { ctx.fillStyle = '#fff7ed'; ctx.font = '700 11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(tank.label || 'BOSS', tank.x + tank.width / 2, tank.y - 24); } }
      ctx.restore();
    },
    drawTrails() { const ctx = this.ctx; this.trails.forEach((trail) => { const alpha = clamp(trail.life / trail.maxLife, 0, 1) * 0.55; const gradient = ctx.createRadialGradient(trail.x, trail.y, 0, trail.x, trail.y, trail.radius); gradient.addColorStop(0, hexToRgba(trail.color, alpha)); gradient.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2); ctx.fill(); }); },
    drawBullets() { const ctx = this.ctx; const drawBullet = (bullet) => { ctx.save(); ctx.shadowBlur = 18; ctx.shadowColor = bullet.glow; ctx.fillStyle = bullet.color; const radius = Math.min(bullet.width, bullet.height) / 2; const x = bullet.x, y = bullet.y, w = bullet.width, h = bullet.height; ctx.beginPath(); ctx.moveTo(x+radius,y); ctx.lineTo(x+w-radius,y); ctx.quadraticCurveTo(x+w,y,x+w,y+radius); ctx.lineTo(x+w,y+h-radius); ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h); ctx.lineTo(x+radius,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-radius); ctx.lineTo(x,y+radius); ctx.quadraticCurveTo(x,y,x+radius,y); ctx.closePath(); ctx.fill(); ctx.restore(); }; this.bullets.forEach(drawBullet); this.enemyBullets.forEach(drawBullet); },
    drawParticles() { const ctx = this.ctx; this.particles.forEach((p) => { const alpha = clamp(p.life / p.maxLife, 0, 1); ctx.fillStyle = hexToRgba(p.color, alpha); ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); }); },
    drawFlashes() { const ctx = this.ctx; this.flashes.forEach((flash) => { if (flash.announcement) { const alpha = clamp(flash.life / flash.maxLife, 0, 1); ctx.fillStyle = hexToRgba(flash.color, alpha); ctx.font = '800 26px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(flash.text, flash.x, flash.y); return; } const alpha = clamp(flash.life / flash.maxLife, 0, 1) * 0.8; const gradient = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flash.radius); gradient.addColorStop(0, hexToRgba(flash.color, alpha)); gradient.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2); ctx.fill(); }); },
    drawShockwaves() { const ctx = this.ctx; this.shockwaves.forEach((wave) => { const progress = 1 - clamp(wave.life / wave.maxLife, 0, 1); const radius = wave.maxRadius * progress; ctx.strokeStyle = hexToRgba(wave.color, 0.4 * (1 - progress)); ctx.lineWidth = 5 * (1 - progress); ctx.beginPath(); ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2); ctx.stroke(); }); },
    drawScorePopups() { const ctx = this.ctx; this.scorePopups.forEach((popup) => { const alpha = clamp(popup.life / popup.maxLife, 0, 1); ctx.save(); ctx.globalAlpha = alpha; ctx.font = '900 24px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(15,23,42,0.76)'; ctx.strokeText(popup.text, popup.x, popup.y); ctx.fillStyle = popup.color || '#facc15'; ctx.fillText(popup.text, popup.x, popup.y); ctx.restore(); }); },
    drawSpawnIndicators() { const ctx = this.ctx; this.spawnIndicators.forEach((item) => { const alpha = clamp(item.life / item.maxLife, 0, 1); const radius = 16 + (1 - alpha) * 28; ctx.strokeStyle = hexToRgba(item.color, alpha * 0.75); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(item.x, item.y, radius, 0, Math.PI * 2); ctx.stroke(); }); },
    drawDropIcon(type, cx, cy, size) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (type === 'coin') {
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(0, 0, size * 0.36, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fef3c7'; ctx.stroke(); ctx.fillStyle = '#713f12'; ctx.font = '900 ' + Math.round(size * 0.5) + 'px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 1);
      } else if (type === 'repair') {
        ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.roundRect(-size * 0.34, -size * 0.34, size * 0.68, size * 0.68, 5); ctx.fill();
        ctx.strokeStyle = '#dcfce7'; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-size * 0.18, 0); ctx.lineTo(size * 0.18, 0); ctx.moveTo(0, -size * 0.18); ctx.lineTo(0, size * 0.18); ctx.stroke();
      } else if (type === 'shield') {
        ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.moveTo(0, -size * 0.38); ctx.lineTo(size * 0.34, -size * 0.22); ctx.lineTo(size * 0.25, size * 0.18); ctx.quadraticCurveTo(0, size * 0.42, -size * 0.25, size * 0.18); ctx.lineTo(-size * 0.34, -size * 0.22); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#cffafe'; ctx.stroke();
      } else if (type === 'rapid') {
        ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 3; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-size * 0.22, i * size * 0.12 - size * 0.16); ctx.lineTo(size * 0.08, i * size * 0.12); ctx.lineTo(-size * 0.22, i * size * 0.12 + size * 0.16); ctx.stroke(); } ctx.fillStyle = '#ede9fe'; ctx.beginPath(); ctx.arc(size * 0.24, 0, size * 0.12, 0, Math.PI * 2); ctx.fill();
      } else if (type === 'bomb') {
        ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(0, size * 0.06, size * 0.28, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fed7aa'; ctx.stroke(); ctx.strokeStyle = '#fef3c7'; ctx.beginPath(); ctx.moveTo(size * 0.14, -size * 0.18); ctx.lineTo(size * 0.28, -size * 0.36); ctx.stroke(); ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(size * 0.31, -size * 0.39, size * 0.08, 0, Math.PI * 2); ctx.fill();
      } else if (type === 'burst') {
        ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-size * 0.28, -size * 0.2); ctx.lineTo(size * 0.18, -size * 0.2); ctx.moveTo(-size * 0.28, 0); ctx.lineTo(size * 0.28, 0); ctx.moveTo(-size * 0.28, size * 0.2); ctx.lineTo(size * 0.18, size * 0.2); ctx.stroke(); ctx.fillStyle = '#fce7f3'; [-0.2,0,0.2].forEach((y)=>{ctx.beginPath(); ctx.arc(size*0.32, size*y, size*0.07, 0, Math.PI*2); ctx.fill();});
      } else if (type === 'rail') {
        ctx.fillStyle = '#93c5fd'; ctx.beginPath(); ctx.moveTo(-size * 0.08, -size * 0.42); ctx.lineTo(size * 0.28, -size * 0.08); ctx.lineTo(size * 0.08, -size * 0.08); ctx.lineTo(size * 0.22, size * 0.42); ctx.lineTo(-size * 0.28, size * 0.02); ctx.lineTo(-size * 0.06, size * 0.02); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#dbeafe'; ctx.stroke();
      }
      ctx.restore();
    },
    drawDrops() {
      const ctx = this.ctx;
      const colorMap = { coin: '#facc15', repair: '#22c55e', shield: '#67e8f9', rapid: '#c084fc', bomb: '#f97316', burst: '#f472b6', rail: '#93c5fd' };
      this.drops.forEach((drop) => {
        const color = colorMap[drop.type] || '#ffffff';
        const cx = drop.x + drop.width / 2;
        const cy = drop.y + drop.height / 2;
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fillStyle = 'rgba(15,23,42,0.78)';
        ctx.beginPath();
        ctx.roundRect(drop.x - 2, drop.y - 2, drop.width + 4, drop.height + 4, 8);
        ctx.fill();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = hexToRgba(color, 0.85);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        this.drawDropIcon(drop.type, cx, cy, 25);
        ctx.restore();
      });
    },
    drawTopHud() { const ctx = this.ctx; const coins = window.TankGame.auth.getInventory().coins; const boss = this.enemies.find((enemy) => enemy.isBoss); ctx.save(); ctx.fillStyle = 'rgba(15,23,42,0.52)'; ctx.fillRect(14,14,310,74); ctx.strokeStyle = 'rgba(103,232,249,0.18)'; ctx.strokeRect(14,14,310,74); ctx.fillStyle = '#e2e8f0'; ctx.font = '700 18px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('STAGE ' + this.stage, 28, 40); ctx.font = '600 13px Inter, sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.fillText('FPS ' + this.fps, 28, 62); ctx.fillText('LIVES ' + this.player.lives, 110, 62); ctx.fillText('SCORE ' + this.score, 196, 62); ctx.fillStyle = 'rgba(15,23,42,0.78)'; ctx.fillRect(344,24,272,18); ctx.fillStyle = '#22c55e'; ctx.fillRect(344,24,272 * clamp(this.player.hp / this.player.maxHp, 0, 1), 18); ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.strokeRect(344,24,272,18); ctx.fillStyle = '#cbd5e1'; ctx.font = '600 12px Inter, sans-serif'; ctx.fillText('PLAYER HP', 344, 60); ctx.fillStyle = 'rgba(15,23,42,0.52)'; ctx.fillRect(634,14,312,74); ctx.strokeStyle = this.isBossStage() ? 'rgba(249,115,22,0.26)' : 'rgba(167,139,250,0.20)'; ctx.strokeRect(634,14,312,74); ctx.fillStyle = '#e2e8f0'; ctx.font = '700 16px Inter, sans-serif'; ctx.fillText(this.isBossStage() ? 'Boss Mission' : 'Mission', 648, 40); ctx.font = '600 12px Inter, sans-serif'; ctx.fillStyle = '#94a3b8'; if (boss) { const bossRatio = clamp(boss.hp / boss.maxHp, 0, 1); ctx.fillText((boss.label || 'Boss') + ' • Armor ' + Math.ceil(boss.hp), 648, 58); ctx.fillStyle = 'rgba(15,23,42,0.86)'; ctx.fillRect(648,64,242,12); ctx.fillStyle = '#fb7185'; ctx.fillRect(648,64,242 * bossRatio,12); ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.strokeRect(648,64,242,12); ctx.fillStyle = '#fcd34d'; ctx.fillText('Base pressure high • Credits ' + coins, 648, 94); } else { ctx.fillText('Defeat ' + this.enemyDefeatedInStage + ' / ' + this.totalEnemiesForStage + ' enemies', 648, 58); ctx.fillText((this.base.alive ? 'Protect the base' : 'Base destroyed') + ' • Credits ' + coins, 648, 78); } ctx.restore(); },
    drawBossIntroCinematic() { const ctx = this.ctx; if (this.bossIntroTimer <= 0 || !this.isBossStage()) return; const alpha = clamp(this.bossIntroTimer / 2.4, 0, 1); ctx.save(); ctx.fillStyle = 'rgba(2,6,23,' + (0.42 + alpha * 0.18) + ')'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height); ctx.fillStyle = 'rgba(239,68,68,0.10)'; ctx.fillRect(0,120,this.canvas.width,84); ctx.fillRect(0,this.canvas.height-200,this.canvas.width,72); ctx.strokeStyle = 'rgba(251,113,133,0.34)'; ctx.strokeRect(22,110,this.canvas.width-44,104); ctx.strokeRect(36,this.canvas.height-212,this.canvas.width-72,96); ctx.textAlign='left'; ctx.fillStyle='#fecaca'; ctx.font='700 16px Inter, sans-serif'; ctx.fillText('WARNING // BOSS APPROACH', 42, 145); ctx.fillStyle='#fff7ed'; ctx.font='800 42px Inter, sans-serif'; ctx.fillText(this.activeBossName || 'Unknown Boss', 42, 188); ctx.fillStyle='#cbd5e1'; ctx.font='500 16px Inter, sans-serif'; ctx.fillText('Heavy armor signature detected. Fortify center lane and keep space around the base.', 42, this.canvas.height - 170); ctx.fillText('Entry countdown ' + Math.max(1, Math.ceil(this.bossIntroTimer)) + 's', 42, this.canvas.height - 138); ctx.textAlign='right'; ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.font='800 120px Inter, sans-serif'; ctx.fillText('!', this.canvas.width - 70, 190); ctx.restore(); },

    drawPauseLayer() { const ctx = this.ctx; if (this.state !== GAME_STATES.PAUSED) return; ctx.fillStyle = 'rgba(2,6,23,0.48)'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height); ctx.fillStyle = '#f8fafc'; ctx.font = '800 42px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 12); ctx.font = '500 18px Inter, sans-serif'; ctx.fillStyle = '#cbd5e1'; ctx.fillText('Press P or Resume to continue', this.canvas.width / 2, this.canvas.height / 2 + 24); },
    publishUpdate() { const boss = this.enemies.find((enemy) => enemy.isBoss); const fireControl = this.getEnemyFireControl(); this.onUpdate({ state: this.state, hp: this.player ? this.player.hp : 0, score: this.score, enemyCount: this.enemies.length, stage: this.stage, lives: this.player ? this.player.lives : 0, fps: this.fps, baseAlive: this.base ? this.base.alive : false, coins: window.TankGame.auth.getInventory().coins, skinName: this.skin.label, isBossStage: this.isBossStage(), bossActive: !!boss, bossHp: boss ? Math.ceil(boss.hp) : 0, bossName: boss ? boss.label : this.activeBossName, survivalTime: Math.floor(this.survivalTime || 0), kills: this.enemyDefeatedInStage, totalEnemies: this.totalEnemiesForStage, baseAlive: this.base ? this.base.alive : false, bossKills: (this.isBossStage() && this.enemyDefeatedInStage >= 1) ? 1 : 0, firePaceLabel: fireControl.label, bossIntroActive: this.bossIntroTimer > 0 && this.isBossStage(), bossIntroTimer: this.bossIntroTimer, weaponName: this.currentWeapon.label }); },
    render() { const ctx = this.ctx; this.drawBackground(); ctx.save(); if (this.screenShake > 0) ctx.translate(rand(-this.screenShakePower, this.screenShakePower), rand(-this.screenShakePower, this.screenShakePower)); this.drawArenaFrame(); this.tiles.filter((tile) => tile.type !== 'forest').forEach((tile) => this.drawTile(tile)); this.drawBase(); this.drawTrails(); this.drawBullets(); this.drawDrops(); this.enemies.forEach((enemy) => this.drawTank(enemy, false)); if (this.player.respawnTimer <= 0 || Math.floor(this.player.respawnTimer * 10) % 2 === 0) this.drawTank(this.player, true); this.tiles.filter((tile) => tile.type === 'forest').forEach((tile) => this.drawTile(tile)); this.drawSpawnIndicators(); this.drawParticles(); this.drawShockwaves(); this.drawFlashes(); this.drawScorePopups(); ctx.restore(); this.drawTopHud(); this.drawBossIntroCinematic(); this.drawPauseLayer(); },
    loop(timestamp) { if (this.state !== GAME_STATES.PLAYING) { this.render(); return; } this.update(timestamp); this.render(); this.animationId = requestAnimationFrame((time) => this.loop(time)); },
    initAudio() {
      if (this.audioCtx || !window.AudioContext) return;
      this.audioCtx = new AudioContext();
    },
    playTone(type, freq, duration, volume) {
      if (!this.audioCtx || document.body.dataset.sound !== 'true') return;
      const ctx = this.audioCtx; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = type; osc.frequency.value = freq; gain.gain.value = volume || 0.03; osc.connect(gain); gain.connect(ctx.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration); osc.stop(ctx.currentTime + duration);
    },
    playSound(kind) {
      if (!this.audioCtx) return;
      if (kind === 'shoot') this.playTone('square', 420, 0.06, 0.035);
      else if (kind === 'enemyShoot') this.playTone('square', 240, 0.05, 0.02);
      else if (kind === 'burst') { this.playTone('square', 520, 0.04, 0.028); this.playTone('triangle', 410, 0.05, 0.02); }
      else if (kind === 'rail') { this.playTone('sawtooth', 680, 0.08, 0.03); this.playTone('triangle', 240, 0.10, 0.02); }
      else if (kind === 'hit') this.playTone('triangle', 160, 0.05, 0.025);
      else if (kind === 'explode') { this.playTone('sawtooth', 110, 0.12, 0.04); this.playTone('triangle', 80, 0.16, 0.03); }
      else if (kind === 'pickup') this.playTone('sine', 720, 0.12, 0.03);
      else if (kind === 'playerHit') this.playTone('sawtooth', 130, 0.10, 0.04);
      else if (kind === 'gameOver') { this.playTone('triangle', 180, 0.18, 0.04); this.playTone('triangle', 120, 0.22, 0.03); }
      else if (kind === 'baseDown') { this.playTone('sawtooth', 90, 0.20, 0.05); this.playTone('square', 60, 0.24, 0.04); }
      else if (kind === 'stage') { this.playTone('sine', 520, 0.10, 0.03); this.playTone('sine', 680, 0.12, 0.025); }
      else if (kind === 'bossAlarm') { this.playTone('triangle', 260, 0.16, 0.04); this.playTone('triangle', 210, 0.22, 0.03); }
      else if (kind === 'bossShot') { this.playTone('square', 180, 0.08, 0.03); this.playTone('sawtooth', 120, 0.10, 0.02); }
      else if (kind === 'bossHit') { this.playTone('triangle', 150, 0.08, 0.03); this.playTone('triangle', 105, 0.10, 0.025); }
      else if (kind === 'bossDown') { this.playTone('sawtooth', 70, 0.22, 0.05); this.playTone('triangle', 95, 0.28, 0.04); }
    },
    playMusicPulse() {
      if (!this.audioCtx || document.body.dataset.music !== 'true') return;
      if (this.currentMusicGain) return;
      const ctx = this.audioCtx; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = 'sine'; osc.frequency.value = 65; gain.gain.value = 0.012; osc.connect(gain); gain.connect(ctx.destination); osc.start(); this.currentMusicGain = gain; osc.onended = () => { this.currentMusicGain = null; };
    }
  };
  window.TankGame = window.TankGame || {}; window.TankGame.game = TankGameModule;
})();