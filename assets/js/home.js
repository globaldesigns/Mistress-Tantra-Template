/* ============================================================
   HOME PAGE JS
   - Video fades in from dark base after 3s (no static image)
   - Sticky header darkens on scroll
   - Hamburger menu overlay
   - Smooth scroll on SCROLL button
   ============================================================ */

(function () {
  'use strict';

  /* ── Elements ── */
  const heroVideo  = document.getElementById('heroVideo');
  const menuBtn    = document.getElementById('menuBtn');
  const menuClose  = document.getElementById('menuClose');
  const navOverlay = document.getElementById('navOverlay');
  const scrollBtn  = document.getElementById('scrollBtn');
  const homeHeader = document.getElementById('homeHeader');

  /* ══════════════════════════════════════════════════════════
     ANTI-FOUT — show title only once Allonges font is loaded
     Uses FontFace API; falls back to showing after 800ms max
  ══════════════════════════════════════════════════════════ */
  const heroTitle = document.querySelector('.home-hero__title');
  if (heroTitle) {
    const revealTitle = function () {
      heroTitle.classList.add('font-loaded');
    };

    if ('fonts' in document) {
      document.fonts.load('400 1em Allonges').then(revealTitle).catch(revealTitle);
      // Hard fallback — never wait more than 800ms
      setTimeout(revealTitle, 800);
    } else {
      // No FontFace API — just reveal after short delay
      setTimeout(revealTitle, 300);
    }
  }


     1. Page loads → dark background, video hidden
     2. After 2s  → video fades IN (2s CSS transition)
     3. Video loops natively (loop attr)
  ══════════════════════════════════════════════════════════ */
  if (heroVideo) {
    // Start playing immediately (autoplay attr handles it)
    // Fade video in after 2s — gives time for first frames to buffer
    setTimeout(function () {
      heroVideo.classList.add('visible');
    }, 2000);
  }

  /* ══════════════════════════════════════════════════════════
     STICKY HEADER — darken slightly when scrolled
  ══════════════════════════════════════════════════════════ */
  if (homeHeader) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        homeHeader.classList.add('scrolled');
      } else {
        homeHeader.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════
     HAMBURGER MENU
  ══════════════════════════════════════════════════════════ */
  function openMenu() {
    navOverlay.classList.add('open');
    navOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navOverlay.classList.remove('open');
    navOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (menuBtn)    menuBtn.addEventListener('click', openMenu);
  if (menuClose)  menuClose.addEventListener('click', closeMenu);

  // Click overlay background to close
  if (navOverlay) {
    navOverlay.addEventListener('click', function (e) {
      if (e.target === navOverlay) closeMenu();
    });
  }

  // ESC key to close
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ══════════════════════════════════════════════════════════
     SMOOTH SCROLL — SCROLL button → #intro section
  ══════════════════════════════════════════════════════════ */
  if (scrollBtn) {
    scrollBtn.addEventListener('click', function () {
      const intro = document.getElementById('intro');
      if (intro) {
        intro.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     SCROLL PROGRESS BAR
  ══════════════════════════════════════════════════════════ */
  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════
     BACK TO TOP
  ══════════════════════════════════════════════════════════ */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ══════════════════════════════════════════════════════════
     FADE-IN OBSERVER (sections below hero)
  ══════════════════════════════════════════════════════════ */
  const fadeEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    fadeEls.forEach(function (el) { observer.observe(el); });
  } else {
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* Update footer year */
  const yearEl = document.querySelector('.footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
