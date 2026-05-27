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

  var SCENE_DISPLAY_MS = 2000;   /* how long each scene is fully visible before next crossfade starts */
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

  /* ─────────────────────────────────────────────────────────────
     HERO CAROUSEL — REWRITTEN for seamless, consistent timing
     
     KEY DESIGN PRINCIPLES:
     1. Pre-buffer: load the NEXT scene immediately after the
        current transition ends, so it's ready when the timer fires
     2. setTimeout chaining: each cycle schedules the next, so
        timing is always exactly SCENE_DISPLAY_MS from one
        crossfade-start to the next — no skipped beats
     3. Crossfade starts INSTANTLY when the timer fires — no
        waiting for canplay/play promises. The next scene was
        already buffered in the previous cycle.
     4. Layered z-index: new content fades in ON TOP of old
        content. Old content stays visible until new content
        is fully opaque. NEVER a moment where nothing is visible.
     5. Video-to-Image: image fades in on top (z-index 5), video
        stays visible underneath until image is fully opaque, then
        video is paused and hidden.
     6. Image-to-Video: video fades in on top, image stays visible
        underneath until video is fully opaque, then image fades.
     7. Video-to-Video: standby video fades in on top, active
        video fades out underneath. After crossfade, roles swap.
  ───────────────────────────────────────────────────────────── */

  var sceneIdx   = 0;          /* index of the CURRENTLY VISIBLE scene */
  var activeVid  = heroVideoA; /* the <video> element currently showing */
  var standbyVid = heroVideoB; /* the <video> element available for next scene */

  /* Tracks whether the next scene has been pre-buffered and is ready */
  var nextReady    = false;
  var nextSceneIdx = -1;

  /* ── Load video sources into a <video> element ── */
  function loadVideoSources(videoEl, idx) {
    var scene = HERO_SCENES[idx];
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

  /* ── Try to play a video, with muted retry ── */
  function tryPlay(videoEl) {
    return videoEl.play().catch(function () {
      videoEl.muted = true;
      return videoEl.play().catch(function () {
        return Promise.resolve();
      });
    });
  }

  /* ── Pre-buffer the next scene ──
     Called immediately after a transition completes.
     For video scenes: loads sources into standbyVid and attempts
     to play (muted, in background). The video will be buffered
     and ready when the timer fires.
     For image scenes: preloads the image into memory.
     
     IMPORTANT: The standby video is kept invisible (opacity 0)
     but is actually playing and buffering frames. When the
     crossfade timer fires, we just make it visible — no loading
     delay at all.
  */
  function prebufferNext() {
    nextSceneIdx = (sceneIdx + 1) % HERO_SCENES.length;
    var nextScene = HERO_SCENES[nextSceneIdx];
    nextReady = false;

    if (nextScene.video) {
      /* Load video into standby element */
      loadVideoSources(standbyVid, nextSceneIdx);

      /* Wait for it to be ready, then start playing in background */
      var onReady = function () {
        standbyVid.removeEventListener('canplay', onReady);
        standbyVid.removeEventListener('loadeddata', onReady);
        tryPlay(standbyVid).then(function () {
          nextReady = true;
        }).catch(function () {
          nextReady = true; /* still mark ready — we'll try again on crossfade */
        });
      };

      if (standbyVid.readyState >= 3) {
        onReady();
      } else {
        standbyVid.addEventListener('canplay', onReady);
        standbyVid.addEventListener('loadeddata', onReady);
        /* Fallback: mark ready after 1.5s even if events don't fire */
        setTimeout(function () {
          standbyVid.removeEventListener('canplay', onReady);
          standbyVid.removeEventListener('loadeddata', onReady);
          if (!nextReady) {
            tryPlay(standbyVid);
            nextReady = true;
          }
        }, 1500);
      }
    } else {
      /* Preload image */
      var imgSrc = getHeroImageSrc(nextScene);
      var preload = new Image();
      preload.onload = function () { nextReady = true; };
      preload.onerror = function () { nextReady = true; };
      preload.src = imgSrc;
      /* Also set the background-image now so it's in the CSS cache */
      heroImg.style.backgroundImage = 'url(' + imgSrc + ')';
    }
  }

  /* ── Perform the crossfade to the next scene ──
     This is called by the timer. It starts the crossfade
     IMMEDIATELY — no async waiting. The next scene was
     pre-buffered in the previous cycle.
  */
  function crossfadeToNext() {
    var nextIdx = (sceneIdx + 1) % HERO_SCENES.length;
    var nextScene = HERO_SCENES[nextIdx];

    /* Update the scene index */
    sceneIdx = nextIdx;

    if (nextScene.video) {
      /* ── Next scene is a VIDEO ── */

      /* Ensure standby video sources are loaded (in case prebuffer
         didn't finish, or this is the first cycle) */
      if (standbyVid.readyState < 3) {
        loadVideoSources(standbyVid, sceneIdx);
      }

      /* Try to play if not already playing */
      if (standbyVid.paused) {
        tryPlay(standbyVid);
      }

      /* IMMEDIATELY start crossfade — fade in standby on top of everything */
      standbyVid.style.zIndex = '5';           /* above image (1) and active video (2) */
      standbyVid.classList.add('visible');       /* opacity 0 → 1 via CSS transition */

      /* After crossfade completes, clean up the old layers */
      setTimeout(function () {
        /* Hide the active video (now the OLD scene) */
        activeVid.classList.remove('visible');
        activeVid.pause();

        /* Hide the image layer if it was showing */
        heroImg.style.opacity = '0';
        heroImg.style.zIndex = '1';

        /* Swap A/B roles */
        var temp = activeVid;
        activeVid = standbyVid;
        standbyVid = temp;

        /* Reset the new standby (old active) */
        standbyVid.classList.remove('visible');
        standbyVid.style.zIndex = '';
        standbyVid.pause();

        /* Reset the new active video z-index to normal */
        activeVid.style.zIndex = '';

        /* Pre-buffer the NEXT scene for the upcoming cycle */
        prebufferNext();

        /* Schedule the next crossfade */
        scheduleNext();

      }, CROSSFADE_MS + 50);

    } else {
      /* ── Next scene is an IMAGE ── */

      /* Set the image source (may already be set from prebuffer) */
      var imgSrc = getHeroImageSrc(nextScene);
      heroImg.style.backgroundImage = 'url(' + imgSrc + ')';

      /* IMMEDIATELY start crossfade — fade image in ON TOP of video(s) */
      heroImg.style.zIndex = '5';    /* above both videos */
      heroImg.style.opacity = '1';   /* opacity 0 → 1 via CSS transition */

      /* After crossfade completes, clean up the video layers underneath */
      setTimeout(function () {
        /* Pause and hide both videos — they're now covered by the image */
        heroVideoA.classList.remove('visible');
        heroVideoA.pause();
        heroVideoB.classList.remove('visible');
        heroVideoB.pause();

        /* Reset image z-index to normal resting state */
        heroImg.style.zIndex = '3';

        /* Pre-buffer the NEXT scene for the upcoming cycle */
        prebufferNext();

        /* Schedule the next crossfade */
        scheduleNext();

      }, CROSSFADE_MS + 50);
    }
  }

  /* ── Schedule the next crossfade ── */
  function scheduleNext() {
    setTimeout(crossfadeToNext, SCENE_DISPLAY_MS);
  }

  /* ── Initialize first scene ── */
  function initCarousel() {
    var firstScene = HERO_SCENES[0];

    if (firstScene.video) {
      /* First scene is a video — load into VideoA and show it */
      loadVideoSources(heroVideoA, 0);
      var onFirstReady = function () {
        heroVideoA.removeEventListener('canplay', onFirstReady);
        heroVideoA.removeEventListener('loadeddata', onFirstReady);
        tryPlay(heroVideoA).then(function () {
          heroVideoA.classList.add('visible');
          /* Image hidden behind video */
          heroImg.style.opacity = '0';
          heroImg.style.zIndex = '1';
          /* Pre-buffer scene 1 and start the timer */
          prebufferNext();
          scheduleNext();
        });
      };
      if (heroVideoA.readyState >= 3) {
        onFirstReady();
      } else {
        heroVideoA.addEventListener('canplay', onFirstReady);
        heroVideoA.addEventListener('loadeddata', onFirstReady);
        /* Fallback: start anyway after 2s */
        setTimeout(function () {
          heroVideoA.removeEventListener('canplay', onFirstReady);
          heroVideoA.removeEventListener('loadeddata', onFirstReady);
          if (!heroVideoA.classList.contains('visible')) {
            tryPlay(heroVideoA);
            heroVideoA.classList.add('visible');
            heroImg.style.opacity = '0';
            heroImg.style.zIndex = '1';
            prebufferNext();
            scheduleNext();
          }
        }, 2000);
      }
    } else {
      /* First scene is an image */
      var imgSrc = getHeroImageSrc(firstScene);
      heroImg.style.backgroundImage = 'url(' + imgSrc + ')';
      heroImg.style.zIndex = '3';
      heroImg.style.opacity = '1';
      /* Pre-buffer scene 1 and start the timer */
      prebufferNext();
      scheduleNext();
    }
  }

  /* ── Start! ── */
  initCarousel();

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
