/**
 * PR 리뷰좀요 - Intro Animation & Confetti Fireworks
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fireworks-canvas');
  const ctx = canvas.getContext('2d');
  const introText = document.getElementById('intro-text');
  const replayBtn = document.getElementById('replay-btn');

  let particles = [];
  let animationFrameId = null;
  let dpr = window.devicePixelRatio || 1;

  // High quality color palette (Vibrant yet refined)
  const COLORS = [
    '#FF3B30', // Vibrant Red
    '#FF9500', // Bright Orange
    '#FFCC00', // Celebration Yellow
    '#34C759', // Emerald Green
    '#007AFF', // Electric Blue
    '#5856D6', // Royal Purple
    '#FF2D55', // Hot Pink
    '#00C7BE', // Cyan / Teal
  ];

  // Canvas size adjustment for Retina / High-DPI displays
  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  /**
   * Particle Class
   */
  class Particle {
    constructor(x, y, burstAngleRange) {
      this.x = x;
      this.y = y;

      // Burst direction: predominantly upwards, left, and right (avoiding straight down)
      const minAngle = burstAngleRange ? burstAngleRange[0] : -Math.PI * 0.95;
      const maxAngle = burstAngleRange ? burstAngleRange[1] : -Math.PI * 0.05;
      const angle = minAngle + Math.random() * (maxAngle - minAngle);

      // Explosive initial speed
      const speed = 7 + Math.random() * 11;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;

      // Physics factors
      this.friction = 0.94 + Math.random() * 0.02; // Smooth deceleration
      this.gravity = 0.18 + Math.random() * 0.08;   // Natural drop

      // Visual attributes
      this.size = 6 + Math.random() * 6;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.shape = Math.random() > 0.4 ? 'rect' : 'circle';
      
      // 3D-like flip and rotation
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.25;
      this.scaleX = 1;
      this.scaleSpeed = 0.05 + Math.random() * 0.05;

      // Lifespan & Fade out
      this.alpha = 1;
      this.decay = 0.012 + Math.random() * 0.008; // Lasts ~1.2s - 1.8s
    }

    update() {
      // Apply physics
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;

      this.x += this.vx;
      this.y += this.vy;

      // Rotation & Flip animation
      this.rotation += this.rotSpeed;
      this.scaleX = Math.cos(this.rotation);

      // Fade out
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

      if (this.shape === 'rect') {
        context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.7);
      } else {
        context.beginPath();
        context.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        context.fill();
      }

      context.restore();
    }
  }

  /**
   * Spawn a burst of fireworks particles around the text
   */
  function createBurst(count, angleRange) {
    const rect = introText.getBoundingClientRect();
    // Origin centered near the text
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      // Slight random offset from center for organic spread
      const offsetX = (Math.random() - 0.5) * (rect.width * 0.6);
      const offsetY = (Math.random() - 0.5) * (rect.height * 0.4);
      particles.push(new Particle(originX + offsetX, originY + offsetY, angleRange));
    }

    if (!animationFrameId) {
      animateParticles();
    }
  }

  /**
   * Animation Loop
   */
  function animateParticles() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      animationFrameId = requestAnimationFrame(animateParticles);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      animationFrameId = null;
    }
  }

  /**
   * Run Intro Sequence
   */
  function startIntroAnimation() {
    // Reset state
    particles = [];
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Reset CSS animation
    introText.classList.remove('animate');
    replayBtn.classList.remove('visible');
    
    // Force reflow
    void introText.offsetWidth;

    // Start text animation
    introText.classList.add('animate');

    // 1st Fireworks Burst (Right as text starts rising ~250ms)
    setTimeout(() => {
      createBurst(35, [-Math.PI * 0.9, -Math.PI * 0.1]);
    }, 250);

    // 2nd Fireworks Burst (As text reaches peak ~650ms, light celebration accent)
    setTimeout(() => {
      createBurst(25, [-Math.PI * 0.85, -Math.PI * 0.15]);
    }, 650);

    // Show replay button after intro finishes
    setTimeout(() => {
      replayBtn.classList.add('visible');
    }, 1800);
  }

  // Trigger animation on load
  startIntroAnimation();

  // Replay on button click or screen click (excluding replay button itself)
  replayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startIntroAnimation();
  });

  document.body.addEventListener('click', (e) => {
    if (e.target !== replayBtn && !replayBtn.contains(e.target)) {
      startIntroAnimation();
    }
  });
});
