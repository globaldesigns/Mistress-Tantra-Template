/* ============================================================
   HOME PAGE JS
   - Hero Carousel: 4 scenes (1 image + 3 videos) with crossfade
   - Anti-FOUT: show title only after Allonges font loaded
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
     
     4 scenes:
     1. Girl in green (IMAGE only - hero-home)
     2. Walking in lily pond (VIDEO - lily-pond-hero)
     3. Girl meditating at waterfall (VIDEO - waterfall-hero)
     4. Oil pouring / massage (VIDEO - massage-hero)
  ============================================================ */
  var HERO_SCENES = [
    { id: 'home',      image: 'hero-home',        video: null },
    { id: 'lilypond',  image: 'hero-lilypond',     video: 'lily-pond-hero' },
    { id: 'waterfall', image: 'hero-waterfall',    video: 'waterfall-hero' },
    { id: 'massage',   image: 'hero-massage',      video: 'massage-hero' }
  ];

  var SCENE_DISPLAY_MS = 4000;   /* how long each scene is fully visible */
  var CROSSFADE_MS     = 800;    /* must match CSS transition duration */

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
      mp4:  'assets/videos/' + dir + '/' + scene.video + '.mp4',
      webm: 'assets/videos/' + dir + '/' + scene.video + '.webm'
    };
  }

  /* ──── HERO CAROUSEL ────
     Two <video> elements alternate (A/B crossfade).
     Scene 0 is image-only; scenes 1-3 are video.
     
     KEY FIXES vs old version:
     - Videos have loop attribute in HTML for continuous play
     - play() is called with proper error handling and muted fallback
     - swapLock has a safety timeout so it can never permanently lock
     - Before swapping, we wait for 'canplay' event on the standby video
     - standby video is preloaded and actually playing before we fade it in
  */

  var sceneIdx   = 0;
  var swapLock   = false;
  var activeVid  = heroVideoA;
  var standbyVid = heroVideoB;
  var carouselTimer = null;

  /* Safety: ensure swapLock can never stay true forever */
  function releaseSwapLock() {
    swapLock = false;
  }

  /* Hide both video elements */
  function hideAllVideos() {
    heroVideoA.classList.remove('visible');
    heroVideoB.classList.remove('visible');
    heroVideoA.pause();
    heroVideoB.pause();
  }

  /* Show an image-only scene */
  function showImageScene(sceneIndex) {
    var scene = HERO_SCENES[sceneIndex];
    heroImg.style.backgroundImage = 'url(' + getHeroImageSrc(scene) + ')';
    heroImg.style.opacity = '1';
    heroImg.style.zIndex = '3';
    hideAllVideos();
  }

  /* Load video sources into a <video> element */
  function loadVideoSources(videoEl, sceneIndex) {
    var scene = HERO_SCENES[sceneIndex];
    var srcs  = getHeroVideoSrc(scene);
    /* Remove old sources */
    while (videoEl.firstChild) videoEl.removeChild(videoEl.firstChild);
    /* Add mp4 source (primary) */
    var srcMp4 = document.createElement('source');
    srcMp4.setAttribute('src', srcs.mp4);
    srcMp4.setAttribute('type', 'video/mp4');
    videoEl.appendChild(srcMp4);
    /* Add webm source (fallback) */
    var srcWebm = document.createElement('source');
    srcWebm.setAttribute('src', srcs.webm);
    srcWebm.setAttribute('type', 'video/webm');
    videoEl.appendChild(srcWebm);
    videoEl.load();
  }

  /* Try to play a video element, with muted retry */
  function tryPlay(videoEl) {
    return videoEl.play().catch(function () {
      videoEl.muted = true;
      return videoEl.play().catch(function () {
        /* Give up silently — the video element may not be ready */
        return Promise.resolve();
      });
    });
  }

  /* Show a video scene on the given element (first scene only) */
  function showVideoSceneFirst(videoEl, sceneIndex) {
    heroImg.style.opacity = '0';
    heroImg.style.zIndex = '1';
    loadVideoSources(videoEl, sceneIndex);
    
    /* Wait for the video to be ready, then play and show */
    var onReady = function () {
      videoEl.removeEventListener('canplay', onReady);
      videoEl.removeEventListener('loadeddata', onReady);
      tryPlay(videoEl).then(function () {
        videoEl.classList.add('visible');
      });
    };
    
    if (videoEl.readyState >= 3) {
      onReady();
    } else {
      videoEl.addEventListener('canplay', onReady);
      videoEl.addEventListener('loadeddata', onReady);
      /* Fallback: show after 2s even if canplay never fires */
      setTimeout(function () {
        videoEl.removeEventListener('canplay', onReady);
        videoEl.removeEventListener('loadeddata', onReady);
        tryPlay(videoEl);
        videoEl.classList.add('visible');
      }, 2000);
    }
  }

  /* Advance to next scene with crossfade */
  function advanceScene() {
    if (swapLock) return;
    swapLock = true;
    
    /* Safety: release lock after max 5s no matter what */
    var safetyTimeout = setTimeout(releaseSwapLock, 5000);
    
    sceneIdx = (sceneIdx + 1) % HERO_SCENES.length;
    var nextScene = HERO_SCENES[sceneIdx];

    if (nextScene.video) {
      /* ── Next scene is a VIDEO ── */
      /* Pre-load into standby video */
      loadVideoSources(standbyVid, sceneIdx);
      
      var onStandbyReady = function () {
        standbyVid.removeEventListener('canplay', onStandbyReady);
        standbyVid.removeEventListener('loadeddata', onStandbyReady);
        
        /* Start playing the standby video */
        tryPlay(standbyVid).then(function () {
          /* Crossfade: fade in standby, fade out active */
          heroImg.style.opacity = '0';
          heroImg.style.zIndex = '1';
          standbyVid.classList.add('visible');
          activeVid.classList.remove('visible');
          
          /* After crossfade completes, swap roles */
          setTimeout(function () {
            var temp = activeVid;
            activeVid = standbyVid;
            standbyVid = temp;
            /* Pause and hide the old active video */
            standbyVid.pause();
            standbyVid.classList.remove('visible');
            clearTimeout(safetyTimeout);
            swapLock = false;
          }, CROSSFADE_MS + 200);
        }).catch(function () {
          /* Play failed — still try to show the video */
          standbyVid.classList.add('visible');
          activeVid.classList.remove('visible');
          clearTimeout(safetyTimeout);
          swapLock = false;
        });
      };
      
      if (standbyVid.readyState >= 3) {
        onStandbyReady();
      } else {
        standbyVid.addEventListener('canplay', onStandbyReady);
        standbyVid.addEventListener('loadeddata', onStandbyReady);
        /* Fallback: proceed after 3s even if canplay never fires */
        setTimeout(function () {
          standbyVid.removeEventListener('canplay', onStandbyReady);
          standbyVid.removeEventListener('loadeddata', onStandbyReady);
          if (swapLock) {
            tryPlay(standbyVid);
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
              clearTimeout(safetyTimeout);
              swapLock = false;
            }, CROSSFADE_MS + 200);
          }
        }, 3000);
      }
      
    } else {
      /* ── Next scene is IMAGE-ONLY ── */
      /* Preload the image */
      var imgSrc = getHeroImageSrc(nextScene);
      var preload = new Image();
      preload.onload = function () {
        heroImg.style.backgroundImage = 'url(' + imgSrc + ')';
        heroImg.style.zIndex = '3';
        heroImg.style.opacity = '1';
        hideAllVideos();
        setTimeout(function () {
          clearTimeout(safetyTimeout);
          swapLock = false;
        }, CROSSFADE_MS + 200);
      };
      preload.onerror = function () {
        /* Image failed to load — still switch */
        heroImg.style.backgroundImage = 'url(' + imgSrc + ')';
        heroImg.style.zIndex = '3';
        heroImg.style.opacity = '1';
        hideAllVideos();
        clearTimeout(safetyTimeout);
        swapLock = false;
      };
      preload.src = imgSrc;
    }
  }

  /* ── Start first scene ── */
  if (HERO_SCENES[0].video) {
    showVideoSceneFirst(heroVideoA, 0);
  } else {
    showImageScene(0);
  }

  /* Start the carousel timer */
  carouselTimer = setInterval(advanceScene, SCENE_DISPLAY_MS + CROSSFADE_MS);

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
