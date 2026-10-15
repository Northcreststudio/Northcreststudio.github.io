/* Mangamry Construction — header, blueprint slider, build-a-wall scroll scene, project rail,
   lightbox, badge tilt, counters, testimonials. GSAP + ScrollTrigger load after the page has loaded. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Header: solid on scroll, current-section link, mobile menu ---------- */
  var hdr = $('#hdr');
  var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 30); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  var menuBtn = $('.hdr__menu'), mnav = $('#mnav');
  menuBtn.addEventListener('click', function () {
    var open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', String(open)); mnav.hidden = !open;
  });
  mnav.addEventListener('click', function (e) { if (e.target.closest('a')) { menuBtn.setAttribute('aria-expanded', 'false'); mnav.hidden = true; } });
  if ('IntersectionObserver' in window) {
    var links = $$('.hdr__nav a');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['build', 'projects', 'about', 'faq', 'contact'].forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ---------- Hero glow follows the pointer ---------- */
  var hero = $('.hero'), glow = $('.hero__glow');
  if (finePointer && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      glow.style.transform = "translate(" + (e.clientX - r.left - 260) + "px," + (e.clientY - r.top - 260) + "px)";
    });
  }

  /* ---------- Blueprint ↔ built slider ---------- */
  var bp = $('.bp'), range = $('.bp__range');
  var setPos = function (v) { bp.style.setProperty('--pos', v + '%'); };
  range.addEventListener('input', function () { setPos(range.value); });
  if (!reduce) { // one quick sweep so people notice it is interactive (under 600ms)
    var t0 = null, from = 92, to = 42;
    setPos(from);
    var sweep = function (t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3); setPos(from + (to - from) * e); if (k < 1) requestAnimationFrame(sweep); };
    setTimeout(function () { requestAnimationFrame(sweep); }, 700);
  }

  /* ---------- Count-up numbers (real figures only) ---------- */
  var counters = $$('[data-count]');
  if (!reduce && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return; co.unobserve(en.target);
        var el = en.target, end = +el.getAttribute('data-count'), s = null;
        var tick = function (t) { if (!s) s = t; var k = Math.min(1, (t - s) / 600); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      });
    }, { threshold: .6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- Projects: filters, drag-to-scroll, arrows, progress ---------- */
  var rail = $('.rail'), bar = $('.rail__bar i');
  var cards = $$('.pcard', rail);
  var updateBar = function () {
    var max = rail.scrollWidth - rail.clientWidth, w = Math.max(14, rail.clientWidth / rail.scrollWidth * 100);
    bar.style.setProperty('--w', w + '%');
    bar.style.setProperty('--x', (max > 0 ? rail.scrollLeft / max : 0) * (100 / w * 100 - 100) + '%');
  };
  rail.addEventListener('scroll', updateBar, { passive: true }); window.addEventListener('resize', updateBar); updateBar();
  $$('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      $$('.chip').forEach(function (c) { var on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
      cards.forEach(function (card) { card.classList.toggle('is-out', f !== 'all' && card.getAttribute('data-cat') !== f); });
      rail.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
      if (!reduce && window.gsap) gsap.fromTo(cards.filter(function (c) { return !c.classList.contains('is-out'); }), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .06, ease: 'power2.out' });
      setTimeout(updateBar, 50);
    });
  });
  $$('[data-rail]').forEach(function (b) {
    b.addEventListener('click', function () {
      var card = cards.find(function (c) { return !c.classList.contains('is-out'); });
      rail.scrollBy({ left: (+b.getAttribute('data-rail')) * ((card ? card.offsetWidth : 300) + 18), behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  // Mouse drag (touch already scrolls natively)
  var drag = null;
  rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; drag = { x: e.clientX, left: rail.scrollLeft, moved: false }; });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return; var dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) { drag.moved = true; rail.classList.add('is-drag'); }
    if (drag.moved) rail.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', function () { if (!drag) return; var moved = drag.moved; drag = null; setTimeout(function () { rail.classList.remove('is-drag'); }, moved ? 30 : 0); });

  /* ---------- Lightbox (prev / next through the visible projects) ---------- */
  var lb = document.createElement('div');
  lb.className = 'lb'; lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Project photo');
  lb.innerHTML = '<button type="button" class="rbtn" data-lb="-1" aria-label="Previous photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>' +
    '<figure><img alt=""><p></p></figure>' +
    '<button type="button" class="rbtn" data-lb="1" aria-label="Next photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg></button>' +
    '<button type="button" class="lb__x" aria-label="Close photo">×</button>';
  document.body.appendChild(lb);
  var lbImg = $('img', lb), lbCap = $('p', lb), lbClose = $('.lb__x', lb), lbIdx = 0, lbOpener = null;
  var visible = function () { return cards.filter(function (c) { return !c.classList.contains('is-out'); }); };
  var show = function (i) {
    var list = visible(); lbIdx = (i + list.length) % list.length; var a = list[lbIdx];
    lbImg.src = a.getAttribute('href'); lbImg.alt = $('img', a).alt; lbCap.textContent = a.getAttribute('data-caption');
    if (!reduce && window.gsap) gsap.fromTo(lbImg, { opacity: 0, scale: .97 }, { opacity: 1, scale: 1, duration: .35 });
  };
  var closeLb = function () { lb.hidden = true; document.documentElement.classList.remove('qw-open'); if (lbOpener) lbOpener.focus(); };
  cards.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault(); if (rail.classList.contains('is-drag')) return;
      lbOpener = a; lb.hidden = false; document.documentElement.classList.add('qw-open'); show(visible().indexOf(a)); lbClose.focus();
    });
  });
  $$('[data-lb]', lb).forEach(function (b) { b.addEventListener('click', function () { show(lbIdx + (+b.getAttribute('data-lb'))); }); });
  lbClose.addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') show(lbIdx + 1);
    if (e.key === 'ArrowLeft') show(lbIdx - 1);
    if (e.key === 'Tab') { var f = $$('button', lb); var i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  });

  /* ---------- Owner badges tilt with the pointer ---------- */
  if (finePointer && !reduce) {
    $$('[data-tilt]').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = 'rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 12) + 'deg) translateZ(0)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- Testimonials: auto-advance, pause on hover / focus ---------- */
  var quotes = $('.quotes'), qs = $$('.q', quotes), qi = 0, timer = null, count = $('.reviews__count b');
  var goQ = function (i) {
    qi = (i + qs.length) % qs.length;
    qs.forEach(function (q, n) { q.classList.toggle('is-on', n === qi); });
    count.textContent = qi + 1;
    quotes.classList.remove('is-play'); void quotes.offsetWidth; if (!reduce) quotes.classList.add('is-play');
  };
  var play = function () { if (reduce) return; clearInterval(timer); timer = setInterval(function () { goQ(qi + 1); }, 7000); quotes.classList.add('is-play'); };
  var pause = function () { clearInterval(timer); quotes.classList.remove('is-play'); };
  $$('[data-rev]').forEach(function (b) { b.addEventListener('click', function () { goQ(qi + (+b.getAttribute('data-rev'))); play(); }); });
  quotes.addEventListener('mouseenter', pause); quotes.addEventListener('mouseleave', play);
  quotes.addEventListener('focusin', pause); quotes.addEventListener('focusout', play);
  play();

  /* ---------- GSAP: build-a-wall scene + reveals (skipped for reduced motion) ---------- */
  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

  function initGsap() {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'power2.out', duration: .6 });
    var vh = window.innerHeight;

    // Section reveals: fade + rise 30px, staggered groups 0.1s apart
    [['.projects .head, .projects__lead', 0], ['.pcard', .1], ['.band__in', 0], ['.about__copy > *', .1], ['.badge', .1], ['.process .head', 0],
     ['.proc__step', .1], ['.process__post', 0], ['.reviews .head', 0], ['.quotes', 0], ['.faq .head', 0], ['.faq details', .1], ['.contact__grid > div', 0], ['.clist li', .1]]
      .forEach(function (g) {
        var els = $$(g[0]).filter(function (el) { return el.getBoundingClientRect().top > vh * .9; });
        if (els.length) gsap.from(els, { y: 30, opacity: 0, stagger: g[1], scrollTrigger: { trigger: els[0], start: 'top 88%', once: true } });
      });

    // Process line draws as you scroll past it
    var vertical = window.matchMedia('(max-width: 900px)').matches;
    gsap.fromTo('.proc__line i', vertical ? { scaleY: 0 } : { scaleX: 0 }, { scaleX: 1, scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.proc', start: 'top 75%', end: 'bottom 60%', scrub: true } });

    // ---- Build-a-wall: pinned, scrubbed timeline across six services ----
    var build = $('.build'), steps = $$('.step', build), label = $('.build__label'), meter = $('.build__meter');
    var names = steps.map(function (s) { return $('.step__t', s).textContent; });
    build.classList.add('is-live');
    var draw = $$('.w-plan .draw');
    draw.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = p.getAttribute('stroke-dasharray') ? '' : L; if (!p.getAttribute('stroke-dasharray')) p.style.strokeDashoffset = L; });
    var tl = gsap.timeline({ defaults: { ease: 'power1.inOut', duration: .5 } });
    tl.addLabel('s0', 0)
      .fromTo(draw.filter(function (p) { return !p.getAttribute('stroke-dasharray'); }), { strokeDashoffset: function (i, p) { return p.getTotalLength(); } }, { strokeDashoffset: 0, duration: .7, stagger: .1 }, 0)
      .from('.w-plan [stroke-dasharray]', { opacity: 0, duration: .4 }, .2)
      .from('.w-plan-t text', { opacity: 0, y: 8, stagger: .1, duration: .3 }, .5)
      .addLabel('s1', 1)
      .from('.w-frame .plate', { scaleX: 0, transformOrigin: '0% 50%', stagger: .1, duration: .35 }, 1)
      .from('.w-frame .stud', { scaleY: 0, transformOrigin: '50% 100%', stagger: .06, duration: .35 }, 1.2)
      .addLabel('s2', 2)
      .from('.w-board .sheet', { x: 80, opacity: 0, stagger: .2, duration: .45 }, 2)
      .from('.w-screws circle', { scale: 0, transformOrigin: '50% 50%', stagger: .02, duration: .2 }, 2.55)
      .addLabel('s3', 3)
      .from('.w-tape .tape', { scaleY: 0, transformOrigin: '50% 0%', duration: .35 }, 3)
      .from('.w-tape circle', { scale: 0, transformOrigin: '50% 50%', stagger: .02, duration: .2 }, 3.2)
      .from('.w-finish', { opacity: 0, duration: .35 }, 3.55)
      .addLabel('s4', 4)
      .from('.w-tbar .hangers path', { scaleY: 0, transformOrigin: '50% 0%', duration: .2 }, 4)
      .from('.w-tbar .tees', { y: -30, opacity: 0, duration: .35 }, 4.1)
      .from('.w-tbar .tiles', { opacity: 0, duration: .3 }, 4.45)
      .addLabel('s5', 5)
      .from('.w-pm', { scale: 0, rotation: -25, transformOrigin: '50% 50%', ease: 'back.out(1.7)', duration: .45 }, 5)
      .to({}, { duration: .4 }, 5.6);

    var current = -1;
    var setStep = function (i) {
      if (i === current) return; current = i;
      steps.forEach(function (s, n) { s.classList.toggle('is-on', n === i); });
      label.innerHTML = '<span>0' + (i + 1) + '</span> ' + names[i];
    };
    setStep(0);
    var st = ScrollTrigger.create({
      trigger: build, pin: '.build__pin', start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 3.2); },
      animation: tl, scrub: .4, anticipatePin: 1,
      onUpdate: function (self) { meter.style.setProperty('--p', (self.progress * 100) + '%'); setStep(Math.min(5, Math.floor(self.progress * 6 * .999))); }
    });
    meter.style.setProperty('--p', '0%');
    steps.forEach(function (s, i) {
      $('button', s).addEventListener('click', function () {
        var y = st.start + (st.end - st.start) * ((i + .85) / 6);
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  if (!reduce) {
    var start = function () {
      var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/';
      loadScript(CDN + 'gsap.min.js').then(function () { return loadScript(CDN + 'ScrollTrigger.min.js'); }).then(initGsap).catch(function () { /* page stays fully visible without animation */ });
    };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
  }
})();
