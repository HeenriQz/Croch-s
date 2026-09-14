'use strict';
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const saving = navigator.connection && navigator.connection.saveData;
  function watch(element, callback) {
    if (!('IntersectionObserver' in window)) { callback(true); return; }
    new IntersectionObserver(entries => callback(entries[0].isIntersecting), {threshold:0.15}).observe(element);
  }
  document.querySelectorAll('.examples-track, .testimonials-grid').forEach(track => {
    const cards = [...track.children];
    if (cards.length < 2) return;
    const count = cards.length;
    const copies = track.classList.contains('examples-track') ? 1 : Math.min(5, count);
    function duplicate(card) {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      return clone;
    }
    track.prepend(...cards.slice(-copies).map(duplicate));
    track.append(...cards.slice(0, copies).map(duplicate));
    let step = 0, visible = false, touching = false, settled, timer, cooldown = 0;
    function jump(index) {
      track.style.scrollSnapType = 'none';
      track.scrollLeft = index * step;
      requestAnimationFrame(() => { track.style.scrollSnapType = ''; });
    }
    function normalize() {
      if (!step || touching) return;
      const index = Math.round(track.scrollLeft / step);
      if (index < copies) jump(index + count);
      else if (index >= copies + count) jump(index - count);
    }
    function measure() {
      const next = cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).gap) || 0);
      if (Math.abs(next - step) < .5) return;
      const index = step ? Math.round(track.scrollLeft / step) : copies;
      step = next;
      jump(Math.max(copies, Math.min(copies + count - 1, index)));
    }
    function move(direction) {
      if (!step || touching) return;
      normalize();
      track.scrollBy({left: direction * step, behavior: motion.matches ? 'auto' : 'smooth'});
    }
    function schedule() {
      clearTimeout(timer);
      if (!visible || document.hidden || motion.matches || saving) return;
      timer = setTimeout(() => {
        if (!touching && Date.now() > cooldown) move(1);
        schedule();
      }, 4500);
    }
    track.addEventListener('scroll', () => {
      clearTimeout(settled);
      settled = setTimeout(normalize, 180);
    }, {passive:true});
    track.addEventListener('touchstart', () => { touching = true; }, {passive:true});
    function release() { touching = false; cooldown = Date.now() + 5000; settled = setTimeout(normalize, 180); }
    track.addEventListener('touchend', release, {passive:true});
    track.addEventListener('touchcancel', release, {passive:true});
    track.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); cooldown = Date.now() + 5000;
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    watch(track, value => { visible = value; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    if (motion.addEventListener) motion.addEventListener('change', schedule);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(track);
    else window.addEventListener('resize', measure);
    measure();
  });
  const video = document.querySelector('.platform-video');
  if (video) {
    let visible = false;
    function playback() {
      const manual = motion.matches || saving;
      video.controls = !!manual;
      if (manual || !visible || document.hidden) { video.pause(); return; }
      video.muted = true;
      const playing = video.play();
      if (playing) playing.catch(() => { video.controls = true; });
    }
    watch(video, value => { visible = value; playback(); });
    document.addEventListener('visibilitychange', playback);
    if (motion.addEventListener) motion.addEventListener('change', playback);
  }
})();
