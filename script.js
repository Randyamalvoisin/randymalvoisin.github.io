/* ============================================================
   Randy Malvoisin — Portfolio interactions
   Sections: nav, reveal-on-scroll, parallax, hero node canvas,
   terminal type effect, animated counters, project accordion,
   contact (email copy + mailto/linkedin links)
============================================================ */

document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------
   NAV: scrolled state, mobile toggle, active link tracking
--------------------------------------------------------- */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function updateNavScrolled(){
  nav.classList.toggle('is-scrolled', window.scrollY > 30);
}
updateNavScrolled();
window.addEventListener('scroll', updateNavScrolled, { passive: true });

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('[data-nav]');

function updateActiveNav(){
  let current = '';
  sections.forEach(section => {
    const top = section.offsetTop - 140;
    if (window.scrollY >= top) current = section.id;
  });
  navAnchors.forEach(a => {
    a.classList.toggle('is-active', a.getAttribute('href') === `#${current}`);
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* ---------------------------------------------------------
   REVEAL ON SCROLL
--------------------------------------------------------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---------------------------------------------------------
   PARALLAX LAYERS (data-speed attribute)
--------------------------------------------------------- */
const parallaxEls = document.querySelectorAll('[data-speed]');

function updateParallax(){
  const scrollY = window.scrollY;
  parallaxEls.forEach(el => {
    const speed = parseFloat(el.dataset.speed) || 0.2;
    el.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
  });
}

if (!prefersReducedMotion){
  window.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateParallax);
  }, { passive: true });
  updateParallax();
}

/* ---------------------------------------------------------
   TERMINAL TYPE-IN EFFECT (hero)
--------------------------------------------------------- */
const terminalEl = document.getElementById('terminal');
const terminalLines = [
];

function typeTerminal(){
  if (prefersReducedMotion){
    terminalEl.textContent = terminalLines.join('\n');
    return;
  }
  let lineIndex = 0, charIndex = 0, current = '';

  function tick(){
    if (lineIndex >= terminalLines.length) return;
    const line = terminalLines[lineIndex];

    if (charIndex <= line.length){
      terminalEl.textContent = current + line.slice(0, charIndex);
      charIndex++;
      setTimeout(tick, 28);
    } else {
      current += line + '\n';
      lineIndex++;
      charIndex = 0;
      setTimeout(tick, 320);
    }
  }
  tick();
}
typeTerminal();

/* ---------------------------------------------------------
   ANIMATED COUNTERS (about stats)
--------------------------------------------------------- */
const counters = document.querySelectorAll('.stat__num');

function animateCounter(el){
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  if (prefersReducedMotion){
    el.textContent = target + suffix;
    return;
  }
  const duration = 1200;
  const start = performance.now();

  function step(now){
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });

counters.forEach(c => counterObserver.observe(c));

/* ---------------------------------------------------------
   PROJECT PHASE ACCORDION
--------------------------------------------------------- */
document.querySelectorAll('[data-phase]').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.phase').classList.toggle('is-open');
  });
});
// Open the first phase by default
const firstPhase = document.querySelector('.phase');
if (firstPhase) firstPhase.classList.add('is-open');

/* ---------------------------------------------------------
   CONTACT: copy email to clipboard
--------------------------------------------------------- */
const copyEmailBtn = document.getElementById('copyEmailBtn');
const copyToast = document.getElementById('copyToast');
const emailCard = document.getElementById('emailCard');

if (copyEmailBtn){
  copyEmailBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const email = copyEmailBtn.dataset.copy;

    const showToast = () => {
      copyToast.classList.add('is-shown');
      setTimeout(() => copyToast.classList.remove('is-shown'), 1800);
    };

    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(email).then(showToast).catch(() => {
        window.location.href = emailCard.href;
      });
    } else {
      window.location.href = emailCard.href;
    }
  });
}

/* ---------------------------------------------------------
   HERO NODE NETWORK CANVAS
   Ambient drifting nodes connected by lines when in range —
   a small identity-graph motif, sits behind the hero content.
--------------------------------------------------------- */
(function initNodeCanvas(){
  const canvas = document.getElementById('nodeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height, nodes = [];
  const NODE_COUNT_BASE = 70; // per 1,000,000 px^2, scaled below
  const LINK_DIST = 140;
  const accentColor = '45,225,194';

  function resize(){
    width = canvas.width = canvas.offsetWidth * devicePixelRatio;
    height = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }

  function buildNodes(){
    const area = canvas.offsetWidth * canvas.offsetHeight;
    const count = Math.min(90, Math.round((area / 1000000) * NODE_COUNT_BASE));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.18 * devicePixelRatio,
      r: (Math.random() * 1.4 + 0.6) * devicePixelRatio
    }));
  }

  function step(){
    ctx.clearRect(0, 0, width, height);

    // update + draw nodes
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accentColor}, 0.55)`;
      ctx.fill();
    });

    // draw links between near nodes
    const linkDist = LINK_DIST * devicePixelRatio;
    for (let i = 0; i < nodes.length; i++){
      for (let j = i + 1; j < nodes.length; j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist){
          const opacity = (1 - dist / linkDist) * 0.28;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${accentColor}, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    if (!prefersReducedMotion){
      requestAnimationFrame(step);
    }
  }

  function init(){
    resize();
    buildNodes();
    step();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); buildNodes(); if (prefersReducedMotion) step(); }, 200);
  });

  init();
})();

