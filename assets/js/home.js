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
     HERO VIDEO — MOBILE-SAFE LOOPING
     The video must loop seamlessly on ALL devices including
     iOS Safari. Key insights from real-device debugging:

     1. iOS Safari does NOT support webm — mp4 source MUST be first
     2. Native `loop` attribute is unreliable on mobile Safari
     3. `ended` event may not fire reliably on iOS (2nd+ loop)
     4. `timeupdate` is the most reliable mobile loop trigger
     5. Video may fail to load if source format unsupported
     6. `video.load()` must be called after changing source on iOS

     Approach: Use NATIVE `loop` attribute as the PRIMARY mechanism
     (most browsers handle this correctly), with JS strategies as
     a safety net for browsers where native loop fails.
  ============================================================ */
  var heroVideo = document.getElementById('heroVideo');

  if (heroVideo) {
    /* Re-add native loop — this is the PRIMARY looping mechanism.
       Most modern browsers (Chrome, Firefox, Safari 15+) handle
       this correctly. For browsers where it fails, our JS
       strategies provide a reliable safety net. */
    heroVideo.loop = true;

    /* Helper: safely play a video, returns a Promise */
    function safePlay(vid) {
      var p = vid.play();
      if (p && typeof p.catch === 'function') {
        return p;
      }
      return Promise.resolve();
    }

    /* ---------- ERROR RECOVERY ----------
       If the video fails to load (e.g. format not supported, 
       network error), try to force-reload with just the mp4 source.
       This catches the case where webm was somehow selected on
       a device that doesn't support it. */
    var _errorCount = 0;

    heroVideo.addEventListener('error', function (e) {
      _errorCount++;
      console.warn('[Hero Video] Error event (count=' + _errorCount + '):', heroVideo.error ? heroVideo.error.code : 'unknown');

      /* If we get errors on the current sources, try loading just mp4 */
      if (_errorCount <= 2) {
        var sources = heroVideo.querySelectorAll('source');
        var hasError = false;
        for (var i = 0; i < sources.length; i++) {
          if (sources[i].networkState === 3) { /* NETWORK_NO_SOURCE */
            hasError = true;
            break;
          }
        }
        if (hasError || heroVideo.networkState === 3) {
          /* Remove webm source — force mp4 only */
          for (var j = sources.length - 1; j >= 0; j--) {
            if (sources[j].type === 'video/webm') {
              sources[j].remove();
            }
          }
          heroVideo.load();
          safePlay(heroVideo);
        }
      }
    }, true); /* Use capture to catch errors on <source> elements too */

    /* ---------- JS LOOPING SAFETY NET ----------
       These strategies ensure the video loops even on devices
       where the native `loop` attribute doesn't work. */

    var _looping = false;

    function loopVideo() {
      if (_looping) return;
      _looping = true;
      heroVideo.currentTime = 0;
      safePlay(heroVideo);
      setTimeout(function () { _looping = false; }, 150);
    }

    /* STRATEGY 1: timeupdate — most reliable on mobile.
       Seek back to 0 when within 0.5s of the end, BEFORE
       the video reaches the "ended" state. */
    heroVideo.addEventListener('timeupdate', function () {
      if (heroVideo.duration && heroVideo.currentTime >= heroVideo.duration - 0.5) {
        if (_looping) return;
        _looping = true;
        heroVideo.currentTime = 0;
        setTimeout(function () { _looping = false; }, 150);
      }
    });

    /* STRATEGY 2: ended event — fallback for browsers that fire it */
    heroVideo.addEventListener('ended', function () {
      loopVideo();
    });

    /* STRATEGY 3: Periodic watchdog — 500ms interval.
       Checks if the video has stopped near the end and forces a loop.
       This is the absolute failsafe for any device/browsers that
       don't fire timeupdate or ended events reliably. */
    var loopWatchdog = setInterval(function () {
      if (!heroVideo || !heroVideo.duration || _looping) return;
      if (heroVideo.ended || (heroVideo.paused && heroVideo.currentTime >= heroVideo.duration - 0.5)) {
        loopVideo();
      }
    }, 500);

    /* Also ensure video doesn't stall mid-playback on mobile */
    var stallCheck = setInterval(function () {
      if (!heroVideo || heroVideo.ended || _looping) return;
      /* If video claims to be playing but hasn't advanced in 2 checks,
         it may be stalled — force a small seek to unstick it */
      if (heroVideo.paused && !heroVideo.ended && heroVideo.currentTime > 0 && heroVideo.currentTime < heroVideo.duration - 1) {
        safePlay(heroVideo);
      }
    }, 2000);

    /* Clean up watchdogs if the page is hidden (save battery) */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearInterval(loopWatchdog);
        clearInterval(stallCheck);
      } else {
        /* Re-start watchdogs and ensure video is playing */
        clearInterval(loopWatchdog);
        clearInterval(stallCheck);
        loopWatchdog = setInterval(function () {
          if (!heroVideo || !heroVideo.duration) return;
          if (heroVideo.ended || (heroVideo.paused && heroVideo.currentTime >= heroVideo.duration - 0.5)) {
            heroVideo.currentTime = 0;
            safePlay(heroVideo);
          }
        }, 500);
        stallCheck = setInterval(function () {
          if (!heroVideo || heroVideo.ended) return;
          if (heroVideo.paused && !heroVideo.ended && heroVideo.currentTime > 0 && heroVideo.currentTime < heroVideo.duration - 1) {
            safePlay(heroVideo);
          }
        }, 2000);
        /* If video was paused while page was hidden, resume */
        if (heroVideo.paused && heroVideo.currentTime > 0) {
          safePlay(heroVideo);
        }
      }
    });

    /* ---------- VIDEO REVEAL & AUTOPLAY ----------
       Wait for the video to be ready, then play and reveal.
       If autoplay is blocked, reveal anyway and retry on
       first user interaction (touch or click). */
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
