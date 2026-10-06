/* Heaven Stucco Ltd. — redesign preview */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SERVICES = ['Smooth acrylic finishes', 'Texture acrylic finishes', 'EIFS stucco', 'New stucco homes', 'Stucco painting', 'Stucco repair', 'Failed acrylic stucco repairs', 'Failed cement stucco repairs', 'Bird home repairs', 'Paper and wire', 'Parging and bases', 'Stucco tear down', 'Insurance claims reports'];
  var chosen = [];

  /* ---------- Header ---------- */
  var bar = $('#bar');
  var onScroll = function () { bar.classList.toggle('is-stuck', window.scrollY > 30); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Reveal ---------- */
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !still) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add('is-in'); });

  /* ---------- Active nav ---------- */
  var navLinks = $$('.bar__nav a');
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['services', 'damage', 'work', 'about'].forEach(function (id) { nio.observe(document.getElementById(id)); });
  }

  /* ---------- Estimate list shared by services, damage map and form ---------- */
  var trayEl = $('.tray');
  var chipsEl = $('[data-chips]');
  SERVICES.forEach(function (s) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = s; b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-svc', s);
    b.addEventListener('click', function () { toggle(s); });
    chipsEl.appendChild(b);
  });
  function toggle(s, forceOn) {
    var i = chosen.indexOf(s);
    if (i > -1 && !forceOn) chosen.splice(i, 1);
    else if (i === -1) chosen.push(s);
    paint();
  }
  function paint() {
    $$('[data-svc]').forEach(function (b) {
      if (b.classList.contains('hs')) return;
      b.setAttribute('aria-pressed', String(chosen.indexOf(b.getAttribute('data-svc')) > -1));
    });
    trayEl.classList.toggle('is-empty', !chosen.length);
    $('.tray__list', trayEl).textContent = chosen.length ? chosen.join(' · ') : 'Nothing added yet. Tap services above.';
  }
  $$('.pick').forEach(function (b) { b.addEventListener('click', function () { toggle(b.getAttribute('data-svc')); }); });
  paint();

  /* ---------- Service group tabs ---------- */
  var tabs = $$('.svc__tab');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var g = t.getAttribute('data-group');
      tabs.forEach(function (x) { var on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
      $$('.svc__list').forEach(function (l) { l.hidden = l.getAttribute('data-panel') !== g; });
    });
  });

  /* ---------- Damage map hotspots ---------- */
  var info = $('.spot-info');
  var addBtn = $('.spot-info__add', info);
  var current = null;
  $$('.hs').forEach(function (h) {
    h.setAttribute('aria-pressed', 'false');
    h.addEventListener('click', function () {
      $$('.hs').forEach(function (x) { x.setAttribute('aria-pressed', String(x === h)); });
      current = h.getAttribute('data-svc');
      $('.spot-info__k', info).textContent = h.getAttribute('data-k');
      $('.spot-info__t', info).textContent = h.getAttribute('data-t');
      addBtn.hidden = false;
      addBtn.textContent = chosen.indexOf(current) > -1 ? 'Added to your estimate ✓' : 'Add “' + current + '” to my estimate';
      info.classList.remove('is-flash'); void info.offsetWidth; info.classList.add('is-flash');
    });
  });
  addBtn.addEventListener('click', function () {
    if (!current) return;
    toggle(current, true);
    addBtn.textContent = 'Added to your estimate ✓';
  });

  /* ---------- 3-step estimate form (preview: no backend) ---------- */
  var form = $('#est');
  var steps = $$('.est__s', form);
  var back = $('[data-back]', form), next = $('[data-next]', form), send = $('[data-send]', form);
  var err = $('.est__err', form);
  var done = $('.est-done');
  var step = 0;
  var msgs = ['Choose the property type and job size.', 'Pick at least one service, or tell us about the job.', 'Add your name, phone and project address.'];
  function setStep(i) {
    step = i;
    steps.forEach(function (s, n) { s.classList.toggle('is-on', n === i); });
    $('.est__step b', form).textContent = i + 1;
    $('.est__bar', form).style.setProperty('--s', i + 1);
    back.hidden = i === 0; next.hidden = i === steps.length - 1; send.hidden = i !== steps.length - 1;
    err.textContent = '';
  }
  function valid(i) {
    var ok = true;
    if (i === 1) ok = chosen.length > 0 || $('#e-notes').value.trim() !== '';
    $$('[required]', steps[i]).forEach(function (f) {
      if (f.type === 'radio') { if (!form.querySelector('input[name="' + f.name + '"]:checked')) ok = false; }
      else { var good = f.value.trim() !== '' && f.checkValidity(); var w = f.closest('.field'); if (w) w.classList.toggle('is-bad', !good); if (!good) ok = false; }
    });
    if (!ok) err.textContent = msgs[i];
    return ok;
  }
  next.addEventListener('click', function () { if (valid(step)) setStep(step + 1); });
  back.addEventListener('click', function () { setStep(step - 1); });
  form.addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f) f.classList.remove('is-bad'); err.textContent = ''; });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!valid(step)) return;
    var fd = new FormData(form);
    var rows = [['Property', fd.get('property')], ['Job size', fd.get('size')], ['Services', chosen.join(', ') || '—'], ['Name', fd.get('name')], ['Phone', fd.get('phone')], ['Email', fd.get('email') || '—'], ['Address', fd.get('address')]];
    if (fd.get('notes')) rows.push(['Notes', fd.get('notes')]);
    var dl = $('.est-done__sum', done); dl.innerHTML = '';
    rows.forEach(function (r) { var d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; d.appendChild(dt); d.appendChild(dd); dl.appendChild(d); });
    form.hidden = true; done.hidden = false; done.focus();
  });
  $('[data-restart]', done).addEventListener('click', function () { form.reset(); chosen = []; paint(); form.hidden = false; done.hidden = true; setStep(0); });
  setStep(0);
})();
