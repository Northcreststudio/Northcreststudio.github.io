/* Bett-N-Court Roofs — 4-step quote wizard (modal) */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // TODO: connect form. Preview only: nothing is sent while ENDPOINT is empty.
  // At launch, set ENDPOINT to a form service that emails Bett-N-Court Roofs (e.g. a free Formspree
  // or Web3Forms endpoint) and confirm it accepts file uploads for the optional roof photos.
  var ENDPOINT = '';

  var modal = $('#quote');
  var panel = $('.qw__panel', modal);
  var form = $('.qw__form', modal);
  var steps = $$('.qw__step', modal);
  var done = $('.qw__done', modal);
  var back = $('[data-back]', modal), next = $('[data-next]', modal), submit = $('[data-submit]', modal);
  var bar = $('.qw__bar', modal), barFill = $('.qw__bar i', modal), count = $('.qw__count b', modal);
  var step = 0, opener = null;

  /* ---------- open / close ---------- */
  function open(preset, from) {
    opener = from || document.activeElement;
    form.hidden = false; done.hidden = true; $('.qw__progress', modal).hidden = false;
    if (preset) $$('input[name="service"]', form).forEach(function (c) { if (c.value === preset) c.checked = true; });
    show(0);
    modal.hidden = false;
    document.documentElement.classList.add('qw-open');
    if (!reduce && window.gsap) gsap.from(panel, { y: 24, opacity: 0, duration: 0.35, ease: 'power2.out' });
    panel.focus();
  }
  function close() {
    modal.hidden = true;
    document.documentElement.classList.remove('qw-open');
    if (opener && opener.focus) opener.focus();
  }
  $$('[data-quote]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); open(b.getAttribute('data-quote'), b); });
  });
  $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') { // focus trap
      var f = $$('button, [href], input, select, textarea', panel).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- steps ---------- */
  function show(i) {
    step = i;
    steps.forEach(function (s, n) { s.classList.toggle('is-on', n === i); });
    count.textContent = i + 1;
    barFill.style.width = ((i + 1) / steps.length * 100) + '%';
    bar.setAttribute('aria-valuenow', String(i + 1));
    back.hidden = i === 0; next.hidden = i === steps.length - 1; submit.hidden = i !== steps.length - 1;
    panel.scrollTop = 0;
    if (!reduce && window.gsap) gsap.from(steps[i], { x: 20, opacity: 0, duration: 0.3, ease: 'power2.out' });
  }

  /* ---------- validation ---------- */
  function err(name, on) {
    var p = $('[data-err="' + name + '"]', form);
    if (p) p.hidden = !on;
    var field = form.elements[name];
    if (field && field.tagName) field.setAttribute('aria-invalid', on ? 'true' : 'false');
    if (field && field.tagName && on) field.setAttribute('aria-describedby', p ? (p.id || (p.id = 'err-' + name)) : '');
    return !on;
  }
  function checked(name) { return !!form.querySelector('input[name="' + name + '"]:checked'); }
  function validate(i) {
    var ok = true, v;
    if (i === 0) ok = err('service', !checked('service')) && ok;
    if (i === 1) { ok = err('size', !checked('size')) && ok; ok = err('timeline', !checked('timeline')) && ok; }
    if (i === 2) ok = err('location', form.elements.location.value.trim().length < 2) && ok;
    if (i === 3) {
      ok = err('name', form.elements.name.value.trim().length < 2) && ok;
      v = form.elements.phone.value.replace(/\D/g, '');
      ok = err('phone', v.length < 10) && ok;
      ok = err('email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.elements.email.value.trim())) && ok;
      ok = err('contact_method', !checked('contact_method')) && ok;
    }
    if (!ok) { var first = $('[data-err]:not([hidden])', steps[i]); if (first) { var f = first.closest('.fld'); (f ? $('input,select,textarea', f) : steps[i].querySelector('input')).focus(); } }
    return ok;
  }
  // clear errors as people fix them
  form.addEventListener('change', function (e) { if (e.target.name) err(e.target.name, false); });
  form.addEventListener('input', function (e) { if (e.target.name && e.target.getAttribute('aria-invalid') === 'true') err(e.target.name, false); });

  next.addEventListener('click', function () { if (validate(step)) show(step + 1); });
  back.addEventListener('click', function () { show(step - 1); });

  /* ---------- photo previews ---------- */
  var photos = form.elements.photos, thumbs = $('.thumbs', form);
  photos.addEventListener('change', function () {
    thumbs.innerHTML = '';
    Array.prototype.slice.call(photos.files, 0, 6).forEach(function (file) {
      var img = document.createElement('img'); img.alt = 'Selected photo: ' + file.name; img.src = URL.createObjectURL(file); thumbs.appendChild(img);
    });
  });

  /* ---------- submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(step)) return;
    var data = new FormData(form);
    var finish = function () {
      form.hidden = true; $('.qw__progress', modal).hidden = true; done.hidden = false; done.focus();
      form.reset(); thumbs.innerHTML = '';
    };
    if (!ENDPOINT) { submit.disabled = true; setTimeout(function () { submit.disabled = false; finish(); }, 400); return; }
    submit.disabled = true;
    fetch(ENDPOINT, { method: 'POST', body: data, mode: 'no-cors' }).then(finish, finish).finally(function () { submit.disabled = false; });
  });
})();
