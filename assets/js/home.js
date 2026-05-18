/* ============================================================
   HOME PAGE JS
   - Video crossfade (image → video after 3s)
   - Endless smooth loop: video fades out near end, image shows, video restarts & fades back in
   - Hamburger menu overlay
   - Smooth scroll on SCROLL button
   ============================================================ */

(function () {
  'use strict';

  /* ── Elements ── */
  const heroVideo  = document.getElementById('heroVideo');
  const heroImage  = document.getElementById('heroImage');
  const menuBtn    = document.getElementById('menuBtn');
  const menuClose  = document.getElementById('menuClose');
  const navOverlay = document.getElementById('navOverlay');
  const scrollBtn  = document.getElementById('scrollBtn');

  /* ══════════════════════════════════════════════
     VIDEO CROSSFADE LOOP
     1. Page loads → image visible, video hidden
     2. After 3s  → video fades IN over image (2s CSS transition)
     3. 3s before video ends → video fades OUT, image reappears
     4. On video 'ended' / timeupdate near end → video resets & fades back in
     Uses CSS transition on .home-hero__video { opacity: 0 }
     .visible adds opacity: 1
  ══════════════════════════════════════════════ */

  if (heroVideo) {
    let videoReady = false;
    let fadeOutScheduled = false;

    /* Wait for video to be ready enough to play smoothly */
    heroVideo.addEventListener('canplaythrough', function () {
      videoReady = true;
    }, { once: true });

    /* ── Initial fade-in after 3 seconds ── */
    setTimeout(function () {
      if (heroVideo) {
        heroVideo.classList.add('visible');
        fadeOutScheduled = false;
      }
    }, 3000);

    /* ── Seamless loop: fade out 2.5s before end, then restart & fade back in ── */
    heroVideo.addEventListener('timeupdate', function () {
      if (!heroVideo.duration) return;

      const timeLeft = heroVideo.duration - heroVideo.currentTime;

      /* Start fade-out 2.5s before video ends */
      if (timeLeft <= 2.5 && !fadeOutScheduled) {
        fadeOutScheduled = true;
        heroVideo.classList.remove('visible'); /* fade out over 2s (CSS) */
      }
    });

    /* ── When video loops back to start (loop attr handles restart) ── */
    heroVideo.addEventListener('timeupdate', function () {
      /* After loop restarts (currentTime < 0.5 and fadeOut was done) fade back in */
      if (heroVideo.currentTime < 0.3 && fadeOutScheduled) {
        fadeOutScheduled = false;
        setTimeout(function () {
          heroVideo.classList.add('visible');
        }, 600); /* brief pause on image before next fade-in */
      }
    });
  }

  /* ══════════════════════════════════════════════
     HAMBURGER MENU OVERLAY
  ══════════════════════════════════════════════ */
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

  if (menuBtn)   menuBtn.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);

  /* Close on ESC */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* Close on overlay background click */
  if (navOverlay) {
    navOverlay.addEventListener('click', function (e) {
      if (e.target === navOverlay) closeMenu();
    });
  }

  /* ══════════════════════════════════════════════
     SMOOTH SCROLL — SCROLL button → #intro section
  ══════════════════════════════════════════════ */
  if (scrollBtn) {
    scrollBtn.addEventListener('click', function () {
      const target = document.getElementById('intro');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ══════════════════════════════════════════════
     SCROLL PROGRESS BAR (reuse from main.js logic)
  ══════════════════════════════════════════════ */
  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      const scrollTop  = window.scrollY;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════
     BACK TO TOP
  ══════════════════════════════════════════════ */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ══════════════════════════════════════════════
     FADE-IN ON SCROLL (mirrors main.js)
  ══════════════════════════════════════════════ */
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
