/* DERMAMETHOD Skin Clinic — redesign preview */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DATA = JSON.parse($('#dm-data').textContent);

  /* ---------- Top bar border once scrolled ---------- */
  var bar = $('#bar');
  var onScroll = function () { bar.classList.toggle('is-stuck', window.scrollY > 40); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Open-now badge, from the clinic's hours in Calgary time ---------- */
  // day: 0 = Sunday … 6 = Saturday; [open hour, close hour] in 24h
  var HOURS = { 0: [9, 21], 1: [10, 19], 2: [9, 21], 3: [9, 21], 4: [9, 21], 5: [9, 21], 6: [10, 19] };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function calgaryNow() {
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Edmonton', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day: day, mins: Number(get('hour')) * 60 + Number(get('minute')) };
  }
  function fmt(h) { return (h % 12 || 12) + ' ' + (h < 12 ? 'AM' : 'PM'); }
  function statusText() {
    var now = calgaryNow();
    var today = HOURS[now.day];
    if (now.mins >= today[0] * 60 && now.mins < today[1] * 60) return { open: true, text: 'Open now · Closes at ' + fmt(today[1]) };
    if (now.mins < today[0] * 60) return { open: false, text: 'Closed · Opens today at ' + fmt(today[0]) };
    var next = (now.day + 1) % 7;
    return { open: false, text: 'Closed · Opens tomorrow at ' + fmt(HOURS[next][0]) };
  }
  function paintStatus() {
    var s = statusText();
    $$('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      $('.status__text', el).textContent = s.text;
    });
    var d = calgaryNow().day;
    $$('.hours tr').forEach(function (tr) { tr.classList.toggle('is-today', Number(tr.getAttribute('data-day')) === d); });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !still) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = $$('.bar__nav a');
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['finder', 'menu', 'practitioners', 'visit'].forEach(function (id) { navIO.observe(document.getElementById(id)); });
  }

  /* ---------- Treatment menu: tabs, concern filters, expanding rows ---------- */
  var items = $$('.item');
  var groups = $$('.menu__group');
  var tabs = $$('.tab');
  var chips = $$('.chip');
  var emptyMsg = $('.menu__empty');
  var state = { cat: 'all', concern: null };

  function applyFilters() {
    var shown = 0;
    items.forEach(function (it) {
      var okCat = state.cat === 'all' || it.getAttribute('data-cat') === state.cat;
      var okCon = !state.concern || (' ' + it.getAttribute('data-concerns') + ' ').indexOf(' ' + state.concern + ' ') > -1;
      var show = okCat && okCon;
      it.classList.toggle('is-hidden', !show);
      if (show) shown++;
    });
    groups.forEach(function (g) {
      g.classList.toggle('is-hidden', !$$('.item:not(.is-hidden)', g).length);
    });
    emptyMsg.hidden = shown > 0;
  }
  function setTab(cat) {
    state.cat = cat;
    tabs.forEach(function (t) { var on = t.getAttribute('data-tab') === cat; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', String(on)); });
    applyFilters();
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { setTab(t.getAttribute('data-tab')); }); });
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var k = c.getAttribute('data-concern');
      state.concern = state.concern === k ? null : k;
      chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-concern') === state.concern)); });
      applyFilters();
    });
  });
  $('[data-clear]').addEventListener('click', function () {
    state.concern = null;
    chips.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
    setTab('all');
  });

  function setOpen(it, open) {
    it.classList.toggle('is-open', open);
    $('.item__head', it).setAttribute('aria-expanded', String(open));
  }
  items.forEach(function (it) {
    $('.item__head', it).addEventListener('click', function () { setOpen(it, !it.classList.contains('is-open')); });
  });

  // Open a treatment from elsewhere on the page (quiz results, practitioner links)
  function focusTreatment(id, cat) {
    state.concern = null;
    chips.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
    setTab(cat || 'all');
    var it = document.getElementById('t-' + id);
    if (!it) return;
    setOpen(it, true);
    it.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
    it.classList.remove('is-flash'); void it.offsetWidth; it.classList.add('is-flash');
  }
  $$('[data-open-cat]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      setTab(a.getAttribute('data-open-cat'));
      document.getElementById('menu').scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Skin concern finder ---------- */
  var quiz = $('.quiz');
  var steps = $$('.quiz__step', quiz);
  var dots = $$('.finder__steps li');
  var pick = { concern: null, who: null };
  var LABEL = {};
  $$('.opt[data-concern]', quiz).forEach(function (b) { LABEL[b.getAttribute('data-concern')] = $('.opt__t', b).textContent; });

  function showStep(n) {
    steps.forEach(function (s) {
      var on = Number(s.getAttribute('data-step')) === n;
      s.hidden = !on;
      s.classList.toggle('is-on', on);
    });
    dots.forEach(function (d) { d.classList.toggle('is-on', Number(d.getAttribute('data-dot')) <= n); });
    var first = $('.quiz__step[data-step="' + n + '"] button', quiz);
    if (first && document.activeElement && quiz.contains(document.activeElement)) first.focus({ preventScroll: true });
  }

  function results() {
    var ids = DATA.picks[pick.concern] || [];
    var byWho = ids.filter(function (id) { return pick.who === 'any' || DATA.t[id].who === pick.who; });
    var list = byWho.slice(0, 3);
    var note = '';
    if (!list.length) {
      // nothing for that practitioner and concern: show the other practitioner's matches and say so
      list = ids.slice(0, 3);
      if (pick.who === 'm') note = 'Dr. Mankaeva has a special interest in skin health and acne. For this concern, these treatments are with Violeta, or <a href="' + DATA.book + '" target="_blank" rel="noopener">book a consultation</a> to talk it through.';
      else note = 'Volume and contour treatments are medical injectables with Dr. Mankaeva, MD.';
    }
    $('.quiz__sub', quiz).textContent = 'For ' + LABEL[pick.concern].toLowerCase() + (pick.who === 'v' ? ', with Violeta' : pick.who === 'm' ? ', with Dr. Mankaeva' : '') + '.';
    var ul = $('.recs', quiz);
    ul.innerHTML = '';
    list.forEach(function (id) {
      var t = DATA.t[id];
      var li = document.createElement('li');
      var meta = [t.time, t.price].filter(Boolean).join(' · ');
      li.innerHTML =
        '<img class="rec__img" alt="" width="72" height="72">' +
        '<p class="rec__name"></p>' +
        '<p class="rec__meta"><b></b> · <span class="rec__mt"></span> · <a href="#t-' + id + '" class="rec__more">Details</a></p>' +
        '<a class="btn btn--ink rec__book" target="_blank" rel="noopener">Book<span class="sr"> (opens Square booking)</span></a>';
      $('.rec__img', li).src = t.img;
      $('.rec__name', li).textContent = t.name;
      $('.rec__meta b', li).textContent = t.who === 'm' ? 'Dr. Mankaeva' : 'Violeta';
      $('.rec__mt', li).textContent = meta;
      $('.rec__book', li).href = t.url;
      $('.rec__more', li).addEventListener('click', function (e) { e.preventDefault(); focusTreatment(id); });
      ul.appendChild(li);
    });
    $('.quiz__note', quiz).innerHTML = note || (pick.concern !== 'relax' && pick.who !== 'm' ? 'New here? All facials include a complimentary skin analysis, and new clients get 10% off.' : 'New clients get 10% off their first treatment, with a complimentary consultation.');
  }

  $$('.opt[data-concern]', quiz).forEach(function (b) {
    b.addEventListener('click', function () {
      pick.concern = b.getAttribute('data-concern');
      if (pick.concern === 'relax') { pick.who = 'v'; results(); showStep(3); return; } // relaxation facials are all with Violeta
      showStep(2);
    });
  });
  $$('.opt[data-who]', quiz).forEach(function (b) {
    b.addEventListener('click', function () { pick.who = b.getAttribute('data-who'); results(); showStep(3); });
  });
  $('[data-back="1"]', quiz).addEventListener('click', function () { showStep(1); });
  $('[data-restart]', quiz).addEventListener('click', function () { pick = { concern: null, who: null }; showStep(1); });
})();
