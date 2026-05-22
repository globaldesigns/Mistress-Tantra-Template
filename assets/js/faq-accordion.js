/* ══════════════════════════════════════════════════════════════════════════════
   FAQ MODULE — Accordion JavaScript
   One item open per category at a time.
   ══════════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {
  // Track open item per category: { catIndex: itemIndex }
  var openMap = {};

  document.querySelectorAll('.faq-accordion-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-accordion-item');
      var category = item.closest('.faq-category');
      var catIndex = getCategoryIndex(category);
      var itemIndex = getItemIndex(category, item);

      if (openMap[catIndex] === itemIndex) {
        // Close current
        item.classList.remove('faq-open');
        btn.setAttribute('aria-expanded', 'false');
        delete openMap[catIndex];
      } else {
        // Close previously open in this category
        var prevOpen = category.querySelector('.faq-open');
        if (prevOpen) {
          prevOpen.classList.remove('faq-open');
          prevOpen.querySelector('.faq-accordion-btn').setAttribute('aria-expanded', 'false');
        }
        // Open clicked item
        item.classList.add('faq-open');
        btn.setAttribute('aria-expanded', 'true');
        openMap[catIndex] = itemIndex;
      }
    });
  });

  function getCategoryIndex(categoryEl) {
    var categories = document.querySelectorAll('.faq-category');
    for (var i = 0; i < categories.length; i++) {
      if (categories[i] === categoryEl) return i;
    }
    return 0;
  }

  function getItemIndex(categoryEl, itemEl) {
    var items = categoryEl.querySelectorAll('.faq-accordion-item');
    for (var i = 0; i < items.length; i++) {
      if (items[i] === itemEl) return i;
    }
    return 0;
  }
});
