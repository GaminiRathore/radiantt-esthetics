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

// Auto-scrolling marquees (awards, happy clients, academy gallery) that are also swipeable/draggable.
// Native touch scrolling handles mobile swipe; mouse drag is added for desktop. Auto-scroll pauses
// while the user is interacting and resumes shortly after they let go.
function makeAutoSwipeReel(stripSelector, reelSelector, targetDurationSec) {
  document.querySelectorAll(stripSelector).forEach(strip => {
    const reel = strip.querySelector(reelSelector);
    if (!reel) return;

    let paused = false;
    let resumeTimer = null;
    const pauseFor = (ms) => {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, ms);
    };

    // Mouse drag-to-scroll
    let isDown = false, startX = 0, startScroll = 0, dragMoved = 0;
    strip.addEventListener('mousedown', e => {
      isDown = true;
      strip.classList.add('dragging');
      startX = e.pageX;
      startScroll = strip.scrollLeft;
      dragMoved = 0;
      paused = true;
      clearTimeout(resumeTimer);
    });
    window.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const dx = e.pageX - startX;
      dragMoved = Math.max(dragMoved, Math.abs(dx));
      strip.scrollLeft = startScroll - dx;
    });
    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      strip.classList.remove('dragging');
      pauseFor(1500);
    });
    // Suppress the click-to-open-lightbox if this mouseup ended a real drag
    strip.addEventListener('click', e => {
      if (dragMoved > 5) { e.stopPropagation(); e.preventDefault(); }
      dragMoved = 0;
    }, true);

    // Touch / wheel interaction just pauses auto-scroll; native scrolling does the rest
    strip.addEventListener('touchstart', () => { paused = true; clearTimeout(resumeTimer); }, { passive: true });
    strip.addEventListener('touchend', () => pauseFor(1500), { passive: true });
    strip.addEventListener('touchcancel', () => pauseFor(1500), { passive: true });
    strip.addEventListener('wheel', () => pauseFor(1500), { passive: true });
    strip.addEventListener('mouseenter', () => { paused = true; });
    strip.addEventListener('mouseleave', () => { if (!isDown) pauseFor(300); });

    let last = null;
    const tick = (now) => {
      if (last === null) last = now;
      const dt = (now - last) / 1000;
      last = now;
      const half = reel.scrollWidth / 2;
      if (!paused && half > 0) {
        const speed = half / targetDurationSec;
        strip.scrollLeft += speed * dt;
        if (strip.scrollLeft >= half) strip.scrollLeft -= half;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
makeAutoSwipeReel('.awards-strip', '.awards-reel', 110);
makeAutoSwipeReel('.client-strip', '.client-reel', 42);
makeAutoSwipeReel('.acad-gallery-strip', '.acad-gallery-reel', 70);

// Testimonials — swipeable/scrollable carousel with arrow buttons
const testReel = document.getElementById('testReel');
const testPrev = document.getElementById('testPrev');
const testNext = document.getElementById('testNext');
if (testReel && testPrev && testNext) {
  const scrollByCard = (dir) => {
    const card = testReel.querySelector('.test-card');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(testReel).columnGap || getComputedStyle(testReel).gap) || 0;
    testReel.scrollBy({ left: (card.getBoundingClientRect().width + gap) * dir, behavior: 'smooth' });
  };
  testPrev.addEventListener('click', () => scrollByCard(-1));
  testNext.addEventListener('click', () => scrollByCard(1));
}

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
