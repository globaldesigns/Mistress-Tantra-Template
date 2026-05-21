/* ============================================================
   SACRED STARBURST — Stripe-style radiant ray visualization
   Canvas 2D implementation using the site's earthy palette.
   Hundreds of thin lines fan outward from a bottom focal point,
   with color gradients from warm bronze/gold at center to
   sage/forest at edges. Noticeable yet harmonious, meditative.
   ============================================================ */

(function () {
  'use strict';

  /* -- Color palette — more sage/green presence -- */
  var COLORS = {
    /* Center (warm bronze/gold with sage influence) */
    centerA: { r: 180, g: 165, b: 110 },  /* gold with sage warmth */
    centerB: { r: 165, g: 155, b: 105 },  /* muted gold-sage */
    /* Mid (transitional sage-green) — dominant zone, more green */
    midA:    { r: 145, g: 155, b: 100 },  /* sage-gold */
    midB:    { r: 122, g: 142, b: 96  },  /* warm sage */
    /* Edge (cool sage/forest) — rich green tones */
    edgeA:   { r: 105, g: 132, b: 88  },  /* sage-green */
    edgeB:   { r: 78,  g: 98,  b: 62  }   /* deep forest-sage */
  };

  /* Max opacity for individual rays — noticeable but not overwhelming */
  var MAX_RAY_OPACITY = 0.28;

  /* Number of rays */
  var RAY_COUNT = 280;

  /* Spread angle in radians from the focal point upward.
     Math.PI = full semicircle (180°). */
  var SPREAD_ANGLE = Math.PI * 0.94;

  /* Animation timing — more noticeable but meditative */
  var DRIFT_SPEED  = 0.00018;   /* Faster angular drift */
  var PULSE_SPEED  = 0.0006;    /* Faster brightness pulse */
  var LENGTH_SPEED = 0.00025;   /* Faster length oscillation */

  /* ---- Ray class ---- */
  function Ray(index, total) {
    this.index = index;
    /* Evenly distribute across spread, centered on straight up */
    this.baseAngle = -Math.PI / 2 + (index / (total - 1) - 0.5) * SPREAD_ANGLE;
    /* Each ray has its own phase offsets for organic movement */
    this.driftPhase  = Math.random() * Math.PI * 2;
    this.pulsePhase  = Math.random() * Math.PI * 2;
    this.lengthPhase = Math.random() * Math.PI * 2;
    /* Base length as fraction of canvas height — longer rays extending higher */
    this.baseLength  = 0.55 + Math.random() * 0.45;
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
    centerWeight = Math.pow(centerWeight, 0.55);     /* Wider sage zone — more green */

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
      /* Mid to edge blend — this is now the dominant zone */
      var localT = centerWeight / 0.5;
      r = Math.round(eA.r + (mAc.r - eA.r) * localT);
      g = Math.round(eA.g + (mAc.g - eA.g) * localT);
      b = Math.round(eA.b + (mAc.b - eA.b) * localT);
    }

    this.colorR = r;
    this.colorG = g;
    this.colorB = b;

    /* Base color — slightly warmer/golden at the origin point */
    this.colorBaseR = Math.min(255, r + 20);
    this.colorBaseG = Math.min(255, g + 12);
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

    /* Clear */
    ctx.clearRect(0, 0, w, h);

    /* Global pulse — noticeable but gentle brightness oscillation */
    var globalPulse = 0.8 + 0.2 * Math.sin(now * PULSE_SPEED);

    /* Central glow — soft radial gradient at the focal point, more sage */
    var glowRadius = Math.max(1, Math.min(w, h) * 0.15);
    var glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, glowRadius);
    glow.addColorStop(0, 'rgba(180,165,110,' + (0.16 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(0.35, 'rgba(145,155,100,' + (0.08 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(0.7, 'rgba(122,138,106,' + (0.03 * globalPulse).toFixed(3) + ')');
    glow.addColorStop(1, 'rgba(105,132,88,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(fx - glowRadius, fy - glowRadius, glowRadius * 2, glowRadius * 2);

    /* Draw each ray */
    for (var i = 0; i < this.rays.length; i++) {
      var ray = this.rays[i];

      /* Angular drift — more noticeable oscillation around base angle */
      var driftOffset = Math.sin(now * DRIFT_SPEED + ray.driftPhase) * 0.03;
      /* Add a secondary slower drift for organic feel */
      driftOffset += Math.sin(now * DRIFT_SPEED * 0.6 + ray.driftPhase * 1.3) * 0.015;
      var angle = ray.baseAngle + driftOffset;

      /* Length oscillation — rays grow and shrink more visibly */
      var lengthMod = 0.65 + 0.35 * Math.sin(now * LENGTH_SPEED + ray.lengthPhase);
      /* Rays extend higher — full canvas height utilization */
      var length = ray.baseLength * lengthMod * h * 1.05;

      /* Per-ray pulse — more noticeable brightness variation */
      var rayPulse = 0.6 + 0.4 * Math.sin(now * PULSE_SPEED * 0.8 + ray.pulsePhase);
      var opacity = MAX_RAY_OPACITY * rayPulse * globalPulse;

      /* Endpoint */
      var endX = fx + Math.cos(angle) * length;
      var endY = fy + Math.sin(angle) * length;

      /* Gradient along the ray — warm at base, fading to transparent at tip */
      var grad = ctx.createLinearGradient(fx, fy, endX, endY);
      grad.addColorStop(0, 'rgba(' + ray.colorBaseR + ',' + ray.colorBaseG + ',' + ray.colorBaseB + ',' + (opacity * 1.3).toFixed(3) + ')');
      grad.addColorStop(0.1, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 1.0).toFixed(3) + ')');
      grad.addColorStop(0.4, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.55).toFixed(3) + ')');
      grad.addColorStop(0.75, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',' + (opacity * 0.18).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(' + ray.colorR + ',' + ray.colorG + ',' + ray.colorB + ',0)');

      /* Draw the ray */
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ray.width;
      ctx.stroke();
    }

    /* Secondary glow layer — larger, sage-tinted, for atmospheric depth */
    var glow2Radius = Math.max(1, Math.min(w, h) * 0.3);
    var glow2 = ctx.createRadialGradient(fx, fy, 0, fx, fy, glow2Radius);
    glow2.addColorStop(0, 'rgba(145,155,100,' + (0.06 * globalPulse).toFixed(3) + ')');
    glow2.addColorStop(0.4, 'rgba(122,138,106,' + (0.03 * globalPulse).toFixed(3) + ')');
    glow2.addColorStop(1, 'rgba(105,132,88,0)');
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
