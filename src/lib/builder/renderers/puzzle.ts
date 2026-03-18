export function renderPuzzleGameScript() {
  return String.raw`
function createGame() {
  const size = CONFIG.gameplay.gridSize;
  const padding = logicalWidth > logicalHeight ? 90 : 42;
  const boardSize = Math.min(logicalWidth, logicalHeight) - padding * 2;
  const cellSize = boardSize / size;
  const offsetX = (logicalWidth - boardSize) / 2;
  const offsetY = (logicalHeight - boardSize) / 2;
  const cells = [];
  let moves = 0;

  function indexAt(col, row) {
    return row * size + col;
  }

  function flip(col, row) {
    const positions = [
      [col, row],
      [col + 1, row],
      [col - 1, row],
      [col, row + 1],
      [col, row - 1],
    ];

    for (const [nextCol, nextRow] of positions) {
      if (nextCol < 0 || nextCol >= size || nextRow < 0 || nextRow >= size) continue;
      const cell = cells[indexAt(nextCol, nextRow)];
      cell.on = !cell.on;
    }
  }

  function solved() {
    return cells.every((cell) => cell.on);
  }

  function shuffleBoard() {
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        cells.push({ col, row, on: true });
      }
    }

    for (let index = 0; index < CONFIG.gameplay.shuffleMoves; index += 1) {
      flip(Math.floor(rand(0, size)), Math.floor(rand(0, size)));
    }
  }

  function reset() {
    cells.length = 0;
    moves = 0;
    state.score = 0;
    state.started = false;
    state.gameOver = false;
    resetCombo();
    shuffleBoard();
    setMessage(CONFIG.title, CONFIG.controlsHint);
  }

  function startOrRestart() {
    if (state.gameOver) {
      reset();
      return;
    }

    state.started = true;
    setMessage(CONFIG.title, "Clear the whole grid into one glowing state.");
  }

  function handleBoardPress(x, y) {
    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);
    if (col < 0 || col >= size || row < 0 || row >= size) return;
    if (!state.started) startOrRestart();
    if (state.gameOver) {
      reset();
      return;
    }

    flip(col, row);
    moves += 1;
    state.score = Math.max(0, 400 - moves * 12);
    triggerJuice(offsetX + col * cellSize + cellSize / 2, offsetY + row * cellSize + cellSize / 2, CONFIG.palette.accent, 12);

    if (solved()) {
      state.gameOver = true;
      updateBest();
      setMessage(
        "Board cleared",
        CONFIG.restartPolish
          ? "Tap again to remix the board and keep your solve speed sharp."
          : "Tap to play again."
      );
      triggerJuice(logicalWidth / 2, logicalHeight / 2, CONFIG.palette.accent2, 26);
    }
  }

  function update() {
    if (input.pressed) {
      input.pressed = false;
      handleBoardPress(input.pointerX, input.pointerY);
    }
  }

  function draw() {
    ctx.fillStyle = CONFIG.palette.bg;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    ctx.fillStyle = CONFIG.palette.panel;
    ctx.fillRect(offsetX - 18, offsetY - 18, boardSize + 36, boardSize + 36);

    for (const cell of cells) {
      const x = offsetX + cell.col * cellSize;
      const y = offsetY + cell.row * cellSize;
      ctx.fillStyle = cell.on ? CONFIG.palette.accent : "rgba(255,255,255,0.08)";
      ctx.fillRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
      if (cell.on) {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(x + 12, y + 12, cellSize - 24, 10);
      }
    }

    ctx.fillStyle = CONFIG.palette.text;
    ctx.font = "18px Arial";
    ctx.fillText("Moves " + moves, 24, 34);
  }

  return { update, draw, reset };
}
`
}
