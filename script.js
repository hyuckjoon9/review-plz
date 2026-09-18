/**
 * PR 리뷰좀요 - Over-the-Top Celebration Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fireworks-canvas');
  const ctx = canvas.getContext('2d');
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

  // Vibrant Palette
  const COLORS = [
    '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
    '#007AFF', '#5856D6', '#AF52DE', '#FF2D55',
    '#00C7BE', '#FFD700', '#FF5722', '#00E676'
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
   * Firework Explosion Particle
   */
  class Particle {
    constructor(x, y, shapeType = null, angleRange = null) {
      this.x = x;
      this.y = y;

      const minAngle = angleRange ? angleRange[0] : 0;
      const maxAngle = angleRange ? angleRange[1] : Math.PI * 2;
      const angle = minAngle + Math.random() * (maxAngle - minAngle);

      const speed = 6 + Math.random() * 14;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;

      this.friction = 0.94 + Math.random() * 0.02;
      this.gravity = 0.18 + Math.random() * 0.08;

      this.size = 5 + Math.random() * 8;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];

      const shapes = ['rect', 'circle', 'star', 'ribbon'];
      this.shape = shapeType || shapes[Math.floor(Math.random() * shapes.length)];

      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.3;
      this.scaleX = 1;

      this.alpha = 1;
      this.decay = 0.01 + Math.random() * 0.008;
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
        drawStar(context, this.size * 0.8);
      } else if (this.shape === 'circle') {
        context.beginPath();
        context.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        context.fill();
      } else if (this.shape === 'ribbon') {
        context.fillRect(-this.size * 0.8, -this.size * 0.25, this.size * 1.6, this.size * 0.5);
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

      const targetX = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
      const targetY = window.innerHeight * 0.4;
      const angle = Math.atan2(targetY - this.y, targetX - this.x);
      const speed = 12 + Math.random() * 8;

      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 4; // slight arc upward
      this.gravity = 0.25;

      this.emoji = Math.random() > 0.3 ? '🎉' : '✨';
      this.size = 28 + Math.random() * 12;
      this.rotation = 0;
      this.rotSpeed = fromLeft ? 0.15 : -0.15;
      this.alpha = 1;
      this.decay = 0.012;
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
      this.y = -20 - Math.random() * 100;
      this.size = 4 + Math.random() * 6;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.vy = 1.5 + Math.random() * 2.5;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.1;
      this.scaleX = 1;
      this.opacity = 0.6 + Math.random() * 0.4;
    }

    update() {
      this.y += this.vy;
      this.x += Math.sin(this.y * 0.02) * 0.8 + this.vx;
      this.rotation += this.rotSpeed;
      this.scaleX = Math.cos(this.rotation);

      if (this.y > window.innerHeight + 20) {
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
      this.size = 3 + Math.random() * 5;
      this.color = '#FFD700';
      this.alpha = Math.random();
      this.speed = 0.02 + Math.random() * 0.03;
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
   * Spawn Explosion Burst
   */
  function createBurst(x, y, count = 35, spreadType = 'all') {
    let angleRange = null;
    if (spreadType === 'up') angleRange = [-Math.PI * 0.95, -Math.PI * 0.05];
    if (spreadType === 'left') angleRange = [-Math.PI * 0.95, -Math.PI * 0.4];
    if (spreadType === 'right') angleRange = [-Math.PI * 0.6, -Math.PI * 0.05];

    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, null, angleRange));
    }
    if (!animationFrameId) animate();
  }

  /**
   * Spawn Bottom Mortar Shot
   */
  function launchMortar(targetX, targetY) {
    const startX = targetX;
    const startY = window.innerHeight + 10;
    const count = 28;

    for (let i = 0; i < count; i++) {
      particles.push(new Particle(startX, startY, null, [-Math.PI * 0.75, -Math.PI * 0.25]));
    }
    if (!animationFrameId) animate();
  }

  /**
   * Main Render Loop
   */
  function animate() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Render Burst Particles & Emojis
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // Render Ambient Particles
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
   * Over-the-Top Sequence Execution
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

    // Reset UI CSS Classes
    sunburst.classList.remove('active');
    shockwave.classList.remove('active');
    flashOverlay.classList.remove('flash-active');
    mainTitle.classList.remove('anim-enter', 'anim-shake', 'anim-glow', 'anim-pop', 'anim-float');
    shineText.classList.remove('shine-active');

    subtext1.classList.remove('show');
    subtext2.classList.remove('show');
    subtext3.classList.remove('show');
    replayBtn.classList.remove('visible');

    // Force DOM Reflow
    void mainTitle.offsetWidth;

    // 0.4s: Main Title Entrance Bounce Starts
    scheduleTask(400, () => {
      mainTitle.classList.add('anim-enter');
    });

    // 0.8s: Burst 1 (Center Top Firework) + Activate Golden Rays Sunburst
    scheduleTask(800, () => {
      const titleRect = mainTitle.getBoundingClientRect();
      const centerX = titleRect.left + titleRect.width / 2;
      const topY = titleRect.top - 20;

      sunburst.classList.add('active');
      createBurst(centerX, topY, 45, 'up');
    });

    // 1.1s: Burst 2 & 3 (Left & Right Explosions)
    scheduleTask(1100, () => {
      const titleRect = mainTitle.getBoundingClientRect();
      const leftX = Math.max(50, titleRect.left - 60);
      const rightX = Math.min(window.innerWidth - 50, titleRect.right + 60);
      const centerY = titleRect.top + titleRect.height / 2;

      createBurst(leftX, centerY, 40, 'left');
      createBurst(rightX, centerY, 40, 'right');
    });

    // 1.3s: Shockwave Ring + Screen Flash + Title Glow, Pop Scale, Shake & Shine
    scheduleTask(1300, () => {
      flashOverlay.classList.add('flash-active');
      shockwave.classList.add('active');
      mainTitle.classList.add('anim-glow', 'anim-shake', 'anim-pop');
      shineText.classList.add('shine-active');
    });

    // 1.6s: Ambient Confetti Snowfall + Twinkling Stars + Flying Emojis
    scheduleTask(1600, () => {
      for (let i = 0; i < 22; i++) ambientParticles.push(new FallingConfetti());
      for (let i = 0; i < 15; i++) ambientParticles.push(new TwinkleStar());
      ambientActive = true;

      // Flying 🎉 Emojis from sides
      particles.push(new FlyingEmoji(true));
      particles.push(new FlyingEmoji(false));
      particles.push(new FlyingEmoji(true));
      particles.push(new FlyingEmoji(false));

      if (!animationFrameId) animate();
    });

    // 2.0s: Cheeky Subtext 1 ("금방 끝나요 ^^") + Bottom Mortar Shot
    scheduleTask(2000, () => {
      subtext1.classList.add('show');
      launchMortar(window.innerWidth * 0.35, window.innerHeight * 0.7);
    });

    // 2.7s: Cheeky Subtext 2 ("진짜 별거 없어요") + Bottom Mortar Shot
    scheduleTask(2700, () => {
      subtext2.classList.add('show');
      launchMortar(window.innerWidth * 0.65, window.innerHeight * 0.75);
    });

    // 3.4s: Cheeky Subtext 3 ("아마도" - Small & Faint)
    scheduleTask(3400, () => {
      subtext3.classList.add('show');
    });

    // 4.0s+: Final State - Main Title Floating Loop + Replay Button
    scheduleTask(4000, () => {
      mainTitle.classList.add('anim-float');
      replayBtn.classList.add('visible');
    });
  }

  // Trigger Sequence on Load
  startGrandSequence();

  // Replay Triggering
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

