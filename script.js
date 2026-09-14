const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Exemplos com cópias nas extremidades para transições contínuas.
document.querySelectorAll('.plan-examples').forEach(carousel => {
  const viewport = carousel.querySelector('.examples-track');
  const slides = [...viewport.querySelectorAll('.example-slide')];

  const total = slides.length;
  const first = slides[0].cloneNode(true);
  const last = slides[total - 1].cloneNode(true);
  [first, last].forEach(clone => clone.setAttribute('aria-hidden', 'true'));
  viewport.prepend(last);
  viewport.append(first);
  let width = 0;
  let timer;
  let busy = false;
  let touching = false;
  const step = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(viewport).gap);
  function jump(position) {
    viewport.style.scrollSnapType = 'none';
    viewport.scrollTo({left: position * width, behavior: 'instant'});
    requestAnimationFrame(() => { viewport.style.scrollSnapType = ''; });
  }
  function update() {
    if (!width) return;
    const position = Math.round(viewport.scrollLeft / width);
    const index = ((position - 1) % total + total) % total;
  }
  function settle() {
    if (touching || !width) return;
    const position = Math.round(viewport.scrollLeft / width);
    if (position === 0) jump(total);
    else if (position === total + 1) jump(1);
    busy = false;
    update();
  }
  function navigate(direction) {
    if (busy || touching || !width) return;
    settle();
    const position = Math.round(viewport.scrollLeft / width);
    busy = true;
    viewport.scrollTo({left: (position + direction) * width, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  }
  let visible = false;
  let pauseUntil = 0;
  const pauseForInteraction = () => { pauseUntil = Date.now() + 5000; };
  viewport.addEventListener('touchstart', pauseForInteraction, {passive:true});
  viewport.addEventListener('pointerdown', pauseForInteraction, {passive:true});
  viewport.addEventListener('keydown', pauseForInteraction);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
  }, {threshold:0.25}).observe(viewport);
  setInterval(() => {
    if (visible && !document.hidden && Date.now() >= pauseUntil) navigate(1);
  }, 3500);
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  viewport.addEventListener('scroll', () => {
    update();
    clearTimeout(timer);
    timer = setTimeout(settle, 160);
  }, {passive:true});
  viewport.addEventListener('scrollend', settle);
  viewport.addEventListener('touchstart', () => { touching = true; }, {passive:true});
  function endTouch() { touching = false; pauseForInteraction(); clearTimeout(timer); timer = setTimeout(settle, 160); }
  viewport.addEventListener('touchend', endTouch, {passive:true});
  viewport.addEventListener('touchcancel', endTouch, {passive:true});
  new ResizeObserver(() => {
    const nextWidth = step();
    if (Math.abs(nextWidth - width) < .5) return;
    const current = width ? Math.round(viewport.scrollLeft / width) : 1;
    width = nextWidth;
    jump(Math.max(1, Math.min(total, current)));
    busy = false;
    update();
  }).observe(viewport);
});
// Carrossel horizontal circular com conjuntos duplicados nas extremidades.
(() => {
  const root = document.querySelector('.testimonials-carousel');
  const viewport = root.querySelector('.testimonials-grid');
  const originals = [...viewport.children];
  const total = originals.length;
  const counter = root.querySelector('.review-count');
  originals.forEach((card, i) => {
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `${i + 1} de ${total}`);
  });
  function cloneSet() {
    const fragment = document.createDocumentFragment();
    originals.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      fragment.appendChild(clone);
    });
    return fragment;
  }
  viewport.prepend(cloneSet());
  viewport.append(cloneSet());
  const step = () => originals[0].getBoundingClientRect().width + parseFloat(getComputedStyle(viewport).gap);
  let initialized = false;
  function sync() {
    const width = step();
    const cycle = width * total;
    if (!cycle) return;
    if (viewport.scrollLeft < cycle - width / 2) viewport.scrollLeft += cycle;
    else if (viewport.scrollLeft >= cycle * 2 - width / 2) viewport.scrollLeft -= cycle;
    const index = ((Math.round(viewport.scrollLeft / width) % total) + total) % total;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${total}`;
  }
  function move(direction) { viewport.scrollLeft += direction * step(); sync(); }
  root.querySelector('.review-prev').addEventListener('click', () => move(-1));
  root.querySelector('.review-next').addEventListener('click', () => move(1));
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  viewport.addEventListener('scroll', () => { if (initialized) sync(); }, {passive:true});
  new ResizeObserver(() => {
    initialized = false;
    viewport.scrollLeft = step() * total;
    initialized = true;
    sync();
  }).observe(viewport);
})();






