/* ============================================================
   HOME PAGE JS
   - Anti-FOUT: show title only after Allonges font loaded
   - Video seamless crossfade loop (two <video> elements)
   - Sticky header darkens on scroll
   - Hamburger menu overlay
   - Smooth scroll on SCROLL button
   - Fade-in observer for below-hero sections
   ============================================================ */

(function () {
  'use strict';

  /* -- Elements -- */
  var menuBtn    = document.getElementById('menuBtn');
  var menuClose  = document.getElementById('menuClose');
  var navOverlay = document.getElementById('navOverlay');
  var scrollBtn  = document.getElementById('scrollBtn');
  var homeHeader = document.getElementById('homeHeader');

  /* ============================================================
     ANTI-FOUT
     Title starts at opacity:0 in CSS.
     We reveal it only after Allonges is confirmed loaded.
     Hard 800ms fallback so it never stays invisible.
  ============================================================ */
  var heroTitle = document.querySelector('.home-hero__title');
  if (heroTitle) {
    var revealed = false;

    var revealTitle = function () {
      if (revealed) return;
      revealed = true;
      heroTitle.classList.add('font-loaded');
    };

    if ('fonts' in document) {
      document.fonts.load('400 1em Allonges').then(revealTitle).catch(revealTitle);
    }
    /* Hard fallback - never wait more than 800ms */
    setTimeout(revealTitle, 800);
  }

  /* ============================================================
     HERO VIDEO — single video with BULLETPROOF JS looping
     Native `loop` attribute is unreliable on many mobile browsers.
     Instead, we manage looping entirely via JavaScript using
     MULTIPLE redundant strategies:
       1. timeupdate — seek back to 0 when near the end
       2. seeking    — intercept end-of-video seeks
       3. ended      — fallback for browsers that fire it
       4. watchdog   — 500ms interval checks video state
     This ensures the video loops on EVERY device, every time.
  ============================================================ */
  var heroVideo = document.getElementById('heroVideo');

  if (heroVideo) {
    /* Remove native loop — we manage it entirely in JS for reliability */
    heroVideo.removeAttribute('loop');

    /* Helper: safely play a video, returns a Promise */
    function safePlay(vid) {
      var p = vid.play();
      if (p && typeof p.catch === 'function') {
        return p;
      }
      return Promise.resolve();
    }

    /* Core loop function: seek to start and play */
    var _looping = false;

    function loopVideo() {
      if (_looping) return;
      _looping = true;
      heroVideo.currentTime = 0;
      safePlay(heroVideo);
      setTimeout(function () { _looping = false; }, 100);
    }

    /* STRATEGY 1: timeupdate — fires ~4 times/sec on most browsers.
       This is the MOST RELIABLE way to detect the video reaching
       the end on mobile devices. We seek back to 0 when we're
       within 0.3s of the end, avoiding the "ended" state entirely. */
    heroVideo.addEventListener('timeupdate', function () {
      if (heroVideo.duration && heroVideo.currentTime >= heroVideo.duration - 0.3) {
        if (_looping) return;
        _looping = true;
        heroVideo.currentTime = 0;
        /* No need to call play() here — the video is already playing.
           Seeking back to 0 while playing continues playback from 0. */
        setTimeout(function () { _looping = false; }, 100);
      }
    });

    /* STRATEGY 2: seeking event — when the browser internally seeks
       to the end of the video (some mobile browsers do this before
       firing "ended"), intercept it and redirect to 0. */
    heroVideo.addEventListener('seeking', function () {
      if (_looping) return;
      if (heroVideo.duration && heroVideo.currentTime >= heroVideo.duration - 0.1 && heroVideo.currentTime > 0) {
        _looping = true;
        heroVideo.currentTime = 0;
        setTimeout(function () { _looping = false; }, 100);
      }
    });

    /* STRATEGY 3: ended event — fallback for browsers that fire it.
       Some mobile Safari versions don't fire this reliably, but
       for those that do, this catches any edge cases. */
    heroVideo.addEventListener('ended', function () {
      loopVideo();
    });

    /* STRATEGY 4: Periodic check — absolute failsafe.
       Every 500ms, verify the video is still playing. If it
       stopped and we're near the end, force a loop. This catches
       any scenario the event listeners miss. */
    var loopWatchdog = setInterval(function () {
      if (!heroVideo || !heroVideo.duration || _looping) return;
      if (heroVideo.ended || (heroVideo.paused && heroVideo.currentTime >= heroVideo.duration - 0.5)) {
        loopVideo();
      }
    }, 500);

    /* Clean up watchdog if the page is hidden (save battery) */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearInterval(loopWatchdog);
      } else {
        /* Re-start watchdog and ensure video is playing */
        clearInterval(loopWatchdog);
        loopWatchdog = setInterval(function () {
          if (!heroVideo || !heroVideo.duration) return;
          if (heroVideo.ended || (heroVideo.paused && heroVideo.currentTime >= heroVideo.duration - 0.5)) {
            heroVideo.currentTime = 0;
            safePlay(heroVideo);
          }
        }, 500);
        /* If video was paused while page was hidden, resume */
        if (heroVideo.paused && heroVideo.currentTime > 0) {
          safePlay(heroVideo);
        }
      }
    });

    function revealWhenReady() {
      safePlay(heroVideo).then(function () {
        heroVideo.classList.add('visible');
      }).catch(function () {
        /* Autoplay blocked — reveal anyway, retry on user interaction */
        heroVideo.classList.add('visible');
        function retryPlay() {
          safePlay(heroVideo);
          document.removeEventListener('touchstart', retryPlay);
          document.removeEventListener('click', retryPlay);
        }
        document.addEventListener('touchstart', retryPlay, { once: true });
        document.addEventListener('click', retryPlay, { once: true });
      });
    }

    /* Wait for video to be ready, then play and reveal */
    if (heroVideo.readyState >= 3) {
      revealWhenReady();
    } else {
      heroVideo.addEventListener('canplay', revealWhenReady, { once: true });
      /* Fallback: if canplay never fires, try after 3s */
      setTimeout(function () {
        heroVideo.removeEventListener('canplay', revealWhenReady);
        revealWhenReady();
      }, 3000);
    }
  }

  /* ============================================================
     STICKY HEADER - darken slightly when scrolled
  ============================================================ */
  if (homeHeader) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        homeHeader.classList.add('scrolled');
      } else {
        homeHeader.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  /* ============================================================
     HAMBURGER MENU
  ============================================================ */
  function openMenu() {
    if (!navOverlay) return;
    navOverlay.classList.add('open');
    navOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!navOverlay) return;
    navOverlay.classList.remove('open');
    navOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (menuBtn)   menuBtn.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);

  if (navOverlay) {
    navOverlay.addEventListener('click', function (e) {
      if (e.target === navOverlay) closeMenu();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ============================================================
     SMOOTH SCROLL - SCROLL button -> #intro section
  ============================================================ */
  if (scrollBtn) {
    scrollBtn.addEventListener('click', function () {
      var intro = document.getElementById('intro');
      if (intro) {
        intro.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ============================================================
     SCROLL PROGRESS BAR
  ============================================================ */
  var progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      var scrollTop  = window.scrollY;
      var docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      var pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ============================================================
     BACK TO TOP
  ============================================================ */
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     FADE-IN OBSERVER (sections below hero)
  ============================================================ */
  var fadeEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .fade-in-up, .fade-in-scale, .section-entrance');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
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

  /* ============================================================
     SECTION ENTRANCE OBSERVER
     Triggers earlier than fade-in for full-section animations.
  ============================================================ */
  var sectionEntranceEls = document.querySelectorAll('.section-entrance');
  if (sectionEntranceEls.length && 'IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });
    sectionEntranceEls.forEach(function (el) { sectionObserver.observe(el); });
  } else {
    sectionEntranceEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* Update footer year */
  var yearEl = document.querySelector('.footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     SACRED GEOMETRY — fade in mandala + starburst when intro visible
  ============================================================ */
  var sacredEls = [
    document.getElementById('sacredMandala'),
    document.getElementById('sacredMandalaSmall')
  ].filter(Boolean);

  /* Starburst canvas — lives inside #intro section */
  var starburstCanvas = document.getElementById('sacredStarburst');

  if (sacredEls.length && 'IntersectionObserver' in window) {
    var sacredObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          sacredEls.forEach(function(el) { el.classList.add('visible'); });
          sacredObserver.disconnect();
        }
      });
    }, { threshold: 0.15 });
    var introSection = document.getElementById('intro');
    if (introSection) sacredObserver.observe(introSection);
  } else {
    sacredEls.forEach(function(el) { el.classList.add('visible'); });
  }

  /* Starburst init — observe #intro section */
  if (starburstCanvas && 'IntersectionObserver' in window) {
    var starburstObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          starburstCanvas.classList.add('visible');
          if (window.SacredStarburst) window.SacredStarburst.init(starburstCanvas);
          starburstObs.disconnect();
        }
      });
    }, { threshold: 0.05 });
    var introSection = document.getElementById('intro');
    if (introSection) starburstObs.observe(introSection);
  } else if (starburstCanvas) {
    starburstCanvas.classList.add('visible');
    if (window.SacredStarburst) window.SacredStarburst.init(starburstCanvas);
  }


})();

