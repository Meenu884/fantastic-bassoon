const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 24,
  speed: 280,
};

const keys = {};
const notes = [];
const hazards = [];

let score = 0;
let lives = 3;
let playing = true;
let won = false;
let lastTime = 0;
let noteTimer = 0;
let hazardTimer = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resetGame() {
  score = 0;
  lives = 3;
  playing = true;
  won = false;
  notes.length = 0;
  hazards.length = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  noteTimer = 0;
  hazardTimer = 0;
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  document.querySelector(".controls").textContent =
    "Use WASD or the arrow keys to move. Press Enter to restart.";
}

function spawnNote() {
  const radius = 8 + Math.random() * 6;
  notes.push({
    x: 24 + Math.random() * (canvas.width - 48),
    y: 24 + Math.random() * (canvas.height - 48),
    radius,
    sway: Math.random() * Math.PI * 2,
  });
}

function spawnHazard() {
  const radius = 10 + Math.random() * 8;
  hazards.push({
    x: 24 + Math.random() * (canvas.width - 48),
    y: 24 + Math.random() * (canvas.height - 48),
    radius,
    vx: (Math.random() - 0.5) * 220,
    vy: (Math.random() - 0.5) * 220,
  });
}

function update(delta) {
  if (!playing) return;

  if (keys.ArrowLeft || keys.a) player.x -= player.speed * delta;
  if (keys.ArrowRight || keys.d) player.x += player.speed * delta;
  if (keys.ArrowUp || keys.w) player.y -= player.speed * delta;
  if (keys.ArrowDown || keys.s) player.y += player.speed * delta;

  player.x = clamp(player.x, 26, canvas.width - 26);
  player.y = clamp(player.y, 26, canvas.height - 26);

  noteTimer += delta;
  hazardTimer += delta;

  if (noteTimer > 0.7) {
    noteTimer = 0;
    spawnNote();
  }

  if (hazardTimer > 1.2) {
    hazardTimer = 0;
    spawnHazard();
  }

  for (let i = notes.length - 1; i >= 0; i -= 1) {
    const note = notes[i];
    note.sway += delta * 2.4;
    note.y += Math.sin(note.sway) * 0.8;

    const distance = Math.hypot(note.x - player.x, note.y - player.y);
    if (distance < player.size + note.radius) {
      notes.splice(i, 1);
      score += 1;
      scoreEl.textContent = score;

      if (score >= 12) {
        playing = false;
        won = true;
        document.querySelector(".controls").textContent =
          "You won! Press Enter to play again.";
        return;
      }
    }
  }

  for (let i = hazards.length - 1; i >= 0; i -= 1) {
    const hazard = hazards[i];
    hazard.x += hazard.vx * delta;
    hazard.y += hazard.vy * delta;

    if (hazard.x <= hazard.radius || hazard.x >= canvas.width - hazard.radius) {
      hazard.vx *= -1;
      hazard.x = clamp(hazard.x, hazard.radius, canvas.width - hazard.radius);
    }

    if (hazard.y <= hazard.radius || hazard.y >= canvas.height - hazard.radius) {
      hazard.vy *= -1;
      hazard.y = clamp(hazard.y, hazard.radius, canvas.height - hazard.radius);
    }

    const distance = Math.hypot(hazard.x - player.x, hazard.y - player.y);
    if (distance < player.size + hazard.radius) {
      hazards.splice(i, 1);
      lives -= 1;
      livesEl.textContent = lives;

      if (lives <= 0) {
        playing = false;
        won = false;
        document.querySelector(".controls").textContent =
          "Game over. Press Enter to play again.";
        return;
      }

      player.x = canvas.width / 2;
      player.y = canvas.height / 2;
      notes.length = 0;
      hazards.length = 0;
      noteTimer = 0;
      hazardTimer = 0;
      break;
    }
  }
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#22164a");
  grad.addColorStop(1, "#0a0717");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(1, 1);

  // Body
  ctx.fillStyle = "#4f3bff";
  ctx.beginPath();
  ctx.roundRect(-16, -12, 38, 24, 12);
  ctx.fill();

  // Bell and mouthpiece
  ctx.fillStyle = "#8c63ff";
  ctx.beginPath();
  ctx.arc(18, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffce5c";
  ctx.beginPath();
  ctx.roundRect(-28, -6, 16, 12, 8);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-6, -4, 2.4, 0, Math.PI * 2);
  ctx.arc(2, -4, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawNotes() {
  notes.forEach((note) => {
    ctx.save();
    ctx.translate(note.x, note.y);
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.moveTo(0, -note.radius);
    ctx.lineTo(note.radius * 0.7, -note.radius * 0.4);
    ctx.lineTo(note.radius * 0.2, note.radius * 0.6);
    ctx.lineTo(0, note.radius);
    ctx.lineTo(-note.radius * 0.45, note.radius * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawHazards() {
  hazards.forEach((hazard) => {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.fillStyle = "#212d3d";
    ctx.beginPath();
    ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(0, 0, hazard.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function draw() {
  drawBackground();
  drawHazards();
  drawNotes();
  drawPlayer();
}

function loop(timestamp) {
  const delta = Math.min(0.03, (timestamp - lastTime) / 1000 || 0.016);
  lastTime = timestamp;

  update(delta);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if (event.key === "Enter" && !playing) {
    resetGame();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

resetGame();
requestAnimationFrame(loop);
