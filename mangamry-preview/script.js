/* Mangamry Construction Inc. — redesign preview */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: transparent → frosted on scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScrollHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Sticky "Call Now" appears once the hero buttons are out of view ---------- */
  var callNow = document.querySelector('.call-now');
  var heroActions = document.querySelector('.hero__actions');
  if (callNow && heroActions && 'IntersectionObserver' in window) {
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
    if (open) header.classList.add('is-scrolled');
    else onScrollHeader();
  }
  toggle.addEventListener('click', function () {
    setMenu(!root.classList.contains('menu-open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a:not(.btn)'));
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'about', 'services', 'projects'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });

    // Safety net: never leave content hidden
    window.addEventListener('load', function () {
      setTimeout(function () {
        reveals.forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
        });
      }, 1200);
    });
  }

  /* ---------- Process timeline: amber line draws with scroll ---------- */
  var timeline = document.querySelector('.timeline');
  var steps = timeline ? Array.prototype.slice.call(timeline.querySelectorAll('.step')) : [];

  if (timeline && !reduceMotion) {
    var ticking = false;
    var vertical = window.matchMedia('(max-width: 720px)');

    var updateTimeline = function () {
      ticking = false;
      var rect = timeline.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 when the timeline top reaches 85% of the viewport, 1 when its bottom reaches 55%
      var start = vh * 0.85;
      var end = vh * 0.55;
      var total = rect.height + (start - end);
      var progress = (start - rect.top) / total;
      progress = Math.max(0, Math.min(1, progress));
      timeline.style.setProperty('--progress', progress.toFixed(4));

      steps.forEach(function (step, i) {
        var threshold;
        if (vertical.matches) {
          threshold = (step.offsetTop + 36) / timeline.offsetHeight;
        } else {
          threshold = steps.length > 1 ? i / (steps.length - 1) : 0;
        }
        step.classList.toggle('is-lit', progress >= threshold - 0.02);
      });
    };
    var requestTimeline = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateTimeline); }
    };
    timeline.style.setProperty('--progress', '0');
    updateTimeline();
    window.addEventListener('scroll', requestTimeline, { passive: true });
    window.addEventListener('resize', requestTimeline);
  } else {
    steps.forEach(function (s) { s.classList.add('is-lit'); });
  }

  /* ---------- Testimonials carousel ---------- */
  var carousel = document.querySelector('.carousel');
  if (carousel) {
    var track = carousel.querySelector('.carousel__track');
    var slides = track.children;
    var dotsWrap = carousel.querySelector('.carousel__dots');
    var viewport = carousel.querySelector('.carousel__viewport');
    var index = 0;
    var timer = null;
    var DELAY = 6500;

    var dots = Array.prototype.map.call(slides, function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel__dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      b.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    var go = function (i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      dots.forEach(function (d, n) { d.setAttribute('aria-selected', String(n === index)); });
      Array.prototype.forEach.call(slides, function (s, n) { s.setAttribute('aria-hidden', String(n !== index)); });
    };
    var stop = function () { clearInterval(timer); timer = null; };
    var start = function () {
      if (reduceMotion || timer) return;
      timer = setInterval(function () { go(index + 1); }, DELAY);
    };
    var restart = function () { stop(); start(); };

    carousel.querySelectorAll('.carousel__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        go(index + Number(btn.getAttribute('data-dir')));
        restart();
      });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    // Swipe / drag
    var startX = 0, startY = 0, dx = 0, dragging = false, locked = null;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; locked = null; dx = 0;
      startX = e.clientX; startY = e.clientY;
      stop();
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var mx = e.clientX - startX;
      var my = e.clientY - startY;
      if (locked === null && (Math.abs(mx) > 6 || Math.abs(my) > 6)) {
        locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
        if (locked === 'x') {
          track.classList.add('is-dragging');
          try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
      }
      if (locked !== 'x') return;
      dx = mx;
      var w = viewport.offsetWidth;
      track.style.transform = 'translateX(' + (-index * w + dx) + 'px)';
    });
    var endDrag = function () {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      if (locked === 'x' && Math.abs(dx) > viewport.offsetWidth * 0.15) {
        go(index + (dx < 0 ? 1 : -1));
      } else {
        go(index);
      }
      start();
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);

    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(index + 1); restart(); }
      if (e.key === 'ArrowLeft') { go(index - 1); restart(); }
    });

    go(0);
    // Begin auto-sliding once the carousel is on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.3 }).observe(carousel);
    } else {
      start();
    }
  }

  /* ---------- Project photo lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var works = Array.prototype.slice.call(document.querySelectorAll('.work'));
  if (lightbox && works.length) {
    var lbImg = lightbox.querySelector('.lightbox__img');
    var lbCap = lightbox.querySelector('.lightbox__caption');
    var lbIndex = 0;
    var lastFocus = null;

    var show = function (i) {
      lbIndex = (i + works.length) % works.length;
      var w = works[lbIndex];
      var img = w.querySelector('img');
      lbImg.src = w.getAttribute('href');
      lbImg.alt = img.alt;
      lbCap.textContent = w.getAttribute('data-caption') + '  ·  ' + (lbIndex + 1) + ' / ' + works.length;
      // restart the fade-in
      lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
    };
    var openLb = function (i) {
      lastFocus = document.activeElement;
      show(i);
      lightbox.hidden = false;
      root.classList.add('lightbox-open');
      lightbox.querySelector('.lightbox__close').focus();
    };
    var closeLb = function () {
      lightbox.hidden = true;
      root.classList.remove('lightbox-open');
      if (lastFocus) lastFocus.focus();
    };

    works.forEach(function (w, i) {
      w.addEventListener('click', function (e) { e.preventDefault(); openLb(i); });
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
      if (e.key === 'Tab') { // keep focus inside the dialog
        var f = lightbox.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Swipe between photos
    var lbStartX = 0, lbStartY = 0;
    lightbox.addEventListener('touchstart', function (e) {
      lbStartX = e.touches[0].clientX; lbStartY = e.touches[0].clientY;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - lbStartX;
      var dy = e.changedTouches[0].clientY - lbStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(lbIndex + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLb();
    }, { passive: true });
  }

  /* ---------- Quote form (preview: no backend) ---------- */
  var form = document.getElementById('quote-form');
  var success = document.getElementById('form-success');
  if (form && success) {
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
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f && f.classList.contains('is-invalid') && e.target.checkValidity()) f.classList.remove('is-invalid');
    });
    form.addEventListener('change', function (e) {
      var f = e.target.closest('.field');
      if (f && e.target.checkValidity()) f.classList.remove('is-invalid');
    });
    document.getElementById('form-reset').addEventListener('click', function () {
      form.reset();
      success.hidden = true;
      form.hidden = false;
      form.querySelector('input').focus();
    });
  }
})();