/* About page overlap image fade-in */
(function(){
  var overlapImg = document.querySelector('.about-overlap-image img');
  if (overlapImg && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) { overlapImg.classList.add('visible'); obs.disconnect(); }
      });
    }, { threshold: 0.15 });
    obs.observe(overlapImg);
  } else if (overlapImg) {
    overlapImg.classList.add('visible');
  }
})();

/* About page sacred geometry visibility */
(function(){
  var aboutSacredEls = [
    document.getElementById('aboutSacredMandala'),
    document.getElementById('aboutSacredMandalaSmall')
  ].filter(Boolean);

  var aboutStarburstCanvas = document.getElementById('aboutSacredStarburst');

  if (aboutSacredEls.length && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          aboutSacredEls.forEach(function(el) { el.classList.add('visible'); });
          obs.disconnect();
        }
      });
    }, { threshold: 0.15 });
    var originSection = document.querySelector('.section-intro-sacred');
    if (originSection) obs.observe(originSection);
  } else {
    aboutSacredEls.forEach(function(el) { el.classList.add('visible'); });
  }

  /* About starburst init — observe the origin section */
  if (aboutStarburstCanvas && 'IntersectionObserver' in window) {
    var aboutStarburstObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          aboutStarburstCanvas.classList.add('visible');
          if (window.SacredStarburst) window.SacredStarburst.init(aboutStarburstCanvas);
          aboutStarburstObs.disconnect();
        }
      });
    }, { threshold: 0.05 });
    var originSection = document.querySelector('.section-intro-sacred');
    if (originSection) aboutStarburstObs.observe(originSection);
  } else if (aboutStarburstCanvas) {
    aboutStarburstCanvas.classList.add('visible');
    if (window.SacredStarburst) window.SacredStarburst.init(aboutStarburstCanvas);
  }
})();

