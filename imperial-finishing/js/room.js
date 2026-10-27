/* Imperial Finishing preview: trim profiles and the 3D "finish a room" studio.
   Profiles are plain data so the spec sheet can draw them even without WebGL. */
(function () {
  'use strict';

  var IN = 0.0254;

  // ---------- Trim styles (typical sizes, in inches) ----------
  var STYLES = {
    modern: {
      name: 'Modern', blurb: 'Square edges and slim profiles. Clean lines that suit newer homes and flat-panel doors.',
      base: { h: 4.25, t: 0.5, top: 'ease' }, casing: { w: 2.75, t: 0.625, type: 'flat' }, head: 'same', crown: { d: 3.5, type: 'cove' }
    },
    craftsman: {
      name: 'Craftsman', blurb: 'Flat stock with a thick header and cap. A sturdy, built-by-hand look that pairs well with shaker doors.',
      base: { h: 5.5, t: 0.75, top: 'cap' }, casing: { w: 3.5, t: 0.75, type: 'flat' }, head: 'craftsman', crown: { d: 4.5, type: 'cove' }
    },
    colonial: {
      name: 'Colonial', blurb: 'The classic stepped profile found in many Calgary homes. Easy to match when replacing a few rooms.',
      base: { h: 3.25, t: 0.5625, top: 'ogee' }, casing: { w: 2.25, t: 0.6875, type: 'colonial' }, head: 'same', crown: { d: 3.625, type: 'ogee' }
    },
    traditional: {
      name: 'Traditional', blurb: 'Tall base, beaded casing and a full crown. A finished, formal look for main floors and great rooms.',
      base: { h: 7.25, t: 0.75, top: 'ogee' }, casing: { w: 3.5, t: 0.875, type: 'bead' }, head: 'same', crown: { d: 5.25, type: 'ogee' }
    }
  };

  function quad(p0, c, p1, n) {
    var out = [];
    for (var i = 1; i <= n; i++) {
      var t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t;
      out.push([a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]]);
    }
    return out;
  }
  function bez(p0, c1, c2, p1, n) {
    var out = [];
    for (var i = 1; i <= n; i++) {
      var t = i / n, u = 1 - t;
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1]
      ]);
    }
    return out;
  }

  // Baseboard: [out, up] in metres
  function basePts(b) {
    var h = b.h * IN, t = b.t * IN, p = [[0, 0], [t, 0]];
    if (b.top === 'cap') {
      p.push([t, h * 0.84], [t + 0.007, h * 0.84], [t + 0.007, h * 0.92]);
      p = p.concat(quad([t + 0.007, h * 0.92], [t + 0.007, h], [t, h], 5));
    } else if (b.top === 'ogee') {
      p.push([t, h * 0.7]);
      p = p.concat(bez([t, h * 0.7], [t, h * 0.84], [t * 0.3, h * 0.8], [t * 0.4, h * 0.93], 10));
      p = p.concat(quad([t * 0.4, h * 0.93], [t * 0.45, h], [t * 0.22, h], 5));
    } else {
      p.push([t, h - 0.004]);
      p = p.concat(quad([t, h - 0.004], [t, h], [t - 0.004, h], 4));
    }
    p.push([0, h]);
    return p;
  }

  // Casing: [across, out]; across 0 = outer edge, w = edge at the opening
  function casingPts(c) {
    var w = c.w * IN, t = c.t * IN, p = [[0, 0], [w, 0]];
    if (c.type === 'colonial') {
      p.push([w, t * 0.42]);
      p = p.concat(bez([w, t * 0.42], [w * 0.75, t * 0.45], [w * 0.62, t * 0.92], [w * 0.4, t * 0.84], 10));
      p.push([w * 0.2, t * 0.84]);
      p = p.concat(quad([w * 0.2, t * 0.84], [w * 0.16, t], [w * 0.08, t], 4));
      p.push([0, t]);
    } else if (c.type === 'bead') {
      p.push([w, t * 0.72], [w * 0.3, t * 0.72]);
      p = p.concat(quad([w * 0.3, t * 0.72], [w * 0.22, t * 1.0], [w * 0.14, t * 0.82], 6));
      p.push([w * 0.08, t * 0.82], [w * 0.08, t], [0, t]);
    } else {
      p.push([w, t - 0.003]);
      p = p.concat(quad([w, t - 0.003], [w, t], [w - 0.003, t], 3));
      p.push([0, t]);
    }
    return p;
  }

  // Craftsman header: [out, up]
  function headerPts(c) {
    var t = c.t * IN, h = 5.5 * IN;
    return [[0, 0], [t + 0.004, 0], [t + 0.004, 0.012], [t, 0.012], [t, h], [t + 0.012, h], [t + 0.012, h + 0.022], [0, h + 0.022]];
  }

  // Crown: [out, up] relative to the top of the wall
  function crownPts(cr) {
    var d = cr.d * IN, drop = d * 0.78, proj = d * 0.62, p = [[0, -drop], [0.008, -drop], [0.008, -drop + 0.008]];
    var a = [0.008, -drop + 0.008], b = [proj - 0.008, -0.008];
    if (cr.type === 'ogee') p = p.concat(bez(a, [proj * 0.95, -drop * 0.9], [proj * 0.05, -drop * 0.1], b, 14));
    else p = p.concat(quad(a, [proj * 0.12, -drop * 0.12], b, 12));
    p.push([proj - 0.008, 0], [0, 0]);
    return p;
  }

  window.IFProfiles = { STYLES: STYLES, IN: IN, basePts: basePts, casingPts: casingPts, headerPts: headerPts, crownPts: crownPts };

  // ---------- 3D studio ----------
  var STAGES = [
    { key: 'bare', name: 'Bare walls', text: 'Drywall is up and the floor is in. This is where finishing carpentry starts.' },
    { key: 'base', name: 'Baseboards', text: 'Baseboards go on first, fitted to the floor with tight inside corners.' },
    { key: 'door', name: 'Door & casing', text: 'The door is hung in its jamb with even gaps, then cased on the room side.' },
    { key: 'window', name: 'Window trim', text: 'Window casing, stool and apron finish the opening and hide the drywall edge.' },
    { key: 'crown', name: 'Crown moulding', text: 'Crown moulding runs along the ceiling line and turns the corner.' },
    { key: 'wainscot', name: 'Wainscoting', text: 'A chair rail and panel moulding add depth to the lower wall.' },
    { key: 'paint', name: 'Paint-ready', text: 'Trim is filled and caulked, ready for paint. Try a few wall colours below.' }
  ];
  var TRIM_FINISHES = {
    white: { name: 'Painted white', color: 0xf3f1ec, grain: null, rough: 0.38 },
    oak: { name: 'Natural oak', color: 0xd3a56d, grain: ['#c8955b', '#a87542'], rough: 0.55 },
    walnut: { name: 'Walnut stain', color: 0x7a4b2f, grain: ['#6a3f26', '#4a2a17'], rough: 0.5 }
  };
  var WALLS = {
    warm: { name: 'Warm white', color: 0xebe5da },
    greige: { name: 'Greige', color: 0xc9bfb0 },
    sage: { name: 'Sage', color: 0xa3ae98 },
    charcoal: { name: 'Charcoal', color: 0x4b4f53 }
  };
  window.IFRoomData = { STAGES: STAGES, TRIM_FINISHES: TRIM_FINISHES, WALLS: WALLS };

  var state = { stage: 0, style: 'craftsman', trim: 'white', wall: 'greige' };
  var listeners = [];
  function emit() { listeners.forEach(function (fn) { fn(state); }); }

  var api = {
    state: state,
    on: function (fn) { listeners.push(fn); fn(state); },
    setStage: function (n) { state.stage = n; emit(); },
    setStyle: function (k) { state.style = k; emit(); },
    setTrim: function (k) { state.trim = k; emit(); },
    setWall: function (k) { state.wall = k; emit(); },
    replay: function () {},
    stopAuto: function () {},
    ready: false
  };
  window.IFRoom = api;

  var host = document.getElementById('room-stage');
  if (!host) return;
  function fail() { document.documentElement.classList.add('no-webgl'); }
  if (!window.THREE) { fail(); return; }
  var THREE = window.THREE;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { fail(); return; }
  if (!renderer.getContext()) { fail(); return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  var camHome = new THREE.Vector3(5.4, 3.3, 5.9);
  camera.position.copy(camHome);
  var look = new THREE.Vector3(0, 1.22, 0);
  camera.lookAt(look);

  scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x2a2622, 0.75));
  var sun = new THREE.DirectionalLight(0xfff1dc, 0.85);
  sun.position.set(5, 8, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -4; sun.shadow.camera.right = 4; sun.shadow.camera.top = 4; sun.shadow.camera.bottom = -4;
  sun.shadow.bias = -0.0008;
  sun.shadow.radius = 4;
  scene.add(sun);
  var fill = new THREE.DirectionalLight(0xdfe8f2, 0.28);
  fill.position.set(-3, 3, 7);
  scene.add(fill);

  // Room dimensions (metres)
  var L = 4.2, H = 2.6, T = 0.12;
  var door = { x0: 1.55, x1: 2.43, h: 2.05 };
  var win = { x0: 1.45, x1: 2.65, y0: 0.98, y1: 2.08 };

  var pivot = new THREE.Group();
  scene.add(pivot);
  var room = new THREE.Group();
  room.position.set(-L / 2, 0, -L / 2);
  pivot.add(room);

  var back = new THREE.Group();            // wall-local: x along wall, y up, z out into the room
  var left = new THREE.Group();
  left.rotation.y = Math.PI / 2;
  left.position.z = L;
  room.add(back, left);

  // ---- textures ----
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  var floorTex = canvasTex(1024, 1024, function (g, w, h) {
    var r = rnd(7), rows = 10, rh = h / rows;
    for (var i = 0; i < rows; i++) {
      var x = -r() * 400;
      while (x < w) {
        var len = 300 + r() * 420, tone = 120 + r() * 40;
        g.fillStyle = 'rgb(' + Math.round(tone * 0.86) + ',' + Math.round(tone * 0.6) + ',' + Math.round(tone * 0.42) + ')';
        g.fillRect(x, i * rh, len, rh);
        g.globalAlpha = 0.12;
        for (var k = 0; k < 7; k++) {
          g.fillStyle = r() > 0.5 ? '#2a170b' : '#e8c79a';
          g.fillRect(x, i * rh + r() * rh, len, 1 + r() * 2);
        }
        g.globalAlpha = 1;
        g.fillStyle = 'rgba(20,10,4,.55)';
        g.fillRect(x, i * rh, 2, rh);
        x += len;
      }
      g.fillStyle = 'rgba(20,10,4,.6)';
      g.fillRect(0, i * rh, w, 2);
    }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;

  var drywallTex = canvasTex(512, 256, function (g, w, h) {
    g.fillStyle = '#d6d4cf'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e9e7e2';
    [0.3, 0.62, 0.93].forEach(function (f) { g.fillRect(f * w - 10, 0, 20, h); });
    g.fillRect(0, h * 0.48 - 9, w, 18);
    var r = rnd(3);
    g.fillStyle = 'rgba(255,255,255,.7)';
    for (var i = 0; i < 70; i++) { g.beginPath(); g.arc(r() * w, r() * h, 1.5 + r() * 3, 0, 7); g.fill(); }
  });
  drywallTex.wrapS = drywallTex.wrapT = THREE.RepeatWrapping;

  function grainTex(cols) {
    return canvasTex(256, 512, function (g, w, h) {
      g.fillStyle = cols[0]; g.fillRect(0, 0, w, h);
      var r = rnd(11);
      for (var i = 0; i < 60; i++) {
        g.strokeStyle = cols[1]; g.globalAlpha = 0.15 + r() * 0.25; g.lineWidth = 1 + r() * 2.5;
        var x = r() * w; g.beginPath(); g.moveTo(x, 0);
        for (var y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y / 70 + i) * (4 + r() * 6), y);
        g.stroke();
      }
      g.globalAlpha = 1;
    });
  }

  // ---- materials ----
  var wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: drywallTex, roughness: 0.92 });
  var floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.62 });
  var edgeMat = new THREE.MeshStandardMaterial({ color: 0x24292d, roughness: 0.9 });
  var trimMat = new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.38 });
  var glassMat = new THREE.MeshStandardMaterial({ color: 0xb9d4e8, emissive: 0x7fa6c4, emissiveIntensity: 0.45, roughness: 0.08, metalness: 0.1 });
  var metalMat = new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.35, metalness: 0.8 });
  var grains = { oak: grainTex(TRIM_FINISHES.oak.grain), walnut: grainTex(TRIM_FINISHES.walnut.grain) };

  // ---- static shell ----
  function wallShape(holes) {
    var s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(L, 0); s.lineTo(L, H); s.lineTo(0, H); s.lineTo(0, 0);
    holes.forEach(function (o) {
      var p = new THREE.Path();
      p.moveTo(o[0], o[1]); p.lineTo(o[0], o[3]); p.lineTo(o[2], o[3]); p.lineTo(o[2], o[1]); p.lineTo(o[0], o[1]);
      s.holes.push(p);
    });
    return s;
  }
  function wallMesh(holes) {
    var g = new THREE.ExtrudeGeometry(wallShape(holes), { depth: T, bevelEnabled: false });
    var uv = g.attributes.uv;
    for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.6, uv.getY(i) / 1.3);
    var m = new THREE.Mesh(g, wallMat);
    m.position.z = -T;
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  back.add(wallMesh([[door.x0, 0, door.x1, door.h]]));
  left.add(wallMesh([[win.x0, win.y0, win.x1, win.y1]]));

  var floorG = new THREE.PlaneGeometry(L, L);
  floorTex.repeat.set(2, 2);
  var floor = new THREE.Mesh(floorG, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(L / 2, 0.001, L / 2);
  floor.receiveShadow = true;
  room.add(floor);
  var slab = new THREE.Mesh(new THREE.BoxGeometry(L + T, 0.14, L + T), edgeMat);
  slab.position.set(L / 2 - T / 2, -0.07, L / 2 - T / 2);
  slab.receiveShadow = true;
  room.add(slab);

  var glass = new THREE.Mesh(new THREE.PlaneGeometry(win.x1 - win.x0, win.y1 - win.y0), glassMat);
  glass.position.set((win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2, -T * 0.6);
  left.add(glass);

  // ---- trim pieces (rebuilt when the style changes) ----
  var pieces = [];      // { mesh, stage, delay, parent }
  var trimRoot = { back: new THREE.Group(), left: new THREE.Group() };
  back.add(trimRoot.back); left.add(trimRoot.left);

  function shapeFrom(pts, map) {
    var s = new THREE.Shape();
    pts.forEach(function (p, i) { var q = map(p); if (i) s.lineTo(q[0], q[1]); else s.moveTo(q[0], q[1]); });
    return s;
  }
  function extrude(shape, len) {
    return new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false, curveSegments: 4 });
  }
  function add(wall, mesh, stage) {
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.home = mesh.position.clone();
    trimRoot[wall].add(mesh);
    var n = pieces.filter(function (p) { return p.stage === stage; }).length;
    pieces.push({ mesh: mesh, stage: stage, delay: n * 70 });
  }
  // A run along the wall: profile [out, up], spanning x0..x0+len at height y
  function hRun(wall, pts, x0, len, y, stage, mat) {
    var m = new THREE.Mesh(extrude(shapeFrom(pts, function (p) { return [p[0], p[1]]; }), len), mat || trimMat);
    m.rotation.y = -Math.PI / 2;
    m.position.set(x0 + len, y, 0);
    add(wall, m, stage);
  }
  // A vertical piece: profile [across, out], across mapped along +x from x0
  function vRun(wall, pts, x0, y0, len, mirror, stage, w) {
    var m = new THREE.Mesh(extrude(shapeFrom(pts, function (p) { return [mirror ? w - p[0] : p[0], p[1]]; }), len), trimMat);
    m.rotation.x = Math.PI / 2;
    m.position.set(x0, y0 + len, 0);
    add(wall, m, stage);
  }
  function box(wall, w, h, d, x, y, z, stage, mat) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || trimMat);
    m.position.set(x, y, z);
    add(wall, m, stage);
    return m;
  }

  function build() {
    pieces.forEach(function (p) {
      p.mesh.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
      p.mesh.parent.remove(p.mesh);
    });
    anims = [];
    pieces = [];
    var st = STYLES[state.style];
    var bp = basePts(st.base), cw = st.casing.w * IN, ct = st.casing.t * IN, cp = casingPts(st.casing);
    var baseH = st.base.h * IN;

    // 1 baseboards
    hRun('back', bp, 0, door.x0 - cw, 0, 1);
    hRun('back', bp, door.x1 + cw, L - door.x1 - cw, 0, 1);
    hRun('left', bp, 0, L, 0, 1);

    // 2 door: jamb, slab, casing
    var jt = 0.019;
    box('back', jt, door.h, T, door.x0 + jt / 2, door.h / 2, -T / 2, 2);
    box('back', jt, door.h, T, door.x1 - jt / 2, door.h / 2, -T / 2, 2);
    box('back', door.x1 - door.x0, jt, T, (door.x0 + door.x1) / 2, door.h - jt / 2, -T / 2, 2);
    var dw = door.x1 - door.x0 - 2 * jt - 0.006, dh = door.h - jt - 0.012;
    var slabGroup = new THREE.Group();
    var slab = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.04), trimMat);
    slab.castShadow = true; slab.receiveShadow = true;
    slab.position.set(dw / 2, 0, 0);
    slabGroup.add(slab);
    var rail = 0.12, stile = 0.11, rd = 0.008;
    [[dw / 2, dh / 2 - rail / 2, dw, rail], [dw / 2, -dh / 2 + rail * 0.9, dw, rail * 1.8], [dw / 2, 0.02, dw, rail * 0.9],
     [stile / 2, 0, stile, dh], [dw - stile / 2, 0, stile, dh]].forEach(function (r) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(r[2], r[3], rd), trimMat);
      m.position.set(r[0], r[1], 0.02 + rd / 2);
      m.castShadow = true;
      slabGroup.add(m);
    });
    var knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), metalMat);
    knob.position.set(dw - 0.07, -0.06, 0.05);
    slabGroup.add(knob);
    slabGroup.position.set(door.x0 + jt + 0.003, 0.006 + dh / 2, -0.03);
    slabGroup.rotation.y = -0.42;
    add('back', slabGroup, 2);
    vRun('back', cp, door.x0 - cw, 0, door.h, false, 2, cw);
    vRun('back', cp, door.x1, 0, door.h, true, 2, cw);
    if (st.head === 'craftsman') {
      hRun('back', headerPts(st.casing), door.x0 - cw - 0.012, door.x1 - door.x0 + 2 * cw + 0.024, door.h, 2);
    } else {
      hRun('back', cp.map(function (p) { return [p[1], cw - p[0]]; }), door.x0 - cw, door.x1 - door.x0 + 2 * cw, door.h, 2);
    }

    // 3 window: jambs, stool, apron, casing
    box('left', win.x1 - win.x0, jt, T, (win.x0 + win.x1) / 2, win.y1 - jt / 2, -T / 2, 3);
    box('left', jt, win.y1 - win.y0, T, win.x0 + jt / 2, (win.y0 + win.y1) / 2, -T / 2, 3);
    box('left', jt, win.y1 - win.y0, T, win.x1 - jt / 2, (win.y0 + win.y1) / 2, -T / 2, 3);
    var stoolW = win.x1 - win.x0 + 2 * cw + 0.05;
    box('left', stoolW, 0.024, T + 0.05, (win.x0 + win.x1) / 2, win.y0 - 0.012, -T + (T + 0.05) / 2, 3);
    hRun('left', cp.map(function (p) { return [p[1], p[0]]; }), win.x0 - cw, win.x1 - win.x0 + 2 * cw, win.y0 - 0.024 - cw, 3);
    vRun('left', cp, win.x0 - cw, win.y0, win.y1 - win.y0, false, 3, cw);
    vRun('left', cp, win.x1, win.y0, win.y1 - win.y0, true, 3, cw);
    if (st.head === 'craftsman') hRun('left', headerPts(st.casing), win.x0 - cw - 0.012, win.x1 - win.x0 + 2 * cw + 0.024, win.y1, 3);
    else hRun('left', cp.map(function (p) { return [p[1], cw - p[0]]; }), win.x0 - cw, win.x1 - win.x0 + 2 * cw, win.y1, 3);

    // 4 crown
    var cr = crownPts(st.crown);
    hRun('back', cr, 0, L, H, 4);
    hRun('left', cr, 0, L, H, 4);

    // 5 wainscoting: chair rail plus panel frames
    var railY = 0.9, railPts = [[0, 0], [0.016, 0], [0.016, 0.012], [0.024, 0.02], [0.024, 0.036], [0.016, 0.044], [0.016, 0.056], [0, 0.056]];
    function wainscot(wall, a, b) {
      if (b - a < 0.3) return;
      hRun(wall, railPts, a, b - a, railY - 0.056, 5);
      var y0 = baseH + 0.08, y1 = railY - 0.13, gap = 0.1, n = Math.max(1, Math.round((b - a - gap) / 0.62));
      var pw = (b - a - gap * (n + 1)) / n, s = 0.022, d = 0.012;
      for (var i = 0; i < n; i++) {
        var x = a + gap + i * (pw + gap);
        box(wall, pw, s, d, x + pw / 2, y1 - s / 2, d / 2, 5);
        box(wall, pw, s, d, x + pw / 2, y0 + s / 2, d / 2, 5);
        box(wall, s, y1 - y0 - 2 * s, d, x + s / 2, (y0 + y1) / 2, d / 2, 5);
        box(wall, s, y1 - y0 - 2 * s, d, x + pw - s / 2, (y0 + y1) / 2, d / 2, 5);
      }
    }
    wainscot('back', 0.02, door.x0 - cw - 0.04);
    wainscot('back', door.x1 + cw + 0.04, L - 0.02);
    wainscot('left', 0.02, win.x0 - cw - 0.08);
    wainscot('left', win.x1 + cw + 0.08, L - 0.02);

    pieces.forEach(function (p) { p.mesh.visible = p.stage <= state.stage; p.t0 = -1; });
  }

  // ---- animation ----
  var anims = [];
  var ease = function (t) { var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  function flyIn(stage) {
    var now = performance.now();
    pieces.forEach(function (p) {
      if (p.stage !== stage) return;
      p.mesh.visible = true;
      if (reduce) { p.mesh.position.copy(p.mesh.userData.home); return; }
      anims.push({ p: p, start: now + p.delay, dur: 720 });
      p.mesh.position.copy(p.mesh.userData.home).add(new THREE.Vector3(0, 0.35, 0.9));
    });
  }

  var shownStage = 0;
  function applyStage(n, animate) {
    pieces.forEach(function (p) {
      if (p.stage > n) p.mesh.visible = false;
      else if (!animate || p.stage <= shownStage) { p.mesh.visible = true; p.mesh.position.copy(p.mesh.userData.home); }
    });
    if (animate) for (var s = shownStage + 1; s <= n; s++) flyIn(s);
    shownStage = n;
    paintTarget = n >= 6 ? new THREE.Color(WALLS[state.wall].color) : null;
    wake();
  }

  var paintMix = 0, paintTarget = null, wallColor = new THREE.Color(0xffffff);
  function updatePaint(dt) {
    var goal = paintTarget ? 1 : 0;
    paintMix += (goal - paintMix) * Math.min(1, dt * 4);
    if (Math.abs(goal - paintMix) < 0.002) paintMix = goal;
    if (paintTarget) wallColor.lerp(paintTarget, Math.min(1, dt * 5));
    if (paintMix > 0.5 && wallMat.map) { wallMat.map = null; wallMat.needsUpdate = true; }
    if (paintMix <= 0.5 && !wallMat.map) { wallMat.map = drywallTex; wallMat.needsUpdate = true; wallColor.set(0xffffff); }
    wallMat.color.copy(paintMix > 0.5 ? wallColor : new THREE.Color(0xffffff));
    return paintMix !== goal || (paintTarget && !wallColor.equals(paintTarget));
  }

  function applyTrim() {
    var f = TRIM_FINISHES[state.trim];
    trimMat.color.set(f.grain ? 0xffffff : f.color);
    trimMat.map = f.grain ? grains[state.trim] : null;
    trimMat.roughness = f.rough;
    trimMat.needsUpdate = true;
    wake();
  }

  // ---- interaction: drag to turn ----
  var yaw = 0, yawGoal = 0, dragging = false, lastX = 0, idle = 0;
  host.addEventListener('pointerdown', function (e) {
    dragging = true; lastX = e.clientX; host.classList.add('dragging');
    host.setPointerCapture && host.setPointerCapture(e.pointerId);
    api.stopAuto();
  });
  host.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    yawGoal = Math.max(-0.75, Math.min(0.6, yawGoal + (e.clientX - lastX) * 0.006));
    lastX = e.clientX; idle = 0; wake();
  });
  function endDrag() { dragging = false; host.classList.remove('dragging'); }
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', endDrag);
  host.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { yawGoal = Math.max(-0.75, yawGoal - 0.12); wake(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { yawGoal = Math.min(0.6, yawGoal + 0.12); wake(); e.preventDefault(); }
  });

  // ---- render loop (pauses offscreen and when idle) ----
  var running = false, visible = true, last = performance.now(), time = 0;
  function resize() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var narrow = w / h < 1.05;
    camera.fov = narrow ? 41 : 33;
    camera.position.copy(camHome).multiplyScalar(narrow ? 1.18 : 1);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    wake();
  }
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt; idle += dt;
    var busy = false;
    for (var i = anims.length - 1; i >= 0; i--) {
      var a = anims[i], k = (now - a.start) / a.dur;
      if (k < 0) { busy = true; continue; }
      var home = a.p.mesh.userData.home, e = ease(Math.min(1, k)), off = 1 - e;
      a.p.mesh.position.set(home.x, home.y + 0.35 * off, home.z + 0.9 * off);
      if (k >= 1) { a.p.mesh.position.copy(home); anims.splice(i, 1); } else busy = true;
    }
    if (updatePaint(dt)) busy = true;
    var sway = reduce || dragging ? 0 : Math.sin(time * 0.35) * 0.05 * Math.min(1, idle / 2);
    yaw += (yawGoal + sway - yaw) * Math.min(1, dt * 6);
    pivot.rotation.y = yaw;
    renderer.render(scene, camera);
    var settling = Math.abs(yawGoal + sway - yaw) > 0.0005;
    if (visible && (busy || settling || !reduce)) requestAnimationFrame(frame);
    else running = false;
  }
  function wake() {
    if (running || !visible) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); }).observe(host);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize);

  // ---- autoplay the build once ----
  var autoTimer = null;
  function autoplay(from) {
    clearInterval(autoTimer);
    var n = from;
    api.setStage(n);
    autoTimer = setInterval(function () {
      n++;
      if (n >= STAGES.length) { clearInterval(autoTimer); autoTimer = null; return; }
      api.setStage(n);
    }, reduce ? 900 : 1500);
  }
  api.stopAuto = function () { clearInterval(autoTimer); autoTimer = null; };
  api.replay = function () { api.stopAuto(); shownStage = 0; api.setStage(0); setTimeout(function () { autoplay(1); }, 400); };

  var lastStyle = null, lastTrim = null, lastWall = null;
  api.on(function (s) {
    if (s.style !== lastStyle) { lastStyle = s.style; build(); applyStage(s.stage, false); }
    if (s.trim !== lastTrim) { lastTrim = s.trim; applyTrim(); }
    if (s.wall !== lastWall) { lastWall = s.wall; if (s.stage >= 6) paintTarget = new THREE.Color(WALLS[s.wall].color); }
    if (s.stage !== shownStage) applyStage(s.stage, s.stage > shownStage);
    wake();
  });

  resize();
  api.ready = true;
  document.documentElement.classList.add('webgl-ready');
  var started = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es, ob) {
      if (es[0].isIntersecting && !started) { started = true; ob.disconnect(); setTimeout(function () { if (state.stage === 0) autoplay(1); }, 500); }
    }, { threshold: 0.35 }).observe(host);
  } else autoplay(1);
})();
