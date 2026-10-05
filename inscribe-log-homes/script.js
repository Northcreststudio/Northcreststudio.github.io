/* In Scribe Log Homes — redesign preview */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Header ---------- */
  var header = document.querySelector('.site-header');
  function onScrollHeader() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Sticky "Call Now" once the hero buttons scroll away ---------- */
  var callNow = document.querySelector('.call-now');
  var heroActions = document.querySelector('.hero__actions');
  if (callNow && heroActions && hasIO) {
    new IntersectionObserver(function (entries) {
      callNow.classList.toggle('is-shown', !entries[0].isIntersecting);
    }).observe(heroActions);
  } else if (callNow) {
    callNow.classList.add('is-shown');
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (open) header.classList.add('is-scrolled'); else onScrollHeader();
  }
  toggle.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false); });

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a:not(.btn)'));
  if (hasIO) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'about', 'services', 'process', 'gallery'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (!hasIO || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
    window.addEventListener('load', function () {
      setTimeout(function () {
        reveals.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible'); });
      }, 1200);
    });
  }

  /* ---------- Build process: red line draws down as you scroll ---------- */
  var steps = document.querySelector('.steps');
  var stepItems = steps ? Array.prototype.slice.call(steps.querySelectorAll('.step')) : [];
  if (steps && !reduceMotion) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var rect = steps.getBoundingClientRect();
      var marker = window.innerHeight * 0.6; // the point on screen the line "reaches"
      var progress = Math.max(0, Math.min(1, (marker - rect.top) / rect.height));
      steps.style.setProperty('--progress', progress.toFixed(4));
      stepItems.forEach(function (s) {
        var dot = s.querySelector('.step__dot').getBoundingClientRect();
        s.classList.toggle('is-lit', dot.top + dot.height / 2 < marker);
      });
    };
    var request = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    steps.style.setProperty('--progress', '0');
    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
  } else {
    stepItems.forEach(function (s) { s.classList.add('is-lit'); });
  }

  /* ---------- Gallery filters ---------- */
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('.filter'));
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      shots.forEach(function (s) {
        var show = f === 'all' || s.getAttribute('data-cat') === f;
        s.classList.toggle('is-hidden', !show);
        s.classList.remove('is-entering');
        if (show && !reduceMotion) { void s.offsetWidth; s.classList.add('is-entering'); }
      });
    });
  });

  /* ---------- Lightbox (gallery photos + plans) ---------- */
  var lightbox = document.getElementById('lightbox');
  var lbImg = lightbox.querySelector('.lightbox__img');
  var lbCap = lightbox.querySelector('.lightbox__caption');
  var group = [];
  var lbIndex = 0;
  var lastFocus = null;

  function show(i) {
    lbIndex = (i + group.length) % group.length;
    var item = group[lbIndex];
    var img = item.querySelector('img');
    lbImg.src = item.getAttribute('href');
    lbImg.alt = img ? img.alt : '';
    var label = item.getAttribute('data-caption') || (img ? img.alt : '');
    lbCap.textContent = label + (group.length > 1 ? '  ·  ' + (lbIndex + 1) + ' / ' + group.length : '');
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
  }
  function openLb(items, i) {
    group = items;
    lastFocus = document.activeElement;
    show(i);
    lightbox.hidden = false;
    root.classList.add('lightbox-open');
    lightbox.querySelector('.lightbox__close').focus();
  }
  function closeLb() {
    lightbox.hidden = true;
    root.classList.remove('lightbox-open');
    if (lastFocus) lastFocus.focus();
  }

  shots.forEach(function (s) {
    s.addEventListener('click', function (e) {
      e.preventDefault();
      var visible = shots.filter(function (x) { return !x.classList.contains('is-hidden'); });
      openLb(visible, visible.indexOf(s));
    });
  });
  var plans = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox="plans"]'));
  plans.forEach(function (p, i) {
    p.addEventListener('click', function (e) { e.preventDefault(); openLb(plans, i); });
  });

  lightbox.querySelector('.lightbox__close').addEventListener('click', closeLb);
  lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', function () { show(lbIndex - 1); });
  lightbox.querySelector('.lightbox__nav--next').addEventListener('click', function () { show(lbIndex + 1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.classList.contains('lightbox__figure')) closeLb();
  });
  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') show(lbIndex + 1);
    if (e.key === 'ArrowLeft') show(lbIndex - 1);
    if (e.key === 'Tab') {
      var b = lightbox.querySelectorAll('button');
      if (e.shiftKey && document.activeElement === b[0]) { e.preventDefault(); b[b.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === b[b.length - 1]) { e.preventDefault(); b[0].focus(); }
    }
  });
  var sx = 0, sy = 0;
  lightbox.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(lbIndex + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLb();
  }, { passive: true });

  /* ---------- Contact form (preview: no backend) ---------- */
  var form = document.getElementById('quote-form');
  var success = document.getElementById('form-success');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = null;
    form.querySelectorAll('[required]').forEach(function (field) {
      var ok = field.checkValidity() && field.value.trim() !== '';
      field.closest('.field').classList.toggle('is-invalid', !ok);
      if (!ok && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });
  ['input', 'change'].forEach(function (type) {
    form.addEventListener(type, function (e) {
      var f = e.target.closest('.field');
      if (f && e.target.checkValidity()) f.classList.remove('is-invalid');
    });
  });
  document.getElementById('form-reset').addEventListener('click', function () {
    form.reset();
    success.hidden = true;
    form.hidden = false;
    form.querySelector('input').focus();
  });
})();
