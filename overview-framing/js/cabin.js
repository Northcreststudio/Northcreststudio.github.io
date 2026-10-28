/* Overview Framing preview: 3D log cabin that frames itself.
   Piers and floor deck, log walls with saddle-notch tails, gable ends, ridge and purlins,
   log rafters, roof, then the porch. Scrub the build, drag to turn, switch day and dusk. */
(function () {
  'use strict';
  var host = document.getElementById('cabin-stage');
  var api = { ready: false, set: function () {}, play: function () {}, pause: function () {}, light: function () {}, on: function () {} };
  window.OVCabin = api;
  if (!host) return;
  function fail() { document.documentElement.classList.add('no-webgl'); }
  if (!window.THREE) { fail(); return; }
  var THREE = window.THREE, renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); if (!renderer.getContext()) throw 0; } catch (e) { fail(); return; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.insertBefore(renderer.domElement, host.firstChild);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(33, 1, 0.1, 80);
  var look = new THREE.Vector3(0, 1.75, 0.3);

  // ---------- lights (day / dusk) ----------
  var hemi = new THREE.HemisphereLight(0xe6edf3, 0x1d2a3d, 0.8); scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xfff1dc, 0.9);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  var sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.far = 40;
  sun.shadow.bias = -0.0008; sun.shadow.radius = 3;
  scene.add(sun);
  var rim = new THREE.DirectionalLight(0xa9c4e6, 0.0); rim.position.set(-8, 4, -6); scene.add(rim);
  var glow = new THREE.PointLight(0xffb45c, 0, 7, 2); glow.position.set(0, 1.5, 0); scene.add(glow);
  var LIGHT = {
    day: { hemi: 0.8, hemiSky: new THREE.Color(0xe6edf3), sunC: new THREE.Color(0xfff1dc), sunI: 0.9, sunP: new THREE.Vector3(6, 10, 7), rim: 0.0, glow: 0 },
    dusk: { hemi: 0.32, hemiSky: new THREE.Color(0x8a7aa8), sunC: new THREE.Color(0xff9d55), sunI: 1.05, sunP: new THREE.Vector3(-9, 3.2, 6), rim: 0.55, glow: 1.6 }
  };
  var lightMode = 'day', lightMix = 0;

  // ---------- textures ----------
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  var bark = canvasTex(512, 128, function (g, w, h) {
    var r = rnd(3); g.fillStyle = '#c99a62'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 90; i++) { g.fillStyle = r() > 0.5 ? 'rgba(120,72,30,.22)' : 'rgba(240,200,140,.25)'; g.fillRect(0, r() * h, w, 1 + r() * 3); }
    for (var k = 0; k < 14; k++) { g.fillStyle = 'rgba(90,50,20,.45)'; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 6, 3 + r() * 3, 0, 0, 7); g.fill(); }
  });
  bark.wrapS = bark.wrapT = THREE.RepeatWrapping;
  var rings = canvasTex(128, 128, function (g, w, h) {
    g.fillStyle = '#e2bf8a'; g.fillRect(0, 0, w, h);
    for (var i = 1; i < 14; i++) { g.strokeStyle = 'rgba(140,90,40,' + (0.25 + (i % 3) * 0.12) + ')'; g.lineWidth = 1.4; g.beginPath(); g.arc(64 + (i % 2), 64, i * 4.6, 0, 7); g.stroke(); }
    g.strokeStyle = 'rgba(90,50,20,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.stroke();
  });
  var seam = canvasTex(256, 64, function (g, w, h) {
    g.fillStyle = '#2b2d30'; g.fillRect(0, 0, w, h);
    for (var x = 0; x < w; x += 32) { g.fillStyle = '#3b3e42'; g.fillRect(x, 0, 3, h); g.fillStyle = '#1d1f21'; g.fillRect(x + 3, 0, 1, h); }
  });
  seam.wrapS = seam.wrapT = THREE.RepeatWrapping;

  var M = {
    log: [new THREE.MeshStandardMaterial({ map: bark, roughness: 0.78 }), new THREE.MeshStandardMaterial({ map: rings, roughness: 0.85 }), new THREE.MeshStandardMaterial({ map: rings, roughness: 0.85 })],
    timber: new THREE.MeshStandardMaterial({ color: 0xd4a76e, roughness: 0.7 }),
    ply: new THREE.MeshStandardMaterial({ color: 0xa88356, roughness: 0.9 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x77736c, roughness: 0.95 }),
    roof: new THREE.MeshStandardMaterial({ map: seam, roughness: 0.42, metalness: 0.55 }),
    plinth: new THREE.MeshStandardMaterial({ color: 0x0b1424, roughness: 1 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc9d1db, emissive: 0x3c4c63, emissiveIntensity: 0.7, roughness: 0.25, metalness: 0.85 })
  };

  // ---------- stage / plinth ----------
  var pivot = new THREE.Group(); scene.add(pivot);
  var plinth = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.8, 0.22, 72), M.plinth);
  plinth.position.y = -0.11; plinth.receiveShadow = true; pivot.add(plinth);
  [6.62, 5.4].forEach(function (rad, i) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(rad, i ? 0.012 : 0.03, 8, 120), M.gold);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.005 + (i ? 0.002 : 0); pivot.add(ring);
  });

  // ---------- build pieces ----------
  var pieces = [];
  var GROUPS = [];  // [name, t0, t1]
  function add(obj, group) {
    obj.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    obj.userData.home = obj.position.clone();
    obj.userData.rot = obj.rotation.clone();
    obj.visible = false;
    pivot.add(obj);
    pieces.push({ obj: obj, group: group });
  }
  var R = 0.15, CH = 0.27, LX = 6.4, DZ = 5.0, TAIL = 0.34, BASE = 0.6, COURSES = 8;
  function logX(x0, x1, y, z, r) {
    var len = x1 - x0, m = new THREE.Mesh(new THREE.CylinderGeometry(r || R, r || R, len, 18, 1), M.log);
    m.rotation.z = Math.PI / 2; m.position.set((x0 + x1) / 2, y, z); return m;
  }
  function logZ(z0, z1, y, x, r) {
    var len = z1 - z0, m = new THREE.Mesh(new THREE.CylinderGeometry(r || R, r || R, len, 18, 1), M.log);
    m.rotation.x = Math.PI / 2; m.position.set(x, y, (z0 + z1) / 2); return m;
  }
  function between(a, b, r, mat) {
    var dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14, 1), mat || M.log);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  }
  function segments(lo, hi, gaps) {
    var out = [], cur = lo;
    gaps.slice().sort(function (a, b) { return a[0] - b[0]; }).forEach(function (g) { if (g[0] > cur) out.push([cur, g[0]]); cur = Math.max(cur, g[1]); });
    if (hi > cur) out.push([cur, hi]);
    return out;
  }

  // piers, beams, deck
  for (var px = -2.8; px <= 2.81; px += 1.4) for (var pz = -2.2; pz <= 2.21; pz += 2.2) {
    var pier = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), M.concrete); pier.position.set(px, 0.21, pz); add(pier, 'deck');
  }
  [-2.2, 0, 2.2].forEach(function (z) { var bm = new THREE.Mesh(new THREE.BoxGeometry(LX + 0.2, 0.18, 0.2), M.timber); bm.position.set(0, 0.51, z); add(bm, 'deck'); });
  var deck = new THREE.Mesh(new THREE.BoxGeometry(LX + 0.3, 0.06, DZ + 0.3), M.ply); deck.position.set(0, 0.6, 0); add(deck, 'deck');
  var porchDeck = new THREE.Mesh(new THREE.BoxGeometry(LX - 1.2, 0.06, 1.6), M.timber); porchDeck.position.set(0, 0.58, DZ / 2 + 0.95); add(porchDeck, 'porch');

  // log walls: front/back run along x, sides along z, offset half a course (saddle notch)
  var doorGap = [[-0.5, 0.5]], backWin = [[-1.7, -0.6], [0.6, 1.7]], sideWin = [[-0.65, 0.65]];
  for (var c = 0; c < COURSES; c++) {
    var yF = BASE + R + c * CH, yS = yF + CH / 2;
    var fg = c < COURSES - 1 ? doorGap : [];
    segments(-LX / 2 - TAIL, LX / 2 + TAIL, fg).forEach(function (s) { add(logX(s[0], s[1], yF, DZ / 2), 'walls'); });
    segments(-LX / 2 - TAIL, LX / 2 + TAIL, c >= 3 && c <= 5 ? backWin : []).forEach(function (s) { add(logX(s[0], s[1], yF, -DZ / 2), 'walls'); });
    var sg = c >= 3 && c <= 5 ? sideWin : [];
    segments(-DZ / 2 - TAIL, DZ / 2 + TAIL, sg).forEach(function (s) { add(logZ(s[0], s[1], yS, -LX / 2), 'walls'); });
    segments(-DZ / 2 - TAIL, DZ / 2 + TAIL, sg).forEach(function (s) { add(logZ(s[0], s[1], yS, LX / 2), 'walls'); });
  }
  var TOP = BASE + R + (COURSES - 1) * CH + CH / 2;
  // gable ends on the short sides
  var GC = 6, RISE = GC * CH;
  for (var k = 1; k <= GC; k++) {
    var half = (DZ / 2 + 0.05) * (1 - k / (GC + 0.6)), y = TOP + k * CH - CH / 2;
    add(logZ(-half, half, y, -LX / 2), 'gables');
    add(logZ(-half, half, y, LX / 2), 'gables');
  }
  var RIDGE = TOP + RISE + 0.12, OH = 0.7;
  add(logX(-LX / 2 - OH, LX / 2 + OH, RIDGE, 0, 0.19), 'ridge');
  [-1, 1].forEach(function (s) { add(logX(-LX / 2 - OH, LX / 2 + OH, TOP + RISE * 0.5 + 0.05, s * DZ / 4, 0.16), 'ridge'); });
  // rafters, both slopes
  var EAVE_Z = DZ / 2 + 0.75, EAVE_Y = TOP - 0.38;
  for (var i = 0; i <= 10; i++) {
    var x = -LX / 2 - 0.45 + i * (LX + 0.9) / 10;
    [-1, 1].forEach(function (s) {
      add(between(new THREE.Vector3(x, EAVE_Y, s * EAVE_Z), new THREE.Vector3(x, RIDGE + 0.05, 0), 0.07), 'rafters');
    });
  }
  // roof panels
  [-1, 1].forEach(function (s) {
    var a = new THREE.Vector3(0, EAVE_Y + 0.12, s * (EAVE_Z + 0.05)), b = new THREE.Vector3(0, RIDGE + 0.2, 0);
    var len = a.distanceTo(b), w = LX + 2 * OH + 0.3;
    var tex = seam.clone(); tex.needsUpdate = true; tex.repeat.set(w * 1.6, 1);
    var mat = M.roof.clone(); mat.map = tex;
    var p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, len), mat);
    p.position.copy(a).add(b).multiplyScalar(0.5);
    p.rotation.x = s * Math.atan2(RIDGE - EAVE_Y, EAVE_Z);
    add(p, 'roof');
  });
  // porch: log posts, beam, lean-to roof
  [-2.3, 2.3].forEach(function (x) { add(between(new THREE.Vector3(x, 0.6, DZ / 2 + 1.6), new THREE.Vector3(x, EAVE_Y - 0.25, DZ / 2 + 1.6), 0.12), 'porch'); });
  add(logX(-2.6, 2.6, EAVE_Y - 0.2, DZ / 2 + 1.6, 0.13), 'porch');
  (function () {
    var a = new THREE.Vector3(0, EAVE_Y + 0.02, DZ / 2 + 0.7), b = new THREE.Vector3(0, EAVE_Y - 0.12, DZ / 2 + 2.0);
    var len = a.distanceTo(b), mat = M.roof.clone(); mat.map = seam.clone(); mat.map.needsUpdate = true; mat.map.repeat.set(9, 1);
    var p = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.05, len), mat);
    p.position.copy(a).add(b).multiplyScalar(0.5); p.rotation.x = Math.atan2(a.y - b.y, b.z - a.z);
    add(p, 'porch');
  })();
  // warm light behind the openings at dusk
  glow.position.set(0, BASE + 1.0, 0);

  // ---------- timeline ----------
  var ORDER = [['deck', 0.0, 0.1], ['walls', 0.1, 0.52], ['gables', 0.52, 0.62], ['ridge', 0.62, 0.68], ['rafters', 0.68, 0.82], ['roof', 0.82, 0.9], ['porch', 0.9, 0.985]];
  var STAGES = [
    { at: 0, name: 'Piers & floor deck' }, { at: 0.1, name: 'Log walls' }, { at: 0.52, name: 'Gable ends' },
    { at: 0.62, name: 'Ridge & purlins' }, { at: 0.68, name: 'Rafters' }, { at: 0.82, name: 'Roof' }, { at: 0.9, name: 'Porch' }, { at: 0.985, name: 'Framed & dried in' }
  ];
  ORDER.forEach(function (o) {
    var list = pieces.filter(function (p) { return p.group === o[0]; }), n = list.length;
    list.forEach(function (p, i) { p.t0 = o[1] + (o[2] - o[1]) * (i / Math.max(1, n)); p.dur = Math.max(0.025, (o[2] - o[1]) / Math.max(1, n) * 3); });
  });
  var counts = { logs: pieces.filter(function (p) { return p.group === 'walls' || p.group === 'gables' || p.group === 'ridge'; }).length, rafters: pieces.filter(function (p) { return p.group === 'rafters'; }).length };
  api.STAGES = STAGES; api.counts = counts;

  var progress = 0, target = 0, playing = false, lastEmit = -1;
  var listeners = [];
  function emit() {
    var st = 0; STAGES.forEach(function (s, i) { if (progress >= s.at) st = i; });
    var logs = 0, raf = 0;
    pieces.forEach(function (p) { if (progress >= p.t0 + p.dur * 0.6) { if (p.group === 'rafters') raf++; else if (p.group === 'walls' || p.group === 'gables' || p.group === 'ridge') logs++; } });
    var info = { progress: progress, stage: st, name: STAGES[st].name, logs: logs, rafters: raf, playing: playing };
    listeners.forEach(function (fn) { fn(info); });
  }
  var easeBack = function (t) { var c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  function applyProgress() {
    pieces.forEach(function (p) {
      var k = (progress - p.t0) / p.dur;
      if (k <= 0) { p.obj.visible = false; return; }
      p.obj.visible = true;
      var home = p.obj.userData.home, rot = p.obj.userData.rot;
      if (k >= 1 || reduce) { p.obj.position.copy(home); p.obj.rotation.copy(rot); return; }
      var e = easeBack(k), off = 1 - e;
      p.obj.position.set(home.x, home.y + 2.6 * off, home.z + 0.6 * off);
      p.obj.rotation.set(rot.x + 0.25 * off, rot.y, rot.z + 0.12 * off);
    });
  }

  // ---------- interaction ----------
  var yaw = -0.35, yawGoal = -0.35, tilt = 0, tiltGoal = 0, dragging = false, lx = 0, idle = 0, autoSpin = !reduce;
  host.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button,input')) return;
    dragging = true; lx = e.clientX; host.classList.add('dragging'); host.setPointerCapture && host.setPointerCapture(e.pointerId); idle = 0; wake();
  });
  host.addEventListener('pointermove', function (e) {
    var r = host.getBoundingClientRect();
    tiltGoal = ((e.clientY - r.top) / r.height - 0.5) * -0.12;
    if (dragging) { yawGoal += (e.clientX - lx) * 0.007; lx = e.clientX; idle = 0; }
    wake();
  });
  function up() { dragging = false; host.classList.remove('dragging'); }
  host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
  host.addEventListener('pointerleave', function () { tiltGoal = 0; });
  host.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') yawGoal -= 0.15; else if (e.key === 'ArrowRight') yawGoal += 0.15; else return;
    e.preventDefault(); idle = 0; wake();
  });

  // ---------- loop ----------
  var running = false, visible = true, last = performance.now();
  function resize() {
    var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    var narrow = w / h < 1.05;
    camera.fov = narrow ? 42 : 33;
    camera.position.set(0, 4.6, narrow ? 15.5 : 14);
    camera.lookAt(look); camera.updateProjectionMatrix(); wake();
  }
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; idle += dt;
    if (playing) { target = Math.min(1, target + dt / 13); if (target >= 1) { playing = false; } }
    var before = progress;
    progress += (target - progress) * Math.min(1, dt * (playing ? 30 : 9));
    if (Math.abs(target - progress) < 0.0004) progress = target;
    applyProgress();
    if (Math.abs(progress - lastEmit) > 0.002 || progress !== before && progress === target) { lastEmit = progress; emit(); }
    // lighting blend
    var goal = lightMode === 'dusk' ? 1 : 0;
    lightMix += (goal - lightMix) * Math.min(1, dt * 3);
    var a = LIGHT.day, b = LIGHT.dusk, m = lightMix;
    hemi.intensity = a.hemi + (b.hemi - a.hemi) * m; hemi.color.copy(a.hemiSky).lerp(b.hemiSky, m);
    sun.color.copy(a.sunC).lerp(b.sunC, m); sun.intensity = a.sunI + (b.sunI - a.sunI) * m;
    sun.position.copy(a.sunP).lerp(b.sunP, m);
    rim.intensity = b.rim * m; glow.intensity = b.glow * m * (progress > 0.5 ? 1 : 0);
    // camera motion
    if (autoSpin && !dragging && idle > 2.5) yawGoal += dt * 0.12;
    yaw += (yawGoal - yaw) * Math.min(1, dt * 5);
    tilt += (tiltGoal - tilt) * Math.min(1, dt * 4);
    pivot.rotation.y = yaw; pivot.rotation.x = tilt * 0.5;
    renderer.render(scene, camera);
    var busy = playing || progress !== target || Math.abs(goal - lightMix) > 0.002 || Math.abs(yawGoal - yaw) > 0.0005 || Math.abs(tiltGoal - tilt) > 0.0005 || (autoSpin && idle > 2.5);
    if (visible && (busy || dragging)) requestAnimationFrame(frame); else running = false;
  }
  function wake() { if (running || !visible) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); }).observe(host);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host); else addEventListener('resize', resize);

  api.on = function (fn) { listeners.push(fn); emit(); };
  api.set = function (p) { playing = false; target = Math.max(0, Math.min(1, p)); if (reduce) progress = target; emit(); wake(); };
  api.play = function () { if (target >= 1) { target = 0; progress = 0; } playing = true; emit(); wake(); };
  api.pause = function () { playing = false; emit(); };
  api.toggle = function () { playing ? api.pause() : api.play(); };
  api.light = function (mode) { lightMode = mode; host.dataset.light = mode; wake(); };
  api.spin = function (on) { autoSpin = on && !reduce; wake(); };

  resize(); applyProgress();
  api.ready = true;
  document.documentElement.classList.add('webgl-ready');
  var started = false;
  function start() { if (started) return; started = true; if (reduce) { api.set(1); } else { setTimeout(api.play, 400); } }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { ob.disconnect(); start(); } }, { threshold: 0.3 }).observe(host);
  else start();
})();
