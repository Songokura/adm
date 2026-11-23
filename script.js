(function () {
  'use strict';
  var VER = (function () { var s = document.currentScript; var m = s && s.src.match(/[?&]v=([^&]+)/); return m ? m[1] : ''; })();
  var WA = 'https://wa.me/77775639425';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var hasGsap = !!window.gsap;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger); else hasGsap = false;
  document.documentElement.classList.add('js');

  /* ---------- язык ---------- */
  var i18nEls = $$('[data-i18n]'), ariaEls = $$('[data-i18n-aria]'), waEls = $$('.js-wa');
  var RU = {}, RUA = {}, lang = 'ru';
  i18nEls.forEach(function (e) { var k = e.getAttribute('data-i18n'); if (!(k in RU)) RU[k] = e.innerHTML; });
  ariaEls.forEach(function (e) { RUA[e.getAttribute('data-i18n-aria')] = e.getAttribute('aria-label'); });
  var FORM_RU = { head: 'Здравствуйте! Заявка с сайта ADM.', name: 'Имя', phone: 'Телефон', what: 'Что требуется' };
  function dict() { return lang === 'kk' ? (window.SITE_KK || {}) : {}; }
  function tr(k, fallback) { var d = dict(); return d[k] || fallback; }
  function setWa() {
    waEls.forEach(function (a) {
      var t = tr(a.getAttribute('data-wa'), a.getAttribute('data-wa-text'));
      a.href = WA + '?text=' + encodeURIComponent(t);
    });
  }
  function applyLang() {
    i18nEls.forEach(function (e) { var k = e.getAttribute('data-i18n'); e.innerHTML = tr(k, RU[k]); });
    ariaEls.forEach(function (e) { var k = e.getAttribute('data-i18n-aria'); e.setAttribute('aria-label', tr(k, RUA[k])); });
    document.documentElement.lang = lang;
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    setWa(); if (typeof liveRender === 'function') liveRender();
    if (hasGsap) ScrollTrigger.refresh();
  }
  function loadKk(cb) {
    var s = document.createElement('script');
    s.src = 'assets/lang/kk.js' + (VER ? '?v=' + VER : '');
    s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }
  function setLang(l, save) {
    if (save) { try { localStorage.setItem('adm-lang', l); } catch (e) {} }
    if (l === 'kk' && !window.SITE_KK) { loadKk(function () { lang = 'kk'; applyLang(); }); return; }
    lang = l; applyLang();
  }
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); }); });
  setWa();

  /* ---------- плавная прокрутка ---------- */
  var lenis = null;
  if (window.Lenis && !RM) {
    lenis = new Lenis({ lerp: 0.12 });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  var hdr = $('#hdr');
  function hdrH() { return hdr.offsetHeight; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href'); if (id.length < 2) return;
    var t = document.querySelector(id); if (!t) return;
    e.preventDefault(); closeMenu();
    if (id === '#top') { if (lenis) lenis.scrollTo(0, { duration: 1.1 }); else window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); }
    else {
      var y = t.getBoundingClientRect().top + window.scrollY - hdrH() - 16;
      if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
    }
    history.replaceState(null, '', id);
  });
  function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- меню ---------- */
  var burger = $('.burger'), mmenu = $('#mmenu');
  function closeMenu() { if (!mmenu || mmenu.hidden) return; mmenu.hidden = true; burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); if (lenis) lenis.start(); }
  if (burger) burger.addEventListener('click', function () {
    if (!mmenu.hidden) return closeMenu();
    mmenu.hidden = false; burger.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open'); if (lenis) lenis.stop();
    if (hasGsap && !RM) gsap.from('.mmenu-nav a, .mmenu-btns .pill', { y: 18, opacity: 0, duration: 0.35, ease: 'power2.out', stagger: 0.03 });
  });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- за окном: погода Астаны и часы работы ---------- */
  var WX = null;
  var LIVE_RU = { cold: 'В такую погоду продувание заметнее всего - приедем в день обращения.', warm: 'Удобное время отрегулировать окна и заменить уплотнитель до холодов.', open: 'Принимаем заявки до 20:00', closed: 'Начинаем работу в 9:00' };
  function liveRender() {
    var t = $('.temp'), lv = $('.live'); if (!lv) return;
    var now = new Date(), h = (now.getUTCHours() + 5) % 24, open = h >= 9 && h < 20;
    var msg = tr('live.' + (open ? 'open' : 'closed'), LIVE_RU[open ? 'open' : 'closed']);
    if (WX) {
      var cold = WX.t <= 3 || WX.w >= 7;
      msg += '. ' + tr('live.' + (cold ? 'cold' : 'warm'), LIVE_RU[cold ? 'cold' : 'warm']);
      $('.temp-v', t).textContent = (WX.t > 0 ? '+' : WX.t < 0 ? '−' : '') + Math.abs(WX.t) + '° · ' + tr('w.wind', 'ветер') + ' ' + WX.w + ' ' + tr('w.ms', 'м/с');
      t.hidden = false;
    }
    lv.classList.toggle('closed', !open);
    $('.live-t', lv).textContent = msg;
    lv.hidden = false;
  }
  (function weather() {
    liveRender();
    if (!window.fetch) return;
    var ctl = window.AbortController ? new AbortController() : null;
    if (ctl) setTimeout(function () { ctl.abort(); }, 5000);
    fetch('https://api.open-meteo.com/v1/forecast?latitude=51.17&longitude=71.45&current=temperature_2m,wind_speed_10m&wind_speed_unit=ms', ctl ? { signal: ctl.signal } : {})
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (!d || !d.current) return; WX = { t: Math.round(d.current.temperature_2m), w: Math.round(d.current.wind_speed_10m) }; liveRender(); })
      .catch(function () {});
  })();

  /* ---------- окно героя: верхняя створка откидывается ---------- */
  (function tilt() {
    var sash = $('.s-top'), hero = $('.hero'); if (!sash || RM) return;
    var cur = 0, want = -7, raf = null;
    function calc() { var p = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.7))); want = -7 - 11 * p; if (!raf) raf = requestAnimationFrame(step); }
    function step() { cur += (want - cur) * 0.12; sash.style.setProperty('--tilt', cur.toFixed(2) + 'deg'); raf = Math.abs(want - cur) > 0.05 ? requestAnimationFrame(step) : null; }
    window.addEventListener('scroll', calc, { passive: true });
    window.addEventListener('load', function () { setTimeout(calc, 500); });
  })();

  /* ---------- счётчики ---------- */
  function counters() {
    if (!hasGsap || RM) return;
    $$('.num[data-count]').forEach(function (el) {
      var end = +el.getAttribute('data-count'), o = { v: 0 };
      function fmt(n) { var s = String(Math.round(n)); return end >= 5000 || end === 2980 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s; }
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () { gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', onUpdate: function () { el.textContent = fmt(o.v); } }); } });
    });
  }

  /* ---------- появление ---------- */
  function reveals() {
    if (!hasGsap || RM) return;
    gsap.from('.hero-txt > *', { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' });
    gsap.from('.win', { y: 40, opacity: 0, duration: 1.1, delay: 0.25, ease: 'power3.out', clearProps: 'transform,opacity' });
    var els = $$('.fix, .more, .price, .tile, .nums > div, .case, .why-c, .biz, .steps li, .form, .ct-list > div');
    els.forEach(function (e) { e.classList.add('rv'); });
    ScrollTrigger.batch(els, {
      start: 'top 92%', once: true,
      onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, onComplete: function () { b.forEach(function (e) { e.classList.remove('rv'); e.style.transform = ''; e.style.opacity = ''; }); } }); }
    });
  }

  /* ---------- объекты: лента, стрелки, шторка ---------- */
  (function cases() {
    var box = $('.cases'); if (!box) return;
    $$('.cmp-r', box).forEach(function (r) {
      var cmp = r.parentNode;
      r.addEventListener('input', function () { r.touched = true; cmp.style.setProperty('--p', r.value + '%'); });
      /* шторка пальцем и мышью по всему кадру: свайп вбок двигает, вертикальный - листает страницу */
      var drag = false, sx = 0, sy = 0, decided = false;
      function setX(x) { var b = cmp.getBoundingClientRect(), v = Math.max(0, Math.min(100, (x - b.left) / b.width * 100)); r.touched = true; r.value = v; cmp.style.setProperty('--p', v + '%'); }
      cmp.addEventListener('pointerdown', function (e) { drag = true; decided = e.pointerType === 'mouse'; sx = e.clientX; sy = e.clientY; if (decided) { setX(e.clientX); cmp.setPointerCapture(e.pointerId); } });
      cmp.addEventListener('pointermove', function (e) {
        if (!drag) return;
        if (!decided) { var dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy); if (dx < 6 && dy < 6) return; if (dy > dx) { drag = false; return; } decided = true; try { cmp.setPointerCapture(e.pointerId); } catch (er) {} }
        setX(e.clientX);
      });
      function end(e) { if (drag && !decided && e.type === 'pointerup') setX(e.clientX); drag = false; }
      cmp.addEventListener('pointerup', end); cmp.addEventListener('pointercancel', end);
    });
    if (!hasGsap || RM || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var cmp = e.target, r = $('.cmp-r', cmp), o = { v: 92 };
        gsap.to(o, { v: 50, duration: 1.5, delay: 0.3, ease: 'power2.inOut', onUpdate: function () { if (r.touched) return; cmp.style.setProperty('--p', o.v + '%'); r.value = o.v; } });
      });
    }, { threshold: 0.5 });
    $$('.cmp', box).forEach(function (c) { io.observe(c); });
  })();

  /* ---------- форма ---------- */
  (function form() {
    var f = $('.form'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.elements.name, phone = f.elements.phone, what = f.elements.what, ok = true;
      [name, phone].forEach(function (x) { var bad = x === phone ? x.value.replace(/\D/g, '').length < 10 : !x.value.trim(); x.parentNode.classList.toggle('err', bad); if (bad && ok) { x.focus(); ok = false; } });
      if (!ok) return;
      var txt = tr('f.wa.head', FORM_RU.head) + ' ' + tr('f.name', FORM_RU.name) + ': ' + name.value.trim() + '. ' + tr('f.phone', FORM_RU.phone) + ': ' + phone.value.trim() + '.';
      if (what.value.trim()) txt += ' ' + tr('f.wa.what', FORM_RU.what) + ': ' + what.value.trim();
      window.open(WA + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      $('.form-ok', f).hidden = false;
    });
  })();

  /* ---------- запуск ---------- */
  
  function boot() {
    var qs = new URLSearchParams(location.search).get('lang'), saved = null;
    try { saved = localStorage.getItem('adm-lang'); } catch (e) {}
    var want = qs === 'kk' || qs === 'ru' ? qs : (saved === 'kk' ? 'kk' : 'ru');
    var go = function () { reveals(); counters(); if (hasGsap) ScrollTrigger.refresh(); };
    if (want === 'kk') loadKk(function () { if (window.SITE_KK) { lang = 'kk'; applyLang(); } go(); });
    else go();
  }
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var booted = false;
  function once() { if (booted) return; booted = true; boot(); }
  fontsReady.then(once); setTimeout(once, 1500);
  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
