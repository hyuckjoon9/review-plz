document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fireworks-canvas');
  const ctx = canvas.getContext('2d');

  // Decoupled DOM Transform Hierarchy
  const titleWrapper = document.getElementById('title-wrapper');
  const titleEffects = document.getElementById('title-effects');
  const mainTitle = document.getElementById('main-title');
  const shineText = document.getElementById('shine-text');

  const sunburst = document.getElementById('sunburst');
  const shockwave = document.getElementById('shockwave');
  const flashOverlay = document.getElementById('flash-overlay');

  const subtext1 = document.getElementById('subtext-1');
  const subtext2 = document.getElementById('subtext-2');
  const subtext3 = document.getElementById('subtext-3');
  const replayBtn = document.getElementById('replay-btn');

  let particles = [];
  let ambientParticles = [];
  let animationFrameId = null;
  let dpr = window.devicePixelRatio || 1;
  let ambientActive = false;
  let timeoutIds = [];

  // Super Vibrant Color Palette
  const COLORS = [
    '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
    '#007AFF', '#5856D6', '#AF52DE', '#FF2D55',
    '#00C7BE', '#FFD700', '#FF5722', '#00E676', '#FFFFFF'
  ];

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  /**
   * Helper: Draw 5-Point Star
   */
  function drawStar(context, r) {
    context.beginPath();
    for (let i = 0; i < 5; i++) {
      context.lineTo(
        Math.cos(((18 + i * 72) * Math.PI) / 180) * r,
        -Math.sin(((18 + i * 72) * Math.PI) / 180) * r
      );
      context.lineTo(
        Math.cos(((54 + i * 72) * Math.PI) / 180) * (r * 0.4),
        -Math.sin(((54 + i * 72) * Math.PI) / 180) * (r * 0.4)
      );
    }
    context.closePath();
    context.fill();
  }

  /**
   * Fast Glowing Spark Particle (High Speed Line Trails)
   */
  class SparkParticle {
    constructor(x, y, angleRange = null) {
      this.x = x;
      this.y = y;

      const minAngle = angleRange ? angleRange[0] : 0;
      const maxAngle = angleRange ? angleRange[1] : Math.PI * 2;
      const angle = minAngle + Math.random() * (maxAngle - minAngle);

      const speed = 14 + Math.random() * 16;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.friction = 0.90 + Math.random() * 0.03;
      this.gravity = 0.12;

      this.color = Math.random() > 0.3 ? '#FFD700' : '#FFFFFF';
      this.length = 12 + Math.random() * 16;
      this.alpha = 1;
      this.decay = 0.025 + Math.random() * 0.02;
    }

    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }

    draw(context) {
      if (this.alpha <= 0) return;
      context.save();
      context.globalAlpha = Math.max(0, this.alpha);
      context.strokeStyle = this.color;
      context.lineWidth = 2.5;
      context.beginPath();
      context.moveTo(this.x, this.y);
      context.lineTo(this.x - this.vx * 1.5, this.y - this.vy * 1.5);
      context.stroke();
      context.restore();
    }
  }

  /**
   * Multi-Shape Firework Particle (Star, Circle, Rect, Ribbon)
   */
  class FireworkParticle {
    constructor(x, y, shapeType = null, angleRange = null) {
      this.x = x;
      this.y = y;

      const minAngle = angleRange ? angleRange[0] : 0;
      const maxAngle = angleRange ? angleRange[1] : Math.PI * 2;
      const angle = minAngle + Math.random() * (maxAngle - minAngle);

      const speed = 7 + Math.random() * 16;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;

      this.friction = 0.93 + Math.random() * 0.03;
      this.gravity = 0.16 + Math.random() * 0.1;

      this.size = 5 + Math.random() * 9;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];

      const shapes = ['rect', 'circle', 'star', 'ribbon'];
      this.shape = shapeType || shapes[Math.floor(Math.random() * shapes.length)];

      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.35;
      this.scaleX = 1;

      this.alpha = 1;
      this.decay = 0.009 + Math.random() * 0.009;
    }

    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;

      this.x += this.vx;
      this.y += this.vy;

      this.rotation += this.rotSpeed;
      this.scaleX = Math.cos(this.rotation);
      this.alpha -= this.decay;
    }

    draw(context) {
      if (this.alpha <= 0) return;

      context.save();
      context.globalAlpha = Math.max(0, this.alpha);
      context.translate(this.x, this.y);
      context.rotate(this.rotation);
      context.scale(this.scaleX, 1);
      context.fillStyle = this.color;

      if (this.shape === 'star') {
        drawStar(context, this.size * 0.85);
      } else if (this.shape === 'circle') {
        context.beginPath();
        context.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        context.fill();
      } else if (this.shape === 'ribbon') {
        context.fillRect(-this.size * 0.9, -this.size * 0.25, this.size * 1.8, this.size * 0.5);
      } else {
        context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.75);
      }

      context.restore();
    }
  }

  /**
   * Flying Party Popper Emoji Particle
   */
  class FlyingEmoji {
    constructor(fromLeft) {
      this.x = fromLeft ? -40 : window.innerWidth + 40;
      this.y = window.innerHeight * 0.3 + Math.random() * (window.innerHeight * 0.4);

      const targetX = window.innerWidth / 2 + (Math.random() - 0.5) * 240;
      const targetY = window.innerHeight * 0.35;
      const angle = Math.atan2(targetY - this.y, targetX - this.x);
      const speed = 14 + Math.random() * 9;

      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 5;
      this.gravity = 0.25;

      const emojis = ['🎉', '✨', '🏆', '🎆', '🥳'];
      this.emoji = emojis[Math.floor(Math.random() * emojis.length)];
      this.size = 30 + Math.random() * 14;
      this.rotation = 0;
      this.rotSpeed = fromLeft ? 0.16 : -0.16;
      this.alpha = 1;
      this.decay = 0.011;
    }

    update() {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;
      this.alpha -= this.decay;
    }

    draw(context) {
      if (this.alpha <= 0) return;
      context.save();
      context.globalAlpha = Math.max(0, this.alpha);
      context.translate(this.x, this.y);
      context.rotate(this.rotation);
      context.font = `${this.size}px sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(this.emoji, 0, 0);
      context.restore();
    }
  }

  /**
   * Continuous Ambient Falling Confetti & Twinkling Stars
   */
  class FallingConfetti {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * window.innerWidth;
      this.y = -20 - Math.random() * 120;
      this.size = 4.5 + Math.random() * 6.5;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.vy = 1.6 + Math.random() * 2.8;
      this.vx = (Math.random() - 0.5) * 1.8;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.12;
      this.scaleX = 1;
      this.opacity = 0.65 + Math.random() * 0.35;
    }

    update() {
      this.y += this.vy;
      this.x += Math.sin(this.y * 0.02) * 0.9 + this.vx;
      this.rotation += this.rotSpeed;
      this.scaleX = Math.cos(this.rotation);

      if (this.y > window.innerHeight + 25) {
        this.reset();
      }
    }

    draw(context) {
      context.save();
      context.globalAlpha = this.opacity;
      context.translate(this.x, this.y);
      context.rotate(this.rotation);
      context.scale(this.scaleX, 1);
      context.fillStyle = this.color;
      context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
      context.restore();
    }
  }

  class TwinkleStar {
    constructor() {
      this.x = Math.random() * window.innerWidth;
      this.y = Math.random() * window.innerHeight;
      this.size = 3 + Math.random() * 5.5;
      this.color = '#FFD700';
      this.alpha = Math.random();
      this.speed = 0.02 + Math.random() * 0.035;
      this.growing = Math.random() > 0.5;
    }

    update() {
      if (this.growing) {
        this.alpha += this.speed;
        if (this.alpha >= 1) this.growing = false;
      } else {
        this.alpha -= this.speed;
        if (this.alpha <= 0) {
          this.growing = true;
          this.x = Math.random() * window.innerWidth;
          this.y = Math.random() * window.innerHeight;
        }
      }
    }

    draw(context) {
      context.save();
      context.globalAlpha = Math.max(0, this.alpha);
      context.translate(this.x, this.y);
      context.fillStyle = this.color;
      drawStar(context, this.size);
      context.restore();
    }
  }

  /**
   * Spawn Explosive Firework Burst (Multi-Layered: Sparks + Confetti)
   */
  function createBurst(x, y, count = 55, spreadType = 'all') {
    let angleRange = null;
    if (spreadType === 'up') angleRange = [-Math.PI * 0.95, -Math.PI * 0.05];
    if (spreadType === 'left') angleRange = [-Math.PI * 0.95, -Math.PI * 0.35];
    if (spreadType === 'right') angleRange = [-Math.PI * 0.65, -Math.PI * 0.05];

    // Sparks (Fast line trails)
    const sparkCount = Math.floor(count * 0.4);
    for (let i = 0; i < sparkCount; i++) {
      particles.push(new SparkParticle(x, y, angleRange));
    }

    // Firework Particles (Multi-shaped)
    for (let i = 0; i < count; i++) {
      particles.push(new FireworkParticle(x, y, null, angleRange));
    }

    if (!animationFrameId) animate();
  }

  /**
   * Side Cannon Confetti Blast
   */
  function launchSideCannon(fromLeft) {
    const startX = fromLeft ? 0 : window.innerWidth;
    const startY = window.innerHeight * 0.85;
    const angleRange = fromLeft ? [-Math.PI * 0.45, -Math.PI * 0.15] : [-Math.PI * 0.85, -Math.PI * 0.55];

    for (let i = 0; i < 40; i++) {
      particles.push(new FireworkParticle(startX, startY, 'ribbon', angleRange));
    }
    if (!animationFrameId) animate();
  }

  /**
   * Render Loop
   */
  function animate() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Active Burst Particles & Emojis
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // Ambient Falling Confetti & Stars
    if (ambientActive) {
      for (let i = 0; i < ambientParticles.length; i++) {
        ambientParticles[i].update();
        ambientParticles[i].draw(ctx);
      }
    }

    if (particles.length > 0 || ambientActive) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      animationFrameId = null;
    }
  }

  function scheduleTask(delay, fn) {
    const id = setTimeout(fn, delay);
    timeoutIds.push(id);
  }

  function clearAllSchedule() {
    timeoutIds.forEach(id => clearTimeout(id));
    timeoutIds = [];
  }

  /**
   * Ultra Celebration Sequence Execution (Isolated Transform Layering)
   */
  function startGrandSequence() {
    clearAllSchedule();
    particles = [];
    ambientParticles = [];
    ambientActive = false;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Reset UI CSS Classes across decoupled DOM transform layers
    sunburst.classList.remove('active');
    shockwave.classList.remove('active');
    flashOverlay.classList.remove('flash-active');

    // Layer 1: Wrapper Y-Movement
    titleWrapper.classList.remove('anim-rise', 'anim-float');
    // Layer 2: Effects Shake
    titleEffects.classList.remove('anim-shake');
    // Layer 3: Title Scale & Glow
    mainTitle.classList.remove('anim-center', 'anim-scale-top', 'anim-glow', 'anim-pop');
    // Layer 4: Shine Gradient
    shineText.classList.remove('shine-active');

    subtext1.classList.remove('show');
    subtext2.classList.remove('show');
    subtext3.classList.remove('show');
    replayBtn.classList.remove('visible');

    // Force Reflow
    void mainTitle.offsetWidth;

    // 0.3s: Layer 3 (#main-title) Local Center Entrance
    scheduleTask(300, () => {
      mainTitle.classList.add('anim-center');
    });

    // 0.7s: Grand Firework Wave 1 (Center Top & Behind Text Explosions)
    scheduleTask(700, () => {
      const titleRect = mainTitle.getBoundingClientRect();
      const centerX = titleRect.left + titleRect.width / 2;
      const topY = titleRect.top - 25;
      const centerY = titleRect.top + titleRect.height / 2;

      sunburst.classList.add('active');
      createBurst(centerX, topY, 60, 'up');
      createBurst(centerX, centerY, 45, 'all');
    });

    // 1.1s: Layer 1 (#title-wrapper) IMMEDIATELY Starts Smooth Y-Axis Rise to -24vh
    //       Layer 3 (#main-title) Smoothly Scales to 0.9 locally
    scheduleTask(1100, () => {
      titleWrapper.classList.add('anim-rise');
      mainTitle.classList.add('anim-scale-top');
    });

    // 1.3s: Layer 2 (#title-effects) Shake + Layer 3 Glow/Pop + Layer 4 Shine + Cannons
    // NOTE: #title-wrapper's translateY(-24vh) transition is 100% UNTOUCHED and continues smoothly!
    scheduleTask(1300, () => {
      flashOverlay.classList.add('flash-active');
      shockwave.classList.add('active');

      titleEffects.classList.add('anim-shake');
      mainTitle.classList.add('anim-glow', 'anim-pop');
      shineText.classList.add('shine-active');

      launchSideCannon(true);
      launchSideCannon(false);

      // Start Ambient Confetti & Twinkling Stars
      for (let i = 0; i < 26; i++) ambientParticles.push(new FallingConfetti());
      for (let i = 0; i < 16; i++) ambientParticles.push(new TwinkleStar());
      ambientActive = true;

      if (!animationFrameId) animate();
    });

    // 1.7s (60% into #title-wrapper Y-Rise): Subtext 1 ("금방 끝나요 ^^") Overlapping Entrance
    scheduleTask(1700, () => {
      subtext1.classList.add('show');
      createBurst(window.innerWidth * 0.35, window.innerHeight * 0.65, 30, 'up');
    });

    // 2.1s (#title-wrapper Reaches -24vh Top Position): Subtext 2 ("진짜 별거 없어요") Entrance
    scheduleTask(2100, () => {
      subtext2.classList.add('show');
      createBurst(window.innerWidth * 0.65, window.innerHeight * 0.72, 30, 'up');
    });

    // 2.55s: Subtext 3 ("아마도" - Faint, Small & Ultra-Cheeky) Entrance
    scheduleTask(2550, () => {
      subtext3.classList.add('show');
    });

    // 2.8s: Hilarious Random Delayed Mini Firework Pop! 💥
    scheduleTask(2800, () => {
      const popX = window.innerWidth * 0.62;
      const popY = window.innerHeight * 0.32;
      createBurst(popX, popY, 28, 'all');
      particles.push(new FlyingEmoji(true));
    });

    // 3.2s+: Layer 1 (#title-wrapper) Seamlessly Transitions to Floating Idle Loop at -24vh
    scheduleTask(3200, () => {
      titleWrapper.classList.add('anim-float');
      replayBtn.classList.add('visible');
    });
  }

  // Trigger Sequence on Load
  startGrandSequence();

  // Replay Triggers
  replayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startGrandSequence();
  });

  document.body.addEventListener('click', (e) => {
    if (e.target !== replayBtn && !replayBtn.contains(e.target)) {
      startGrandSequence();
    }
  });
});


