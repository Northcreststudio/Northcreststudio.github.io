/* StarEdge Builders — nav, sticky header, GSAP animations, lightbox */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header shadow ---------- */
  var hdr = $('#hdr');
  var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 10); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('.hdr__menu');
  var mnav = $('#mnav');
  menuBtn.addEventListener('click', function () {
    var open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', String(open));
    mnav.hidden = !open;
  });
  mnav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { menuBtn.setAttribute('aria-expanded', 'false'); mnav.hidden = true; }
  });

  /* ---------- GSAP + ScrollTrigger (skipped entirely when motion is reduced) ---------- */
  if (!reduce && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'power2.out', duration: 0.6 });

    // Hero entrance
    gsap.from('[data-hero]', { y: 30, opacity: 0, stagger: 0.1, delay: 0.05 });

    // Sections fade + slide up 30px
    $$('[data-anim]').forEach(function (el) {
      gsap.from(el, { y: 30, opacity: 0, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    // Cards, list items and gallery stagger 0.1s apart
    $$('[data-stagger]').forEach(function (group) {
      gsap.from(group.children, { y: 30, opacity: 0, stagger: 0.1, scrollTrigger: { trigger: group, start: 'top 88%', once: true } });
    });

    // Subtle hero parallax
    var heroImg = $('.hero__img');
    if (heroImg) {
      gsap.fromTo(heroImg, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  /* ---------- Lightbox for the work gallery ---------- */
  var items = $$('[data-lightbox]');
  if (items.length) {
    var lb = document.createElement('div');
    lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<button type="button" aria-label="Close photo">×</button><figure><img alt=""><p></p></figure>';
    document.body.appendChild(lb);
    var lbImg = $('img', lb), lbCap = $('p', lb), lbClose = $('button', lb), opener = null;
    var close = function () { lb.hidden = true; document.documentElement.classList.remove('qw-open'); if (opener) opener.focus(); };
    items.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); opener = a;
        lbImg.src = a.getAttribute('href'); lbImg.alt = $('img', a).alt; lbCap.textContent = a.getAttribute('data-caption') || '';
        lb.hidden = false; document.documentElement.classList.add('qw-open'); lbClose.focus();
        if (!reduce && window.gsap) gsap.from(lbImg, { scale: 0.96, opacity: 0, duration: 0.35 });
      });
    });
    lbClose.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { e.preventDefault(); lbClose.focus(); } // single control: keep focus on it
    });
  }
})();
