/* ============================================================
   SACRED STARBURST — Stripe-style radiant ray visualization
   Canvas 2D implementation using the site's earthy palette.
   Hundreds of thin lines fan outward from a bottom focal point,
   with color gradients in rich gold that transition to sage.
   Visible, alive, never a secret.
   
   Performance: pauses animation when canvas is off-screen.
   ============================================================ */

(function () {
  'use strict';

  /* -- Color palette — rich gold dominant, sage at edges -- */
  var COLORS = {
    /* Center (rich warm gold — unmistakable, not beige) */
    centerA: { r: 210, g: 175, b: 105 },  /* full aman-gold, rich */
    centerB: { r: 200, g: 168, b: 100 },  /* warm amber gold */
    /* Mid (gold with sage influence — still reads gold) */
    midA:    { r: 188, g: 162, b: 98  },  /* golden-sage blend */
    midB:    { r: 168, g: 155, b: 95  },  /* warm gold-sage */
    /* Edge (sage with gold undertone — green but warm) */
    edgeA:   { r: 138, g: 148, b: 90  },  /* sage-gold */
    edgeB:   { r: 110, g: 128, b: 75  }   /* deep sage */
  };

  /* Max opacity — rays are clearly visible, not hiding */
  var MAX_RAY_OPACITY = 0.55;

  /* Number of rays */
  var RAY_COUNT = 320;

  /* Spread angle in radians from the focal point upward.
     Math.PI = full semicircle (180°). */
  var SPREAD_ANGLE = Math.PI * 0.88;

  /* Animation timing — alive, meditative, noticeable */
  var DRIFT_SPEED  = 0.00032;   /* Noticeable angular sway */
  var PULSE_SPEED  = 0.001;     /* Clear brightness pulse */
  var LENGTH_SPEED = 0.0004;    /* Visible length breathing */

  /* ---- Ray class ---- */
  function Ray(index, total) {
    this.index = index;
    /* Evenly distribute across spread, centered on straight up */
    this.baseAngle = -Math.PI / 2 + (index / (total - 1) - 0.5) * SPREAD_ANGLE;
    /* Each ray has its own phase offsets for organic movement */
    this.driftPhase  = Math.random() * Math.PI * 2;
    this.pulsePhase  = Math.random() * Math.PI * 2;
    this.lengthPhase = Math.random() * Math.PI * 2;
    /* Base length as fraction of canvas height — varied for organic feel */
    this.baseLength  = 0.50 + Math.random() * 0.50;
    /* Line width — thin like Stripe's, slightly varied */
    this.width = 0.4 + Math.random() * 0.9;
    /* Precompute color for this ray based on its position in the fan */
    this._computeColor(index, total);
  }

  Ray.prototype._computeColor = function (index, total) {
    /* t goes from 0 (left edge) to 1 (right edge).
       Center rays (t ≈ 0.5) get rich gold, edge rays get cool sage. */
    var t = index / (total - 1);
    var centerWeight = 1 - Math.abs(t - 0.5) * 2; /* 1 at center, 0 at edges */
    centerWeight = Math.pow(centerWeight, 0.45);     /* Wide gold zone — gold dominates most of the fan */

    /* Interpolate between center and edge colors */
    var cA = COLORS.centerA, cB = COLORS.centerB;
    var eA = COLORS.edgeA,   eB = COLORS.edgeB;
    var mAc = COLORS.midA,   mBc = COLORS.midB;

    /* Two-stage interpolation: center→mid→edge */
    var r, g, b;
    if (centerWeight > 0.5) {
      /* Center to mid blend */
      var localT = (centerWeight - 0.5) / 0.5;
      r = Math.round(mAc.r + (cA.r - mAc.r) * localT);
      g = Math.round(mAc.g + (cA.g - mAc.g) * localT);
      b = Math.round(mAc.b + (cA.b - mAc.b) * localT);
    } else {
      /* Mid to edge blend */
      var localT = centerWeight / 0.5;
      r = Math.round(eA.r + (mAc.r - eA.r) * localT);
      g = Math.round(eA.g + (mAc.g - eA.g) * localT);
      b = Math.round(eA.b + (mAc.b - eA.b) * localT);
    }

    this.colorR = r;
    this.colorG = g;
    this.colorB = b;

    /* Base color — warm gold at the origin point */
    this.colorBaseR = Math.min(255, r + 15);
    this.colorBaseG = Math.min(255, g + 10);
    this.colorBaseB = Math.min(255, b + 4);
  };

  /* ---- Main renderer ---- */
  var instances = [];

  function StarburstInstance(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rays = [];
    this.animId = null;
    this.running = false;
    this.visible = false;
    this.lastTime = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    /* Generate rays */
    for (var i = 0; i < RAY_COUNT; i++) {
      this.rays.push(new Ray(i, RAY_COUNT));
    }

    /* Size canvas */
    this._resize();
    var self = this;
    this._resizeHandler = function () { self._resize(); };
    window.addEventListener('resize', this._resizeHandler);

    /* Respect reduced motion */
    this.reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Visibility observer — pause animation when off-screen */
    if ('IntersectionObserver' in window) {
      this._visObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          self.visible = entry.isIntersecting;
          if (self.visible && self.running && !self.animId) {
            /* Resume animation */
            self.lastTime = performance.now();
            self.animId = requestAnimationFrame(self._tick);
          }
        });
      }, { threshold: 0 });
      this._visObserver.observe(canvas);
    } else {
      this.visible = true;
    }
  }

  StarburstInstance.prototype._resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    /* Focal point at bottom center of canvas.
       Canvas bottom = section bottom (CSS bottom:0).
       Rays fan upward from here, extending above the section
       since canvas is taller than section via overflow:visible. */
    this.focalX = this.width / 2;
    this.focalY = this.height;
  };

  StarburstInstance.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.visible = true;
    this.lastTime = performance.now();
    var self = this;
    if (!this.reducedMotion) {
      this._tick = function (now) {
        /* Skip frame if not visible (off-screen) */
        if (!self.visible) {
          self.animId = null;
          return;
        }
        self._draw(now);
        self.animId = requestAnimationFrame(self._tick);
      };
      this.animId = requestAnimationFrame(this._tick);
    } else {
      /* Static frame for reduced motion */
      this._draw(this.lastTime);
    }
  };

  StarburstInstance.prototype.stop = function () {
    this.running = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    window.removeEventListener('resize', this._resizeHandler);
    if (this._visObserver) {
      this._visObserver.disconnect();
    }
  };

  StarburstInstance.prototype._draw = function (now) {
    var ctx = this.ctx;
    var w = this.width;
    var h = this.height;
    var fx = this.focalX;
    var fy = this.focalY;

    /* Skip if canvas has no dimensions */
    if (w === 0 || h === 0) return;

    /* Clear */
    ctx.clearRect(0, 0, w, h);

    /* Global pulse — gentle brightness oscillation */
    var globalPulse = 0.82 + 0.18 * Math.sin(now * PULSE_SPEED);

    /* Central glow — warm gold radial gradient at the focal point */
    var glowRadius = Math.max(1, Math.min(w, h) * 0.14);
    var glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, glowRadius);
    glow.addColorStop(0, 'rgba(210,175,105,' + (0.14 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(0.3, 'rgba(188,162,98,' + (0.08 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(0.65, 'rgba(168,155,95,' + (0.03 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(1, 'rgba(138,148,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(fx - glowRadius, fy - glowRadius, glowRadius * 2, glowRadius * 2);

    /* Draw each ray */
    for (var i = 0; i < this.rays.length; i++) {
      var ray = this.rays[i];

      /* Angular drift — noticeable sway with layered oscillation */
      var driftOffset = Math.sin(now * DRIFT_SPEED + ray.driftPhase) * 0.045;
      /* Secondary drift for organic feel */
      driftOffset += Math.sin(now * DRIFT_SPEED * 0.55 + ray.driftPhase * 1.4) * 0.025;
      /* Tertiary micro-drift for living texture */
      driftOffset += Math.sin(now * DRIFT_SPEED * 1.8 + ray.driftPhase * 0.7) * 0.012;
      var angle = ray.baseAngle + driftOffset;

      /* Length oscillation — rays visibly breathe */
      var lengthMod = 0.60 + 0.40 * Math.sin(now * LENGTH_SPEED + ray.lengthPhase);
      var length = ray.baseLength * lengthMod * h * 0.72;

      /* Per-ray pulse — noticeable brightness variation */
      var rayPulse = 0.55 + 0.45 * Math.sin(now * PULSE_SPEED * 0.7 + ray.pulsePhase);
      var opacity = MAX_RAY_OPACITY * rayPulse * globalPulse;

      /* Endpoint */
      var endX = fx + Math.cos(angle) * length;
      var endY = fy + Math.sin(angle) * length;

      /* Gradient along the ray */
      var grad = ctx.createLinearGradient(fx, fy, endX, endY);
      grad.addColorStop(0,    'rgba(' + ray.colorBaseR + ',' + ray.colorBaseG + ',' + ray.colorBaseB + ',' + (opacity * 0.90).toFixed(3) + ')');
      grad.addColorStop(0.08, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 1.0).toFixed(3) + ')');
      grad.addColorStop(0.30, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.85).toFixed(3) + ')');
      grad.addColorStop(0.55, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.55).toFixed(3) + ')');
      grad.addColorStop(0.75, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.25).toFixed(3) + ')');
      grad.addColorStop(0.90, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.07).toFixed(3) + ')');
      grad.addColorStop(1,    'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',0)');

      /* Draw the ray */
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ray.width;
      ctx.stroke();
    }

    /* Secondary glow layer — warm gold atmospheric depth */
    var glow2Radius = Math.max(1, Math.min(w, h) * 0.28);
    var glow2 = ctx.createRadialGradient(fx, fy, 0, fx, fy, glow2Radius);
    glow2.addColorStop(0, 'rgba(188,162,98,' + (0.07 * globalPulse).toFixed(3) + ')');
    glow2.addColorStop(0.35, 'rgba(168,155,95,' + (0.035 * globalPulse).toFixed(3) + ')');
    glow2.addColorStop(1, 'rgba(138,148,90,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(fx - glow2Radius, fy - glow2Radius, glow2Radius * 2, glow2Radius * 2);
  };

  /* ---- Public API ---- */
  window.SacredStarburst = {
    init: function (canvas) {
      if (!canvas) return;
      /* Prevent double-init on same canvas */
      for (var i = 0; i < instances.length; i++) {
        if (instances[i].canvas === canvas) return;
      }
      var inst = new StarburstInstance(canvas);
      instances.push(inst);
      inst.start();
    }
  };

})();
