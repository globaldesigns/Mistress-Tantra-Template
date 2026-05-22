/**
 * Responsive Video Source Selector
 * 
 * Loaded in <head> BEFORE any <video> elements in the body.
 * Sets window.__videoDir based on viewport width.
 * 
 * Uses data-src instead of src on <source> elements to prevent 
 * the browser from fetching videos with the {dir} placeholder.
 * On DOMContentLoaded, replaces {dir} with the correct device directory
 * and moves data-src → src, then calls video.load().
 * 
 * Usage in HTML:
 *   <video autoplay muted loop playsinline data-responsive>
 *     <source data-src="assets/videos/{dir}/hero-bg.webm" type="video/webm">
 *     <source data-src="assets/videos/{dir}/hero-bg.mp4" type="video/mp4">
 *   </video>
 * 
 * Device breakpoints:
 *   Laptop/Desktop: >= 1024px → laptop
 *   Tablet Landscape: 768-1023px → tablet-l
 *   Tablet Portrait: 480-767px → tablet-p
 *   Mobile: <= 480px → mobile
 */
(function() {
  'use strict';

  var BREAKPOINTS = [
    { maxWidth: 480, dir: 'mobile' },
    { maxWidth: 767, dir: 'tablet-p' },
    { maxWidth: 1023, dir: 'tablet-l' },
    { maxWidth: Infinity, dir: 'laptop' }
  ];

  var w = window.innerWidth;
  var dir = 'laptop';
  for (var i = 0; i < BREAKPOINTS.length; i++) {
    if (w <= BREAKPOINTS[i].maxWidth) {
      dir = BREAKPOINTS[i].dir;
      break;
    }
  }

  window.__videoDir = dir;

  function updateSources() {
    var sources = document.querySelectorAll('video[data-responsive] source[data-src]');
    for (var i = 0; i < sources.length; i++) {
      var dataSrc = sources[i].getAttribute('data-src') || '';
      // Replace {dir} placeholder with actual device directory
      var realSrc = dataSrc.replace('{dir}', dir);
      sources[i].setAttribute('src', realSrc);
    }
    // Load all responsive videos
    var videos = document.querySelectorAll('video[data-responsive]');
    for (var j = 0; j < videos.length; j++) {
      videos[j].load();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateSources);
  } else {
    updateSources();
  }
})();
