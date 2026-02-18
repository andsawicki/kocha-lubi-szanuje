// =============================================
// Kocha, Lubi, Szanuje 2.0
// =============================================

const WORDS = ['Kocha', 'Lubi', 'Szanuje'];

const WORD_COLORS = {
  Kocha: '#E91E63',
  Lubi: '#FF9800',
  Szanuje: '#9C27B0',
};

const PETAL_COLORS = [
  '#FF6B9D', '#FF8A65', '#FFD54F', '#CE93D8', '#81D4FA',
  '#F48FB1', '#FFAB91', '#FFF176', '#B39DDB', '#80DEEA',
];

const CONFETTI_COLORS = [
  '#FF6B9D', '#FFD54F', '#81D4FA', '#CE93D8',
  '#FF8A65', '#66BB6A', '#F48FB1',
];

const STATE = {
  petalCount: 0,
  petalsRemaining: 0,
  currentWordIndex: 0,
  isAnimating: false,
};

// ---- Ekrany ----

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// ---- Start gry ----

function startGame() {
  STATE.petalCount = Math.floor(Math.random() * 6) + 7; // 7–12
  STATE.petalsRemaining = STATE.petalCount;
  STATE.currentWordIndex = 0;
  STATE.isAnimating = false;

  document.getElementById('particles').innerHTML = '';
  generateFlower(STATE.petalCount);
  showScreen('screen-game');
}

// ---- Generowanie kwiatka ----

function generateFlower(count) {
  const flower = document.getElementById('flower');

  // Usuń poprzednie płatki
  flower.querySelectorAll('.petal-wrapper').forEach((el) => el.remove());
  // Usuń poprzednie floating words
  const container = document.getElementById('flower-container');
  container.querySelectorAll('.floating-word').forEach((el) => el.remove());

  const angleStep = 360 / count;

  for (let i = 0; i < count; i++) {
    const angle = angleStep * i;
    const color = PETAL_COLORS[i % PETAL_COLORS.length];

    const wrapper = document.createElement('div');
    wrapper.className = 'petal-wrapper';
    wrapper.style.transform = `rotate(${angle}deg)`;

    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.background = `linear-gradient(to top, ${color}, ${lighten(color, 30)})`;
    petal.dataset.index = i;
    petal.dataset.angle = angle;

    // Animacja wejścia z opóźnieniem
    petal.classList.add('petal-enter');
    petal.style.animationDelay = `${i * 0.08}s`;

    petal.addEventListener('click', () => pluckPetal(petal, wrapper, angle));

    wrapper.appendChild(petal);
    flower.appendChild(wrapper);
  }
}

// ---- Wyrywanie płatka ----

function pluckPetal(petalEl, wrapper, angle) {
  if (STATE.isAnimating) return;
  if (petalEl.classList.contains('plucked')) return;

  STATE.isAnimating = true;

  const word = WORDS[STATE.currentWordIndex];
  const wordColor = WORD_COLORS[word];

  STATE.currentWordIndex = (STATE.currentWordIndex + 1) % WORDS.length;
  STATE.petalsRemaining--;

  // Animacja wyrwania
  petalEl.classList.add('plucked');

  // Pokaż słowo
  showFloatingWord(word, wordColor, angle);

  // Dźwięk
  playPluckSound();

  if (STATE.petalsRemaining === 0) {
    setTimeout(() => {
      showResult(word, wordColor);
    }, 1000);
  } else {
    setTimeout(() => {
      STATE.isAnimating = false;
    }, 400);
  }
}

// ---- Unoszące się słowo ----

function showFloatingWord(word, color, angleDeg) {
  const container = document.getElementById('flower-container');
  const flower = document.getElementById('flower');
  const flowerRect = flower.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  const radius = flowerRect.width * 0.45;

  const centerX = flowerRect.left - containerRect.left + flowerRect.width / 2;
  const centerY = flowerRect.top - containerRect.top + flowerRect.height / 2;

  const wordX = centerX + Math.cos(angleRad) * radius;
  const wordY = centerY + Math.sin(angleRad) * radius;

  const el = document.createElement('div');
  el.className = 'floating-word';
  el.textContent = word;
  el.style.color = color;
  el.style.left = `${wordX}px`;
  el.style.top = `${wordY}px`;

  container.appendChild(el);

  el.addEventListener('animationend', () => el.remove());
}

// ---- Wynik ----

function showResult(word, color) {
  const resultEl = document.getElementById('result-word');
  resultEl.textContent = word;
  resultEl.style.color = color;

  // Wymuś ponowne odpalenie animacji
  resultEl.style.animation = 'none';
  // eslint-disable-next-line no-unused-expressions
  resultEl.offsetHeight; // reflow
  resultEl.style.animation = '';

  createConfetti(color);
  showScreen('screen-result');
}

// ---- Konfetti ----

function createConfetti(accentColor) {
  const container = document.getElementById('particles');
  container.innerHTML = '';

  const colors = [...CONFETTI_COLORS, accentColor];

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.6;
    const size = Math.random() * 8 + 4;
    const drift = (Math.random() - 0.5) * 200;

    particle.style.left = `${left}%`;
    particle.style.top = '-10px';
    particle.style.width = `${size}px`;
    particle.style.height = `${size * 0.6}px`;
    particle.style.background = color;
    particle.style.animationDelay = `${delay}s`;
    particle.style.setProperty('--drift', `${drift}px`);

    container.appendChild(particle);
  }
}

// ---- Dźwięk ----

function playPluckSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Audio nie wspierane — ignoruj
  }
}

// ---- Pomocnicze ----

function lighten(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent));
  return `rgb(${r},${g},${b})`;
}

// ---- Event listeners ----

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-replay').addEventListener('click', startGame);
