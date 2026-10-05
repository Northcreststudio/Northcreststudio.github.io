/* In Scribe Log Homes — redesign preview */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Header: frosted on scroll, hides on scroll down ---------- */
  var header = $('.site-header');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 30);
    var menuOpen = root.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 500 && y > lastY + 4);
    if (y < lastY - 4) header.classList.remove('is-hidden');
    lastY = y;
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  var toggle = $('.nav__toggle');
  var menu = $('#mobile-menu');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    header.classList.remove('is-hidden');
    if (open) header.classList.add('is-scrolled'); else onScroll();
  }
  toggle.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
  });

  /* ---------- Active nav link ---------- */
  var navLinks = $$('.nav__links a');
  if (hasIO) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'craft', 'services', 'process', 'plans', 'gallery', 'contact'].forEach(function (id) { var el = document.getElementById(id); if (el) navIO.observe(el); });
  }

  /* ---------- Sticky call button once hero buttons are gone ---------- */
  var callNow = $('.call-now');
  if (hasIO) {
    new IntersectionObserver(function (en) { callNow.classList.toggle('is-shown', !en[0].isIntersecting); }).observe($('.hero__actions'));
  } else callNow.classList.add('is-shown');

  /* ---------- Hero slideshow with story-style progress ---------- */
  var hero = $('.hero');
  var slides = $$('.hero__slide');
  var reels = $$('.reel');
  var current = 0;
  var SLIDE_MS = 6500;
  var timer = null;
  hero.style.setProperty('--reel-ms', SLIDE_MS + 'ms');

  function loadSlide(s) {
    var bg = s.getAttribute('data-bg');
    if (bg) { s.style.backgroundImage = 'url(' + bg + ')'; s.removeAttribute('data-bg'); }
  }
  function goSlide(i) {
    current = (i + slides.length) % slides.length;
    loadSlide(slides[current]);
    loadSlide(slides[(current + 1) % slides.length]); // preload the next one
    slides.forEach(function (s, n) { s.classList.toggle('is-active', n === current); });
    reels.forEach(function (r, n) {
      r.classList.remove('is-active');
      r.classList.toggle('is-done', n < current);
    });
    void reels[current].offsetWidth; // restart the progress animation
    reels[current].classList.add('is-active');
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (reduceMotion || hero.classList.contains('is-paused')) return;
    timer = setTimeout(function () { goSlide(current + 1); }, SLIDE_MS);
  }
  reels.forEach(function (r, n) { r.addEventListener('click', function () { goSlide(n); }); });
  if (!reduceMotion) {
    window.addEventListener('load', function () { loadSlide(slides[1]); });
    schedule();
    if (hasIO) new IntersectionObserver(function (en) {
      hero.classList.toggle('is-paused', !en[0].isIntersecting);
      if (en[0].isIntersecting) goSlide(current); else clearTimeout(timer);
    }, { threshold: 0.2 }).observe(hero);
  } else {
    reels[0].classList.add('is-done');
  }

  /* ---------- Generic reveal ---------- */
  var revealTargets = $$('.index, .h2, .about__photo, .about__text > p, .ledger, .craft__stage, .svc, .planx, .callout, .planner, .direct, .contact__lead, .footer__top, .rail-foot');
  if (hasIO && !reduceMotion) {
    revealTargets.forEach(function (el, i) {
      el.setAttribute('data-reveal', '');
      if (el.classList.contains('svc')) el.style.setProperty('--d', (Array.prototype.indexOf.call(el.parentNode.children, el) * 0.05) + 's');
    });
    var revIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); revIO.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealTargets.forEach(function (el) { revIO.observe(el); });
    // draw the scribe line under "life?" when the contact heading appears
    var scribedContact = $('.contact .scribed');
    new IntersectionObserver(function (en, obs) {
      if (en[0].isIntersecting) { scribedContact.classList.add('is-drawn'); obs.disconnect(); }
    }, { threshold: 1 }).observe(scribedContact);
  } else {
    var sc = $('.contact .scribed'); if (sc) sc.classList.add('is-drawn');
  }

  /* ---------- Scroll-driven "read-out" text ---------- */
  var readout = $('[data-readout]');
  if (readout && !reduceMotion) {
    var words = readout.textContent.trim().split(/\s+/);
    readout.setAttribute('aria-label', readout.textContent.trim());
    readout.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
    var wordEls = $$('.w', readout);
    var updateReadout = function () {
      var r = readout.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      p = Math.max(0, Math.min(1, p));
      var lit = Math.round(p * wordEls.length);
      wordEls.forEach(function (w, i) { w.classList.toggle('on', i < lit); });
    };
    onFrame(updateReadout);
  }

  /* ---------- Gentle parallax on the family photo ---------- */
  var para = $('[data-parallax] img');
  if (para && !reduceMotion) {
    onFrame(function () {
      var r = para.parentNode.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
      para.style.transform = 'scale(1.12) translate3d(0,' + (p * -40).toFixed(1) + 'px,0)';
    });
  }

  /* ---------- 02 Craft: toggle + hotspots ---------- */
  var tabs = $$('.toggle__btn');
  var toggleEl = $('.toggle');
  var panels = [$('#craft-pb'), $('#craft-fs')];
  var card = $('.spot-card');
  var stage = $('.craft__stage');
  var openSpot = null;

  function closeCard() {
    card.hidden = true;
    if (openSpot) { openSpot.setAttribute('aria-expanded', 'false'); openSpot = null; }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      closeCard();
      tabs.forEach(function (x, n) { x.classList.toggle('is-active', n === i); x.setAttribute('aria-selected', String(n === i)); });
      panels.forEach(function (p, n) { p.hidden = n !== i; p.classList.toggle('is-active', n === i); });
      toggleEl.setAttribute('data-active', String(i));
    });
  });
  $$('.spot').forEach(function (s) {
    s.addEventListener('click', function (e) {
      e.stopPropagation();
      if (openSpot === s) { closeCard(); return; }
      closeCard();
      openSpot = s;
      s.setAttribute('aria-expanded', 'true');
      $('.spot-card__title', card).textContent = s.getAttribute('data-title');
      $('.spot-card__text', card).textContent = s.getAttribute('data-text');
      card.hidden = false;
      // position the card next to the marker, kept inside the stage
      var sr = s.getBoundingClientRect();
      var st = stage.getBoundingClientRect();
      var cw = card.offsetWidth, ch = card.offsetHeight;
      var x = sr.left - st.left + sr.width / 2 + 26;
      if (x + cw > st.width) x = sr.left - st.left - cw - 6;
      x = Math.max(0, Math.min(x, st.width - cw));
      var y = sr.top - st.top - 10;
      y = Math.max(0, Math.min(y, st.height - ch));
      card.style.left = x + 'px';
      card.style.top = y + 'px';
    });
  });
  $('.spot-card__close').addEventListener('click', closeCard);
  document.addEventListener('click', function (e) { if (!card.hidden && !card.contains(e.target)) closeCard(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });

  /* ---------- 03 Services: accordion + cursor-following preview ---------- */
  var svcs = $$('.svc');
  svcs.forEach(function (li) {
    var btn = $('.svc__row', li);
    btn.addEventListener('click', function () {
      var open = !li.classList.contains('is-open');
      svcs.forEach(function (o) { o.classList.remove('is-open'); $('.svc__row', o).setAttribute('aria-expanded', 'false'); });
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      floatEl.classList.remove('is-on');
    });
  });
  var floatEl = $('.svc-float');
  var floatImg = $('img', floatEl);
  if (finePointer && !reduceMotion) {
    var fx = 0, fy = 0, tx = 0, ty = 0, running = false;
    var loop = function () {
      fx += (tx - fx) * 0.18; fy += (ty - fy) * 0.18;
      floatEl.style.transform = 'translate3d(' + (fx + 30).toFixed(1) + 'px,' + (fy - 110).toFixed(1) + 'px,0) scale(1)';
      if (floatEl.classList.contains('is-on')) requestAnimationFrame(loop); else running = false;
    };
    svcs.forEach(function (li) {
      var row = $('.svc__row', li);
      row.addEventListener('mouseenter', function () {
        if (li.classList.contains('is-open')) return;
        floatImg.src = li.getAttribute('data-img');
        floatEl.classList.add('is-on');
        if (!running) { running = true; requestAnimationFrame(loop); }
      });
      row.addEventListener('mouseleave', function () { floatEl.classList.remove('is-on'); });
      row.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (!fx) { fx = tx; fy = ty; } });
    });
  }

  /* ---------- 04 Process: sticky visual follows the active step ---------- */
  var beats = $$('.beat');
  var storyImgs = $$('.story__frame img');
  var storyNow = $('.story__now');
  var storyMeter = $('.story__meter');
  if (hasIO) {
    var beatIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = Number(en.target.getAttribute('data-beat'));
        beats.forEach(function (b, n) { b.classList.toggle('is-active', n === i); });
        storyImgs.forEach(function (img, n) { img.classList.toggle('is-active', n === i); });
        storyNow.textContent = ('0' + (i + 1)).slice(-2);
        storyMeter.style.setProperty('--p', ((i + 1) / beats.length).toFixed(4));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    beats.forEach(function (b) { beatIO.observe(b); });
  }

  /* ---------- 05 Plans: footprint explorer ---------- */
  var plans = [
    { name: 'The Classic', w: 20, d: 25, bed: 1, bath: 1, sqft: 500, loft: 300, extra: "With a 10' × 20' covered deck", img: 'images/plans/the-classic.jpg' },
    { name: 'Hybrid Log Cabin', w: 22, d: 26, bed: 1, bath: 1, sqft: 572, loft: 266, extra: '', img: 'images/plans/hybrid-log-cabin.jpg' },
    { name: 'The Classic II', w: 31, d: 37, bed: 3, bath: 2, sqft: 1147, loft: 650, extra: '', img: 'images/plans/the-classic-ii.jpg' },
    { name: 'The Ranch', w: 68, d: 40, bed: 5, bath: 5, sqft: 2000, loft: null, extra: 'With a walk-out basement & wrap-around deck', img: 'images/plans/the-ranch.jpg' }
  ];
  var ptabs = $$('.ptab');
  var fpActive = $('.fp--active');
  var nameEl = $('.planx__name');
  var extraEl = $('.planx__extra');
  var sheet = $('.planx__sheet');
  var statEls = { bed: $('[data-stat="bed"]'), bath: $('[data-stat="bath"]'), sqft: $('[data-stat="sqft"]'), loft: $('[data-stat="loft"]') };
  function countTo(el, to) {
    if (to === null) { el.textContent = '—'; return; }
    var from = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
    if (reduceMotion) { el.textContent = to; return; }
    var t0 = performance.now(), dur = 700;
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur); k = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * k);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function showPlan(i) {
    var p = plans[i];
    ptabs.forEach(function (t, n) { t.classList.toggle('is-active', n === i); t.setAttribute('aria-selected', String(n === i)); });
    fpActive.style.setProperty('--w', p.w);
    fpActive.style.setProperty('--d', p.d);
    $('.fp__w', fpActive).textContent = p.w + "'";
    $('.fp__d', fpActive).textContent = p.d + "'";
    nameEl.textContent = p.name;
    extraEl.textContent = p.extra;
    countTo(statEls.bed, p.bed); countTo(statEls.bath, p.bath); countTo(statEls.sqft, p.sqft); countTo(statEls.loft, p.loft);
    sheet.href = p.img;
    sheet.setAttribute('data-caption', p.name + ' — ' + p.w + "' × " + p.d + "'");
    var img = $('img', sheet); img.src = p.img; img.alt = p.name + ' plan sheet with elevation and floor plans';
  }
  ptabs.forEach(function (t, i) { t.addEventListener('click', function () { showPlan(i); }); });

  /* ---------- 06 Gallery: drag rail + filters ---------- */
  var rail = $('#rail');
  var frames = $$('.frame', rail);
  var railBar = $('.rail-progress');
  function railProgress() {
    var max = rail.scrollWidth - rail.clientWidth;
    railBar.style.setProperty('--p', max > 0 ? (rail.scrollLeft / max).toFixed(4) : 1);
  }
  rail.addEventListener('scroll', railProgress, { passive: true });
  railProgress();
  $$('.rail-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      rail.scrollBy({ left: Number(b.getAttribute('data-dir')) * rail.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });
  rail.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') rail.scrollBy({ left: 300, behavior: 'smooth' });
    if (e.key === 'ArrowLeft') rail.scrollBy({ left: -300, behavior: 'smooth' });
  });
  // mouse drag (touch already scrolls natively)
  var dragging = false, moved = 0, startX = 0, startLeft = 0;
  rail.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; moved = 0; startX = e.clientX; startLeft = rail.scrollLeft;
  });
  window.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 5) rail.classList.add('is-dragging');
    rail.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!dragging) return;
    dragging = false;
    setTimeout(function () { rail.classList.remove('is-dragging'); }, 0);
  });
  $$('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      $$('.chip').forEach(function (c) { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
      frames.forEach(function (fr) { fr.classList.toggle('is-hidden', f !== 'all' && fr.getAttribute('data-cat') !== f); });
      rail.scrollTo({ left: 0 });
      railProgress();
    });
  });

  /* ---------- Lightbox (gallery + plan sheets) ---------- */
  var lb = $('#lightbox');
  var lbImg = $('.lightbox__img', lb);
  var lbCap = $('.lightbox__caption', lb);
  var group = [], lbIndex = 0, lastFocus = null;
  function lbShow(i) {
    lbIndex = (i + group.length) % group.length;
    var it = group[lbIndex];
    var im = $('img', it);
    lbImg.src = it.getAttribute('href');
    lbImg.alt = im ? im.alt : '';
    lbCap.textContent = (it.getAttribute('data-caption') || (im ? im.alt : '')) + (group.length > 1 ? '  ·  ' + (lbIndex + 1) + ' / ' + group.length : '');
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
    $$('.lightbox__nav', lb).forEach(function (b) { b.hidden = group.length < 2; });
  }
  function lbOpen(items, i) { group = items; lastFocus = document.activeElement; lbShow(i); lb.hidden = false; root.classList.add('lightbox-open'); $('.lightbox__close', lb).focus(); }
  function lbClose() { lb.hidden = true; root.classList.remove('lightbox-open'); if (lastFocus) lastFocus.focus(); }
  frames.forEach(function (fr) {
    fr.addEventListener('click', function (e) {
      e.preventDefault();
      if (rail.classList.contains('is-dragging') || moved > 5) { moved = 0; return; }
      var vis = frames.filter(function (x) { return !x.classList.contains('is-hidden'); });
      lbOpen(vis, vis.indexOf(fr));
    });
  });
  sheet.addEventListener('click', function (e) { e.preventDefault(); lbOpen([sheet], 0); });
  $('.lightbox__close', lb).addEventListener('click', lbClose);
  $('.lightbox__nav--prev', lb).addEventListener('click', function () { lbShow(lbIndex - 1); });
  $('.lightbox__nav--next', lb).addEventListener('click', function () { lbShow(lbIndex + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__figure')) lbClose(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowRight' && group.length > 1) lbShow(lbIndex + 1);
    if (e.key === 'ArrowLeft' && group.length > 1) lbShow(lbIndex - 1);
    if (e.key === 'Tab') {
      var b = $$('button:not([hidden])', lb);
      if (e.shiftKey && document.activeElement === b[0]) { e.preventDefault(); b[b.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === b[b.length - 1]) { e.preventDefault(); b[0].focus(); }
    }
  });
  var sx = 0, sy = 0;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (group.length > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbShow(lbIndex + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) lbClose();
  }, { passive: true });

  /* ---------- 07 Multi-step planner (preview: no backend) ---------- */
  var form = $('#planner');
  var planner = $('.planner');
  var steps = $$('.pstep', form);
  var stepNow = $('.planner__now');
  var bar = $('.planner__bar');
  var btnBack = $('[data-back]', form), btnNext = $('[data-next]', form), btnSubmit = $('[data-submit]', form);
  var errorEl = $('.planner__error');
  var done = $('.planner__done');
  var step = 0;
  var messages = ['Pick what you’d like built.', 'Choose a starting point.', 'Tell us where and when.', 'Add your name, phone and email.'];

  function setStep(i) {
    step = i;
    steps.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
    stepNow.textContent = i + 1;
    bar.style.setProperty('--s', i + 1);
    btnBack.hidden = i === 0;
    btnNext.hidden = i === steps.length - 1;
    btnSubmit.hidden = i !== steps.length - 1;
    errorEl.textContent = '';
  }
  function valid(i) {
    var ok = true;
    $$('[required]', steps[i]).forEach(function (f) {
      if (f.type === 'radio') {
        if (!form.querySelector('input[name="' + f.name + '"]:checked')) ok = false;
      } else {
        var good = f.checkValidity() && f.value.trim() !== '';
        var wrap = f.closest('.field'); if (wrap) wrap.classList.toggle('is-invalid', !good);
        if (!good) ok = false;
      }
    });
    if (!ok) errorEl.textContent = messages[i];
    return ok;
  }
  btnNext.addEventListener('click', function () {
    if (!valid(step)) return;
    setStep(step + 1);
    var first = $('input', steps[step]); if (first && finePointer) first.focus({ preventScroll: true });
  });
  btnBack.addEventListener('click', function () { setStep(step - 1); });
  // picking a tile/option on steps 1–2 moves on automatically
  form.addEventListener('change', function (e) {
    errorEl.textContent = '';
    var f = e.target.closest('.field'); if (f) f.classList.remove('is-invalid');
    if ((e.target.name === 'build' && step === 0) || (e.target.name === 'start' && step === 1)) {
      setTimeout(function () { setStep(step + 1); }, reduceMotion ? 0 : 320);
    }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!valid(step)) return;
    var fd = new FormData(form);
    var rows = [['Build', fd.get('build')], ['Starting from', fd.get('start')], ['Location', fd.get('location')], ['Timing', fd.get('when')], ['Plans / permits', fd.get('ready') || '—'], ['Name', fd.get('name')], ['Phone', fd.get('phone')], ['Email', fd.get('email')]];
    if (fd.get('notes')) rows.push(['Notes', fd.get('notes')]);
    var dl = $('.summary', done);
    dl.innerHTML = '';
    rows.forEach(function (r) {
      var d = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = r[0];
      var dd = document.createElement('dd'); dd.textContent = r[1];
      d.appendChild(dt); d.appendChild(dd); dl.appendChild(d);
    });
    form.hidden = true;
    $('.planner__top', planner).hidden = true;
    done.hidden = false;
    done.focus();
  });
  $('[data-restart]', done).addEventListener('click', function () {
    form.reset();
    form.hidden = false;
    $('.planner__top', planner).hidden = false;
    done.hidden = true;
    setStep(0);
  });
  setStep(0);

  /* ---------- Shared rAF scroll loop ---------- */
  function onFrame(fn) {
    var ticking = false;
    var run = function () { ticking = false; fn(); };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    run();
  }
})();
