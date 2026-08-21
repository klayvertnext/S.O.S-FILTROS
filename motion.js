'use strict';

(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const progress = document.querySelector('.scroll-progress span');
  const topbar = document.querySelector('.topbar');
  const hero = document.querySelector('.hero');
  const heroStage = document.querySelector('[data-hero-depth]');
  let scrollFrame = 0;
  let pointerFrame = 0;
  let heroRect = null;

  root.classList.add('js-motion');

  function updateScrollEffects() {
    scrollFrame = 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    if (topbar) topbar.classList.toggle('is-scrolled', window.scrollY > 18);
  }

  function requestScrollUpdate() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
  }

  function setupRevealAnimations() {
    const items = [...document.querySelectorAll('.reveal')];
    items.forEach((item) => item.setAttribute('data-motion-ready', ''));

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });

    items.forEach((item) => observer.observe(item));
  }

  function updateHeroRect() {
    heroRect = hero?.getBoundingClientRect() || null;
  }

  function setupHeroDepth() {
    if (!hero || !heroStage || reducedMotion.matches || !precisePointer.matches) return;
    updateHeroRect();

    hero.addEventListener('pointerenter', updateHeroRect, { passive: true });

    hero.addEventListener('pointermove', (event) => {
      if (!heroRect || pointerFrame) return;
      const x = (event.clientX - heroRect.left) / heroRect.width - 0.5;
      const y = (event.clientY - heroRect.top) / heroRect.height - 0.5;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        heroStage.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
        heroStage.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
      });
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
      heroStage.style.setProperty('--ry', '0deg');
      heroStage.style.setProperty('--rx', '0deg');
    }, { passive: true });
  }

  function resetTilt(card) {
    if (!card) return;
    card.classList.remove('is-tilting');
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  }

  function setupCardDepth() {
    if (reducedMotion.matches || !precisePointer.matches) return;
    let activeCard = null;
    let tiltFrame = 0;
    let nextPoint = null;

    document.addEventListener('pointermove', (event) => {
      const card = event.target.closest('.catalog-card, .about-card, .contact-form, .feedback-form');
      if (!card) {
        resetTilt(activeCard);
        activeCard = null;
        return;
      }
      if (activeCard !== card) {
        resetTilt(activeCard);
        activeCard = card;
        activeCard.classList.add('is-tilting');
      }
      nextPoint = { x: event.clientX, y: event.clientY };
      if (tiltFrame) return;
      tiltFrame = requestAnimationFrame(() => {
        tiltFrame = 0;
        if (!activeCard || !nextPoint) return;
        const rect = activeCard.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (nextPoint.x - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (nextPoint.y - rect.top) / rect.height));
        activeCard.style.setProperty('--tilt-y', `${((x - 0.5) * 6).toFixed(2)}deg`);
        activeCard.style.setProperty('--tilt-x', `${((0.5 - y) * 5).toFixed(2)}deg`);
        activeCard.style.setProperty('--glow-x', `${(x * 100).toFixed(1)}%`);
        activeCard.style.setProperty('--glow-y', `${(y * 100).toFixed(1)}%`);
      });
    }, { passive: true });

    document.addEventListener('pointerleave', () => resetTilt(activeCard), { passive: true });
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', () => {
    updateHeroRect();
    requestScrollUpdate();
  }, { passive: true });

  document.addEventListener('catalog:rendered', () => {
    document.querySelectorAll('#catalogGrid .reveal').forEach((item) => item.classList.add('is-visible'));
  });

  updateScrollEffects();
  setupRevealAnimations();
  setupHeroDepth();
  setupCardDepth();
})();
