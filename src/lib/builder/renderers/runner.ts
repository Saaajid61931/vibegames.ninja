export function renderRunnerGameScript() {
  return String.raw`
function createGame() {
  const ground = logicalHeight * 0.82;
  const runner = { x: logicalWidth * 0.18, y: ground - 48, w: 42, h: 48, vy: 0, onGround: true };
  const obstacles = [];
  let spawnMs = CONFIG.gameplay.obstacleRate;
  let accumulator = 0;

  function reset() {
    obstacles.length = 0;
    runner.y = ground - runner.h;
    runner.vy = 0;
    runner.onGround = true;
    state.score = 0;
    state.gameOver = false;
    state.started = false;
    resetCombo();
    setMessage(CONFIG.title, CONFIG.controlsHint);
  }

  function jump() {
    if (!runner.onGround) return;
    runner.onGround = false;
    runner.vy = -CONFIG.gameplay.jumpPower;
    triggerJuice(runner.x + runner.w * 0.5, runner.y + runner.h * 0.5, CONFIG.palette.accent, 12);
  }

  function startOrRestart() {
    if (state.gameOver) {
      reset();
      return;
    }
    state.started = true;
    setMessage(CONFIG.title, "Clear jumps build pace fast. Keep the lane alive.");
  }

  function update(dt) {
    accumulator += dt * 1000;

    if (input.pressed) {
      input.pressed = false;
      if (!state.started || state.gameOver) startOrRestart();
      else jump();
    }

    if (!state.started || state.gameOver) return;

    runner.vy += CONFIG.gameplay.gravity;
    runner.y += runner.vy;

    if (runner.y >= ground - runner.h) {
      runner.y = ground - runner.h;
      runner.vy = 0;
      runner.onGround = true;
    }

    if (accumulator >= spawnMs) {
      accumulator = 0;
      spawnMs = CONFIG.gameplay.obstacleRate * rand(0.85, 1.12);
      obstacles.push({
        x: logicalWidth + rand(0, 50),
        y: ground - rand(34, 72),
        w: rand(28, 44),
        h: rand(34, 72),
        scored: false,
      });
    }

    const speed = CONFIG.gameplay.speed * 60 * dt;
    for (const obstacle of obstacles) {
      obstacle.x -= speed;
      if (!obstacle.scored && obstacle.x + obstacle.w < runner.x) {
        obstacle.scored = true;
        const combo = addComboStep();
        state.score += 10 * combo;
        triggerJuice(obstacle.x, obstacle.y, CONFIG.palette.accent2, 8);
      }

      const hit =
        runner.x < obstacle.x + obstacle.w &&
        runner.x + runner.w > obstacle.x &&
        runner.y < obstacle.y + obstacle.h &&
        runner.y + runner.h > obstacle.y;

      if (hit) {
        state.gameOver = true;
        updateBest();
        setMessage(
          "Runner down",
          CONFIG.restartPolish
            ? "Tap, click, or press Space to snap right back into the lane."
            : "Tap or press Space to restart."
        );
        triggerJuice(runner.x + runner.w * 0.5, runner.y + runner.h * 0.5, CONFIG.palette.accent2, 24);
      }
    }

    while (obstacles.length > 0 && obstacles[0].x + obstacles[0].w < -60) {
      obstacles.shift();
    }

    state.score += dt * (6 + state.combo * 1.4);
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer <= 0) resetCombo();
    updateBest();
  }

  function draw() {
    ctx.fillStyle = CONFIG.palette.bg;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < logicalWidth; i += 70) {
      ctx.fillRect((i - performance.now() * 0.06) % (logicalWidth + 70), 0, 22, logicalHeight);
    }

    ctx.fillStyle = CONFIG.palette.panel;
    ctx.fillRect(0, ground, logicalWidth, logicalHeight - ground);

    ctx.fillStyle = CONFIG.palette.accent2;
    for (const obstacle of obstacles) {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    }

    ctx.fillStyle = CONFIG.palette.accent;
    ctx.fillRect(runner.x, runner.y, runner.w, runner.h);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(runner.x + 7, runner.y + 8, runner.w - 14, 10);
  }

  return { update, draw, reset };
}
`
}
