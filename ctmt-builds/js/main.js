/* CTMT Builds — nav, sticky bars, GSAP animations, wall explorer, build stages, stud calculator, gallery, lightbox */

// GOOGLE BUSINESS PROFILE: paste CTMT Builds' Google Maps / Business Profile link between the quotes,
// for example 'https://g.page/r/xxxxxxxx'. While this is empty, every "Find us on Google" link stays hidden.
var GOOGLE_PROFILE_URL = '';

// GOOGLE REVIEWS: paste the "Ask for reviews" link from CTMT Builds' Google Business Profile between the quotes,
// for example 'https://g.page/r/xxxxxxxx/review'. While this is empty, every "Leave a Google review" link stays hidden.
var GOOGLE_REVIEW_URL = '';

(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Google profile + review links appear once a URL is set above ---------- */
  if (GOOGLE_PROFILE_URL) $$('[data-gbp]').forEach(function (a) { a.href = GOOGLE_PROFILE_URL; a.hidden = false; });
  if (GOOGLE_REVIEW_URL) {
    $$('[data-review]').forEach(function (a) { a.href = GOOGLE_REVIEW_URL; a.hidden = false; });
    $$('[data-review-pending]').forEach(function (el) { el.hidden = true; });
  }

  /* ---------- Sticky header + mobile call/quote bar ---------- */
  var hdr = $('#hdr'), mbar = $('.mbar');
  var onScroll = function () {
    var y = window.scrollY;
    hdr.classList.toggle('is-stuck', y > 10);
    if (mbar) mbar.classList.toggle('is-on', y > 320);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('.hdr__menu'), mnav = $('#mnav');
  menuBtn.addEventListener('click', function () {
    var open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', String(open));
    mnav.hidden = !open;
  });
  mnav.addEventListener('click', function (e) {
    if (e.target.closest('a, button')) { menuBtn.setAttribute('aria-expanded', 'false'); mnav.hidden = true; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !mnav.hidden) { menuBtn.setAttribute('aria-expanded', 'false'); mnav.hidden = true; menuBtn.focus(); }
  });

  /* ---------- Range inputs: red fill up to the thumb ---------- */
  function fill(r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
  $$('input[type="range"]').forEach(function (r) { fill(r); r.addEventListener('input', function () { fill(r); }); });

  /* ---------- Anatomy of a framed wall ---------- */
  var wall = $('[data-wall]');
  if (wall) {
    var svg = $('svg', wall), info = $('.wall__info', wall), chips = $$('.chip', wall);
    var parts = {
      'bottom-plate': ['Bottom plate', 'The horizontal board nailed to the subfloor that every stud stands on. It sets the wall’s line and anchors it to the floor.'],
      'top-plate': ['Double top plate', 'Two layers across the top of the wall. They tie walls together at corners and intersections and spread the load from the floor or roof above. Joints in the two layers are staggered.'],
      'stud': ['Common studs', 'The vertical members, usually 2×4 or 2×6, spaced 16 or 24 inches on centre. They carry the load down to the plate and give sheathing and drywall something solid to fasten to.'],
      'king': ['King studs', 'Full-height studs on each side of a door or window opening. They run plate to plate and stiffen the edges of the opening.'],
      'jack': ['Jack (trimmer) studs', 'Shorter studs nailed to the king studs. The header sits on top of them, so they carry the load from above the opening down to the floor.'],
      'header': ['Header', 'The beam over a door or window. It picks up the load that the missing studs would have carried and moves it to the jack studs on either side. Its size depends on the span and the load above.'],
      'cripple': ['Cripple studs', 'Short studs above the header and below the window sill. They keep the 16-inch layout going so sheathing and drywall have nailing.'],
      'sill': ['Rough sill', 'The flat framing that forms the bottom of a window opening, sized to the window’s rough opening.'],
      'blocking': ['Blocking', 'Short pieces fitted between studs. Used as fire blocking and as solid backing for cabinets, handrails, grab bars and TV mounts.']
    };
    var setPart = function (key) {
      var p = parts[key]; if (!p) return;
      svg.classList.add('has-on');
      $$('[data-part]', svg).forEach(function (g) { g.classList.toggle('is-on', g.getAttribute('data-part') === key); });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-key') === key)); });
      info.innerHTML = '<h3>' + p[0] + '</h3><p>' + p[1] + '</p>';
      if (!reduce && window.gsap) gsap.from(info.children, { y: 10, opacity: 0, stagger: 0.06, duration: 0.3 });
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { setPart(c.getAttribute('data-key')); }); });
    $$('[data-part]', svg).forEach(function (g) {
      g.addEventListener('click', function () { setPart(g.getAttribute('data-part')); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPart(g.getAttribute('data-part')); } });
    });
  }

  /* ---------- Build stages scrubber ---------- */
  var st = $('[data-stages]');
  if (st) {
    var imgs = $$('.stages__view img', st), btns = $$('.stages__list button', st), tag = $('.stages__tag', st), range = $('input[type="range"]', st);
    var cur = 0, auto = null;
    var go = function (i) {
      cur = i;
      imgs.forEach(function (im, n) { im.classList.toggle('is-on', n === i); });
      btns.forEach(function (b, n) { b.setAttribute('aria-pressed', String(n === i)); });
      tag.textContent = 'Stage 0' + (i + 1) + ' · ' + $('b', btns[i]).textContent;
      if (range.value != i + 1) { range.value = i + 1; fill(range); }
      range.setAttribute('aria-valuetext', $('b', btns[i]).textContent);
    };
    var stop = function () { if (auto) { clearInterval(auto); auto = null; } };
    btns.forEach(function (b, n) { b.addEventListener('click', function () { stop(); go(n); }); });
    range.addEventListener('input', function () { stop(); go(Math.round(range.value) - 1); });
    go(0);
    // Plays through the stages once when it scrolls into view (skipped with reduced motion)
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; io.disconnect();
        auto = setInterval(function () { if (cur >= imgs.length - 1) return stop(); go(cur + 1); }, 1600);
      }, { threshold: 0.6 });
      io.observe(st);
    }
  }

  /* ---------- Stud calculator ---------- */
  var calc = $('[data-calc]');
  if (calc) {
    var len = $('#c-len', calc), opn = $('#c-open', calc);
    var outLen = $('[data-out="len"]', calc), outOpen = $('[data-out="open"]', calc);
    var outStuds = $('[data-out="studs"]', calc), outPlate = $('[data-out="plate"]', calc), outBoards = $('[data-out="boards"]', calc);
    var shown = { studs: 0, plate: 0, boards: 0 };
    var tween = function (el, key, val) {
      if (reduce || !window.gsap) { el.textContent = val; shown[key] = val; return; }
      gsap.to(shown, { [key]: val, duration: 0.45, ease: 'power2.out', snap: { [key]: 1 }, onUpdate: function () { el.textContent = shown[key]; } });
    };
    var run = function () {
      var L = +len.value, o = +opn.value, s = +($('input[name="spacing"]:checked', calc) || { value: 16 }).value;
      outLen.textContent = L + ' ft'; outOpen.textContent = o;
      var studs = Math.ceil(L * 12 / s) + 1 + o * 2;   // layout studs, one to close the end, plus a jack stud each side of every opening
      var plate = L * 3;                               // one bottom plate + double top plate
      tween(outStuds, 'studs', studs);
      tween(outPlate, 'plate', plate);
      tween(outBoards, 'boards', Math.ceil(plate / 16));
    };
    calc.addEventListener('input', run);
    calc.addEventListener('change', run);
    run();
  }

  /* ---------- Gallery filters ---------- */
  var filters = $('[data-filters]');
  if (filters) {
    var tiles = $$('.gal a');
    $$('.chip', filters).forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.getAttribute('data-filter');
        $$('.chip', filters).forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
        tiles.forEach(function (t) { t.hidden = !(f === 'all' || (t.getAttribute('data-cat') || '').indexOf(f) > -1); });
        if (!reduce && window.gsap) gsap.from(tiles.filter(function (t) { return !t.hidden; }), { opacity: 0, y: 16, stagger: 0.05, duration: 0.35 });
      });
    });
  }

  /* ---------- Lightbox with previous / next ---------- */
  var items = $$('[data-lightbox]');
  if (items.length) {
    var lb = document.createElement('div');
    lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<button type="button" class="lb__x" aria-label="Close photo">×</button>' +
      '<button type="button" class="lb__nav lb__prev" aria-label="Previous photo">‹</button>' +
      '<button type="button" class="lb__nav lb__next" aria-label="Next photo">›</button><figure><img alt=""><p></p></figure>';
    document.body.appendChild(lb);
    var lbImg = $('img', lb), lbCap = $('p', lb), lbClose = $('.lb__x', lb), opener = null, idx = 0;
    var visible = function () { return items.filter(function (a) { return !a.hidden; }); };
    var showAt = function (i) {
      var list = visible(); idx = (i + list.length) % list.length; var a = list[idx];
      lbImg.src = a.getAttribute('href'); lbImg.alt = $('img', a).alt; lbCap.textContent = a.getAttribute('data-caption') || '';
      if (!reduce && window.gsap) gsap.from(lbImg, { scale: 0.97, opacity: 0, duration: 0.3 });
    };
    var close = function () { lb.hidden = true; document.documentElement.classList.remove('qw-open'); if (opener) opener.focus(); };
    items.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); opener = a;
        lb.hidden = false; document.documentElement.classList.add('qw-open');
        showAt(visible().indexOf(a)); lbClose.focus();
      });
    });
    lbClose.addEventListener('click', close);
    $('.lb__prev', lb).addEventListener('click', function () { showAt(idx - 1); });
    $('.lb__next', lb).addEventListener('click', function () { showAt(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    var tx = null;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) showAt(idx + (dx < 0 ? 1 : -1)); tx = null; });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') showAt(idx + 1);
      if (e.key === 'ArrowLeft') showAt(idx - 1);
      if (e.key === 'Tab') { // keep focus inside the three controls
        var f = $$('button', lb), i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  }

  /* ---------- GSAP + ScrollTrigger ----------
     Loaded from cdnjs after the page has loaded so it never delays the first paint.
     Skipped entirely when the visitor prefers reduced motion. */
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    var vh = window.innerHeight;
    gsap.defaults({ ease: 'power2.out', duration: 0.55 });

    // (The hero's entrance runs in CSS so it starts with the first paint.)

    // Sections fade and slide up 30px
    $$('[data-anim]').forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.85) return; // already on screen: leave it visible
      gsap.from(el, { y: 30, opacity: 0, clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    // Cards and gallery tiles stagger in 0.1s apart
    $$('[data-stagger]').forEach(function (group) {
      if (group.getBoundingClientRect().top < vh * 0.85) return;
      gsap.from(group.children, { y: 30, opacity: 0, stagger: 0.1, clearProps: 'transform,opacity', scrollTrigger: { trigger: group, start: 'top 88%', once: true } });
    });

    // Wall diagram: the framing goes up piece by piece
    var wallSvg = $('[data-wall] svg');
    if (wallSvg && wallSvg.getBoundingClientRect().top > vh * 0.85) {
      gsap.from($$('.pc', wallSvg), { scaleY: 0, transformOrigin: '50% 100%', stagger: 0.025, duration: 0.4, ease: 'power2.out', scrollTrigger: { trigger: wallSvg, start: 'top 80%', once: true } });
    }

    // Process line draws across as you scroll
    var bar = $('.steps__bar');
    if (bar) {
      var vertical = window.matchMedia('(max-width: 900px)').matches;
      gsap.fromTo(bar, vertical ? { scaleY: 0 } : { scaleX: 0 }, { scaleX: 1, scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'bottom 60%', scrub: 0.4 } });
    }

    // Subtle hero parallax
    var heroImg = $('.hero__img');
    if (heroImg) gsap.fromTo(heroImg, { yPercent: -4 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
  if (!reduce) {
    var start = function () {
      var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/';
      loadScript(CDN + 'gsap.min.js').then(function () { return loadScript(CDN + 'ScrollTrigger.min.js'); }).then(initAnimations).catch(function () { /* content stays visible without animations */ });
    };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
  }
})();
