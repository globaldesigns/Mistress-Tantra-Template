/* ============================================================
   MISTRESS TANTRA — Shared JavaScript
   Multi-Page Navigation · Scroll Animations · Fixed Heroes
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- NAVBAR SCROLL EFFECT ---
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // --- MOBILE MENU TOGGLE ---
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- SCROLL PROGRESS BAR ---
  const scrollProgress = document.querySelector('.scroll-progress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgress.style.width = scrollPercent + '%';
    }, { passive: true });
  }

  // --- BACK TO TOP ---
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- SCROLL ANIMATIONS (Intersection Observer) ---
  const animatedElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .fade-in-up, .fade-in-scale, .section-entrance');
  if (animatedElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  }

  // --- SECTION ENTRANCE OBSERVER (triggers earlier) ---
  const sectionEntranceEls = document.querySelectorAll('.section-entrance');
  if (sectionEntranceEls.length > 0) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -5% 0px'
    });
    sectionEntranceEls.forEach(el => sectionObserver.observe(el));
  }

  // --- FIXED HERO BACKGROUND MANAGEMENT ---
  // Fade the fixed hero bg as user scrolls — but keep it partially visible as ghostly background
  const heroSection = document.querySelector('.hero');
  const heroBg = document.querySelector('.hero > .hero-bg');

  if (heroSection && heroBg) {
    const handleHeroFade = () => {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      const viewportH = window.innerHeight;
      // Start fading as soon as hero bottom enters viewport
      const fadeProgress = Math.max(0, Math.min(1, 1 - (heroBottom / viewportH)));
      // Fade from 1.0 down to 0.12 — never fully disappear, stays as ghostly bg
      const opacity = 1 - (fadeProgress * 0.88);
      heroBg.style.opacity = Math.max(0.12, opacity);
      heroBg.style.transition = 'none'; // No CSS transition — direct from scroll
    };
    window.addEventListener('scroll', handleHeroFade, { passive: true });
    handleHeroFade();
  }

  // --- PAGE TRANSITIONS DISABLED ---
  // Navigation is instant — no overlay or delay

  // --- FORM HANDLING ---
  // Simple form feedback for the connect page
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Sent with Gratitude ✓';
        btn.style.borderColor = 'var(--sage)';
        btn.style.color = 'var(--sage)';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.borderColor = '';
          btn.style.color = '';
          this.reset();
        }, 3000);
      }
    });
  });

  // --- DYNAMIC FOOTER YEAR ---
  const yearEl = document.querySelector('.footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // --- FOOTER HAMBURGER MENU ---
  const footerHamburger = document.getElementById('footerHamburger');
  const footerNav = document.getElementById('footerNav');
  if (footerHamburger && footerNav) {
    footerHamburger.addEventListener('click', () => {
      footerHamburger.classList.toggle('open');
      footerNav.classList.toggle('open');
    });
    footerNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        footerHamburger.classList.remove('open');
        footerNav.classList.remove('open');
      });
    });
  }

});