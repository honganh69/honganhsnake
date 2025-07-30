const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

/* --- CẤU HÌNH GAME --- */
const gridSize = 20;
const tileCountX = canvas.width / gridSize;
const tileCountY = canvas.height / gridSize;
const extraGrow = 3;
let snakeSpeed = 2;
const speedIncrease = 0.1;

let snake = [
  { x: Math.floor(tileCountX / 2) * gridSize, y: Math.floor(tileCountY / 2) * gridSize }
];
let food = {
  x: Math.floor(tileCountX * 3 / 4) * gridSize,
  y: Math.floor(tileCountY * 3 / 4) * gridSize
};
let dx = 0, dy = 0, score = 0;
let isGameStarted = false;
let lastTimestamp = 0;

/* --- LOGO WATERMARK --- */
const gameLogo = new Image();
gameLogo.src = 'Image/logo.png'; // Đảm bảo đúng đường dẫn
let logoLoaded = false;
gameLogo.onload = function() {
  logoLoaded = true;
  if (!isGameStarted) drawIntroScreen();
};
gameLogo.onerror = function() {
  console.error('Không thể tải logo.');
};

function drawLogoOnCanvas() {
  if (!logoLoaded) return;
  ctx.globalAlpha = 0.5;              // Đậm hơn
  const logoWidth = 600;              // Gấp đôi so với ban đầu
  const logoHeight = 300;
  const logoX = (canvas.width - logoWidth) / 2;
  const logoY = (canvas.height - logoHeight) / 2;
  ctx.drawImage(gameLogo, logoX, logoY, logoWidth, logoHeight);
  ctx.globalAlpha = 1.0;              // Reset
}

/* --- ÂM THANH --- */
function playSound(freq, duration) {
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  osc.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration / 1000);
}

/* --- VẼ CƠ BẢN --- */
function drawBackground() {
  ctx.fillStyle = '#1C2526';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00FFFF';
  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('HongAnh Snake', canvas.width - 30, canvas.height - 10);
  ctx.textAlign = 'left';
}

function drawDecorations() {
  ctx.fillStyle = '#4CAF50';
  [[10, 10], [canvas.width - 10, 10], [10, canvas.height - 10], [canvas.width - 10, canvas.height - 10]]
    .forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
}

function drawApple(x, y) {
  const g = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, gridSize / 2);
  g.addColorStop(0, '#FF6666');
  g.addColorStop(1, '#CC0000');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, gridSize / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#663300';
  ctx.fillRect(x - 2, y - gridSize / 2 - 2, 4, 6);
  ctx.fillStyle = '#339933';
  ctx.beginPath();
  ctx.ellipse(x + 3, y - gridSize / 2 + 2, 4, 2, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawIntroScreen() {
  drawBackground();
  drawDecorations();
  drawLogoOnCanvas();              // Watermark logo to giữa màn chờ
  ctx.fillStyle = '#FFD700';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('HongAnh Snake', canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillText('Nhấn Enter để bắt đầu', canvas.width / 2, canvas.height / 2);
}

/* --- LOOP GAME --- */
function drawGame(timestamp) {
  if (!isGameStarted) return;
  lastTimestamp = lastTimestamp || timestamp;
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  drawBackground();
  drawLogoOnCanvas();              // Always draw watermark
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw snake
  snake.forEach((seg, i) => {
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(seg.x + gridSize / 2, seg.y + gridSize / 2, gridSize / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    if (i === 0 && (dx || dy)) {
      ctx.fillStyle = '#fff';
      let ox = 0, oy = 0;
      if (dx > 0) { ox = gridSize * .3; oy = gridSize * .2; }
      else if (dx < 0) { ox = -gridSize * .3; oy = gridSize * .2; }
      else if (dy > 0) { ox = gridSize * .2; oy = gridSize * .3; }
      else { ox = gridSize * .2; oy = -gridSize * .3; }
      [[ox, -oy], [ox, oy]].forEach(([ex, ey]) => {
        ctx.beginPath();
        ctx.arc(seg.x + gridSize / 2 + ex, seg.y + gridSize / 2 + ey, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(seg.x + gridSize / 2 + ex + 1, seg.y + gridSize / 2 + ey, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
      });
    }
  });

  // Draw apple
  drawApple(food.x + gridSize / 2, food.y + gridSize / 2);
  ctx.shadowColor = 'transparent';

  drawDecorations();
  ctx.fillStyle = '#FFD700';
  ctx.font = '16px Arial';
  ctx.fillText(`Điểm: ${score}`, 10, 20);

  // Update snake position
  if (dx || dy) {
    const head = { x: snake[0].x + dx * snakeSpeed, y: snake[0].y + dy * snakeSpeed };
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) return gameOver();
    snake.unshift(head);
    if (snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)) return gameOver();
    if (Math.hypot(head.x - food.x, head.y - food.y) < gridSize / 2) {
      score += 10;
      playSound(440, 100);
      const pop = document.createElement('div');
      pop.className = 'score-popup';
      pop.innerText = '+10';
      pop.style.left = `${food.x + gridSize / 2}px`;
      pop.style.top = `${food.y + gridSize / 2}px`;
      document.body.appendChild(pop);
      setTimeout(() => pop.remove(), 1000);
      for (let i = 0; i < extraGrow; i++) snake.push({ x: snake[snake.length - 1].x, y: snake[snake.length - 1].y });
      snakeSpeed += speedIncrease;
      generateFood();
    } else {
      snake.pop();
    }
  }

  requestAnimationFrame(drawGame);
}

/* --- GAME LOGIC --- */
function generateFood() {
  let x, y, valid = false;
  while (!valid) {
    x = Math.floor(Math.random() * tileCountX) * gridSize;
    y = Math.floor(Math.random() * tileCountY) * gridSize;
    valid = !snake.some(seg => seg.x === x && seg.y === y);
  }
  food = { x, y };
}

function gameOver() {
  playSound(220, 200);
  ctx.fillStyle = '#FFD700';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
  ctx.fillText(`Điểm: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
  ctx.fillText('Nhấn Enter để chơi lại', canvas.width / 2, canvas.height / 2 + 80);
  isGameStarted = false;
}

function startGame() {
  if (isGameStarted) return;
  snake = [{ x: Math.floor(tileCountX / 2) * gridSize, y: Math.floor(tileCountY / 2) * gridSize }];
  food = { x: Math.floor(tileCountX * 3 / 4) * gridSize, y: Math.floor(tileCountY * 3 / 4) * gridSize };
  dx = dy = 0;
  score = 0;
  snakeSpeed = 2;
  isGameStarted = true;
  lastTimestamp = 0;
  requestAnimationFrame(drawGame);
}

/* --- BẮT PHÍM --- */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if (!isGameStarted) startGame();
    return;
  }
  if (!isGameStarted) return;
  switch (e.key) {
    case 'ArrowUp': if (dy !== 1) { dx = 0; dy = -1; } break;
    case 'ArrowDown': if (dy !== -1) { dx = 0; dy = 1; } break;
    case 'ArrowLeft': if (dx !== 1) { dx = -1; dy = 0; } break;
    case 'ArrowRight': if (dx !== -1) { dx = 1; dy = 0; } break;
  }
});

/* --- KHỞI ĐỘNG MÀN HÌNH CHỜ --- */
drawIntroScreen();