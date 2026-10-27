/* Imperial Finishing preview: page interactions */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  var specReady = false;
  function scrollToEl(node) { node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }

  // ---------- Tape-measure scroll progress + active nav ----------
  var tape = $('.tape');
  var navLinks = $$('nav.main a');
  var steps = $('#steps');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    tape.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0);
    var current = null;
    navLinks.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s && s.getBoundingClientRect().top < innerHeight * 0.4) current = a;
    });
    navLinks.forEach(function (a) { a.classList.toggle('on', a === current); });
    if (steps && innerWidth > 760) {
      var r = steps.getBoundingClientRect();
      var f = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3);
      steps.style.setProperty('--fill', Math.max(0, Math.min(1, f)).toFixed(3));
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // ---------- 3D studio controls ----------
  var room = window.IFRoom, data = window.IFRoomData, P = window.IFProfiles;
  if (room && data) {
    var chips = $('#v-chips');
    data.STAGES.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.stage = i;
      b.innerHTML = '<i>' + (i + 1) + '</i>' + s.name;
      chips.appendChild(b);
    });
    var seg = $('[data-style-group]');
    Object.keys(P.STYLES).forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.style = k; b.textContent = P.STYLES[k].name;
      seg.appendChild(b);
    });
    var hex = function (n) { return '#' + ('00000' + n.toString(16)).slice(-6); };
    Object.keys(data.TRIM_FINISHES).forEach(function (k) {
      var f = data.TRIM_FINISHES[k], b = document.createElement('button');
      b.type = 'button'; b.className = 'sw'; b.dataset.trim = k;
      b.innerHTML = '<span style="--c:' + (f.grain ? 'linear-gradient(100deg,' + f.grain[0] + ',' + f.grain[1] + ' 40%,' + f.grain[0] + ' 70%,' + f.grain[1] + ')' : hex(f.color)) + '"></span>' + f.name;
      $('#trim-swatches').appendChild(b);
    });
    Object.keys(data.WALLS).forEach(function (k) {
      var w = data.WALLS[k], b = document.createElement('button');
      b.type = 'button'; b.className = 'sw'; b.dataset.wall = k;
      b.innerHTML = '<span style="--c:' + hex(w.color) + '"></span>' + w.name;
      $('#wall-swatches').appendChild(b);
    });

    var hint = $('#v-hint');
    function interacted() { room.stopAuto(); hint && hint.classList.add('gone'); }
    chips.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; interacted(); room.setStage(+b.dataset.stage); });
    seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; room.setStyle(b.dataset.style); });
    $('#trim-swatches').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; room.setTrim(b.dataset.trim); });
    $('#wall-swatches').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      interacted(); room.setWall(b.dataset.wall);
      if (room.state.stage < 6) room.setStage(6);
    });
    $('#v-replay').addEventListener('click', function () { room.replay(); });
    $('#room-stage').addEventListener('pointerdown', function () { hint && hint.classList.add('gone'); });

    room.on(function (s) {
      var st = data.STAGES[s.stage];
      $('#v-step').textContent = 'Step ' + (s.stage + 1) + ' of ' + data.STAGES.length;
      $('#v-name').textContent = st.name;
      $('#v-text').textContent = st.text;
      $$('.chip', chips).forEach(function (c, i) { c.setAttribute('aria-pressed', i === s.stage); c.classList.toggle('done', i < s.stage); });
      $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.style === s.style); });
      $$('[data-trim]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.trim === s.trim); });
      $$('[data-wall]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.wall === s.wall && s.stage >= 6); });
      renderSpec(s.style);
    });

    $$('[data-goto-stage]').forEach(function (b) {
      b.addEventListener('click', function () {
        interacted();
        scrollToEl($('#studio'));
        setTimeout(function () { room.setStage(+b.dataset.gotoStage); }, reduce ? 0 : 450);
      });
    });
  }

  // ---------- Tilt cards ----------
  if (!reduce && finePointer) {
    $$('.tilt-card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', function () { c.style.removeProperty('--ry'); c.style.removeProperty('--rx'); });
    });
    var badge = $('#badge');
    if (badge) {
      var logo = $('svg', badge);
      badge.addEventListener('pointermove', function (e) {
        var r = badge.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        logo.style.setProperty('--ry', ((x - 0.5) * 18).toFixed(2) + 'deg');
        logo.style.setProperty('--rx', ((0.5 - y) * 14).toFixed(2) + 'deg');
        badge.style.setProperty('--shine', ((x - 0.5) * 140).toFixed(1) + '%');
      });
      badge.addEventListener('pointerleave', function () { logo.style.removeProperty('--ry'); logo.style.removeProperty('--rx'); badge.style.removeProperty('--shine'); });
    }
  }

  // ---------- Kitchen: hotspots + layout drawing ----------
  var SPOTS = [
    { x: 66, y: 14, t: 'Tall uppers to the ceiling', d: 'The upper cabinets above the fridge run right up to the ceiling line, so there is no dusty gap on top.' },
    { x: 47.6, y: 28, t: 'Built-in wine cubby', d: 'A narrow wine cubby fills the space between two upper runs and lines up with the cabinet faces.' },
    { x: 18, y: 18, t: 'Fitted around the hood', d: 'Upper cabinets sit tight to the stainless hood chimney on both sides, with the tile running clean behind.' },
    { x: 85, y: 44, t: 'Pantry wall', d: 'Floor-to-ceiling pantry cabinets wrap the fridge so the whole wall reads as one built-in piece.' },
    { x: 10, y: 72, t: 'Drawer banks', d: 'Deep drawer banks with long bar pulls, lined up across every front.' },
    { x: 55, y: 80, t: 'Two-tone island', d: 'A dark wood island base against the white shaker perimeter gives the kitchen its two-tone look.' }
  ];
  var frame = $('#k-frame');
  if (frame) {
    var cur = 0;
    SPOTS.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'hs'; b.textContent = i + 1;
      b.style.left = s.x + '%'; b.style.top = s.y + '%';
      b.setAttribute('aria-label', 'Detail ' + (i + 1) + ': ' + s.t);
      b.addEventListener('click', function () { showSpot(i); });
      frame.appendChild(b);
    });
    function showSpot(i) {
      cur = (i + SPOTS.length) % SPOTS.length;
      $('#hs-title').textContent = (cur + 1) + '. ' + SPOTS[cur].t;
      $('#hs-text').textContent = SPOTS[cur].d;
      $$('.hs', frame).forEach(function (b, k) { b.setAttribute('aria-pressed', k === cur); });
    }
    $('#hs-prev').addEventListener('click', function () { showSpot(cur - 1); });
    $('#hs-next').addEventListener('click', function () { showSpot(cur + 1); });
    showSpot(0);

    var img = $('#k-img'), canvas = $('#plan-canvas'), drawn = false;
    function drawPlan() {
      if (drawn || !img.naturalWidth) return;
      drawn = true;
      var W = Math.min(1000, img.naturalWidth), H = Math.round(W * img.naturalHeight / img.naturalWidth);
      canvas.width = W; canvas.height = H;
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, W, H);
      var src = ctx.getImageData(0, 0, W, H).data, g = new Float32Array(W * H), i;
      for (i = 0; i < W * H; i++) g[i] = src[i * 4] * 0.299 + src[i * 4 + 1] * 0.587 + src[i * 4 + 2] * 0.114;
      var out = ctx.createImageData(W, H), o = out.data;
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        var p = (y * W + x) * 4, grid = (x % 32 === 0 || y % 32 === 0) ? 10 : 0;
        o[p] = 22 + grid; o[p + 1] = 40 + grid; o[p + 2] = 62 + grid; o[p + 3] = 255;
        if (x > 0 && y > 0 && x < W - 1 && y < H - 1) {
          var k = y * W + x;
          var gx = -g[k - W - 1] - 2 * g[k - 1] - g[k + W - 1] + g[k - W + 1] + 2 * g[k + 1] + g[k + W + 1];
          var gy = -g[k - W - 1] - 2 * g[k - W] - g[k - W + 1] + g[k + W - 1] + 2 * g[k + W] + g[k + W + 1];
          var a = Math.max(0, Math.min(1, (Math.sqrt(gx * gx + gy * gy) - 40) / 110));
          if (a > 0) { o[p] += (232 - o[p]) * a; o[p + 1] += (241 - o[p + 1]) * a; o[p + 2] += (250 - o[p + 2]) * a; }
        }
      }
      ctx.putImageData(out, 0, 0);
    }
    $$('.k-tabs button').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.k-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b === t); });
        frame.dataset.mode = t.dataset.mode;
        frame.setAttribute('aria-labelledby', t.id);
        $('#k-detail').hidden = t.dataset.mode !== 'details';
        if (t.dataset.mode === 'layout') { if (img.complete) drawPlan(); else img.addEventListener('load', drawPlan, { once: true }); }
      });
    });
    var range = $('#compare-range');
    range.addEventListener('input', function () { frame.style.setProperty('--pos', range.value + '%'); });
  }

  // ---------- Trim style spec sheet ----------
  function frac(inches) {
    var whole = Math.floor(inches + 1e-6), n = Math.round((inches - whole) * 16), d = 16;
    if (n === 16) { whole++; n = 0; }
    while (n && n % 2 === 0) { n /= 2; d /= 2; }
    return (whole ? whole : '') + (whole && n ? '-' : '') + (n ? n + '/' + d : (whole ? '' : '0')) + '"';
  }
  function dimLine(svg, x1, y1, x2, y2, label, vertical) {
    el('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: 'dim' }, svg);
    var t = 4;
    if (vertical) {
      el('line', { x1: x1 - t, y1: y1, x2: x1 + t, y2: y1, class: 'dim' }, svg);
      el('line', { x1: x2 - t, y1: y2, x2: x2 + t, y2: y2, class: 'dim' }, svg);
      var tx = el('text', { x: x1 + 8, y: (y1 + y2) / 2 + 3, class: 'dimt' }, svg); tx.textContent = label;
    } else {
      el('line', { x1: x1, y1: y1 - t, x2: x1, y2: y1 + t, class: 'dim' }, svg);
      el('line', { x1: x2, y1: y2 - t, x2: x2, y2: y2 + t, class: 'dim' }, svg);
      var ty = el('text', { x: (x1 + x2) / 2, y: y1 + 14, class: 'dimt', 'text-anchor': 'middle' }, svg); ty.textContent = label;
    }
  }
  function drawProfile(svg, pts, opts) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var minX = Math.min.apply(0, xs), maxX = Math.max.apply(0, xs), minY = Math.min.apply(0, ys), maxY = Math.max.apply(0, ys);
    var box = 130, s = box / Math.max(maxX - minX, maxY - minY);
    var w = (maxX - minX) * s, h = (maxY - minY) * s, ox = (220 - w) / 2 - 14, oy = (220 + h) / 2 - 6;
    var X = function (v) { return ox + (v - minX) * s; }, Y = function (v) { return oy - (v - minY) * s; };
    if (opts.wall) el('line', { x1: X(0), y1: 8, x2: X(0), y2: 212, class: 'wallref' }, svg);
    if (opts.floor) el('line', { x1: 8, y1: Y(0), x2: 212, y2: Y(0), class: 'wallref' }, svg);
    if (opts.ceiling) el('line', { x1: 8, y1: Y(0), x2: 212, y2: Y(0), class: 'wallref' }, svg);
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ') + ' Z';
    var path = el('path', { d: d, class: 'prof' }, svg);
    if (!reduce && path.getTotalLength) {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)';
      path.style.strokeDashoffset = 0;
    }
    var IN = P.IN;
    dimLine(svg, X(maxX) + 14, Y(maxY), X(maxX) + 14, Y(minY), frac((maxY - minY) / IN), true);
    dimLine(svg, X(minX), Y(minY) + 12, X(maxX), Y(minY) + 12, frac((maxX - minX) / IN), false);
  }
  var SHEETS = { modern: 'A-1', craftsman: 'A-2', colonial: 'A-3', traditional: 'A-4' };
  var specStyle = null;
  function renderSpec(key) {
    if (!specReady || !P || key === specStyle || !$('#sheet')) return;
    specStyle = key;
    var st = P.STYLES[key];
    drawProfile($('#sv-base'), P.basePts(st.base), { wall: true, floor: true });
    drawProfile($('#sv-casing'), P.casingPts(st.casing), { floor: true });
    drawProfile($('#sv-crown'), P.crownPts(st.crown), { wall: true, ceiling: true });
    $('#dim-base').textContent = frac(st.base.h) + ' × ' + frac(st.base.t);
    $('#dim-casing').textContent = frac(st.casing.w) + ' × ' + frac(st.casing.t);
    $('#dim-crown').textContent = frac(st.crown.d) + ' crown';
    $('#spec-blurb').textContent = st.blurb;
    $('#spec-name').textContent = st.name;
    $('#spec-no').textContent = SHEETS[key];
    $$('#spec-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.style === key); b.tabIndex = b.dataset.style === key ? 0 : -1; });
    $('#sheet').setAttribute('aria-label', st.name + ' trim profiles');
  }
  if (P && $('#spec-tabs')) {
    specReady = true;
    Object.keys(P.STYLES).forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.style = k; b.textContent = P.STYLES[k].name;
      b.addEventListener('click', function () { room ? room.setStyle(k) : renderSpec(k); });
      $('#spec-tabs').appendChild(b);
    });
    $('#spec-tabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var keys = Object.keys(P.STYLES), i = keys.indexOf(specStyle) + (e.key === 'ArrowRight' ? 1 : -1);
      var k = keys[(i + keys.length) % keys.length];
      room ? room.setStyle(k) : renderSpec(k);
      $('#spec-tabs [data-style="' + k + '"]').focus();
    });
    renderSpec(room ? room.state.style : 'craftsman');
    $('#spec-try').addEventListener('click', function () {
      scrollToEl($('#studio'));
      if (room && room.state.stage < 6) { room.stopAuto(); setTimeout(function () { room.setStage(6); }, reduce ? 0 : 450); }
    });
  }

  // ---------- Trim estimator ----------
  var calc = $('#calc');
  var last = { base: 0, casing: 0, crown: 0 }, calcData = null;
  function num(id) { var v = parseInt($('#' + id).value, 10), i = $('#' + id); v = isNaN(v) ? +i.min : Math.max(+i.min, Math.min(+i.max, v)); return v; }
  function tween(node, from, to) {
    if (reduce || from === to) { node.textContent = to; return; }
    var t0 = performance.now();
    (function step(t) {
      var k = Math.min(1, (t - t0) / 450), e = 1 - Math.pow(1 - k, 3);
      node.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function drawRoomPlan(L, W, doors, wins) {
    var svg = $('#plan-svg');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var pad = 44, s = Math.min((320 - pad * 2) / L, (200 - 70) / W);
    var w = L * s, h = W * s, x0 = (320 - w) / 2 + 8, y0 = (200 - h) / 2 + 6;
    el('rect', { x: x0, y: y0, width: w, height: h, class: 'room-r' }, svg);
    if ($('#c-base').checked) el('rect', { x: x0 + 7, y: y0 + 7, width: Math.max(0, w - 14), height: Math.max(0, h - 14), class: 'base-r' }, svg);
    var dw = 3 * s;
    // doors along the bottom wall, then the right wall
    for (var i = 0; i < doors; i++) {
      var onBottom = i % 2 === 0, idx = Math.floor(i / 2), nOn = Math.ceil((onBottom ? doors : doors - 1) / 2) || 1;
      if (onBottom) {
        var span = w - dw, dx = x0 + span * (idx + 1) / (nOn + 1);
        el('line', { x1: dx, y1: y0 + h, x2: dx + dw, y2: y0 + h, class: 'door-gap' }, svg);
        el('path', { d: 'M' + dx + ' ' + (y0 + h) + ' L' + dx + ' ' + (y0 + h - dw) + ' A' + dw + ' ' + dw + ' 0 0 1 ' + (dx + dw) + ' ' + (y0 + h), class: 'door' }, svg);
      } else {
        var spanR = h - dw, dy = y0 + spanR * (idx + 1) / (Math.floor(doors / 2) + 1);
        el('line', { x1: x0 + w, y1: dy, x2: x0 + w, y2: dy + dw, class: 'door-gap' }, svg);
        el('path', { d: 'M' + (x0 + w) + ' ' + dy + ' L' + (x0 + w - dw) + ' ' + dy + ' A' + dw + ' ' + dw + ' 0 0 0 ' + (x0 + w) + ' ' + (dy + dw), class: 'door' }, svg);
      }
    }
    var ww = 3.5 * s;
    for (var j = 0; j < wins; j++) {
      var top = j % 2 === 0, jdx = Math.floor(j / 2), nT = Math.ceil(wins / 2), nL = Math.floor(wins / 2);
      if (top) { var wx = x0 + (w - ww) * (jdx + 1) / (nT + 1); el('line', { x1: wx, y1: y0, x2: wx + ww, y2: y0, class: 'win' }, svg); }
      else { var wy = y0 + (h - ww) * (jdx + 1) / (nL + 1); el('line', { x1: x0, y1: wy, x2: x0, y2: wy + ww, class: 'win' }, svg); }
    }
    el('line', { x1: x0, y1: y0 - 16, x2: x0 + w, y2: y0 - 16, class: 'dim' }, svg);
    var t1 = el('text', { x: x0 + w / 2, y: y0 - 21, 'text-anchor': 'middle', class: 'dimt' }, svg); t1.textContent = L + ' ft';
    el('line', { x1: x0 - 16, y1: y0, x2: x0 - 16, y2: y0 + h, class: 'dim' }, svg);
    var t2 = el('text', { x: x0 - 21, y: y0 + h / 2, 'text-anchor': 'middle', class: 'dimt', transform: 'rotate(-90 ' + (x0 - 21) + ' ' + (y0 + h / 2) + ')' }, svg); t2.textContent = W + ' ft';
  }
  function runCalc() {
    var L = num('c-len'), W = num('c-wid'), doors = num('c-doors'), wins = num('c-wins'), P2 = 2 * (L + W);
    var on = { base: $('#c-base').checked, casing: $('#c-casing').checked, crown: $('#c-crown').checked };
    var raw = { base: Math.max(0, P2 - doors * 3), casing: doors * 17 + wins * 15, crown: P2 };
    ['base', 'casing', 'crown'].forEach(function (k) {
      var lf = on[k] ? Math.ceil(raw[k] * 1.1) : 0, box = $('#r-' + k);
      box.classList.toggle('off', !on[k]);
      tween($('[data-n]', box), last[k], lf);
      $('.sticks', box).textContent = on[k] ? Math.ceil(lf / 16) + ' × 16 ft lengths' : 'Not included';
      last[k] = lf;
    });
    drawRoomPlan(L, W, doors, wins);
    calcData = { L: L, W: W, doors: doors, wins: wins, base: last.base, casing: last.casing, crown: last.crown };
  }
  if (calc) {
    $$('[data-step]', calc).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = $('#' + b.dataset.step); i.value = Math.max(+i.min, Math.min(+i.max, (parseInt(i.value, 10) || 0) + +b.dataset.d)); runCalc();
      });
    });
    calc.addEventListener('input', runCalc);
    calc.addEventListener('change', runCalc);
    runCalc();
    $('#calc-send').addEventListener('click', function () {
      var c = calcData, parts = [];
      if (c.base) parts.push('baseboard ~' + c.base + ' ft');
      if (c.casing) parts.push('casing ~' + c.casing + ' ft');
      if (c.crown) parts.push('crown ~' + c.crown + ' ft');
      var line = 'Room about ' + c.L + ' × ' + c.W + ' ft, ' + c.doors + ' door' + (c.doors === 1 ? '' : 's') + ', ' + c.wins + ' window' + (c.wins === 1 ? '' : 's') + '. Estimator: ' + (parts.join(', ') || 'no trim selected') + '.';
      var ta = $('#w-details');
      ta.value = ta.value ? ta.value + '\n' + line : line;
      var tile = $('#wizard input[value="Trim & baseboards"]'); if (tile) tile.checked = true;
      var btn = this; btn.textContent = 'Added to your request';
      setTimeout(function () { btn.textContent = 'Add to my quote request'; }, 2400);
      scrollToEl($('#quote'));
    });
  }

  // ---------- Service area map ----------
  var map = $('#map');
  if (map) {
    var px = function (lon) { return 20 + (lon + 121.2) * 71.4; }, py = function (lat) { return 20 + (52.6 - lat) * 106.25; };
    var path = function (pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + px(p[0]).toFixed(1) + ' ' + py(p[1]).toFixed(1); }).join(' '); };
    el('rect', { x: 0, y: 0, width: 640, height: 380, class: 'terrain' }, map);
    var g = el('g', { opacity: '.5' }, map);
    for (var gx = 0; gx <= 640; gx += 40) el('line', { x1: gx, y1: 0, x2: gx, y2: 380, stroke: '#2a3035', 'stroke-width': 1 }, g);
    for (var gy = 0; gy <= 380; gy += 40) el('line', { x1: 0, y1: gy, x2: 640, y2: gy, stroke: '#2a3035', 'stroke-width': 1 }, g);
    var border = [[-118.6, 52.6], [-117.8, 52.2], [-117.2, 51.85], [-116.3, 51.45], [-115.8, 51.0], [-115.3, 50.5], [-114.9, 50.0], [-114.6, 49.6], [-114.4, 49.4]];
    var mt = el('g', {}, map);
    var r = (function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(5);
    for (var m = 0; m < 46; m++) {
      var t = r(), bi = Math.min(border.length - 2, Math.floor(t * (border.length - 1))), f = t * (border.length - 1) - bi;
      var lon = border[bi][0] + (border[bi + 1][0] - border[bi][0]) * f - 0.2 - r() * 1.5, lat = border[bi][1] + (border[bi + 1][1] - border[bi][1]) * f + (r() - 0.5) * 0.4;
      var mx = px(lon), my = py(lat), sz = 7 + r() * 9;
      el('path', { d: 'M' + (mx - sz) + ' ' + my + ' L' + mx + ' ' + (my - sz * 1.3) + ' L' + (mx + sz) + ' ' + my + ' Z', class: 'mtn' }, mt);
    }
    el('path', { d: path(border), class: 'border' }, map);
    var p1 = el('text', { x: 40, y: 60, class: 'prov' }, map); p1.textContent = 'BRITISH COLUMBIA';
    var p2 = el('text', { x: 520, y: 60, class: 'prov' }, map); p2.textContent = 'ALBERTA';
    var route = el('path', { d: path([[-114.07, 51.05], [-115.35, 51.09], [-115.57, 51.18], [-116.18, 51.43], [-116.96, 51.3], [-118.2, 51.0], [-118.98, 50.84], [-119.27, 50.27], [-119.41, 50.05]]), class: 'route' }, map);
    var hw = el('text', { x: px(-117.75), y: py(51.15) + 22, class: 'town', fill: '#e3b23c' }, map); hw.textContent = 'HWY 1';
    [['Banff', -115.57, 51.18, -10, 18], ['Golden', -116.96, 51.3, -16, -10], ['Revelstoke', -118.2, 51.0, -64, -8]].forEach(function (t) {
      el('circle', { cx: px(t[1]), cy: py(t[2]), r: 2.5, fill: '#7d868e' }, map);
      var n = el('text', { x: px(t[1]) + t[3], y: py(t[2]) + t[4], class: 'town' }, map); n.textContent = t[0];
    });
    var pins = {};
    [['calgary', 'Calgary', -114.07, 51.05, 14, 6], ['lake', 'Lake Country', -119.41, 50.05, 14, 22]].forEach(function (p) {
      var gp = el('g', { class: 'pin', 'data-pin': p[0] }, map);
      el('circle', { cx: px(p[2]), cy: py(p[3]), r: 9, class: 'ring' }, gp);
      el('circle', { cx: px(p[2]), cy: py(p[3]), r: 8, class: 'dot' }, gp);
      var tx = el('text', { x: px(p[2]) + p[4], y: py(p[3]) + p[5] }, gp); tx.textContent = p[1].toUpperCase();
      gp.addEventListener('click', function () { setPin(p[0]); });
      pins[p[0]] = gp;
    });
    if (!reduce && route.getTotalLength) {
      var rl = route.getTotalLength();
      route.style.strokeDasharray = '2 8';
      route.animate([{ strokeDashoffset: rl }, { strokeDashoffset: 0 }], { duration: 9000, iterations: Infinity });
    }
    function setPin(k) {
      Object.keys(pins).forEach(function (n) { pins[n].classList.toggle('on', n === k); });
      $$('.area-card').forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.pin === k); });
    }
    $$('.area-card').forEach(function (c) { c.addEventListener('click', function () { setPin(c.dataset.pin); }); });
    setPin('calgary');
  }

  // ---------- Quote wizard ----------
  var wz = $('#wizard');
  if (wz) {
    var panels = $$('.wz-panel', wz), step = 0, labels = $$('.wz-steps span', wz);
    var back = $('#wz-back'), next = $('#wz-next');
    function show(n) {
      step = n;
      panels.forEach(function (p, i) { p.hidden = i !== n; });
      labels.forEach(function (l, i) { l.classList.toggle('on', i <= n); });
      $('.wz-bar', wz).style.setProperty('--w', ((n + 1) / panels.length * 100) + '%');
      back.hidden = n === 0;
      next.textContent = n === panels.length - 1 ? 'Send request' : 'Next';
    }
    function valid() {
      if (step !== panels.length - 1) return true;
      var ok = true;
      ['w-name', 'w-phone'].forEach(function (id) {
        var i = $('#' + id), bad = !i.value.trim();
        i.setAttribute('aria-invalid', bad);
        i.parentElement.querySelector('.err').hidden = !bad;
        if (bad && ok) { i.focus(); ok = false; }
      });
      return ok;
    }
    next.addEventListener('click', function () {
      if (!valid()) return;
      if (step < panels.length - 1) { show(step + 1); var f = panels[step].querySelector('input, textarea'); if (f && innerWidth > 760) f.focus({ preventScroll: true }); return; }
      var fd = new FormData(wz), types = fd.getAll('type');
      var rows = [
        ['Project', types.length ? types.join(', ') : 'Not chosen'],
        ['Location', fd.get('area')], ['Timing', fd.get('when')], ['Type', fd.get('home')],
        ['Photos', ($('#w-photos').files || []).length + ' attached'],
        ['Name', fd.get('name')], ['Phone', fd.get('phone')]
      ];
      if (fd.get('email')) rows.push(['Email', fd.get('email')]);
      if (fd.get('details')) rows.push(['Details', fd.get('details')]);
      var ul = $('#wz-summary'); ul.innerHTML = '';
      rows.forEach(function (r) { var li = document.createElement('li'), b = document.createElement('b'); b.textContent = r[0]; li.appendChild(b); li.appendChild(document.createTextNode(' ' + r[1])); ul.appendChild(li); });
      panels.forEach(function (p) { p.hidden = true; });
      $('#wz-nav').hidden = true; $('.wz-top', wz).hidden = true;
      var done = $('#wz-done'); done.hidden = false; done.focus();
    });
    back.addEventListener('click', function () { if (step > 0) show(step - 1); });
    wz.addEventListener('submit', function (e) { e.preventDefault(); next.click(); });
    wz.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') { e.preventDefault(); next.click(); } });
    $('#wz-restart').addEventListener('click', function () {
      wz.reset(); $('#thumbs').innerHTML = '';
      $('#wz-done').hidden = true; $('#wz-nav').hidden = false; $('.wz-top', wz).hidden = false; show(0);
    });
    var photos = $('#w-photos'), drop = $('#drop');
    photos.addEventListener('change', function () {
      var t = $('#thumbs'); t.innerHTML = '';
      Array.prototype.slice.call(photos.files, 0, 8).forEach(function (f) {
        if (!/^image\//.test(f.type)) return;
        var im = document.createElement('img'); im.alt = f.name; im.src = URL.createObjectURL(f); t.appendChild(im);
      });
    });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('over'); }); });
    show(0);
  }

  // ---------- Small touches ----------
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px' });
    $$('.rise').forEach(function (n) { io.observe(n); });
    var bar = $('#callbar'), q = $('#quote');
    if (bar && q) new IntersectionObserver(function (es) { bar.style.transform = es[0].isIntersecting ? 'translateY(110%)' : ''; }).observe(q);
  } else {
    $$('.rise').forEach(function (n) { n.classList.add('in'); });
  }
})();
