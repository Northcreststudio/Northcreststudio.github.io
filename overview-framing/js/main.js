/* Overview Framing preview: page interactions */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function img(name, w, h, alt, sizes, eager) {
    var big = Math.min(960, w);
    return '<img src="images/' + name + '-960.webp" srcset="images/' + name + '-480.webp 480w, images/' + name + '-960.webp ' + big + 'w" sizes="' + sizes + '" width="' + big + '" height="' + Math.round(big * h / w) + '" alt="' + alt + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async">';
  }

  // ---------- header: menu, scroll progress, active link ----------
  var hdr = $('header.site'), nav = $('#nav'), menu = $('.menu-btn');
  menu.addEventListener('click', function () { var o = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', o); nav.classList.toggle('open', o); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }); });
  var links = $$('a', nav), steps = $('#steps');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    hdr.style.setProperty('--p', h > 0 ? (scrollY / h).toFixed(4) : 0);
    var cur = null;
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = a; });
    links.forEach(function (a) { a.classList.toggle('on', a === cur); });
    if (steps && innerWidth > 860) {
      var r = steps.getBoundingClientRect(), f = (innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.25);
      steps.style.setProperty('--fill', Math.max(0, Math.min(1, f)).toFixed(3));
    }
  }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  // ---------- 3D cabin controls ----------
  var C = window.OVCabin;
  if (C && C.ready) {
    var scrub = $('#v-scrub'), play = $('#v-play'), ticks = $$('.ticks span');
    var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
    var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';
    C.on(function (i) {
      $('#v-no').textContent = 'Stage ' + (i.stage + 1) + ' of ' + C.STAGES.length;
      $('#v-name').textContent = i.name;
      $('#v-logs').textContent = i.logs;
      $('#v-raf').textContent = i.rafters;
      $('#v-pct').textContent = Math.round(i.progress * 100) + '%';
      if (document.activeElement !== scrub) scrub.value = (i.progress * 100).toFixed(1);
      scrub.style.setProperty('--v', (i.progress * 100).toFixed(1));
      ticks.forEach(function (t, k) { t.classList.toggle('on', k <= i.stage - 1 || (k === 0 && i.progress > 0)); });
      play.innerHTML = i.playing ? PAUSE : PLAY;
      play.setAttribute('aria-label', i.playing ? 'Pause the build' : (i.progress >= 1 ? 'Build it again' : 'Play the build'));
    });
    scrub.addEventListener('input', function () { C.set(scrub.value / 100); });
    play.addEventListener('click', function () { C.toggle(); });
    $('#v-light').addEventListener('click', function () {
      var on = this.getAttribute('aria-pressed') !== 'true';
      this.setAttribute('aria-pressed', on); $('span', this).textContent = on ? 'Day' : 'Dusk';
      C.light(on ? 'dusk' : 'day');
    });
    $('#v-spin').addEventListener('click', function () { var on = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', on); C.spin(on); });
  }

  // ---------- stats counters ----------
  if ('IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var n = +e.target.dataset.count, suf = e.target.dataset.suffix || '', t0 = performance.now();
        (function step(t) { var k = Math.min(1, (t - t0) / 1400), v = Math.round(n * (1 - Math.pow(1 - k, 3))); e.target.textContent = v + suf; if (k < 1) requestAnimationFrame(step); })(t0);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (n) { co.observe(n); });
  }

  // ---------- services: flip cards ----------
  var SERVICES = [
    { t: 'Custom homes', img: ['house-roof-trusses', 900, 651, 'Roof trusses set on a new home with house wrap on the walls'], d: 'Full framing packages for custom and spec homes: floor systems, walls, roof and sheathing, framed to the drawings.', tags: ['Floor systems', 'Walls', 'Roof', 'Sheathing'] },
    { t: 'Log homes & cabins', img: ['log-home-crane-sunset', 700, 705, 'Log home being framed at sunset'], d: 'Framing around log shells: floor systems, roof structures, dormers, porches and the interior walls that tie it all together.', tags: ['Log shells', 'Roof systems', 'Dormers', 'Porches'] },
    { t: 'Timber frames', img: ['timber-truss-frame', 900, 1200, 'Timber truss frame standing in a field'], d: 'Heavy timber trusses, posts and beams, from gable-end trusses to covered porches and gazebos.', tags: ['Trusses', 'Posts & beams', 'Gazebos'] },
    { t: 'Multi-family', img: ['multi-family-wall-framing', 700, 930, 'Multi-family wall framing with views over the lake'], d: 'Repeatable, accurate framing for townhomes and multi-storey wood buildings, floor by floor.', tags: ['Townhomes', 'Apartments', 'Multi-storey'] },
    { t: 'Roofs & trusses', img: ['multi-family-roof-framing', 900, 655, 'Large multi-family roof being framed'], d: 'Stick-framed and truss roofs, crane-set trusses, overbuilds and roof sheathing.', tags: ['Stick-framed', 'Crane-set trusses', 'Overbuilds'] },
    { t: 'Additions & garages', svg: true, d: 'Additions tied cleanly into the existing house, detached garages, basement development and interior walls.', tags: ['Additions', 'Garages', 'Basements', 'Interior walls'] }
  ];
  var flips = $('#flips');
  if (flips) {
    var GARAGE = '<svg viewBox="0 0 300 300" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;background:#15243a"><g fill="none" stroke="#c9d1db" stroke-width="2"><path d="M40 150 150 70l110 80"/><path d="M60 140v110h180V140"/><path d="M95 250v-70h110v70"/><path d="M95 198h110M95 216h110M95 234h110" stroke-width="1.2"/>' +
      [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return '<path d="M' + (72 + i * 19.5) + ' 140v' + (i % 3 === 1 ? 30 : 110) + '" stroke-width="1" opacity=".5"/>'; }).join('') + '<path d="M150 70v30" /><circle cx="150" cy="112" r="9"/></g></svg>';
    SERVICES.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'flip'; b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', s.t + '. ' + s.d);
      b.innerHTML = '<span class="face front">' + (s.svg ? GARAGE : img(s.img[0], s.img[1], s.img[2], s.img[3], '(max-width: 560px) 92vw, (max-width: 960px) 46vw, 380px')) +
        '<span class="ft"><span class="num">0' + (i + 1) + '</span><h3>' + s.t + '</h3><span class="more">Flip for details <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5"/></svg></span></span></span>' +
        '<span class="face back"><span class="num label">0' + (i + 1) + '</span><h3>' + s.t + '</h3><p>' + s.d + '</p><ul>' + s.tags.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></span>';
      b.addEventListener('click', function () { var on = !b.classList.contains('flipped'); b.classList.toggle('flipped', on); b.setAttribute('aria-pressed', on); });
      if (fine && !reduce) b.addEventListener('mouseleave', function () { b.classList.remove('flipped'); b.setAttribute('aria-pressed', 'false'); });
      flips.appendChild(b);
    });
  }

  // ---------- projects gallery ----------
  var PROJECTS = [
    ['log-home-crane-sunset', 700, 705, 'log', 'Log home framing', 'Log home being framed at sunset with a telehandler beside it'],
    ['multi-family-wall-framing', 700, 930, 'frame', 'Multi-family wall framing · BC', 'Multi-family wall framing in British Columbia'],
    ['log-home-timber-roof', 700, 729, 'log', 'Timber roof on a log home', 'Log home with a timber roof structure going up'],
    ['multi-family-roof-framing', 900, 655, 'frame', 'Multi-family roof framing', 'Large multi-family roof being framed'],
    ['log-rafters', 1200, 900, 'log', 'Log rafters going up', 'Log rafters fanning out from a log shell'],
    ['house-roof-trusses', 900, 651, 'frame', 'Roof trusses on a new home', 'Roof trusses set on a new home'],
    ['log-walls-crane-lift', 700, 701, 'log', 'Crane-set log walls', 'Crane lifting log wall sections into place'],
    ['multi-family-sheathed', 900, 664, 'frame', 'Multi-storey frame, sheathed', 'Multi-storey wood frame with roof sheathing on'],
    ['timber-truss-frame', 900, 1200, 'log', 'Timber truss frame', 'Timber truss frame standing in a field'],
    ['finished-log-cabin', 900, 676, 'log', 'Finished log cabin', 'Finished log cabin with a balcony among the trees'],
    ['apartment-framing-winter', 900, 675, 'frame', 'Winter framing, multi-storey', 'Multi-storey building framed through winter'],
    ['log-shell-prebuild', 1200, 675, 'log', 'Log shell pre-build', 'Log shell being pre-built indoors'],
    ['log-home-finished', 1079, 608, 'log', 'Finished log home', 'Finished log home with a large deck']
  ];
  var gal = $('#gallery'), chipsBox = $('#chips');
  if (gal) {
    var CATS = [['all', 'All work'], ['log', 'Log homes & cabins'], ['frame', 'Framing jobs']];
    CATS.forEach(function (c, i) {
      var n = c[0] === 'all' ? PROJECTS.length : PROJECTS.filter(function (p) { return p[3] === c[0]; }).length;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.cat = c[0];
      b.setAttribute('aria-pressed', i === 0); b.innerHTML = c[1] + '<b>' + n + '</b>';
      chipsBox.appendChild(b);
    });
    PROJECTS.forEach(function (p, i) {
      var f = document.createElement('figure'); f.className = 'tile'; f.dataset.cat = p[3]; f.tabIndex = 0; f.setAttribute('role', 'button');
      f.setAttribute('aria-label', 'Open photo: ' + p[4]);
      f.innerHTML = img(p[0], p[1], p[2], p[5], '(max-width: 640px) 92vw, 380px') + '<figcaption><small>' + (p[3] === 'log' ? 'Log homes & cabins' : 'Framing') + '</small>' + p[4] + '</figcaption>';
      f.addEventListener('click', function () { openLb(i); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); } });
      gal.appendChild(f);
    });
    chipsBox.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', chipsBox).forEach(function (c) { c.setAttribute('aria-pressed', c === b); });
      $$('.tile', gal).forEach(function (t, k) {
        var show = b.dataset.cat === 'all' || t.dataset.cat === b.dataset.cat;
        t.classList.toggle('hide', !show);
        if (show && !reduce && t.animate) t.animate([{ opacity: 0, transform: 'translateY(16px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: (k % 6) * 50, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
      });
    });
    // lightbox
    var lb = null, cur = 0, lastFocus = null;
    function visibleIdx() { return PROJECTS.map(function (p, i) { return i; }).filter(function (i) { return !gal.children[i].classList.contains('hide'); }); }
    function openLb(i) {
      lastFocus = document.activeElement; cur = i;
      if (!lb) {
        lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Project photo');
        lb.innerHTML = '<div class="lb-top"><span id="lb-cap"></span><button class="btn btn-line btn-sm" type="button" id="lb-close">Close</button></div><figure class="lb-fig"><img id="lb-img" alt=""></figure><div class="lb-nav"><button class="btn btn-line btn-sm" type="button" id="lb-prev">Previous</button><button class="btn btn-gold btn-sm" type="button" id="lb-next">Next</button></div>';
        document.body.appendChild(lb);
        $('#lb-close', lb).addEventListener('click', closeLb);
        $('#lb-prev', lb).addEventListener('click', function () { step(-1); });
        $('#lb-next', lb).addEventListener('click', function () { step(1); });
        lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-fig')) closeLb(); });
        lb.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
      }
      lb.hidden = false; document.body.style.overflow = 'hidden'; show(); $('#lb-next', lb).focus();
    }
    function show() {
      var p = PROJECTS[cur], im = $('#lb-img', lb);
      im.src = 'images/' + p[0] + '-960.webp'; im.alt = p[5];
      var v = visibleIdx();
      $('#lb-cap', lb).textContent = (v.indexOf(cur) + 1) + ' / ' + v.length + ' · ' + p[4];
    }
    function step(d) { var v = visibleIdx(), k = v.indexOf(cur); cur = v[(k + d + v.length) % v.length]; show(); }
    function closeLb() { lb.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  }

  // ---------- roof pitch explorer ----------
  var psvg = $('#pitch-svg');
  if (psvg) {
    var rise = $('#p-rise'), span = $('#p-span'), cur2 = { r: 8, s: 24 }, goal = { r: 8, s: 24 }, anim = 0;
    function ftin(ft) { var f = Math.floor(ft), i = Math.round((ft - f) * 12); if (i === 12) { f++; i = 0; } return f + "' " + i + '"'; }
    function draw(r, s) {
      while (psvg.firstChild) psvg.removeChild(psvg.firstChild);
      var oh = 2, wall = 8, ridgeRise = s / 2 * r / 12, ohDrop = oh * r / 12;
      var sc = Math.min(520 / (s + 2 * oh), 230 / (ridgeRise + wall + 1));
      var gy = 318, cx = 300, plateY = gy - wall * sc, ridgeY = plateY - ridgeRise * sc, half = s / 2 * sc;
      var gold = '#8fb0d4', gold2 = '#eef2f6', sil = '#c9d1db', mut = '#5f7089';
      for (var gx = 0; gx <= 600; gx += 20) el('line', { x1: gx, y1: 0, x2: gx, y2: 340, stroke: '#1b2a40', 'stroke-width': 1 }, psvg);
      for (var gy2 = 0; gy2 <= 340; gy2 += 20) el('line', { x1: 0, y1: gy2, x2: 600, y2: gy2, stroke: '#1b2a40', 'stroke-width': 1 }, psvg);
      el('line', { x1: 20, y1: gy, x2: 580, y2: gy, stroke: mut, 'stroke-width': 2 }, psvg);
      el('rect', { x: cx - half, y: plateY, width: half * 2, height: wall * sc, fill: 'rgba(201,209,219,.05)', stroke: sil, 'stroke-width': 2 }, psvg);
      for (var k = 1; k < s / 1.333; k++) { var x = cx - half + k * 1.333 * sc; if (x < cx + half - 2) el('line', { x1: x, y1: plateY, x2: x, y2: gy, stroke: sil, 'stroke-width': 0.6, opacity: 0.35 }, psvg); }
      // truss webbing
      var w = [[cx - half, plateY], [cx - half / 2, plateY - ridgeRise * sc / 2], [cx - half / 3, plateY], [cx, ridgeY], [cx + half / 3, plateY], [cx + half / 2, plateY - ridgeRise * sc / 2], [cx + half, plateY]];
      el('polyline', { points: w.map(function (p) { return p.join(','); }).join(' '), fill: 'none', stroke: gold, 'stroke-width': 1.2, opacity: 0.7 }, psvg);
      el('line', { x1: cx, y1: ridgeY, x2: cx, y2: plateY, stroke: gold, 'stroke-width': 1.2, opacity: 0.7 }, psvg);
      el('line', { x1: cx - half, y1: plateY, x2: cx + half, y2: plateY, stroke: gold, 'stroke-width': 3 }, psvg);
      // rafters with overhang
      var oL = [cx - half - oh * sc, plateY + ohDrop * sc], oR = [cx + half + oh * sc, plateY + ohDrop * sc];
      el('polyline', { points: oL.join(',') + ' ' + cx + ',' + ridgeY + ' ' + oR.join(','), fill: 'none', stroke: gold2, 'stroke-width': 6, 'stroke-linejoin': 'miter' }, psvg);
      // pitch triangle on the right rafter
      var tx = cx + half * 0.45, ty = ridgeY + (half * 0.45) * r / 12, run = 12 * sc * 0.55;
      el('path', { d: 'M' + tx + ' ' + (ty - 14) + ' h' + run + ' v' + (run * r / 12), fill: 'none', stroke: sil, 'stroke-width': 1.2 }, psvg);
      el('text', { x: tx + run / 2, y: ty - 20, 'text-anchor': 'middle', fill: sil, 'font-size': 12, 'font-family': 'Josefin Sans, Arial', 'font-weight': 700 }, psvg, '12');
      el('text', { x: tx + run + 8, y: ty - 14 + run * r / 24 + 4, fill: sil, 'font-size': 12, 'font-family': 'Josefin Sans, Arial', 'font-weight': 700 }, psvg, String(Math.round(r)));
      // dimensions
      el('line', { x1: cx - half, y1: gy + 12, x2: cx + half, y2: gy + 12, stroke: mut, 'stroke-width': 1 }, psvg);
      el('text', { x: cx, y: gy + 9, 'text-anchor': 'middle', fill: gold2, 'font-size': 13, 'font-family': 'Josefin Sans, Arial', 'font-weight': 700 }, psvg, Math.round(s) + ' FT SPAN');
      el('line', { x1: cx - half - 30, y1: plateY, x2: cx - half - 30, y2: ridgeY, stroke: mut, 'stroke-width': 1 }, psvg);
      el('text', { x: cx - half - 36, y: (plateY + ridgeY) / 2, 'text-anchor': 'end', fill: gold2, 'font-size': 13, 'font-family': 'Josefin Sans, Arial', 'font-weight': 700 }, psvg, ftin(ridgeRise));
    }
    function outputs() {
      var r = goal.r, s = goal.s, run = s / 2 + 2;
      $('#p-rise-v').textContent = r + '/12'; $('#p-span-v').textContent = s + ' ft';
      $('#p-ang').textContent = (Math.atan(r / 12) * 180 / Math.PI).toFixed(1) + '°';
      $('#p-raf').textContent = ftin(run * Math.sqrt(1 + (r / 12) * (r / 12)));
      $('#p-rid').textContent = ftin(s / 2 * r / 12);
      $$('.presets button').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.pr === r && +b.dataset.ps === s); });
    }
    function tick() {
      cur2.r += (goal.r - cur2.r) * 0.18; cur2.s += (goal.s - cur2.s) * 0.18;
      if (Math.abs(goal.r - cur2.r) < 0.01 && Math.abs(goal.s - cur2.s) < 0.01) { cur2.r = goal.r; cur2.s = goal.s; anim = 0; } else anim = requestAnimationFrame(tick);
      draw(cur2.r, cur2.s);
    }
    function update() { goal.r = +rise.value; goal.s = +span.value; outputs(); if (reduce) { cur2.r = goal.r; cur2.s = goal.s; draw(goal.r, goal.s); } else if (!anim) anim = requestAnimationFrame(tick); }
    rise.addEventListener('input', update); span.addEventListener('input', update);
    $$('.presets button').forEach(function (b) { b.addEventListener('click', function () { rise.value = b.dataset.pr; span.value = b.dataset.ps; update(); }); });
    outputs(); draw(8, 24);
  }

  // ---------- map: Alberta + BC ----------
  var map = $('#map');
  if (map) {
    var X = function (lon) { return 10 + (lon + 139.2) * 20.6; }, Y = function (lat) { return 12 + (60.1 - lat) * 34.6; };
    var P = function (pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ') + ' Z'; };
    var divide = [[-114.06, 49], [-114.6, 49.6], [-114.9, 50.0], [-115.3, 50.5], [-115.8, 51.0], [-116.3, 51.45], [-117.2, 51.85], [-117.8, 52.2], [-118.6, 52.6], [-119.4, 53.2], [-120, 53.8]];
    var AB = [[-120, 60], [-110, 60], [-110, 49]].concat(divide).concat([[-120, 60]]);
    var BC = [[-120, 60], [-139.05, 60], [-137.6, 59.2], [-135.4, 59.7], [-133.4, 58.4], [-131.8, 56.6], [-130.0, 55.9], [-130.5, 54.7], [-129.6, 53.5], [-128.4, 52.3], [-127.4, 51.0], [-125.4, 50.2], [-124.3, 49.4], [-123.1, 49.0]].concat(divide).concat([[-120, 60]]);
    var VI = [[-128.4, 50.8], [-127.2, 50.9], [-125.4, 50.2], [-123.5, 48.4], [-124.7, 48.6], [-126.5, 49.5]];
    for (var gx = 0; gx <= 640; gx += 32) el('line', { x1: gx, y1: 0, x2: gx, y2: 420, stroke: '#1b2a40', 'stroke-width': 1 }, map);
    for (var gy = 0; gy <= 420; gy += 32) el('line', { x1: 0, y1: gy, x2: 640, y2: gy, stroke: '#1b2a40', 'stroke-width': 1 }, map);
    var shapes = {
      bc: [el('path', { d: P(BC), class: 'shape' }, map), el('path', { d: P(VI), class: 'shape' }, map)],
      ab: [el('path', { d: P(AB), class: 'shape' }, map)]
    };
    el('text', { x: X(-126.5), y: Y(55.2), fill: '#7f8ea3', 'font-family': 'Josefin Sans, Arial', 'font-weight': 700, 'font-size': 13, 'letter-spacing': 4, 'text-anchor': 'middle' }, map, 'BRITISH COLUMBIA');
    el('text', { x: X(-114.8), y: Y(56.4), fill: '#7f8ea3', 'font-family': 'Josefin Sans, Arial', 'font-weight': 700, 'font-size': 13, 'letter-spacing': 4, 'text-anchor': 'middle' }, map, 'ALBERTA');
    [['Edmonton', -113.49, 53.55], ['Red Deer', -113.81, 52.27], ['Rocky Mtn House', -114.92, 52.37], ['Kamloops', -120.33, 50.67], ['Kelowna', -119.5, 49.89], ['Vancouver', -123.12, 49.28]].forEach(function (t) {
      el('circle', { cx: X(t[1]), cy: Y(t[2]), r: 3, fill: '#8796ab' }, map);
      el('text', { x: X(t[1]) + (t[0] === 'Rocky Mtn House' || t[0] === 'Kamloops' || t[0] === 'Vancouver' ? -6 : 6), y: Y(t[2]) + 4, fill: '#8796ab', 'font-family': 'DM Sans, Arial', 'font-size': 10, 'text-anchor': t[0] === 'Rocky Mtn House' || t[0] === 'Kamloops' || t[0] === 'Vancouver' ? 'end' : 'start' }, map, t[0]);
    });
    var cxp = X(-114.07), cyp = Y(51.05);
    [70, 140, 210].forEach(function (rr, i) {
      var ring = el('circle', { cx: cxp, cy: cyp, r: rr, fill: 'none', stroke: '#c9d1db', 'stroke-width': 1, 'stroke-dasharray': '3 6', opacity: 0.45 - i * 0.12 }, map);
      if (!reduce && ring.animate) ring.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: i % 2 ? 90 : -90 }], { duration: 9000 + i * 3000, iterations: Infinity });
    });
    var pulse = el('circle', { cx: cxp, cy: cyp, r: 10, fill: 'none', stroke: '#eef2f6', 'stroke-width': 2 }, map);
    if (!reduce && pulse.animate) pulse.animate([{ r: 8, opacity: 1 }, { r: 30, opacity: 0 }], { duration: 2200, iterations: Infinity });
    el('path', { d: 'M' + cxp + ' ' + (cyp - 10) + ' l10 10 -10 10 -10 -10z', fill: '#eef2f6', stroke: '#0f1b2d', 'stroke-width': 2 }, map);
    el('text', { x: cxp + 16, y: cyp + 5, fill: '#f5f7fa', 'font-family': 'Righteous, Arial', 'font-size': 18, 'letter-spacing': 2 }, map, 'CALGARY');
    function setProv(k) {
      Object.keys(shapes).forEach(function (n) { shapes[n].forEach(function (p) { p.setAttribute('fill', n === k ? 'rgba(201,209,219,.2)' : 'rgba(201,209,219,.05)'); p.setAttribute('stroke', n === k ? '#c9d1db' : '#3a4d68'); p.setAttribute('stroke-width', n === k ? 2 : 1.2); }); });
      $$('.prov').forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.prov === k); });
    }
    $$('.prov').forEach(function (c) { c.addEventListener('click', function () { setProv(c.dataset.prov); }); });
    Object.keys(shapes).forEach(function (n) { shapes[n].forEach(function (p) { p.style.cursor = 'pointer'; p.addEventListener('click', function () { setProv(n); }); }); });
    setProv('ab');
  }

  // ---------- logo badge tilt + shine ----------
  var badge = $('#badge');
  if (badge && fine && !reduce) {
    var lg = $('svg', badge);
    badge.addEventListener('pointermove', function (e) {
      var r = badge.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      lg.style.setProperty('--ry', ((x - 0.5) * 20).toFixed(1) + 'deg'); lg.style.setProperty('--rx', ((0.5 - y) * 14).toFixed(1) + 'deg');
      badge.style.setProperty('--shine', ((x - 0.5) * 150).toFixed(0) + '%');
    });
    badge.addEventListener('pointerleave', function () { lg.style.removeProperty('--ry'); lg.style.removeProperty('--rx'); badge.style.removeProperty('--shine'); });
  }

  // ---------- quote wizard ----------
  var wz = $('#wizard');
  if (wz) {
    var panels = $$('.wz-panel', wz), stp = 0, labels = $$('.wz-steps span', wz), back = $('#wz-back'), next = $('#wz-next');
    function showStep(n) {
      stp = n; panels.forEach(function (p, i) { p.hidden = i !== n; });
      labels.forEach(function (l, i) { l.classList.toggle('on', i <= n); });
      $('.wz-bar', wz).style.setProperty('--w', ((n + 1) / panels.length * 100) + '%');
      back.hidden = n === 0; next.textContent = n === panels.length - 1 ? 'Send request' : 'Next';
    }
    function valid() {
      if (stp !== panels.length - 1) return true;
      var ok = true;
      ['w-name', 'w-phone'].forEach(function (id) { var i = $('#' + id), bad = !i.value.trim(); i.setAttribute('aria-invalid', bad); i.parentElement.querySelector('.err').hidden = !bad; if (bad && ok) { i.focus(); ok = false; } });
      return ok;
    }
    next.addEventListener('click', function () {
      if (!valid()) return;
      if (stp < panels.length - 1) { showStep(stp + 1); return; }
      var fd = new FormData(wz), types = fd.getAll('type');
      var rows = [['Project', types.length ? types.join(', ') : 'Not chosen'], ['Province', fd.get('prov')], ['Location', fd.get('town') || 'Not given'], ['You are', fd.get('who')], ['Size', fd.get('size') || 'Not given'], ['Start', fd.get('start') || 'Not given'], ['Name', fd.get('name')], ['Phone', fd.get('phone')]];
      if (fd.get('company')) rows.push(['Company', fd.get('company')]);
      if (fd.get('email')) rows.push(['Email', fd.get('email')]);
      if (fd.get('notes')) rows.push(['Notes', fd.get('notes')]);
      var ul = $('#wz-summary'); ul.innerHTML = '';
      rows.forEach(function (r) { var li = document.createElement('li'), b = document.createElement('b'); b.textContent = r[0]; li.appendChild(b); li.appendChild(document.createTextNode(' ' + r[1])); ul.appendChild(li); });
      panels.forEach(function (p) { p.hidden = true; }); $('#wz-nav').hidden = true; $('.wz-top', wz).hidden = true;
      var d = $('#wz-done'); d.hidden = false; d.focus();
    });
    back.addEventListener('click', function () { if (stp > 0) showStep(stp - 1); });
    wz.addEventListener('submit', function (e) { e.preventDefault(); next.click(); });
    wz.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') { e.preventDefault(); next.click(); } });
    $('#wz-restart').addEventListener('click', function () { wz.reset(); $('#wz-done').hidden = true; $('#wz-nav').hidden = false; $('.wz-top', wz).hidden = false; showStep(0); });
    showStep(0);
  }

  // ---------- reveals, rules, call bar ----------
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.rise, .drule').forEach(function (n) { io.observe(n); });
    var bar = $('#callbar'), q = $('#quote');
    if (bar && q) new IntersectionObserver(function (es) { bar.style.transform = es[0].isIntersecting ? 'translateY(110%)' : ''; }).observe(q);
  } else $$('.rise, .drule').forEach(function (n) { n.classList.add('in'); });
})();
