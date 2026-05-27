/* ============================================================
   HOME PAGE JS
   - Anti-FOUT: show title only after Allonges font loaded
   - Hero Carousel: image crossfade (mobile) / video crossfade (desktop)
   - Sticky header darkens on scroll
   - Hamburger menu overlay
   - Smooth scroll on SCROLL button
   - Fade-in observer for below-hero sections
   ============================================================ */

(function () {
  'use strict';

  /* -- Elements -- */
  var heroVideoA = document.getElementById('heroVideoA');
  var heroVideoB = document.getElementById('heroVideoB');
  var heroImg    = document.getElementById('heroImage');
  var menuBtn    = document.getElementById('menuBtn');
  var menuClose  = document.getElementById('menuClose');
  var navOverlay = document.getElementById('navOverlay');
  var scrollBtn  = document.getElementById('scrollBtn');
  var homeHeader = document.getElementById('homeHeader');

  /* ============================================================
     HERO CAROUSEL CONFIGURATION
     Scenes cycle through with smooth crossfade transitions.
     Mobile uses background-image crossfade (reliable).
     Desktop uses video crossfade (cinematic).
  ============================================================ */
  var HERO_SCENES = [
    { id: 'home',       image: 'hero-home',       video: null },
    { id: 'candles',    image: 'hero-candles',     video: 'candles-hero' },
    { id: 'lotus',      image: 'hero-lotus',       video: 'lotus-pond-hero' },
    { id: 'rainforest', image: 'hero-rainforest',  video: 'rainforest-hero' }
  ];

  var SCENE_DISPLAY_MS = 6000;   /* how long each scene is fully visible */
  var CROSSFADE_MS     = 1500;   /* must match CSS transition duration */

  function getDeviceDir() {
    var w = window.innerWidth;
    if (w <= 480) return 'mobile';
    if (w <= 767) return 'tablet-p';
    if (w <= 1023) return 'tablet-l';
    return 'laptop';
  }

  function getHeroImageSrc(scene) {
    return 'assets/images/' + getDeviceDir() + '/' + scene.image + '.webp';
  }

  function getHeroVideoSrc(scene) {
    var dir = getDeviceDir();
    return {
      webm: 'assets/videos/' + dir + '/' + scene.video + '.webm',
      mp4:  'assets/videos/' + dir + '/' + scene.video + '.mp4'
    };
  }

  /* ─── HERO CAROUSEL (ALL devices) ───
     Cycles through 4 scenes with crossfade.
     - Scenes with video: crossfade between heroVideoA/heroVideoB
     - Scenes without video (image-only): show via heroImage background
     heroImage is always behind the videos (z-index 1).
     When an image scene is active, videos are hidden.
     When a video scene is active, heroImage is hidden. */
  var sceneIdx   = 0;
  var swapLock   = false;
  var activeVid  = heroVideoA;
  var standbyVid = heroVideoB;

  /* Show an image scene */
  function showImageScene(sceneIndex) {
    var scene = HERO_SCENES[sceneIndex];
    heroImg.style.backgroundImage = 'url(' + getHeroImageSrc(scene) + ')';
    heroImg.style.opacity = '1';
    heroImg.style.zIndex = '3';
    heroVideoA.classList.remove('visible');
    heroVideoB.classList.remove('visible');
    heroVideoA.pause();
    heroVideoB.pause();
  }

  /* Load a video scene into a <video> element */
  function loadVideoScene(videoEl, sceneIndex) {
    var scene = HERO_SCENES[sceneIndex];
    var srcs  = getHeroVideoSrc(scene);
    while (videoEl.firstChild) videoEl.removeChild(videoEl.firstChild);
    var srcMp4 = document.createElement('source');
    srcMp4.setAttribute('src', srcs.mp4);
    srcMp4.setAttribute('type', 'video/mp4');
    videoEl.appendChild(srcMp4);
    var srcWebm = document.createElement('source');
    srcWebm.setAttribute('src', srcs.webm);
    srcWebm.setAttribute('type', 'video/webm');
    videoEl.appendChild(srcWebm);
    videoEl.load();
  }

  /* Show a video scene on the given video element */
  function showVideoScene(videoEl, sceneIndex) {
    heroImg.style.opacity = '0';
    heroImg.style.zIndex = '1';
    loadVideoScene(videoEl, sceneIndex);
    videoEl.play().then(function () {
      videoEl.classList.add('visible');
    }).catch(function () {
      videoEl.muted = true;
      videoEl.play().catch(function () {});
      videoEl.classList.add('visible');
    });
  }

  /* Start first scene */
  if (HERO_SCENES[0].video) {
    showVideoScene(heroVideoA, 0);
  } else {
    showImageScene(0);
  }

  /* Advance to next scene with crossfade */
  function advanceScene() {
    if (swapLock) return;
    swapLock = true;
    sceneIdx = (sceneIdx + 1) % HERO_SCENES.length;
    var nextScene = HERO_SCENES[sceneIdx];

    if (nextScene.video) {
      /* Next scene is a video — load into standby and crossfade */
      loadVideoScene(standbyVid, sceneIdx);
      standbyVid.play().then(function () {
        heroImg.style.opacity = '0';
        heroImg.style.zIndex = '1';
        standbyVid.classList.add('visible');
        activeVid.classList.remove('visible');
        setTimeout(function () {
          var temp = activeVid;
          activeVid = standbyVid;
          standbyVid = temp;
          standbyVid.pause();
          standbyVid.classList.remove('visible');
          swapLock = false;
        }, CROSSFADE_MS + 100);
      }).catch(function () {
        standbyVid.muted = true;
        standbyVid.play().then(function () {
          heroImg.style.opacity = '0';
          heroImg.style.zIndex = '1';
          standbyVid.classList.add('visible');
          activeVid.classList.remove('visible');
          setTimeout(function () {
            var temp = activeVid;
            activeVid = standbyVid;
            standbyVid = temp;
            standbyVid.pause();
            standbyVid.classList.remove('visible');
            swapLock = false;
          }, CROSSFADE_MS + 100);
        }).catch(function () { swapLock = false; });
      });
    } else {
      /* Next scene is image-only — fade to image */
      heroImg.style.backgroundImage = 'url(' + getHeroImageSrc(nextScene) + ')';
      heroImg.style.zIndex = '3';
      heroImg.style.opacity = '1';
      heroVideoA.classList.remove('visible');
      heroVideoB.classList.remove('visible');
      heroVideoA.pause();
      heroVideoB.pause();
      setTimeout(function () { swapLock = false; }, CROSSFADE_MS + 100);
    }
  }

  setInterval(advanceScene, SCENE_DISPLAY_MS + CROSSFADE_MS);

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
