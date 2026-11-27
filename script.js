// Переворот карточек: состояние живёт в aria-pressed, анимация — в CSS.
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('click', () => {
    card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'));
  });
});

// Подсветка текущего раздела в шапке (aria-current + подчёркивание в CSS).
const links = new Map([...document.querySelectorAll('.nav a')].map((a) => [a.hash.slice(1), a]));
const spy = new IntersectionObserver((entries) => {
  for (const { isIntersecting, target } of entries) {
    if (!isIntersecting) continue;
    links.forEach((a, id) => (id === target.id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
  }
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('.sec').forEach((s) => spy.observe(s));

// Один жест колеса = одна секция (десктоп, где секция помещается в экран).
// Клавиатура и тач работают через CSS scroll-snap; на мобильных секции выше экрана — нативный скролл.
const sections = [...document.querySelectorAll('.sec')];
const desktop = matchMedia('(min-width: 761px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let busy = false;
let lastWheel = 0;
let failsafe = 0;

const release = () => {
  if (performance.now() - lastWheel > 120) busy = false;
  else setTimeout(release, 60); // ждём конца инерции трекпада
};
addEventListener('scrollend', () => busy && release());

addEventListener('wheel', (event) => {
  if (!desktop.matches || event.ctrlKey || event.deltaY === 0) return;
  event.preventDefault();
  lastWheel = performance.now();
  if (busy) return;

  const current = Math.round(scrollY / innerHeight);
  const next = Math.min(sections.length - 1, Math.max(0, current + Math.sign(event.deltaY)));
  if (next === current) return;

  busy = true;
  clearTimeout(failsafe);
  failsafe = setTimeout(() => { busy = false; }, 1500);
  sections[next].scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
}, { passive: false });