/* Offerings page: Tantric Ritual starburst + mandala visibility */
(function(){
  var ritualMandalaEls = [
    document.getElementById('offeringsRitualMandala'),
    document.getElementById('offeringsRitualMandalaSmall')
  ].filter(Boolean);

  var ritualStarburstCanvas = document.getElementById('offeringsRitualStarburst');

  if (ritualMandalaEls.length && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          ritualMandalaEls.forEach(function(el) { el.classList.add('visible'); });
          obs.disconnect();
        }
      });
    }, { threshold: 0.15 });
    var ritualSection = document.getElementById('offeringsRitualSection');
    if (ritualSection) obs.observe(ritualSection);
  } else {
    ritualMandalaEls.forEach(function(el) { el.classList.add('visible'); });
  }

  /* Offerings starburst init — observe the ritual section */
  if (ritualStarburstCanvas && 'IntersectionObserver' in window) {
    var ritualStarburstObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          ritualStarburstCanvas.classList.add('visible');
          if (window.SacredStarburst) window.SacredStarburst.init(ritualStarburstCanvas);
          ritualStarburstObs.disconnect();
        }
      });
    }, { threshold: 0.05 });
    var ritualSection = document.getElementById('offeringsRitualSection');
    if (ritualSection) ritualStarburstObs.observe(ritualSection);
  } else if (ritualStarburstCanvas) {
    ritualStarburstCanvas.classList.add('visible');
    if (window.SacredStarburst) window.SacredStarburst.init(ritualStarburstCanvas);
  }
})();

/* Offerings + Connect pages: auto-show offerings-mandala elements when visible */
(function(){
  var mandalaImgs = document.querySelectorAll('.offerings-mandala-section .offerings-mandala');
  if (!mandalaImgs.length) return;

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var mandalas = entry.target.querySelectorAll('.offerings-mandala');
          mandalas.forEach(function(m) { m.style.opacity = ''; });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10 });
    document.querySelectorAll('.offerings-mandala-section').forEach(function(section) {
      obs.observe(section);
    });
  }
})();
