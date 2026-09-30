/* ============================================================
   Randy Malvoisin — spatial gallery
   nav · 3D gallery camera · exhibit dialog · copy email
============================================================ */

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------------- NAV ---------------- */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function setMenu(open){
  navLinks.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', open);
}
navToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('is-open')));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

const sections = [...document.querySelectorAll('main section[id]')];
const navAnchors = [...navLinks.querySelectorAll('a')];
function updateNav(){
  nav.classList.toggle('is-solid', window.scrollY > 40);
  let current = '';
  for (const s of sections){ if (window.scrollY >= s.offsetTop - window.innerHeight * 0.4) current = s.id; }
  navAnchors.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${current}`));
}

/* ---------------- GALLERY ---------------- */
const gallery = document.getElementById('gallery');
const world = document.getElementById('galleryWorld');
const floor = gallery.querySelector('.gallery__floor');
const exhibits = [...world.querySelectorAll('.exhibit')];
const signs = [...world.querySelectorAll('.gallery__sign')].map(el => {
  // a sign hangs just behind the first exhibit that follows it
  let next = el.nextElementSibling;
  while (next && !next.classList.contains('exhibit')) next = next.nextElementSibling;
  return { el, at: exhibits.indexOf(next) };
});
const counterIndex = document.getElementById('galleryIndex');
const counterNow = document.getElementById('galleryNow');
document.getElementById('galleryTotal').textContent = exhibits.length;

// 3D only on wide screens with a fine pointer or large viewport, and when motion is welcome
const spatialQuery = window.matchMedia('(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)');

const SPACING = 1100;     // depth between exhibits (px)
const FIRST = -450;       // where the first exhibit hangs
const FOCUS = -200;       // depth at which an exhibit is "in front of you"
const TRAVEL = (exhibits.length - 1) * SPACING + (FOCUS - FIRST) + 300;
let is3d = false, cam = 0, galleryTop = 0, scrollLen = 1;

// pointer look-around (decorative, springy lerp)
let lookX = 0, lookY = 0, targetX = 0, targetY = 0;

function placement(i){
  const side = i % 2 === 0 ? -1 : 1;
  const xOff = Math.min(window.innerWidth * 0.25, 380);
  return {
    x: side * xOff,
    y: [-10, 30, -40, 20][i % 4],
    rot: side * -16,
    base: FIRST - i * SPACING
  };
}

function measure(){
  is3d = spatialQuery.matches;
  gallery.classList.toggle('is-3d', is3d);
  if (!is3d){
    gallery.style.height = '';
    exhibits.forEach(el => { el.style.transform = ''; el.style.opacity = ''; el.style.pointerEvents = ''; });
    signs.forEach(s => { s.el.style.transform = ''; s.el.style.opacity = ''; });
    world.style.transform = '';
    return;
  }
  // scroll distance that drives the walk: ~70% of a screen per exhibit
  const intro = gallery.querySelector('.gallery__intro').offsetHeight;
  const walk = exhibits.length * window.innerHeight * 0.7;
  gallery.style.height = `${intro + walk + window.innerHeight}px`;
  galleryTop = gallery.offsetTop + intro;
  scrollLen = walk;
  render();
}

function render(){
  if (!is3d) return;
  const progress = Math.min(Math.max((window.scrollY - galleryTop) / scrollLen, 0), 1);
  cam = progress * TRAVEL;

  let nearest = 0, nearestDist = Infinity;
  exhibits.forEach((el, i) => {
    const p = placement(i);
    const z = p.base + cam;
    // fog far away, fade out just before passing the viewer
    const far = Math.min(Math.max((z + 4200) / 1600, 0), 1);
    const near = Math.min(Math.max((260 - z) / 320, 0), 1);
    const opacity = far * near;
    el.style.transform = `translate(-50%, -50%) translate3d(${p.x}px, ${p.y}px, ${z}px) rotateY(${p.rot}deg)`;
    el.style.opacity = opacity.toFixed(3);
    el.style.pointerEvents = opacity < 0.35 ? 'none' : '';
    const d = Math.abs(z - FOCUS);
    if (d < nearestDist){ nearestDist = d; nearest = i; }
  });

  signs.forEach(({ el, at }) => {
    const z = FIRST - at * SPACING - 700 + cam;
    // one sign at a time: fades in from the distance, gone before it reaches you
    const far = Math.min(Math.max((z + 2000) / 700, 0), 1);
    const near = Math.min(Math.max((-100 - z) / 500, 0), 1);
    // keep the sign in the same band near the top of the screen at any depth
    const y = -window.innerHeight * 0.29 * (1 + -z / 900);
    el.style.transform = `translate(-50%, -50%) translate3d(0px, ${y}px, ${z}px)`;
    el.style.opacity = (far * near).toFixed(3);
  });

  counterIndex.textContent = nearest + 1;
  counterNow.textContent = exhibits[nearest].querySelector('.exhibit__title').textContent;
  floor.style.backgroundPosition = `0 ${-(cam % 240)}px, 0 ${-(cam % 240)}px`;
}

function lookLoop(){
  lookX += (targetX - lookX) * 0.08;
  lookY += (targetY - lookY) * 0.08;
  world.style.transform = `rotateY(${lookX}deg) rotateX(${lookY}deg)`;
  if (Math.abs(targetX - lookX) > 0.01 || Math.abs(targetY - lookY) > 0.01) requestAnimationFrame(lookLoop);
  else lookRunning = false;
}
let lookRunning = false;
window.addEventListener('pointermove', e => {
  if (!is3d || e.pointerType !== 'mouse') return;
  targetX = (e.clientX / window.innerWidth - 0.5) * 5;
  targetY = (e.clientY / window.innerHeight - 0.5) * -3;
  if (!lookRunning){ lookRunning = true; requestAnimationFrame(lookLoop); }
}, { passive: true });

// Keyboard users: focusing an exhibit walks the camera to it
exhibits.forEach((el, i) => {
  el.querySelector('.exhibit__open').addEventListener('focus', () => {
    if (!is3d) return;
    const p = placement(i);
    const camNeeded = FOCUS - p.base;
    const y = galleryTop + (camNeeded / TRAVEL) * scrollLen;
    window.scrollTo({ top: y, behavior: 'instant' });
  });
});

let queued = false;
function onScroll(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; updateNav(); render(); });
}
window.addEventListener('scroll', onScroll, { passive: true });
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { measure(); updateNav(); }, 150); });
spatialQuery.addEventListener('change', measure);
// fonts change intro height, so measure again once they're ready
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
measure();
updateNav();

/* ---------------- EXHIBIT DIALOG ---------------- */
const dialog = document.getElementById('detail');
const dTitle = document.getElementById('detailTitle');
const dKicker = document.getElementById('detailKicker');
const dBody = document.getElementById('detailBody');

exhibits.forEach(el => {
  el.querySelector('.exhibit__open').addEventListener('click', () => {
    dKicker.textContent = el.querySelector('.exhibit__kicker').textContent;
    dTitle.textContent = el.querySelector('.exhibit__title').textContent;
    dBody.replaceChildren(el.querySelector('.exhibit__detail').content.cloneNode(true));
    dBody.scrollTop = 0;
    dialog.showModal();
  });
});
document.getElementById('detailClose').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

/* ---------------- COPY EMAIL ---------------- */
const copyBtn = document.getElementById('copyEmail');
const toast = document.getElementById('toast');
copyBtn.addEventListener('click', async () => {
  const email = copyBtn.dataset.copy;
  try{
    await navigator.clipboard.writeText(email);
    toast.textContent = 'Email copied';
  }catch{
    window.location.href = `mailto:${email}`;
    return;
  }
  toast.classList.add('is-shown');
  clearTimeout(copyBtn._t);
  copyBtn._t = setTimeout(() => toast.classList.remove('is-shown'), 1800);
});
