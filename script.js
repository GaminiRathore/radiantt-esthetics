// Nav background on scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 60));

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// Auto-scrolling marquees (awards, happy clients, testimonials) — pause on touch as well as hover
document.querySelectorAll('.awards-strip, .client-strip, .test-strip, .acad-gallery-strip').forEach(strip => {
  const reel = strip.querySelector('.awards-reel, .client-reel, .test-reel');
  if (!reel) return;
  strip.addEventListener('touchstart', () => reel.classList.add('paused'), { passive: true });
  strip.addEventListener('touchend', () => reel.classList.remove('paused'), { passive: true });
  strip.addEventListener('touchcancel', () => reel.classList.remove('paused'), { passive: true });
});

// Gate cards (home) — enter on scroll into view
const gateCards = document.querySelectorAll('.gate-card');
if (gateCards.length && 'IntersectionObserver' in window) {
  const gateObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  gateCards.forEach(card => gateObserver.observe(card));
} else {
  gateCards.forEach(card => card.classList.add('is-visible'));
}

// Smooth-scroll for in-page anchors
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) {
      e.preventDefault();
      window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 72, behavior: 'smooth' });
      document.getElementById('mobileMenu').classList.remove('open');
    }
  });
});

// Mobile menu
document.getElementById('hamBtn').onclick = () => document.getElementById('mobileMenu').classList.add('open');
document.getElementById('mobileClose').onclick = () => document.getElementById('mobileMenu').classList.remove('open');

// Lightbox carousel — handles awards strip (.ar-item) and academy gallery (.acad-gal-item)
const lb = document.getElementById('lb');
if (lb) {
  const lbImg = document.getElementById('lbImg');
  const lbVideo = document.getElementById('lbVideo');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  const lbCounter = document.getElementById('lbCounter');

  let items = [];
  let idx = 0;

  const setCounter = () => {
    if (lbCounter) lbCounter.textContent = items.length > 1 ? `${idx + 1} / ${items.length}` : '';
  };

  const showItem = () => {
    const item = items[idx];
    const videoSrc = item.dataset.video;
    if (videoSrc && lbVideo) {
      lbImg.hidden = true;
      lbVideo.hidden = false;
      lbVideo.src = videoSrc;
      lbVideo.currentTime = 0;
      lbVideo.play().catch(() => {});
    } else {
      if (lbVideo) { lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); lbVideo.hidden = true; }
      lbImg.hidden = false;
      lbImg.src = item.dataset.src;
    }
  };

  const goto = (n) => {
    idx = (n + items.length) % items.length;
    lbImg.classList.add('lb-fade');
    setTimeout(() => {
      showItem();
      lbImg.classList.remove('lb-fade');
    }, 180);
    setCounter();
  };

  const openLb = (group, startIdx) => {
    items = group;
    idx = startIdx;
    showItem();
    setCounter();
    const showNav = items.length > 1;
    if (lbPrev) lbPrev.style.display = showNav ? '' : 'none';
    if (lbNext) lbNext.style.display = showNav ? '' : 'none';
    lb.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeLb = () => {
    lb.setAttribute('hidden', '');
    lbImg.src = '';
    lbImg.classList.remove('lb-fade');
    if (lbVideo) { lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); lbVideo.hidden = true; }
    lbImg.hidden = false;
    document.body.style.overflow = '';
  };

  // Build unique-src group from a CSS selector (deduplicates awards strip clones)
  const buildGroup = (selector) => {
    const seen = new Set();
    return Array.from(document.querySelectorAll(selector)).filter(btn => {
      const src = btn.dataset.src;
      if (seen.has(src)) return false;
      seen.add(src);
      return true;
    });
  };

  const arGroup = buildGroup('.ar-item');
  const galGroup = buildGroup('.acad-gal-item');
  const clientGroup = buildGroup('.client-item');

  arGroup.forEach((btn, i) => btn.addEventListener('click', () => openLb(arGroup, i)));
  galGroup.forEach((btn, i) => btn.addEventListener('click', () => openLb(galGroup, i)));
  clientGroup.forEach((btn, i) => btn.addEventListener('click', () => openLb(clientGroup, i)));

  lbClose.addEventListener('click', closeLb);
  if (lbPrev) lbPrev.addEventListener('click', e => { e.stopPropagation(); goto(idx - 1); });
  if (lbNext) lbNext.addEventListener('click', e => { e.stopPropagation(); goto(idx + 1); });
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', e => {
    if (lb.hasAttribute('hidden')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') goto(idx - 1);
    if (e.key === 'ArrowRight') goto(idx + 1);
  });

  // Touch swipe
  let touchX = 0;
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) dx < 0 ? goto(idx + 1) : goto(idx - 1);
  });
}

// Forms are display-only until a backend/form service is wired up.
// Prevent default submission so no data is sent to a non-existent endpoint.
document.querySelectorAll('form[data-noaction]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    if (btn && !btn.dataset.done) {
      const original = btn.textContent;
      btn.textContent = 'Thank you — we will be in touch';
      btn.dataset.done = '1';
      setTimeout(() => { btn.textContent = original; delete btn.dataset.done; form.reset(); }, 3500);
    }
  });
});
