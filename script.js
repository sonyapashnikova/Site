const viewport = document.querySelector('#site-viewport');
const artboards = [...document.querySelectorAll('.artboard')];
const DESIGN_VIEWPORT = 1280;
const getScale = () => window.innerWidth / DESIGN_VIEWPORT;

document.querySelectorAll('.card-hotspot').forEach((card) => {
  const toggleCard = () => {
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
  };
  card.addEventListener('click', toggleCard);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleCard();
    }
  });
});

function replayReveal(artboard) {
  if (!artboard) return;
  artboard.classList.remove('is-visible');
  void artboard.offsetWidth;
  requestAnimationFrame(() => artboard.classList.add('is-visible'));
}

function fitDesign() {
  const scale = getScale();
  document.documentElement.style.setProperty('--scale', scale);
  viewport.style.height = `${3595 * scale}px`;
  updateScrollMotion();
}

let motionFrame = 0;
function updateScrollMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const scale = getScale();
  const viewportCenter = window.scrollY + window.innerHeight / 2;

  artboards.forEach((artboard, index) => {
    const sectionTop = artboard.offsetTop * scale;
    const sectionHeight = artboard.offsetHeight * scale;
    const sectionCenter = sectionTop + sectionHeight / 2;
    const distance = (viewportCenter - sectionCenter) / Math.max(window.innerHeight, 1);
    const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

    artboard.style.setProperty('--bg-shift', `${clamp(distance * 42, 42)}px`);
    artboard.style.setProperty('--header-drift', `${clamp(distance * 10, 10)}px`);
    artboard.style.setProperty('--footer-drift', `${clamp(distance * -12, 12)}px`);
    artboard.style.setProperty('--motto-drift', `${clamp(distance * 16, 16)}px`);
    artboard.style.setProperty('--card-drift', `${clamp(distance * (10 + index * 3), 18)}px`);
  });
}

function requestScrollMotion() {
  if (motionFrame) return;
  motionFrame = requestAnimationFrame(() => {
    motionFrame = 0;
    updateScrollMotion();
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    const scale = getScale();
    window.scrollTo({ top: target.offsetTop * scale, behavior: 'smooth' });
    replayReveal(target);
    history.replaceState(null, '', link.getAttribute('href'));
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const artboard = entry.target;

    if (entry.isIntersecting && !artboard.dataset.inView) {
      artboard.dataset.inView = 'true';
      replayReveal(artboard);
    }

    if (!entry.isIntersecting) {
      delete artboard.dataset.inView;
      artboard.classList.remove('is-visible');
    }
  });
}, { threshold: 0.18 });

let activeArtboard = null;
function revealAtViewportCenter() {
  const scale = getScale();
  const center = window.scrollY + window.innerHeight / 2;
  const next = artboards.find((artboard) => {
    const top = artboard.offsetTop * scale;
    const bottom = top + artboard.offsetHeight * scale;
    return center >= top && center <= bottom;
  });
  if (next !== activeArtboard) {
    activeArtboard = next;
    if (next) replayReveal(next);
  }
}

document.querySelectorAll('.artboard').forEach((artboard) => revealObserver.observe(artboard));

// The first screen must be visible immediately on initial load.
artboards[0]?.classList.add('is-visible');

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  artboards.forEach((artboard) => artboard.classList.add('is-visible'));
}

window.addEventListener('resize', fitDesign);
window.addEventListener('scroll', () => {
  revealAtViewportCenter();
  requestScrollMotion();
}, { passive: true });
fitDesign();
revealAtViewportCenter();
