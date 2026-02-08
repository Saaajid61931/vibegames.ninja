"use strict";

(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const hud = {
    berries: document.getElementById("berries"),
    dashes: document.getElementById("dashes"),
    deaths: document.getElementById("deaths"),
    timer: document.getElementById("timer"),
    overlay: document.getElementById("overlay")
  };

  const TILE = 16;

  const PHYS = {
    maxRun: 155,
    groundAccel: 1800,
    airAccel: 1300,
    groundFriction: 1900,
    airFriction: 640,
    gravity: 1500,
    maxFall: 420,
    jumpSpeed: 318,
    jumpHoldGravityScale: 0.55,
    coyote: 0.11,
    jumpBuffer: 0.11,
    wallSlideSpeed: 86,
    wallSlideGrip: 900,
    wallJumpX: 220,
    wallJumpY: 310,
    dashSpeed: 360,
    dashTime: 0.14,
    maxDashes: 1,
    crystalRespawn: 2.2
  };

  const CAMERA = {
    followX: 8,
    followY: 7,
    shakeDecay: 2.8,
    maxShake: 9
  };

  const KEYS = {
    left: ["ArrowLeft", "KeyA"],
    right: ["ArrowRight", "KeyD"],
    up: ["ArrowUp", "KeyW"],
    down: ["ArrowDown", "KeyS"],
    jump: ["Space", "KeyZ", "KeyC"],
    dash: ["KeyX", "ShiftLeft", "ShiftRight"],
    restart: ["KeyR", "Enter"]
  };

  class InputManager {
    constructor() {
      this.counts = new Map();
      this.pressed = new Set();

      window.addEventListener("keydown", (event) => {
        if (!this.shouldTrack(event.code)) {
          return;
        }
        event.preventDefault();
        if (event.repeat) {
          return;
        }
        this.setKeyDown(event.code, true);
      });

      window.addEventListener("keyup", (event) => {
        if (!this.shouldTrack(event.code)) {
          return;
        }
        event.preventDefault();
        this.setKeyDown(event.code, false);
      });
    }

    shouldTrack(code) {
      return Object.values(KEYS).some((group) => group.includes(code));
    }

    setKeyDown(code, down) {
      const current = this.counts.get(code) || 0;
      if (down) {
        const next = current + 1;
        this.counts.set(code, next);
        if (current === 0) {
          this.pressed.add(code);
        }
        return;
      }

      if (current <= 1) {
        this.counts.delete(code);
      } else {
        this.counts.set(code, current - 1);
      }
    }

    isDown(code) {
      return (this.counts.get(code) || 0) > 0;
    }

    anyDown(codes) {
      return codes.some((code) => this.isDown(code));
    }

    anyPressed(codes) {
      return codes.some((code) => this.pressed.has(code));
    }

    endFrame() {
      this.pressed.clear();
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(from, to, amount) {
    return from + (to - from) * amount;
  }

  function moveToward(current, target, maxDelta) {
    if (current < target) {
      return Math.min(current + maxDelta, target);
    }
    if (current > target) {
      return Math.max(current - maxDelta, target);
    }
    return target;
  }

  function overlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds - minutes * 60;
    const paddedSeconds = String(Math.floor(rest)).padStart(2, "0");
    const hundredths = String(Math.floor((rest % 1) * 100)).padStart(2, "0");
    return `${String(minutes).padStart(2, "0")}:${paddedSeconds}.${hundredths}`;
  }

  function makeLevelGrid() {
    const width = 152;
    const height = 34;
    const grid = Array.from({ length: height }, () => Array(width).fill("."));

    const set = (x, y, tile) => {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return;
      }
      grid[y][x] = tile;
    };

    const fill = (x, y, w, h, tile) => {
      for (let yy = y; yy < y + h; yy += 1) {
        for (let xx = x; xx < x + w; xx += 1) {
          set(xx, yy, tile);
        }
      }
    };

    fill(0, 0, width, 1, "#");
    fill(0, height - 1, width, 1, "#");
    fill(0, 0, 1, height, "#");
    fill(width - 1, 0, 1, height, "#");

    fill(1, 29, 22, 4, "#");
    fill(30, 26, 20, 7, "#");

    fill(50, 29, 4, 4, "#");
    fill(53, 18, 2, 15, "#");
    fill(61, 14, 2, 19, "#");
    fill(63, 16, 14, 17, "#");

    fill(77, 10, 24, 2, "#");
    fill(77, 20, 24, 13, "#");

    fill(101, 24, 18, 9, "#");
    fill(119, 26, 6, 7, "#");
    fill(125, 20, 8, 13, "#");
    fill(133, 16, 8, 17, "#");
    fill(141, 12, 7, 21, "#");
    fill(148, 8, 2, 25, "#");

    for (let x = 23; x <= 29; x += 1) {
      set(x, 32, "^");
    }
    for (let x = 39; x <= 42; x += 1) {
      set(x, 25, "^");
    }
    for (let x = 56; x <= 58; x += 1) {
      set(x, 32, "^");
    }
    for (let x = 68; x <= 70; x += 1) {
      set(x, 15, "^");
    }
    for (let x = 84; x <= 91; x += 1) {
      set(x, 12, "v");
    }
    for (let x = 85; x <= 92; x += 1) {
      set(x, 19, "^");
    }
    for (let x = 108; x <= 111; x += 1) {
      set(x, 23, "^");
    }
    for (let x = 128; x <= 130; x += 1) {
      set(x, 19, "^");
    }
    for (let x = 136; x <= 138; x += 1) {
      set(x, 15, "^");
    }
    for (let x = 144; x <= 146; x += 1) {
      set(x, 11, "^");
    }

    set(4, 28, "P");
    set(15, 24, "o");
    set(36, 22, "o");
    set(74, 15, "C");
    set(95, 17, "o");
    set(106, 23, "K");
    set(116, 20, "o");
    set(138, 14, "C");
    set(145, 10, "o");
    set(150, 7, "G");

    return grid;
  }

  function parseLevel(grid) {
    const height = grid.length;
    const width = grid[0].length;
    const tiles = grid.map((row) => row.slice());
    const spikes = [];
    const berries = [];
    const crystals = [];
    const checkpoints = [];

    let spawn = { x: 2, y: 2 };
    let goal = { x: (width - 3) * TILE, y: (height - 3) * TILE, w: TILE, h: TILE };

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const tile = tiles[y][x];
        if ("^v<>".includes(tile)) {
          spikes.push({ x, y, kind: tile });
          tiles[y][x] = ".";
          continue;
        }

        if (tile === "o") {
          berries.push({
            x: x * TILE + TILE * 0.5,
            y: y * TILE + TILE * 0.5,
            phase: Math.random() * Math.PI * 2,
            collected: false
          });
          tiles[y][x] = ".";
          continue;
        }

        if (tile === "C") {
          crystals.push({
            x: x * TILE + TILE * 0.5,
            y: y * TILE + TILE * 0.5,
            used: false,
            timer: 0
          });
          tiles[y][x] = ".";
          continue;
        }

        if (tile === "K") {
          checkpoints.push({
            id: checkpoints.length,
            x: x * TILE,
            y: y * TILE,
            tileX: x,
            tileY: y,
            active: false
          });
          tiles[y][x] = ".";
          continue;
        }

        if (tile === "P") {
          spawn = { x, y };
          tiles[y][x] = ".";
          continue;
        }

        if (tile === "G") {
          goal = {
            x: x * TILE + 2,
            y: y * TILE + 2,
            w: TILE - 4,
            h: TILE - 4
          };
          tiles[y][x] = ".";
        }
      }
    }

    return {
      width,
      height,
      pixelWidth: width * TILE,
      pixelHeight: height * TILE,
      tiles,
      spikes,
      berries,
      crystals,
      checkpoints,
      spawn,
      goal
    };
  }

  const input = new InputManager();
  setupTouchControls(input);

  const level = parseLevel(makeLevelGrid());

  const state = {
    level,
    player: {
      x: 0,
      y: 0,
      w: 12,
      h: 14,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      touchingLeft: false,
      touchingRight: false,
      wallSlide: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      dashTimer: 0,
      dashDirX: 1,
      dashDirY: 0,
      dashes: PHYS.maxDashes,
      dead: false,
      deathTimer: 0
    },
    camera: {
      x: 0,
      y: 0,
      shake: 0
    },
    particles: [],
    elapsed: 0,
    winTime: 0,
    won: false,
    deaths: 0,
    collected: 0,
    activeCheckpoint: -1,
    respawnTile: { x: level.spawn.x, y: level.spawn.y },
    message: "Climb to the summit. Dash crystals refill your air dash.",
    messageTimer: 4
  };

  spawnPlayerAtTile(state.respawnTile);
  updateHud();
  refreshOverlay();

  function setupTouchControls(inputManager) {
    const controls = document.getElementById("mobile-controls");
    if (!controls) {
      return;
    }

    const buttons = controls.querySelectorAll("button[data-key]");
    buttons.forEach((button) => {
      const keyCode = button.getAttribute("data-key");
      let held = false;

      const press = () => {
        if (held || !keyCode) {
          return;
        }
        held = true;
        button.classList.add("active");
        inputManager.setKeyDown(keyCode, true);
      };

      const release = () => {
        if (!held || !keyCode) {
          return;
        }
        held = false;
        button.classList.remove("active");
        inputManager.setKeyDown(keyCode, false);
      };

      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        press();
      });

      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", (event) => {
        if (event.buttons === 0) {
          release();
        }
      });
      button.addEventListener("contextmenu", (event) => event.preventDefault());
    });
  }

  function isSolidTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= level.width || ty >= level.height) {
      return true;
    }
    return level.tiles[ty][tx] === "#";
  }

  function isSolidPixel(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    return isSolidTile(tx, ty);
  }

  function playerRect() {
    return {
      x: state.player.x,
      y: state.player.y,
      w: state.player.w,
      h: state.player.h
    };
  }

  function spawnPlayerAtTile(tile) {
    const p = state.player;
    p.x = tile.x * TILE + (TILE - p.w) * 0.5;
    p.y = tile.y * TILE + (TILE - p.h);
    p.vx = 0;
    p.vy = 0;
    p.onGround = false;
    p.touchingLeft = false;
    p.touchingRight = false;
    p.wallSlide = false;
    p.coyoteTimer = 0;
    p.jumpBufferTimer = 0;
    p.dashTimer = 0;
    p.dashes = PHYS.maxDashes;
    p.dead = false;
    p.deathTimer = 0;
  }

  function restartRun() {
    state.elapsed = 0;
    state.winTime = 0;
    state.won = false;
    state.deaths = 0;
    state.collected = 0;
    state.activeCheckpoint = -1;
    state.respawnTile = { x: level.spawn.x, y: level.spawn.y };
    state.particles.length = 0;

    level.berries.forEach((berry) => {
      berry.collected = false;
    });
    level.crystals.forEach((crystal) => {
      crystal.used = false;
      crystal.timer = 0;
    });
    level.checkpoints.forEach((checkpoint) => {
      checkpoint.active = false;
    });

    spawnPlayerAtTile(state.respawnTile);
    state.message = "Run reset. Reach the summit!";
    state.messageTimer = 1.5;
    state.camera.shake = 0;
    updateHud();
    refreshOverlay();
  }

  function killPlayer() {
    const p = state.player;
    if (state.won || p.dead) {
      return;
    }

    p.dead = true;
    p.deathTimer = 0.46;
    p.vx = 0;
    p.vy = 0;
    state.deaths += 1;
    state.camera.shake = 0.36;

    spawnParticleBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, 18, "#ff7f74", 92);
  }

  function respawnPlayer() {
    spawnPlayerAtTile(state.respawnTile);

    level.crystals.forEach((crystal) => {
      crystal.used = false;
      crystal.timer = 0;
    });
  }

  function startDash(inputX, inputY) {
    const p = state.player;
    if (p.dashes <= 0) {
      return;
    }

    let dx = inputX;
    let dy = inputY;
    if (dx === 0 && dy === 0) {
      dx = p.facing;
    }

    const length = Math.hypot(dx, dy) || 1;
    p.dashDirX = dx / length;
    p.dashDirY = dy / length;
    p.dashes -= 1;
    p.dashTimer = PHYS.dashTime;
    p.vx = p.dashDirX * PHYS.dashSpeed;
    p.vy = p.dashDirY * PHYS.dashSpeed;
    p.jumpBufferTimer = 0;
    state.camera.shake = Math.max(state.camera.shake, 0.18);

    spawnParticleBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, 9, "#70f0ff", 60);
  }

  function moveAndCollide(dt) {
    const p = state.player;

    p.touchingLeft = false;
    p.touchingRight = false;
    p.onGround = false;

    const dx = p.vx * dt;
    p.x += dx;

    if (dx > 0) {
      const right = p.x + p.w;
      const tx = Math.floor(right / TILE);
      const top = Math.floor((p.y + 1) / TILE);
      const bottom = Math.floor((p.y + p.h - 1) / TILE);

      for (let ty = top; ty <= bottom; ty += 1) {
        if (isSolidTile(tx, ty)) {
          p.x = tx * TILE - p.w - 0.001;
          p.vx = 0;
          p.touchingRight = true;
          p.dashTimer = 0;
          break;
        }
      }
    } else if (dx < 0) {
      const tx = Math.floor(p.x / TILE);
      const top = Math.floor((p.y + 1) / TILE);
      const bottom = Math.floor((p.y + p.h - 1) / TILE);

      for (let ty = top; ty <= bottom; ty += 1) {
        if (isSolidTile(tx, ty)) {
          p.x = (tx + 1) * TILE + 0.001;
          p.vx = 0;
          p.touchingLeft = true;
          p.dashTimer = 0;
          break;
        }
      }
    }

    const dy = p.vy * dt;
    p.y += dy;

    if (dy > 0) {
      const bottom = p.y + p.h;
      const ty = Math.floor(bottom / TILE);
      const left = Math.floor((p.x + 1) / TILE);
      const right = Math.floor((p.x + p.w - 1) / TILE);

      for (let tx = left; tx <= right; tx += 1) {
        if (isSolidTile(tx, ty)) {
          p.y = ty * TILE - p.h - 0.001;
          p.vy = 0;
          p.onGround = true;
          break;
        }
      }
    } else if (dy < 0) {
      const ty = Math.floor(p.y / TILE);
      const left = Math.floor((p.x + 1) / TILE);
      const right = Math.floor((p.x + p.w - 1) / TILE);

      for (let tx = left; tx <= right; tx += 1) {
        if (isSolidTile(tx, ty)) {
          p.y = (ty + 1) * TILE + 0.001;
          p.vy = 0;
          break;
        }
      }
    }

    const sampleTop = p.y + 2;
    const sampleMid = p.y + p.h * 0.5;
    const sampleBottom = p.y + p.h - 2;
    p.touchingLeft =
      p.touchingLeft ||
      isSolidPixel(p.x - 1, sampleTop) ||
      isSolidPixel(p.x - 1, sampleMid) ||
      isSolidPixel(p.x - 1, sampleBottom);

    p.touchingRight =
      p.touchingRight ||
      isSolidPixel(p.x + p.w + 1, sampleTop) ||
      isSolidPixel(p.x + p.w + 1, sampleMid) ||
      isSolidPixel(p.x + p.w + 1, sampleBottom);
  }

  function spikeRect(spike) {
    const x = spike.x * TILE;
    const y = spike.y * TILE;

    if (spike.kind === "^") {
      return { x: x + 2, y: y + 1, w: TILE - 4, h: TILE - 5 };
    }
    if (spike.kind === "v") {
      return { x: x + 2, y: y + 5, w: TILE - 4, h: TILE - 5 };
    }
    if (spike.kind === "<") {
      return { x: x + 1, y: y + 2, w: TILE - 5, h: TILE - 4 };
    }
    return { x: x + 5, y: y + 2, w: TILE - 5, h: TILE - 4 };
  }

  function updatePlayer(dt) {
    const p = state.player;

    const moveX = Number(input.anyDown(KEYS.right)) - Number(input.anyDown(KEYS.left));
    const moveY = Number(input.anyDown(KEYS.down)) - Number(input.anyDown(KEYS.up));
    const jumpPressed = input.anyPressed(KEYS.jump);
    const jumpHeld = input.anyDown(KEYS.jump);
    const dashPressed = input.anyPressed(KEYS.dash);

    if (p.onGround) {
      p.coyoteTimer = PHYS.coyote;
      p.dashes = PHYS.maxDashes;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    }

    p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
    if (jumpPressed) {
      p.jumpBufferTimer = PHYS.jumpBuffer;
    }

    if (dashPressed && p.dashes > 0 && p.dashTimer <= 0) {
      startDash(moveX, moveY);
    }

    if (p.dashTimer > 0) {
      p.dashTimer = Math.max(0, p.dashTimer - dt);
      p.vx = p.dashDirX * PHYS.dashSpeed;
      p.vy = p.dashDirY * PHYS.dashSpeed;
      p.wallSlide = false;
    } else {
      const wallDir = p.touchingLeft ? -1 : p.touchingRight ? 1 : 0;
      if (p.jumpBufferTimer > 0) {
        if (p.coyoteTimer > 0) {
          p.vy = -PHYS.jumpSpeed;
          p.coyoteTimer = 0;
          p.jumpBufferTimer = 0;
          spawnParticleBurst(p.x + p.w * 0.5, p.y + p.h, 5, "#eceef9", 56);
        } else if (wallDir !== 0 && !p.onGround) {
          p.vx = -wallDir * PHYS.wallJumpX;
          p.vy = -PHYS.wallJumpY;
          p.facing = -wallDir;
          p.jumpBufferTimer = 0;
          spawnParticleBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, 7, "#eceef9", 70);
        }
      }

      if (moveX !== 0) {
        p.facing = Math.sign(moveX);
        const accel = p.onGround ? PHYS.groundAccel : PHYS.airAccel;
        p.vx = moveToward(p.vx, moveX * PHYS.maxRun, accel * dt);
      } else {
        const friction = p.onGround ? PHYS.groundFriction : PHYS.airFriction;
        p.vx = moveToward(p.vx, 0, friction * dt);
      }

      let gravity = PHYS.gravity;
      if (jumpHeld && p.vy < 0) {
        gravity *= PHYS.jumpHoldGravityScale;
      }
      p.vy = Math.min(p.vy + gravity * dt, PHYS.maxFall);

      const pushingIntoWall =
        !p.onGround &&
        ((p.touchingLeft && moveX < 0) || (p.touchingRight && moveX > 0));

      if (pushingIntoWall && p.vy > PHYS.wallSlideSpeed) {
        p.wallSlide = true;
        p.vy = moveToward(p.vy, PHYS.wallSlideSpeed, PHYS.wallSlideGrip * dt);
      } else {
        p.wallSlide = false;
      }
    }

    moveAndCollide(dt);

    if (p.y > level.pixelHeight + 120) {
      killPlayer();
      return;
    }

    const pRect = playerRect();
    for (let i = 0; i < level.spikes.length; i += 1) {
      if (overlap(pRect, spikeRect(level.spikes[i]))) {
        killPlayer();
        return;
      }
    }

    for (let i = 0; i < level.berries.length; i += 1) {
      const berry = level.berries[i];
      if (berry.collected) {
        continue;
      }
      const bRect = { x: berry.x - 6, y: berry.y - 6, w: 12, h: 12 };
      if (overlap(pRect, bRect)) {
        berry.collected = true;
        state.collected += 1;
        spawnParticleBurst(berry.x, berry.y, 10, "#ff6688", 80);
      }
    }

    for (let i = 0; i < level.crystals.length; i += 1) {
      const crystal = level.crystals[i];
      if (crystal.used) {
        continue;
      }
      const cRect = { x: crystal.x - 7, y: crystal.y - 7, w: 14, h: 14 };
      if (overlap(pRect, cRect) && p.dashes < PHYS.maxDashes) {
        crystal.used = true;
        crystal.timer = PHYS.crystalRespawn;
        p.dashes = PHYS.maxDashes;
        spawnParticleBurst(crystal.x, crystal.y, 12, "#8df6ff", 95);
      }
    }

    for (let i = 0; i < level.checkpoints.length; i += 1) {
      const checkpoint = level.checkpoints[i];
      const cpRect = { x: checkpoint.x + 2, y: checkpoint.y + 2, w: TILE - 4, h: TILE - 4 };
      if (overlap(pRect, cpRect) && state.activeCheckpoint !== checkpoint.id) {
        state.activeCheckpoint = checkpoint.id;
        state.respawnTile = { x: checkpoint.tileX, y: checkpoint.tileY };
        level.checkpoints.forEach((cp) => {
          cp.active = cp.id === checkpoint.id;
        });
        state.message = "Checkpoint secured.";
        state.messageTimer = 1.2;
        spawnParticleBurst(checkpoint.x + TILE * 0.5, checkpoint.y + TILE * 0.5, 14, "#ffd87f", 80);
      }
    }

    if (!state.won && overlap(pRect, level.goal)) {
      state.won = true;
      state.winTime = state.elapsed;
      p.vx = 0;
      p.vy = 0;
      state.camera.shake = 0.2;
      spawnParticleBurst(level.goal.x + level.goal.w * 0.5, level.goal.y + level.goal.h * 0.5, 22, "#fff5b2", 120);
    }
  }

  function updateCrystals(dt) {
    for (let i = 0; i < level.crystals.length; i += 1) {
      const crystal = level.crystals[i];
      if (!crystal.used) {
        continue;
      }
      crystal.timer -= dt;
      if (crystal.timer <= 0) {
        crystal.used = false;
        crystal.timer = 0;
        spawnParticleBurst(crystal.x, crystal.y, 8, "#b9ffff", 66);
      }
    }
  }

  function spawnParticleBurst(x, y, count, color, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const force = speed * (0.35 + Math.random() * 0.75);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        life: 0.18 + Math.random() * 0.33,
        maxLife: 0.18 + Math.random() * 0.33,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }

      particle.vy += 820 * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
    }
  }

  function updateCamera(dt) {
    const p = state.player;
    const targetX = clamp(
      p.x + p.w * 0.5 - canvas.width * 0.5,
      0,
      Math.max(0, level.pixelWidth - canvas.width)
    );
    const targetY = clamp(
      p.y + p.h * 0.5 - canvas.height * 0.52,
      0,
      Math.max(0, level.pixelHeight - canvas.height)
    );

    const followX = 1 - Math.exp(-CAMERA.followX * dt);
    const followY = 1 - Math.exp(-CAMERA.followY * dt);
    state.camera.x = lerp(state.camera.x, targetX, followX);
    state.camera.y = lerp(state.camera.y, targetY, followY);

    state.camera.shake = Math.max(0, state.camera.shake - CAMERA.shakeDecay * dt);
  }

  function updateHud() {
    hud.berries.textContent = `${state.collected}/${level.berries.length}`;
    hud.dashes.textContent = String(state.player.dashes);
    hud.deaths.textContent = String(state.deaths);
    hud.timer.textContent = formatTime(state.won ? state.winTime : state.elapsed);
  }

  function refreshOverlay() {
    let text = "";
    if (state.won) {
      text = `Summit reached in ${formatTime(state.winTime)}\nBerries: ${state.collected}/${level.berries.length}\nDeaths: ${state.deaths}\n\nPress R or Enter to run again.`;
    } else if (state.messageTimer > 0) {
      text = state.message;
    }

    if (text) {
      hud.overlay.classList.add("show");
      hud.overlay.textContent = text;
    } else {
      hud.overlay.classList.remove("show");
      hud.overlay.textContent = "";
    }
  }

  function update(dt) {
    if (input.anyPressed(KEYS.restart)) {
      restartRun();
      return;
    }

    if (!state.won) {
      state.elapsed += dt;
    }

    if (state.messageTimer > 0) {
      state.messageTimer = Math.max(0, state.messageTimer - dt);
    }

    if (state.player.dead) {
      state.player.deathTimer -= dt;
      if (state.player.deathTimer <= 0) {
        respawnPlayer();
      }
    } else if (!state.won) {
      updateCrystals(dt);
      updatePlayer(dt);
    }

    updateParticles(dt);
    updateCamera(dt);
    updateHud();
    refreshOverlay();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#0f2034");
    gradient.addColorStop(0.55, "#1f4463");
    gradient.addColorStop(1, "#4d8ba2");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 214, 145, 0.18)";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.17, canvas.height * 0.2, 52, 0, Math.PI * 2);
    ctx.fill();

    drawMountainLayer(0.22, 325, 34, "rgba(26, 52, 78, 0.55)");
    drawMountainLayer(0.34, 365, 44, "rgba(17, 40, 62, 0.6)");
    drawMountainLayer(0.5, 418, 52, "rgba(9, 26, 44, 0.72)");
  }

  function drawMountainLayer(parallax, baseY, amplitude, color) {
    const offset = state.camera.x * parallax;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = -80; x <= canvas.width + 80; x += 40) {
      const y = baseY + Math.sin((x + offset) * 0.012) * amplitude;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  function drawTiles() {
    const startX = Math.max(0, Math.floor(state.camera.x / TILE) - 1);
    const endX = Math.min(level.width - 1, Math.ceil((state.camera.x + canvas.width) / TILE) + 1);
    const startY = Math.max(0, Math.floor(state.camera.y / TILE) - 1);
    const endY = Math.min(level.height - 1, Math.ceil((state.camera.y + canvas.height) / TILE) + 1);

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        if (level.tiles[y][x] !== "#") {
          continue;
        }
        const worldX = x * TILE;
        const worldY = y * TILE;
        ctx.fillStyle = "#223f5e";
        ctx.fillRect(worldX, worldY, TILE, TILE);
        ctx.fillStyle = "#3b6388";
        ctx.fillRect(worldX, worldY, TILE, 4);
      }
    }
  }

  function drawSpikes() {
    ctx.fillStyle = "#ffe9cf";
    for (let i = 0; i < level.spikes.length; i += 1) {
      const spike = level.spikes[i];
      const x = spike.x * TILE;
      const y = spike.y * TILE;

      ctx.beginPath();
      if (spike.kind === "^") {
        ctx.moveTo(x, y + TILE);
        ctx.lineTo(x + TILE * 0.5, y);
        ctx.lineTo(x + TILE, y + TILE);
      } else if (spike.kind === "v") {
        ctx.moveTo(x, y);
        ctx.lineTo(x + TILE * 0.5, y + TILE);
        ctx.lineTo(x + TILE, y);
      } else if (spike.kind === "<") {
        ctx.moveTo(x + TILE, y);
        ctx.lineTo(x, y + TILE * 0.5);
        ctx.lineTo(x + TILE, y + TILE);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + TILE, y + TILE * 0.5);
        ctx.lineTo(x, y + TILE);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawBerries() {
    for (let i = 0; i < level.berries.length; i += 1) {
      const berry = level.berries[i];
      if (berry.collected) {
        continue;
      }

      const bob = Math.sin(state.elapsed * 4 + berry.phase) * 1.8;
      const x = berry.x;
      const y = berry.y + bob;

      ctx.fillStyle = "#f4587b";
      ctx.beginPath();
      ctx.arc(x, y, 5.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffd6e0";
      ctx.beginPath();
      ctx.arc(x - 1.8, y - 1.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCrystals() {
    for (let i = 0; i < level.crystals.length; i += 1) {
      const crystal = level.crystals[i];
      const pulse = 0.75 + Math.sin(state.elapsed * 5 + i) * 0.15;

      if (crystal.used) {
        ctx.fillStyle = "rgba(84, 130, 150, 0.55)";
      } else {
        ctx.fillStyle = `rgba(129, 250, 255, ${pulse.toFixed(2)})`;
      }

      const x = crystal.x;
      const y = crystal.y;
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x, y + 8);
      ctx.lineTo(x - 7, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawCheckpoints() {
    for (let i = 0; i < level.checkpoints.length; i += 1) {
      const checkpoint = level.checkpoints[i];
      const x = checkpoint.x;
      const y = checkpoint.y;

      ctx.fillStyle = checkpoint.active ? "#ffe497" : "#8f9ab0";
      ctx.fillRect(x + 7, y + 2, 2, 12);

      ctx.fillStyle = checkpoint.active ? "#ffd06b" : "#bdc5d3";
      ctx.beginPath();
      ctx.moveTo(x + 9, y + 2);
      ctx.lineTo(x + 15, y + 5);
      ctx.lineTo(x + 9, y + 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawGoal() {
    const g = level.goal;
    const wave = Math.sin(state.elapsed * 3.6) * 1.8;

    ctx.fillStyle = "#203a53";
    ctx.fillRect(g.x, g.y, g.w, g.h);

    ctx.fillStyle = "#ffd889";
    ctx.fillRect(g.x + 2, g.y + 2, g.w - 4, g.h - 4);

    ctx.fillStyle = "rgba(255, 248, 190, 0.45)";
    ctx.fillRect(g.x + 2, g.y + 2 + wave, g.w - 4, 3);
  }

  function drawPlayer() {
    const p = state.player;
    if (p.dead) {
      return;
    }

    const x = p.x;
    const y = p.y;
    const squish = p.dashTimer > 0 ? 1.25 : 1;

    ctx.fillStyle = p.dashTimer > 0 ? "#9bf9ff" : "#f3f5ff";
    ctx.fillRect(x + 2 - (squish - 1) * 2, y + 2, p.w - 4 + (squish - 1) * 4, p.h - 4);

    ctx.fillStyle = "#f06e58";
    const hairX = p.facing > 0 ? x + 1 : x + p.w - 4;
    ctx.fillRect(hairX, y + 5, 3, 7);

    ctx.fillStyle = "#13253a";
    const eyeX = p.facing > 0 ? x + p.w - 5 : x + 3;
    ctx.fillRect(eyeX, y + 6, 1, 1);
  }

  function drawParticles() {
    for (let i = 0; i < state.particles.length; i += 1) {
      const particle = state.particles[i];
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    drawBackground();

    const shakeScale = state.camera.shake * CAMERA.maxShake;
    const shakeX = (Math.random() * 2 - 1) * shakeScale;
    const shakeY = (Math.random() * 2 - 1) * shakeScale;

    ctx.save();
    ctx.translate(Math.round(-state.camera.x + shakeX), Math.round(-state.camera.y + shakeY));

    drawTiles();
    drawSpikes();
    drawGoal();
    drawBerries();
    drawCrystals();
    drawCheckpoints();
    drawPlayer();
    drawParticles();

    ctx.restore();
  }

  let previousTime = performance.now();

  function tick(now) {
    const dt = clamp((now - previousTime) / 1000, 0, 1 / 30);
    previousTime = now;

    update(dt);
    render();
    input.endFrame();

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
