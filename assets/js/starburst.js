/* ============================================================
   SACRED STARBURST — Stripe-style radiant ray visualization
   Canvas 2D implementation using the site's earthy palette.
   Hundreds of thin lines fan outward from a bottom focal point,
   with color gradients from warm bronze/gold at center to
   sage/forest at edges. Effortlessly visible, meditative motion.
   ============================================================ */

(function () {
  'use strict';

  /* -- Color palette — sage-dominant with gold accents -- */
  var COLORS = {
    /* Center (warm gold-sage — present but not heavy) */
    centerA: { r: 185, g: 168, b: 112 },  /* muted aman-gold */
    centerB: { r: 170, g: 160, b: 108 },  /* soft gold-sage */
    /* Mid (transitional sage-green — dominant zone) */
    midA:    { r: 140, g: 152, b: 100 },  /* sage-gold blend */
    midB:    { r: 118, g: 140, b: 92  },  /* warm sage */
    /* Edge (cool sage/forest — rich green tones) */
    edgeA:   { r: 98,  g: 128, b: 82  },  /* sage-green */
    edgeB:   { r: 75,  g: 100, b: 60  }   /* deep forest-sage */
  };

  /* Max opacity for individual rays — effortlessly visible without straining */
  var MAX_RAY_OPACITY = 0.52;

  /* Number of rays — density for visual impact */
  var RAY_COUNT = 320;

  /* Spread angle in radians from the focal point upward.
     Math.PI = full semicircle (180°). */
  var SPREAD_ANGLE = Math.PI * 0.94;

  /* Animation timing — noticeably alive, meditative not frantic */
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
       Center rays (t ≈ 0.5) get warm gold, edge rays get cool sage. */
    var t = index / (total - 1);
    var centerWeight = 1 - Math.abs(t - 0.5) * 2; /* 1 at center, 0 at edges */
    centerWeight = Math.pow(centerWeight, 0.55);     /* Wider sage zone — green dominates most of the fan */

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
      /* Mid to edge blend — this is the dominant zone */
      var localT = centerWeight / 0.5;
      r = Math.round(eA.r + (mAc.r - eA.r) * localT);
      g = Math.round(eA.g + (mAc.g - eA.g) * localT);
      b = Math.round(eA.b + (mAc.b - eA.b) * localT);
    }

    this.colorR = r;
    this.colorG = g;
    this.colorB = b;

    /* Base color — subtle warmth at the origin, not a bright gold spot */
    this.colorBaseR = Math.min(255, r + 10);
    this.colorBaseG = Math.min(255, g + 8);
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
    this.lastTime = performance.now();
    var self = this;
    if (!this.reducedMotion) {
      this._tick = function (now) {
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
  };

  StarburstInstance.prototype._draw = function (now) {
    var ctx = this.ctx;
    var w = this.width;
    var h = this.height;
    var fx = this.focalX;
    var fy = this.focalY;

    /* Clear */
    ctx.clearRect(0, 0, w, h);

    /* Global pulse — gentle brightness oscillation */
    var globalPulse = 0.82 + 0.18 * Math.sin(now * PULSE_SPEED);

    /* Central glow — subtle sage-gold radial gradient, not a bright gold spot */
    var glowRadius = Math.max(1, Math.min(w, h) * 0.12);
    var glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, glowRadius);
    glow.addColorStop(0, 'rgba(170,160,108,' + (0.10 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(0.3, 'rgba(140,152,100,' + (0.06 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(0.65, 'rgba(118,140,92,' + (0.025 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(1, 'rgba(98,128,82,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(fx - glowRadius, fy - glowRadius, glowRadius * 2, glowRadius * 2);

    /* Draw each ray */
    for (var i = 0; i < this.rays.length; i++) {
      var ray = this.rays[i];

      /* Angular drift — noticeable sway with primary and secondary oscillation */
      var driftOffset = Math.sin(now * DRIFT_SPEED + ray.driftPhase) * 0.045;
      /* Secondary drift for organic feel — different frequency */
      driftOffset += Math.sin(now * DRIFT_SPEED * 0.55 + ray.driftPhase * 1.4) * 0.025;
      /* Tertiary micro-drift for living texture */
      driftOffset += Math.sin(now * DRIFT_SPEED * 1.8 + ray.driftPhase * 0.7) * 0.012;
      var angle = ray.baseAngle + driftOffset;

      /* Length oscillation — rays visibly breathe */
      var lengthMod = 0.60 + 0.40 * Math.sin(now * LENGTH_SPEED + ray.lengthPhase);
      var length = ray.baseLength * lengthMod * h * 1.05;

      /* Per-ray pulse — noticeable brightness variation */
      var rayPulse = 0.55 + 0.45 * Math.sin(now * PULSE_SPEED * 0.7 + ray.pulsePhase);
      var opacity = MAX_RAY_OPACITY * rayPulse * globalPulse;

      /* Endpoint */
      var endX = fx + Math.cos(angle) * length;
      var endY = fy + Math.sin(angle) * length;

      /* Gradient along the ray — visible in mid-section, fades at both ends.
         Base: subtle warmth (not bright gold).
         8%: full ray color at peak opacity.
         25%: still clearly visible — the "body" of the ray.
         45%: solid mid-section presence.
         65%: starting to thin — transition zone.
         82%: nearly gone — tips are whisper-thin.
         100%: transparent. */
      var grad = ctx.createLinearGradient(fx, fy, endX, endY);
      grad.addColorStop(0,    'rgba(' + ray.colorBaseR + ',' + ray.colorBaseG + ',' + ray.colorBaseB + ',' + (opacity * 0.85).toFixed(3) + ')');
      grad.addColorStop(0.08, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.95).toFixed(3) + ')');
      grad.addColorStop(0.25, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.80).toFixed(3) + ')');
      grad.addColorStop(0.45, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.50).toFixed(3) + ')');
      grad.addColorStop(0.65, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.22).toFixed(3) + ')');
      grad.addColorStop(0.82, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.06).toFixed(3) + ')');
      grad.addColorStop(1,    'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',0)');

      /* Draw the ray */
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ray.width;
      ctx.stroke();
    }

    /* Secondary glow layer — subtle sage atmospheric depth, no gold dominance */
    var glow2Radius = Math.max(1, Math.min(w, h) * 0.25);
    var glow2 = ctx.createRadialGradient(fx, fy, 0, fx, fy, glow2Radius);
    glow2.addColorStop(0, 'rgba(140,152,100,' + (0.045 * globalPulse).toFixed(3) + ')');
    glow2.addColorStop(0.35, 'rgba(118,140,92,' + (0.025 * globalPulse).toFixed(3) + ')');
    glow2.addColorStop(1, 'rgba(98,128,82,0)');
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
