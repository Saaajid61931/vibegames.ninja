export function renderFlappyGameScript() {
  return String.raw`
function createGame() {
  const bird = { x: logicalWidth * 0.24, y: logicalHeight * 0.42, r: 18, vy: 0 };
  const pipes = [];
  let accumulator = 0;
  let spawnMs = 1500;

  function reset() {
    pipes.length = 0;
    bird.y = logicalHeight * 0.42;
    bird.vy = 0;
    accumulator = 0;
    state.score = 0;
    state.started = false;
    state.gameOver = false;
    resetCombo();
    setMessage(CONFIG.title, CONFIG.controlsHint);
  }

  function flap() {
    bird.vy = -CONFIG.gameplay.jumpPower;
    triggerJuice(bird.x, bird.y, CONFIG.palette.accent, 10);
  }

  function startOrRestart() {
    if (state.gameOver) {
      reset();
      return;
    }

    state.started = true;
    flap();
  }

  function update(dt) {
    if (input.pressed) {
      input.pressed = false;
      if (!state.started || state.gameOver) startOrRestart();
      else flap();
    }

    if (!state.started || state.gameOver) return;

    accumulator += dt * 1000;
    bird.vy += CONFIG.gameplay.gravity;
    bird.y += bird.vy;

    if (accumulator >= spawnMs) {
      accumulator = 0;
      spawnMs = 1350 + rand(-180, 180);
      const gapTop = rand(120, logicalHeight - CONFIG.gameplay.gapSize - 140);
      pipes.push({ x: logicalWidth + 80, w: 72, gapTop, gapBottom: gapTop + CONFIG.gameplay.gapSize, scored: false });
    }

    for (const pipe of pipes) {
      pipe.x -= CONFIG.gameplay.speed * 60 * dt;
      if (!pipe.scored && pipe.x + pipe.w < bird.x - bird.r) {
        pipe.scored = true;
        const combo = addComboStep();
        state.score += 12 * combo;
        triggerJuice(pipe.x, pipe.gapTop, CONFIG.palette.accent2, 8);
      }

      const hitX = bird.x + bird.r > pipe.x && bird.x - bird.r < pipe.x + pipe.w;
      const hitTop = bird.y - bird.r < pipe.gapTop;
      const hitBottom = bird.y + bird.r > pipe.gapBottom;

      if (hitX && (hitTop || hitBottom)) {
        state.gameOver = true;
      }
    }

    while (pipes.length > 0 && pipes[0].x + pipes[0].w < -90) {
      pipes.shift();
    }

    if (bird.y - bird.r < 0 || bird.y + bird.r > logicalHeight) {
      state.gameOver = true;
    }

    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer <= 0) resetCombo();
    updateBest();

    if (state.gameOver) {
      setMessage(
        "Flight clipped",
        CONFIG.restartPolish ? "Tap anywhere to retry instantly and protect your lane." : "Tap to restart."
      );
      triggerJuice(bird.x, bird.y, CONFIG.palette.accent2, 20);
    }
  }

  function draw() {
    ctx.fillStyle = CONFIG.palette.bg;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    for (let index = 0; index < 24; index += 1) {
      const x = (index * 80 - performance.now() * 0.03) % (logicalWidth + 80);
      const y = 120 + Math.sin(index + performance.now() * 0.0015) * 28;
      ctx.moveTo(x, y);
      ctx.arc(x, y, 18, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.fillStyle = CONFIG.palette.accent2;
    for (const pipe of pipes) {
      ctx.fillRect(pipe.x, 0, pipe.w, pipe.gapTop);
      ctx.fillRect(pipe.x, pipe.gapBottom, pipe.w, logicalHeight - pipe.gapBottom);
    }

    ctx.fillStyle = CONFIG.palette.accent;
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
    ctx.fill();
  }

  return { update, draw, reset };
}
`
}
