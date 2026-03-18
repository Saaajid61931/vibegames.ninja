export function renderArenaGameScript() {
  return String.raw`
function createGame() {
  const player = { x: logicalWidth * 0.5, y: logicalHeight * 0.5, r: 18, hp: CONFIG.gameplay.maxHealth };
  const enemies = [];
  const bullets = [];
  let spawnMs = 0;
  let fireMs = 0;

  function reset() {
    enemies.length = 0;
    bullets.length = 0;
    player.x = logicalWidth * 0.5;
    player.y = logicalHeight * 0.5;
    player.hp = CONFIG.gameplay.maxHealth;
    state.score = 0;
    state.started = false;
    state.gameOver = false;
    resetCombo();
    spawnMs = 0;
    fireMs = 0;
    setMessage(CONFIG.title, CONFIG.controlsHint);
  }

  function startOrRestart() {
    if (state.gameOver) {
      reset();
      return;
    }
    state.started = true;
    setMessage(CONFIG.title, "Stay moving. Auto-fire keeps pressure on the nearest target.");
  }

  function spawnEnemy() {
    const edge = Math.floor(rand(0, 4));
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = rand(0, logicalWidth);
      y = -40;
    } else if (edge === 1) {
      x = logicalWidth + 40;
      y = rand(0, logicalHeight);
    } else if (edge === 2) {
      x = rand(0, logicalWidth);
      y = logicalHeight + 40;
    } else {
      x = -40;
      y = rand(0, logicalHeight);
    }

    enemies.push({ x, y, r: rand(14, 24), hp: 1 + Math.floor(CONFIG.difficulty / 5) });
  }

  function update(dt) {
    if (input.pressed) {
      input.pressed = false;
      if (!state.started || state.gameOver) startOrRestart();
    }

    if (!state.started || state.gameOver) return;

    let moveX = 0;
    let moveY = 0;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;
    if (input.up) moveY -= 1;
    if (input.down) moveY += 1;
    if (input.pointerActive) {
      moveX = input.pointerX - player.x;
      moveY = input.pointerY - player.y;
    }

    const length = Math.hypot(moveX, moveY) || 1;
    player.x = clamp(player.x + (moveX / length) * CONFIG.gameplay.playerSpeed * 60 * dt, 28, logicalWidth - 28);
    player.y = clamp(player.y + (moveY / length) * CONFIG.gameplay.playerSpeed * 60 * dt, 28, logicalHeight - 28);

    spawnMs += dt * 1000;
    fireMs += dt * 1000;

    if (spawnMs >= CONFIG.gameplay.enemySpawnMs) {
      spawnMs = 0;
      spawnEnemy();
    }

    const target = enemies
      .slice()
      .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0]

    if (target && fireMs >= CONFIG.gameplay.fireRateMs) {
      fireMs = 0;
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      bullets.push({ x: player.x, y: player.y, dx: Math.cos(angle) * 7.8, dy: Math.sin(angle) * 7.8, life: 1.15 });
      triggerJuice(player.x, player.y, CONFIG.palette.accent, 6);
    }

    for (const bullet of bullets) {
      bullet.x += bullet.dx * 60 * dt;
      bullet.y += bullet.dy * 60 * dt;
      bullet.life -= dt;
    }

    for (const enemy of enemies) {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.x += Math.cos(angle) * CONFIG.gameplay.enemySpeed * 60 * dt;
      enemy.y += Math.sin(angle) * CONFIG.gameplay.enemySpeed * 60 * dt;
      const touch = Math.hypot(enemy.x - player.x, enemy.y - player.y) < enemy.r + player.r;
      if (touch) {
        player.hp -= dt * 1.6;
        state.flash = 0.24;
        resetCombo();
      }
    }

    for (const enemy of enemies) {
      for (const bullet of bullets) {
        if (bullet.life <= 0) continue;
        if (Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < enemy.r + 5) {
          enemy.hp -= 1;
          bullet.life = 0;
          if (enemy.hp <= 0) {
            const combo = addComboStep();
            state.score += 18 * combo;
            triggerJuice(enemy.x, enemy.y, CONFIG.palette.accent2, 14);
          }
        }
      }
    }

    for (let index = enemies.length - 1; index >= 0; index -= 1) {
      if (enemies[index].hp <= 0) enemies.splice(index, 1);
    }

    for (let index = bullets.length - 1; index >= 0; index -= 1) {
      const bullet = bullets[index];
      if (
        bullet.life <= 0 ||
        bullet.x < -20 ||
        bullet.x > logicalWidth + 20 ||
        bullet.y < -20 ||
        bullet.y > logicalHeight + 20
      ) {
        bullets.splice(index, 1);
      }
    }

    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer <= 0) resetCombo();
    state.score += dt * 4;
    updateBest();

    if (player.hp <= 0) {
      state.gameOver = true;
      setMessage(
        "Arena lost",
        CONFIG.restartPolish
          ? "Tap to re-enter fast, keep the chaos tighter, and chase a cleaner wave."
          : "Tap to restart."
      );
      triggerJuice(player.x, player.y, CONFIG.palette.accent2, 30);
    }
  }

  function draw() {
    ctx.fillStyle = CONFIG.palette.bg;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= logicalWidth; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, logicalHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= logicalHeight; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(logicalWidth, y);
      ctx.stroke();
    }

    ctx.fillStyle = CONFIG.palette.accent;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = CONFIG.palette.accent2;
    for (const enemy of enemies) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#ffffff";
    for (const bullet of bullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(24, logicalHeight - 34, logicalWidth - 48, 14);
    ctx.fillStyle = CONFIG.palette.accent;
    ctx.fillRect(24, logicalHeight - 34, (logicalWidth - 48) * clamp(player.hp / CONFIG.gameplay.maxHealth, 0, 1), 14);
  }

  return { update, draw, reset };
}
`
}
