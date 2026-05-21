/* ============================================================
   SACRED STARBURST — Stripe-style radiant ray visualization
   Canvas 2D implementation using the site's earthy palette.
   Hundreds of thin lines fan outward from a bottom focal point,
   with color gradients from warm bronze/gold at center to
   sage/forest at edges. Very subtle, meditative animation.
   ============================================================ */

(function () {
  'use strict';

  /* -- Color palette (matches CSS custom properties) -- */
  var COLORS = {
    /* Center (warm bronze/gold) — high saturation, warm */
    centerA: { r: 201, g: 169, b: 110 },  /* aman-gold */
    centerB: { r: 182, g: 157, b: 115 },  /* warm bronze */
    /* Mid (transitional sage-gold) */
    midA:    { r: 168, g: 155, b: 100 },  /* muted gold-sage */
    midB:    { r: 140, g: 148, b: 100 },  /* sage-gold */
    /* Edge (cool sage/forest) — desaturated, cool */
    edgeA:   { r: 122, g: 138, b: 106 },  /* sage */
    edgeB:   { r: 85,  g: 100, b: 72  }   /* deep sage-forest */
  };

  /* Max opacity for individual rays — kept very subtle */
  var MAX_RAY_OPACITY = 0.18;

  /* Number of rays — enough for density without killing performance */
  var RAY_COUNT = 260;

  /* Spread angle in radians from the focal point upward.
     Math.PI = full semicircle (180°). We use a touch less for elegance. */
  var SPREAD_ANGLE = Math.PI * 0.92;

  /* Animation timing */
  var DRIFT_SPEED  = 0.00008;   /* How fast rays drift angularly */
  var PULSE_SPEED  = 0.0004;    /* How fast brightness pulses */
  var LENGTH_SPEED = 0.00015;   /* How fast length variation oscillates */

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
    this.baseLength  = 0.35 + Math.random() * 0.55;
    /* Line width — very thin like Stripe's */
    this.width = 0.4 + Math.random() * 0.8;
    /* Precompute color for this ray based on its position in the fan */
    this._computeColor(index, total);
  }

  Ray.prototype._computeColor = function (index, total) {
    /* t goes from 0 (left edge) to 1 (right edge).
       Center rays (t ≈ 0.5) get warm gold, edge rays get cool sage. */
    var t = index / (total - 1);
    var centerWeight = 1 - Math.abs(t - 0.5) * 2; /* 1 at center, 0 at edges */
    centerWeight = Math.pow(centerWeight, 0.7);     /* Soften the transition */

    /* Interpolate between center and edge colors */
    var cA = COLORS.centerA, cB = COLORS.centerB;
    var eA = COLORS.edgeA,   eB = COLORS.edgeB;
    var mAc = COLORS.midA,   mBc = COLORS.midB;

    /* Use a two-stage interpolation: center→mid→edge */
    var r, g, b;
    if (centerWeight > 0.4) {
      /* Center to mid blend */
      var localT = (centerWeight - 0.4) / 0.6;
      r = Math.round(mAc.r + (cA.r - mAc.r) * localT);
      g = Math.round(mAc.g + (cA.g - mAc.g) * localT);
      b = Math.round(mAc.b + (cA.b - mAc.b) * localT);
    } else {
      /* Mid to edge blend */
      var localT = centerWeight / 0.4;
      r = Math.round(eA.r + (mAc.r - eA.r) * localT);
      g = Math.round(eA.g + (mAc.g - eA.g) * localT);
      b = Math.round(eA.b + (mAc.b - eA.b) * localT);
    }

    this.colorR = r;
    this.colorG = g;
    this.colorB = b;

    /* Add a subtle second color for the ray's gradient (slightly warmer at base) */
    this.colorBaseR = Math.min(255, r + 15);
    this.colorBaseG = Math.min(255, g + 10);
    this.colorBaseB = Math.min(255, b + 5);
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

    /* Focal point at bottom center of canvas */
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
    var elapsed = now - this.lastTime;

    /* Clear */
    ctx.clearRect(0, 0, w, h);

    /* Global pulse — subtle overall brightness oscillation */
    var globalPulse = 0.85 + 0.15 * Math.sin(now * PULSE_SPEED);

    /* Central glow — soft radial gradient at the focal point */
    var glowRadius = Math.max(1, Math.min(w, h) * 0.12);
    var glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, glowRadius);
    glow.addColorStop(0, 'rgba(201,169,110,' + (0.12 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(0.4, 'rgba(182,157,115,' + (0.06 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(1, 'rgba(122,138,106,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(fx - glowRadius, fy - glowRadius, glowRadius * 2, glowRadius * 2);

    /* Draw each ray */
    for (var i = 0; i < this.rays.length; i++) {
      var ray = this.rays[i];

      /* Angular drift — each ray slowly oscillates around its base angle */
      var driftOffset = Math.sin(now * DRIFT_SPEED + ray.driftPhase) * 0.015;
      var angle = ray.baseAngle + driftOffset;

      /* Length oscillation — rays slowly grow and shrink */
      var lengthMod = 0.7 + 0.3 * Math.sin(now * LENGTH_SPEED + ray.lengthPhase);
      var length = ray.baseLength * lengthMod * h * 0.85;

      /* Per-ray pulse — subtle brightness variation */
      var rayPulse = 0.7 + 0.3 * Math.sin(now * PULSE_SPEED * 0.7 + ray.pulsePhase);
      var opacity = MAX_RAY_OPACITY * rayPulse * globalPulse;

      /* Endpoint */
      var endX = fx + Math.cos(angle) * length;
      var endY = fy + Math.sin(angle) * length;

      /* Gradient along the ray — warm at base, fading to transparent at tip */
      var grad = ctx.createLinearGradient(fx, fy, endX, endY);
      grad.addColorStop(0, 'rgba(' + ray.colorBaseR + ',' + ray.colorBaseG + ',' + ray.colorBaseB + ',' + (opacity * 1.2).toFixed(3) + ')');
      grad.addColorStop(0.15, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.9).toFixed(3) + ')');
      grad.addColorStop(0.5, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.5).toFixed(3) + ')');
      grad.addColorStop(0.85, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.15).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',0)');

      /* Draw the ray */
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ray.width;
      ctx.stroke();
    }

    /* Secondary glow layer — larger, even softer, for atmospheric depth */
    var glow2Radius = Math.max(1, Math.min(w, h) * 0.25);
    var glow2 = ctx.createRadialGradient(fx, fy, 0, fx, fy, glow2Radius);
    glow2.addColorStop(0, 'rgba(201,169,110,' + (0.04 * globalPulse).toFixed(3) + ')');
    glow2.addColorStop(0.5, 'rgba(168,155,100,' + (0.02 * globalPulse).toFixed(3) + ')');
    glow2.addColorStop(1, 'rgba(122,138,106,0)');
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
