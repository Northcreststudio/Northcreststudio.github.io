/* Imperial Finishing preview: 3D model of the Calgary kitchen in Mike's photo.
   Built from the photo: white shaker perimeter, range and chimney hood on the left run,
   wine cubby between the uppers, fridge wrapped by a pantry wall, walnut island with a
   white quartz top and black sink. Proportions are approximate. */
(function () {
  'use strict';
  var host = document.getElementById('kitchen-stage');
  if (!host) return;
  var api = { ready: false, focus: function () {}, show: function () {}, hide: function () {} };
  window.IFKitchen = api;
  if (!window.THREE) { document.documentElement.classList.add('no-kitchen3d'); return; }
  var THREE = window.THREE;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var built = false, renderer, scene, camera, running = false, visible = false, shown = false;

  // ---------- helpers ----------
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function canvasTex(w, h, draw, repeat) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  var M = {};
  function mats() {
    var floor = canvasTex(1024, 1024, function (g, w, h) {
      var r = rnd(19), rows = 9, rh = h / rows;
      for (var i = 0; i < rows; i++) {
        var x = -r() * 500;
        while (x < w) {
          var len = 340 + r() * 480, tone = 58 + r() * 22;
          g.fillStyle = 'rgb(' + Math.round(tone * 1.05) + ',' + Math.round(tone * 0.52) + ',' + Math.round(tone * 0.38) + ')';
          g.fillRect(x, i * rh, len, rh);
          g.globalAlpha = 0.14;
          for (var k = 0; k < 8; k++) { g.fillStyle = r() > 0.5 ? '#1a0b05' : '#b9714d'; g.fillRect(x, i * rh + r() * rh, len, 1 + r() * 2); }
          g.globalAlpha = 1; g.fillStyle = 'rgba(12,5,2,.6)'; g.fillRect(x, i * rh, 2, rh); x += len;
        }
        g.fillStyle = 'rgba(12,5,2,.7)'; g.fillRect(0, i * rh, w, 2);
      }
    }, [2.4, 2.4]);
    var tile = canvasTex(512, 256, function (g, w, h) {
      g.fillStyle = '#cfd2d3'; g.fillRect(0, 0, w, h);
      var tw = 64, th = 21;
      for (var y = 0, row = 0; y < h; y += th + 2, row++) {
        for (var x = (row % 2) * -tw / 2; x < w; x += tw + 2) {
          var gr = g.createLinearGradient(0, y, 0, y + th); gr.addColorStop(0, '#fbfbfa'); gr.addColorStop(1, '#eceeed');
          g.fillStyle = gr; g.fillRect(x + 1, y + 1, tw, th);
        }
      }
    }, [5, 2.2]);
    var quartz = canvasTex(1024, 512, function (g, w, h) {
      g.fillStyle = '#f4f3f0'; g.fillRect(0, 0, w, h);
      var r = rnd(4);
      for (var v = 0; v < 9; v++) {
        g.strokeStyle = 'rgba(150,145,140,' + (0.25 + r() * 0.45) + ')'; g.lineWidth = 1 + r() * 4;
        g.beginPath(); var x = r() * w, y = 0; g.moveTo(x, y);
        var vx = (r() - 0.5) * 2; while (y < h) { vx += (r() - 0.5) * 0.8; x += vx * 6; y += 6; g.lineTo(x, y); }
        g.stroke();
      }
    });
    var walnut = canvasTex(256, 512, function (g, w, h) {
      g.fillStyle = '#4a2619'; g.fillRect(0, 0, w, h);
      var r = rnd(8);
      for (var i = 0; i < 70; i++) {
        g.strokeStyle = r() > 0.5 ? 'rgba(30,12,6,.45)' : 'rgba(120,64,40,.35)'; g.lineWidth = 1 + r() * 2.5;
        var x = r() * w; g.beginPath(); g.moveTo(x, 0);
        for (var y = 0, a = 1 + r() * 2.5, ph = r() * 6; y <= h; y += 8) g.lineTo(x + Math.sin(y / 90 + ph) * a * 3, y);
        g.stroke();
      }
    });
    M.wall = new THREE.MeshStandardMaterial({ color: 0xe6e3dd, roughness: 0.95 });
    M.floor = new THREE.MeshStandardMaterial({ map: floor, roughness: 0.5 });
    M.edge = new THREE.MeshStandardMaterial({ color: 0x24292d, roughness: 0.9 });
    M.cab = new THREE.MeshStandardMaterial({ color: 0xe9e8e4, roughness: 0.55 });
    M.cabIn = new THREE.MeshStandardMaterial({ color: 0xf4f3f0, roughness: 0.8 });
    M.island = new THREE.MeshStandardMaterial({ color: 0xffffff, map: walnut, roughness: 0.55 });
    M.quartz = new THREE.MeshStandardMaterial({ color: 0xffffff, map: quartz, roughness: 0.18, metalness: 0.02 });
    M.tile = new THREE.MeshStandardMaterial({ map: tile, roughness: 0.3 });
    M.steel = new THREE.MeshStandardMaterial({ color: 0xc6c9cc, roughness: 0.32, metalness: 0.75 });
    M.nickel = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.25, metalness: 0.9 });
    M.black = new THREE.MeshStandardMaterial({ color: 0x16181a, roughness: 0.35, metalness: 0.2 });
    M.glassBlack = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.08, metalness: 0.4 });
    M.toe = new THREE.MeshStandardMaterial({ color: 0x3a3634, roughness: 0.9 });
    M.glow = new THREE.MeshBasicMaterial({ color: 0xfff1d6 });
    M.leaf = new THREE.MeshStandardMaterial({ color: 0x4f8a3e, roughness: 0.7 });
    M.pot = new THREE.MeshStandardMaterial({ color: 0xf5f5f2, roughness: 0.5 });
    M.board = new THREE.MeshStandardMaterial({ color: 0x9a6a3e, roughness: 0.6 });
    M.wine = new THREE.MeshStandardMaterial({ color: 0x2c1016, roughness: 0.2, metalness: 0.3 });
    M.bowl = new THREE.MeshStandardMaterial({ color: 0xdfeef2, roughness: 0.05, transparent: true, opacity: 0.35 });
  }

  var pieces = [], doors = [], spots = [];
  function track(obj, stage) {
    obj.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    obj.userData.home = obj.position.clone();
    var n = pieces.filter(function (p) { return p.stage === stage; }).length;
    pieces.push({ obj: obj, stage: stage, delay: n * 45 });
    return obj;
  }
  function box(w, h, d, mat, x, y, z, parent) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  function pull(len, vertical, parent, x, y, z) {
    var g = new THREE.Group();
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 10), M.nickel);
    if (!vertical) bar.rotation.z = Math.PI / 2;
    bar.position.z = 0.032; g.add(bar);
    [-1, 1].forEach(function (s) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.032, 8), M.nickel);
      post.rotation.x = Math.PI / 2;
      post.position.set(vertical ? 0 : s * len * 0.42, vertical ? s * len * 0.42 : 0, 0.016);
      g.add(post);
    });
    g.position.set(x, y, z); parent.add(g);
    return g;
  }
  // Shaker front: origin at the front's centre, back face at z = 0
  function shaker(w, h, mat) {
    var g = new THREE.Group(), s = Math.min(0.065, w * 0.2, h * 0.2), t = 0.019;
    box(w, h, t, mat, 0, 0, t / 2, g);
    box(w, s, 0.007, mat, 0, h / 2 - s / 2, t + 0.0035, g);
    box(w, s, 0.007, mat, 0, -h / 2 + s / 2, t + 0.0035, g);
    box(s, h - 2 * s, 0.007, mat, -w / 2 + s / 2, 0, t + 0.0035, g);
    box(s, h - 2 * s, 0.007, mat, w / 2 - s / 2, 0, t + 0.0035, g);
    return g;
  }
  // Base cabinet run segment in wall-local coordinates (x along the wall, z out of the wall)
  function base(parent, x0, w, kind, stage) {
    var g = new THREE.Group(), d = 0.6;
    box(w, 0.78, d - 0.02, M.cab, x0 + w / 2, 0.49, (d - 0.02) / 2, g);
    box(w, 0.1, d - 0.08, M.toe, x0 + w / 2, 0.05, (d - 0.08) / 2, g);
    var gap = 0.004;
    if (kind === 'drawers') {
      var hs = [0.19, 0.27, 0.28], y = 0.88;
      hs.forEach(function (h) {
        var f = shaker(w - gap * 2, h - gap, M.cab); f.position.set(x0 + w / 2, y - h / 2, d - 0.02); g.add(f);
        pull(Math.min(0.45, w * 0.55), false, f, 0, h * 0.18, 0);
        y -= h;
      });
    } else {
      var n = w > 0.62 ? 2 : 1, dw = w / n;
      var top = shaker(w - gap * 2, 0.15, M.cab); top.position.set(x0 + w / 2, 0.8, d - 0.02); g.add(top);
      pull(Math.min(0.32, w * 0.4), false, top, 0, 0, 0);
      for (var i = 0; i < n; i++) {
        var f2 = shaker(dw - gap * 2, 0.6, M.cab); f2.position.set(x0 + dw * i + dw / 2, 0.42, d - 0.02); g.add(f2);
        pull(0.16, true, f2, (i === 0 && n === 2 ? 1 : -1) * (dw / 2 - 0.05), 0.15, 0);
      }
    }
    parent.add(g); track(g, stage);
    return g;
  }
  // Upper cabinet with opening doors and a shelf
  function upper(parent, x0, w, y0, h, depth, stage, nDoors) {
    var g = new THREE.Group(), t = 0.018, d = depth || 0.34;
    box(w, h, t, M.cabIn, x0 + w / 2, y0 + h / 2, t / 2, g);
    box(t, h, d, M.cab, x0 + t / 2, y0 + h / 2, d / 2, g);
    box(t, h, d, M.cab, x0 + w - t / 2, y0 + h / 2, d / 2, g);
    box(w, t, d, M.cab, x0 + w / 2, y0 + h - t / 2, d / 2, g);
    box(w, t, d, M.cab, x0 + w / 2, y0 + t / 2, d / 2, g);
    if (h > 0.6) box(w - 2 * t, t, d - 0.03, M.cabIn, x0 + w / 2, y0 + h * 0.5, (d - 0.03) / 2, g);
    var n = nDoors || (w > 0.62 ? 2 : 1), dw = w / n;
    for (var i = 0; i < n; i++) {
      var hingeLeft = n === 1 ? true : i === 0;
      var pivot = new THREE.Group();
      pivot.position.set(hingeLeft ? x0 + dw * i : x0 + dw * (i + 1), y0 + h / 2, d);
      var f = shaker(dw - 0.006, h - 0.006, M.cab);
      f.position.x = hingeLeft ? dw / 2 : -dw / 2;
      pivot.add(f);
      pull(Math.min(0.2, h * 0.3), true, f, (hingeLeft ? 1 : -1) * (dw / 2 - 0.045), -h / 2 + Math.min(0.16, h * 0.25), 0);
      g.add(pivot);
      doors.push({ pivot: pivot, dir: hingeLeft ? -1 : 1, open: 0 });
    }
    parent.add(g); track(g, stage);
    return g;
  }
  function counter(parent, x0, w, depth, stage) {
    var c = box(w, 0.03, depth, M.quartz, x0 + w / 2, 0.895, depth / 2, null);
    parent.add(c); track(c, stage);
  }
  function tileStrip(parent, x0, w, stage) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.55), M.tile.clone());
    m.material.map = M.tile.map.clone(); m.material.map.needsUpdate = true; m.material.map.repeat.set(w * 1.6, 1.4);
    m.position.set(x0 + w / 2, 0.91 + 0.275, 0.002); m.receiveShadow = true;
    parent.add(m); track(m, stage);
  }

  // ---------- build ----------
  var LB = 6.0, LL = 4.6, H = 2.48;
  var back, left, island = new THREE.Group();
  function build() {
    mats();
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xf6f3ee, 0x2b2420, 0.7));
    var sun = new THREE.DirectionalLight(0xfff4e6, 0.75);
    sun.position.set(6, 9, 7); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0006; sun.shadow.radius = 3;
    sun.target.position.set(2.6, 0, 2.2); scene.add(sun.target);
    scene.add(sun);
    var fill = new THREE.DirectionalLight(0xdfe7f0, 0.3); fill.position.set(-2, 4, 8); scene.add(fill);

    back = new THREE.Group(); left = new THREE.Group();
    left.rotation.y = Math.PI / 2; left.position.z = LL;
    scene.add(back, left, island);

    // shell
    box(LB, H, 0.1, M.wall, LB / 2, H / 2, -0.05, back);
    box(LL, H, 0.1, M.wall, LL / 2, H / 2, -0.05, left);
    var fl = new THREE.Mesh(new THREE.PlaneGeometry(LB, LL), M.floor);
    fl.rotation.x = -Math.PI / 2; fl.position.set(LB / 2, 0.001, LL / 2); fl.receiveShadow = true; scene.add(fl);
    box(LB + 0.1, 0.14, LL + 0.1, M.edge, LB / 2 - 0.05, -0.07, LL / 2 - 0.05, scene);
    // doorway on the far right of the back wall, as in the photo
    box(0.86, 2.05, 0.03, new THREE.MeshStandardMaterial({ color: 0xdedcd7, roughness: 0.6 }), 5.45, 1.025, 0.012, back);

    // --- back wall run (stage 1 bases, 2 uppers) ---
    base(back, 0, 0.62, 'doors', 1);            // blind corner
    base(back, 0.62, 0.8, 'doors', 1);
    base(back, 1.42, 0.5, 'drawers', 1);
    var mw = base(back, 1.92, 0.6, 'doors', 1);  // microwave drawer sits in the front
    box(0.56, 0.3, 0.02, M.steel, 2.22, 0.66, 0.61, mw);
    box(0.4, 0.13, 0.005, M.glassBlack, 2.22, 0.67, 0.622, mw);
    base(back, 2.52, 0.22, 'doors', 1);
    upper(back, 0.62, 0.8, 1.46, 0.98, 0.34, 2);
    var cubby = new THREE.Group();
    box(0.2, 0.98, 0.018, M.cabIn, 1.52, 1.95, 0.009, cubby);
    for (var i = 0; i <= 7; i++) box(0.2, 0.014, 0.33, M.cab, 1.52, 1.46 + i * 0.14, 0.17, cubby);
    box(0.018, 0.98, 0.34, M.cab, 1.42 + 0.009, 1.95, 0.17, cubby);
    box(0.018, 0.98, 0.34, M.cab, 1.62 - 0.009, 1.95, 0.17, cubby);
    for (var b = 0; b < 6; b++) {
      var bt = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.3, 14), M.wine);
      bt.rotation.x = Math.PI / 2; bt.position.set(1.52, 1.46 + b * 0.14 + 0.055, 0.17); cubby.add(bt);
    }
    back.add(cubby); track(cubby, 2);
    upper(back, 1.62, 0.9, 1.46, 0.98, 0.34, 2);
    // fridge, cabinet above, pantry wall
    upper(back, 2.75, 0.94, 1.86, 0.58, 0.62, 2);
    upper(back, 3.69, 0.58, 1.58, 0.86, 0.62, 2, 1);
    upper(back, 3.69, 0.58, 0.58, 1.0, 0.62, 2, 1);
    upper(back, 4.27, 0.58, 1.58, 0.86, 0.62, 2, 1);
    upper(back, 4.27, 0.58, 0.58, 1.0, 0.62, 2, 1);
    [3.69, 4.27].forEach(function (x) {
      var g = new THREE.Group();
      box(0.58, 0.1, 0.56, M.toe, x + 0.29, 0.05, 0.28, g);
      box(0.58, 0.48, 0.6, M.cab, x + 0.29, 0.34, 0.3, g);
      [0.21, 0.445].forEach(function (y) {
        var f = shaker(0.574, 0.225, M.cab); f.position.set(x + 0.29, y, 0.6); g.add(f);
        pull(0.32, false, f, 0, 0.03, 0);
      });
      back.add(g); track(g, 2);
    });

    // --- left wall run (local x: 0 near the viewer, LL at the corner) ---
    base(left, LL - 0.62, 0.62, 'doors', 1);
    base(left, LL - 1.42, 0.8, 'drawers', 1);
    base(left, 0.9, 0.8, 'drawers', 1);
    base(left, 0.2, 0.7, 'drawers', 1);
    base(left, 2.48, 0.7, 'doors', 1);
    upper(left, LL - 1.42, 0.8, 1.46, 0.98, 0.34, 2);
    upper(left, 2.5, 0.68, 1.46, 0.98, 0.34, 2, 1);
    upper(left, 0.2, 0.7, 1.46, 0.98, 0.34, 2, 1);

    // --- counters + backsplash (stage 4) ---
    counter(back, 0, 2.74, 0.63, 4);
    counter(left, 0.2, 1.52, 0.63, 4);
    counter(left, 2.48, LL - 0.63 - 2.48, 0.63, 4);
    tileStrip(back, 0, 2.74, 4);
    tileStrip(left, 0.2, LL - 0.2, 4);

    // --- appliances + hardware (stage 5) ---
    var fridge = new THREE.Group();
    box(0.9, 1.78, 0.66, M.steel, 3.22, 0.95, 0.33, fridge);
    box(0.004, 1.12, 0.01, M.black, 3.22, 1.27, 0.665, fridge);
    box(0.9, 0.006, 0.01, M.black, 3.22, 0.7, 0.665, fridge);
    [3.17, 3.27].forEach(function (x) { box(0.018, 0.5, 0.03, M.nickel, x, 1.25, 0.69, fridge); });
    box(0.5, 0.018, 0.03, M.nickel, 3.22, 0.62, 0.69, fridge);
    back.add(fridge); track(fridge, 5);

    var range = new THREE.Group();
    box(0.76, 0.9, 0.62, M.steel, 1.72 + 0.38, 0.45, 0.31, range);
    box(0.76, 0.012, 0.6, M.glassBlack, 2.1, 0.906, 0.3, range);
    box(0.62, 0.4, 0.01, M.glassBlack, 2.1, 0.45, 0.625, range);
    box(0.6, 0.025, 0.04, M.nickel, 2.1, 0.72, 0.65, range);
    box(0.76, 0.12, 0.05, M.steel, 2.1, 0.97, 0.03, range);
    box(0.22, 0.05, 0.005, M.glassBlack, 2.1, 0.97, 0.056, range);
    left.add(range); track(range, 5);
    // hood: canopy plus chimney
    var hood = new THREE.Group();
    var can = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.55, 0.28, 4, 1), M.steel);
    can.rotation.y = Math.PI / 4; can.scale.set(1, 1, 0.68); can.position.set(2.1, 1.72, 0.26); hood.add(can);
    box(0.3, 0.62, 0.26, M.steel, 2.1, 2.17, 0.13, hood);
    left.add(hood); track(hood, 5);

    // under-cabinet light strips
    [[back, 0.64, 0.76], [back, 1.64, 0.86], [left, LL - 1.4, 0.76], [left, 0.22, 0.66]].forEach(function (s) {
      var strip = new THREE.Mesh(new THREE.PlaneGeometry(s[2], 0.03), M.glow);
      strip.rotation.x = Math.PI / 2; strip.position.set(s[1] + s[2] / 2, 1.455, 0.3); s[0].add(strip); track(strip, 5);
    });
    var warm1 = new THREE.PointLight(0xffe2b8, 0.35, 2.6); warm1.position.set(1.2, 1.35, 0.5); scene.add(warm1);
    var warm2 = new THREE.PointLight(0xffe2b8, 0.3, 2.6); warm2.position.set(0.5, 1.35, 1.6); scene.add(warm2);

    // counter details: plants, board, coffee maker
    var deco = new THREE.Group();
    [[0.95, 0.12], [1.12, 0.1]].forEach(function (p, i) {
      var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.12, 18), M.pot); pot.position.set(p[0], 0.97, 0.16); deco.add(pot);
      for (var k = 0; k < 7; k++) {
        var lf = new THREE.Mesh(new THREE.SphereGeometry(0.045 + (k % 3) * 0.01, 10, 8), M.leaf);
        lf.position.set(p[0] + Math.cos(k * 0.9 + i) * 0.06, 1.07 + (k % 3) * 0.04, 0.16 + Math.sin(k * 0.9 + i) * 0.06); deco.add(lf);
      }
    });
    box(0.25, 0.02, 0.16, M.board, 0.62, 0.92, 0.12, deco);
    box(0.18, 0.3, 0.22, M.black, 2.32, 1.06, 0.14, deco);
    back.add(deco); track(deco, 5);

    // --- island (stage 3 base, 4 top, 5 sink) ---
    var ix = 2.95, iz = 2.4, iw = 2.3, idp = 0.95;
    var ib = new THREE.Group();
    box(iw, 0.86, idp, M.island, ix, 0.45, iz, ib);
    box(0.05, 0.88, idp + 0.04, M.island, ix - iw / 2 - 0.02, 0.45, iz, ib);
    box(0.05, 0.88, idp + 0.04, M.island, ix + iw / 2 + 0.02, 0.45, iz, ib);
    box(0.08, 0.06, 0.02, M.black, ix - 0.55, 0.7, iz + idp / 2 + 0.01, ib); // outlet, like the photo
    island.add(ib); track(ib, 3);
    var itop = box(iw + 0.2, 0.035, idp + 0.2, M.quartz, ix, 0.9, iz, null);
    island.add(itop); track(itop, 4);
    var sink = new THREE.Group();
    box(0.78, 0.004, 0.42, M.black, ix - 0.25, 0.919, iz - 0.12, sink);
    var fp = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.34, 14), M.black); fp.position.set(ix - 0.05, 1.09, iz - 0.4); sink.add(fp);
    var arc = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014, 10, 24, Math.PI), M.black);
    arc.position.set(ix - 0.05, 1.26, iz - 0.29); arc.rotation.y = Math.PI / 2; sink.add(arc);
    var sp = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 10), M.black); sp.position.set(ix - 0.05, 1.215, iz - 0.18); sink.add(sp);
    var bowl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 18), M.bowl); bowl.position.set(ix + 0.35, 1.02, iz - 0.05); sink.add(bowl);
    island.add(sink); track(sink, 5);

    // detail spots (same order as the photo hotspots)
    spots = [
      new THREE.Vector3(3.22, 2.16, 0.68),
      new THREE.Vector3(1.52, 2.02, 0.36),
      new THREE.Vector3(0.36, 2.0, LL - 2.1),
      new THREE.Vector3(4.27, 1.25, 0.66),
      new THREE.Vector3(0.64, 0.6, LL - 1.3),
      new THREE.Vector3(ix + 0.6, 0.55, iz + idp / 2 + 0.04)
    ];
  }

  // ---------- camera ----------
  var VIEWS = {
    photo: { pos: [4.7, 1.75, 6.0], tgt: [2.0, 1.12, 1.0] },
    island: { pos: [6.3, 2.6, 4.6], tgt: [2.6, 0.9, 1.8] },
    top: { pos: [3.0, 9.2, 3.1], tgt: [3.0, 0, 2.3] }
  };
  var tgt = new THREE.Vector3(), tgtGoal = new THREE.Vector3();
  var sph = { r: 6, th: 0.5, ph: 1.2 }, sphGoal = { r: 6, th: 0.5, ph: 1.2 };
  function setView(name, instant) {
    var v = VIEWS[name], p = new THREE.Vector3().fromArray(v.pos), t = new THREE.Vector3().fromArray(v.tgt), d = p.clone().sub(t);
    tgtGoal.copy(t);
    sphGoal.r = d.length(); sphGoal.th = Math.atan2(d.x, d.z); sphGoal.ph = Math.acos(Math.max(-1, Math.min(1, d.y / d.length())));
    if (instant) { tgt.copy(tgtGoal); sph.r = sphGoal.r; sph.th = sphGoal.th; sph.ph = sphGoal.ph; }
    wake();
  }
  function placeCamera() {
    camera.position.set(
      tgt.x + sph.r * Math.sin(sph.ph) * Math.sin(sph.th),
      tgt.y + sph.r * Math.cos(sph.ph),
      tgt.z + sph.r * Math.sin(sph.ph) * Math.cos(sph.th)
    );
    camera.lookAt(tgt);
  }

  // ---------- install animation ----------
  var anims = [];
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  function install() {
    anims = [];
    var now = performance.now();
    pieces.forEach(function (p) {
      var home = p.obj.userData.home;
      if (reduce) { p.obj.position.copy(home); p.obj.visible = true; return; }
      p.obj.visible = false;
      anims.push({ p: p, start: now + (p.stage - 1) * 650 + p.delay, dur: 650 });
    });
    wake();
  }

  // ---------- doors ----------
  var doorsOpen = false;
  function toggleDoors(open) { doorsOpen = open; wake(); }

  // ---------- colours ----------
  var CAB = { white: 0xe9e8e4, sage: 0xa7b39c, navy: 0x2f3e55 };
  var ISL = { walnut: { c: 0xffffff, map: true }, oak: { c: 0xd8b07d, map: false }, charcoal: { c: 0x34383c, map: false } };
  var walnutMap = null;
  function setCab(k) { M.cab.color.setHex(CAB[k]); wake(); }
  function setIsland(k) {
    var v = ISL[k];
    if (!walnutMap) walnutMap = M.island.map;
    M.island.map = v.map ? walnutMap : null; M.island.color.setHex(v.c); M.island.needsUpdate = true; wake();
  }

  // ---------- hotspots overlay ----------
  var hsEls = [];
  function makeHotspots() {
    (window.IFSpots || []).forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'hs hs3d'; b.textContent = i + 1;
      b.setAttribute('aria-label', 'Detail ' + (i + 1) + ': ' + s.t);
      b.addEventListener('click', function () { if (window.IFShowSpot) window.IFShowSpot(i); });
      host.appendChild(b); hsEls.push(b);
    });
  }
  var v3 = new THREE.Vector3();
  function placeHotspots() {
    var w = host.clientWidth, h = host.clientHeight, settled = !anims.length;
    hsEls.forEach(function (b, i) {
      if (!spots[i]) return;
      v3.copy(spots[i]).project(camera);
      var off = v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05 || !settled;
      b.style.opacity = off ? 0 : 1;
      b.style.pointerEvents = off ? 'none' : '';
      b.style.left = ((v3.x + 1) / 2 * w).toFixed(1) + 'px';
      b.style.top = ((1 - v3.y) / 2 * h).toFixed(1) + 'px';
    });
  }

  // ---------- loop ----------
  var last = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var busy = false;
    for (var i = anims.length - 1; i >= 0; i--) {
      var a = anims[i], k = (now - a.start) / a.dur;
      if (k < 0) { busy = true; continue; }
      a.p.obj.visible = true;
      var e = easeOut(Math.min(1, k)), home = a.p.obj.userData.home;
      a.p.obj.position.set(home.x, home.y + 1.3 * (1 - e), home.z);
      if (k >= 1) { a.p.obj.position.copy(home); anims.splice(i, 1); } else busy = true;
    }
    doors.forEach(function (d) {
      var goal = doorsOpen ? 1 : 0;
      if (Math.abs(d.open - goal) > 0.001) { d.open += (goal - d.open) * Math.min(1, dt * 5); busy = true; } else d.open = goal;
      d.pivot.rotation.y = d.dir * d.open * 1.75;
    });
    var f = Math.min(1, dt * 5);
    tgt.lerp(tgtGoal, f);
    ['r', 'th', 'ph'].forEach(function (k) { sph[k] += (sphGoal[k] - sph[k]) * f; if (Math.abs(sphGoal[k] - sph[k]) > 0.0005) busy = true; });
    if (tgt.distanceTo(tgtGoal) > 0.0005) busy = true;
    placeCamera();
    renderer.render(scene, camera);
    placeHotspots();
    if (visible && shown && (busy || dragging)) requestAnimationFrame(frame); else running = false;
  }
  function wake() {
    if (!built || running || !visible || !shown) return;
    running = true; last = performance.now(); requestAnimationFrame(frame);
  }
  function resize() {
    if (!built) return;
    var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); wake();
  }

  // ---------- input ----------
  var dragging = false, lx = 0, ly = 0, pointers = {}, pinch = 0;
  function bindInput() {
    host.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      dragging = true; lx = e.clientX; ly = e.clientY; host.classList.add('dragging');
      host.setPointerCapture && host.setPointerCapture(e.pointerId); wake();
    });
    host.addEventListener('pointermove', function (e) {
      if (!dragging || !pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 2) {
        var a = pointers[ids[0]], b = pointers[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) sphGoal.r = Math.max(3, Math.min(11, sphGoal.r * pinch / d));
        pinch = d; return;
      }
      sphGoal.th = Math.max(-0.35, Math.min(1.75, sphGoal.th - (e.clientX - lx) * 0.006));
      if (e.pointerType !== 'touch') sphGoal.ph = Math.max(0.12, Math.min(1.45, sphGoal.ph - (e.clientY - ly) * 0.005));
      lx = e.clientX; ly = e.clientY;
    });
    function up(e) { delete pointers[e.pointerId]; pinch = 0; if (!Object.keys(pointers).length) { dragging = false; host.classList.remove('dragging'); } }
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    host.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault(); sphGoal.r = Math.max(3, Math.min(11, sphGoal.r * (1 + e.deltaY * 0.002))); wake();
    }, { passive: false });
    host.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft') sphGoal.th = Math.max(-0.35, sphGoal.th - 0.1);
      else if (k === 'ArrowRight') sphGoal.th = Math.min(1.75, sphGoal.th + 0.1);
      else if (k === 'ArrowUp') sphGoal.ph = Math.max(0.12, sphGoal.ph - 0.08);
      else if (k === 'ArrowDown') sphGoal.ph = Math.min(1.45, sphGoal.ph + 0.08);
      else if (k === '+' || k === '=') sphGoal.r = Math.max(3, sphGoal.r * 0.9);
      else if (k === '-') sphGoal.r = Math.min(11, sphGoal.r * 1.1);
      else return;
      e.preventDefault(); wake();
    });
  }

  // ---------- lifecycle ----------
  function init() {
    if (built) return;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      if (!renderer.getContext()) throw new Error('no gl');
    } catch (e) { document.documentElement.classList.add('no-kitchen3d'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.insertBefore(renderer.domElement, host.firstChild);
    camera = new THREE.PerspectiveCamera(42, 4 / 3, 0.1, 60);
    build();
    built = true;
    makeHotspots(); bindInput(); setView('photo', true);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host); else addEventListener('resize', resize);
    resize();
    install();
    api.ready = true;
    document.documentElement.classList.add('kitchen3d-ready');
  }
  api.show = function () { shown = true; init(); resize(); wake(); };
  api.hide = function () { shown = false; };
  api.view = function (n) { setView(n); };
  api.replay = function () { doorsOpen = false; install(); };
  api.doors = function (open) { toggleDoors(open); };
  api.cabinets = setCab;
  api.island = setIsland;
  api.zoom = function (f) { sphGoal.r = Math.max(3, Math.min(11, sphGoal.r * f)); wake(); };
  api.focus = function (i) {
    if (!built || !spots[i]) return;
    tgtGoal.copy(spots[i]); sphGoal.r = Math.max(3.2, Math.min(sphGoal.r, 4.2)); wake();
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); }, { rootMargin: '120px' }).observe(host);
  } else visible = true;
})();
