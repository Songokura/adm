(function () {
  'use strict';
  var VER = (function () { var s = document.currentScript; var m = s && s.src.match(/[?&]v=([^&]+)/); return m ? m[1] : ''; })();
  var WA = 'https://wa.me/77775639425';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'power3.out';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var hasGsap = !!window.gsap;
  if (hasGsap) { gsap.registerPlugin(ScrollTrigger); if (window.SplitText) gsap.registerPlugin(SplitText); }

  /* ---------- бегущая строка: шаг цикла - одна копия ---------- */
  var mqTrack = $('.mq-track'), mqSet = $('.mq-set');
  if (mqTrack && mqSet) {
    for (var c = 0; c < 3; c++) mqTrack.appendChild(mqSet.cloneNode(true));
  }
  function mqSize() { if (mqSet) mqTrack.style.setProperty('--mqw', mqSet.getBoundingClientRect().width + 'px'); }

  /* ---------- язык ---------- */
  var i18nEls = $$('[data-i18n]'), ariaEls = $$('[data-i18n-aria]'), waEls = $$('.js-wa');
  var RU = {}, RUA = {}, splits = [], lang = 'ru';
  i18nEls.forEach(function (e) { var k = e.getAttribute('data-i18n'); if (!(k in RU)) RU[k] = e.innerHTML; });
  ariaEls.forEach(function (e) { RUA[e.getAttribute('data-i18n-aria')] = e.getAttribute('aria-label'); });
  var FORM_RU = { head: 'Здравствуйте! Заявка с сайта ADM Service.', name: 'Имя', phone: 'Телефон', what: 'Что требуется' };
  function dict() { return lang === 'kk' ? (window.SITE_KK || {}) : {}; }
  function tr(k, fallback) { var d = dict(); return d[k] || fallback; }
  function setWa() {
    waEls.forEach(function (a) {
      var t = tr(a.getAttribute('data-wa'), a.getAttribute('data-wa-text'));
      a.href = WA + '?text=' + encodeURIComponent(t);
    });
  }
  function applyLang() {
    splits.forEach(function (s) { try { s.revert(); } catch (e) {} }); splits = [];
    i18nEls.forEach(function (e) { var k = e.getAttribute('data-i18n'); e.innerHTML = tr(k, RU[k]); });
    ariaEls.forEach(function (e) { var k = e.getAttribute('data-i18n-aria'); e.setAttribute('aria-label', tr(k, RUA[k])); });
    document.documentElement.lang = lang;
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    setWa(); mqSize();
    if (hasGsap) ScrollTrigger.refresh();
  }
  function setLang(l, save) {
    if (save) { try { localStorage.setItem('adm-lang', l); } catch (e) {} }
    if (l === 'kk' && !window.SITE_KK) {
      var s = document.createElement('script');
      s.src = 'assets/lang/kk.js' + (VER ? '?v=' + VER : '');
      s.onload = function () { lang = 'kk'; applyLang(); };
      document.head.appendChild(s);
      return;
    }
    lang = l; applyLang();
  }
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); }); });
  setWa();

  /* ---------- плавная прокрутка ---------- */
  var lenis = null;
  if (window.Lenis && !RM) {
    lenis = new Lenis({ lerp: 0.11 });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  function hdrH() { return $('#hdr').offsetHeight; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href'); if (id.length < 2) return;
    var t = document.querySelector(id); if (!t) return;
    e.preventDefault(); closeMenu();
    var trg = t.querySelector('.head, .h2, .kicker') || t;
    if (id === '#top') trg = 0;
    if (lenis) lenis.scrollTo(trg, { offset: trg === 0 ? 0 : -hdrH() - 20, duration: 1.1 });
    else if (trg === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: trg.getBoundingClientRect().top + window.scrollY - hdrH() - 20, behavior: RM ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });

  /* ---------- меню ---------- */
  var burger = $('.burger'), mmenu = $('#mmenu');
  function closeMenu() { if (!mmenu || mmenu.hidden) return; mmenu.hidden = true; burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); if (lenis) lenis.start(); }
  if (burger) burger.addEventListener('click', function () {
    if (!mmenu.hidden) return closeMenu();
    mmenu.hidden = false; burger.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open'); if (lenis) lenis.stop();
    if (hasGsap && !RM) gsap.from('.mmenu-nav a, .mmenu-btns .btn', { y: 24, opacity: 0, duration: 0.4, ease: EASE, stagger: 0.04 });
  });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- движок линий ветра ---------- */
  function Flow(canvas, opt) {
    var ctx = canvas.getContext('2d'), W = 0, H = 0, dpr = 1, parts = [], t = 0, i;
    for (i = 0; i < opt.count; i++) parts.push({ dead: true, h: [] });
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (opt.onsize) opt.onsize(W, H);
    }
    function step(draw) {
      t += 1 / 60;
      var k = opt.intensity ? opt.intensity() : 1, p, n, a, j, c0, c1;
      if (draw) ctx.clearRect(0, 0, W, H);
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        if (p.dead) {
          if (Math.random() < opt.rate * k) { p.dead = false; p.dying = false; p.h.length = 0; p.life = 0; p.seed = Math.random() * 6.283; p.w = opt.w[0] + Math.random() * (opt.w[1] - opt.w[0]); p.vx = 0; p.vy = 0; opt.spawn(p, W, H, t === 1 / 60 || p.first === undefined); p.first = false; p.h.push(p.x, p.y); }
          continue;
        }
        if (!p.dying) {
          opt.field(p, t, W, H);
          p.x += p.vx; p.y += p.vy; p.life++;
          p.h.push(p.x, p.y);
          if (p.h.length > opt.hist * 2) p.h.splice(0, 2);
          if (p.life > p.max || p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) p.dying = true;
        } else {
          p.h.splice(0, 6);
          if (p.h.length < 4) { p.dead = true; continue; }
        }
        if (!draw) continue;
        n = p.h.length / 2;
        a = Math.min(1, p.life / 14) * (opt.fadeWithK ? Math.max(k, 0.0) : 1) * (opt.env ? Math.pow(Math.max(0, 1 - p.life / p.max), 1.15) : 1);
        if (a <= 0.01 || n < 2) continue;
        ctx.lineWidth = p.w;
        for (j = 0; j < 5; j++) {
          c0 = Math.floor((n - 1) * j / 5); c1 = Math.floor((n - 1) * (j + 1) / 5);
          if (c1 <= c0) continue;
          ctx.strokeStyle = opt.color + (a * opt.alpha * (0.06 + 0.235 * j)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.h[c0 * 2], p.h[c0 * 2 + 1]);
          for (var q = c0 + 1; q <= c1; q++) ctx.lineTo(p.h[q * 2], p.h[q * 2 + 1]);
          ctx.stroke();
        }
      }
      if (draw && opt.after) opt.after(ctx, t, W, H, k);
    }
    size();
    return { step: step, size: size, warm: function (nn) { for (var w = 0; w < nn; w++) step(false); step(true); } };
  }

  /* ---------- герой ---------- */
  var hero = $('.hero');
  var S = { wind: 1 };
  (function heroScene() {
    if (!hero) return;
    var win = $('.win', hero), glass = $('.win-glass', hero), sceneBtn = $('.scene-btn', hero);
    var gap = { x0: 0, y0: 0, x1: 0, y1: 0, s: 1 }, mobile = false;

    var room = Flow($('.wind-room', hero), {
      count: 84, rate: 0.07, hist: 84, w: [1.1, 2.6], color: 'rgba(10,186,181,', alpha: 0.9, fadeWithK: true, env: true,
      intensity: function () { return S.wind; },
      onsize: function () {
        var hr = hero.getBoundingClientRect(), wr = win.getBoundingClientRect(), s = wr.width / 1000;
        gap.s = s; gap.x0 = wr.left - hr.left + 94 * s; gap.y0 = wr.top - hr.top + 64 * s; gap.x1 = wr.left - hr.left + 480 * s; gap.y1 = wr.top - hr.top + 606 * s;
        mobile = window.innerWidth < 900;
      },
      spawn: function (p) {
        var r = Math.random();
        if (r < (mobile ? 0.3 : 0.62)) { p.x = gap.x0; p.y = gap.y0 + Math.random() * (gap.y1 - gap.y0); p.vx = -2; p.vy = (Math.random() - 0.5); p.g = (p.y - (gap.y0 + gap.y1) / 2) / (gap.y1 - gap.y0) * 0.9; }
        else if (r < (mobile ? 0.9 : 0.88)) { p.x = gap.x0 + Math.random() * (gap.x1 - gap.x0); p.y = gap.y1; p.vx = -0.6; p.vy = 1.6; p.g = 0.9; }
        else { p.x = gap.x0 + Math.random() * (gap.x1 - gap.x0) * 0.6; p.y = gap.y0; p.vx = -1; p.vy = -1.2; p.g = -0.8; }
        p.max = 120 + Math.random() * 130;
      },
      field: function (p, t, W) {
        var n = Math.sin(p.y * 0.011 + t * 0.5) + 0.55 * Math.sin(p.x * 0.008 - t * 0.4 + p.y * 0.004) + 0.12 * Math.sin(p.seed + t);
        var age = p.life / p.max, sp = Math.max(2.3, W / 520) * (1.2 - 0.62 * age), tx, ty;
        if (mobile) { tx = sp * (0.42 * n - 0.25); ty = sp * (0.55 + 0.3 * p.g); }
        else { tx = -sp; ty = sp * (0.4 * n + p.g * (1 - age) * 0.9); }
        p.vx += (tx - p.vx) * 0.05; p.vy += (ty - p.vy) * 0.05;
      }
    });

    var flakes = [];
    var out = Flow($('.wind-out', hero), {
      count: 34, rate: 0.1, hist: 46, w: [1, 2], color: 'rgba(127,227,223,', alpha: 0.6,
      onsize: function (W, H) {
        flakes = []; for (var f = 0; f < 90; f++) flakes.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.8, s: 0.5 + Math.random(), ph: Math.random() * 6.28 });
      },
      spawn: function (p, W, H) { p.x = p.first === undefined ? Math.random() * W : W + 20; p.y = Math.random() * H * 0.92; p.max = 400; },
      field: function (p, t, W) {
        var sp = W / 150 * (0.8 + 0.4 * Math.sin(p.seed * 3));
        var n = Math.sin(p.x * 0.014 + t * 1.3 + p.seed) + 0.5 * Math.sin(p.x * 0.03 - t * 2 + p.seed * 2);
        p.vx += (-sp - p.vx) * 0.08; p.vy += (sp * 0.34 * n + 0.12 - p.vy) * 0.08;
      },
      after: function (ctx, t, W, H) {
        ctx.fillStyle = 'rgba(240,248,250,.9)';
        var gust = 1 + 0.35 * Math.sin(t * 0.7);
        for (var f = 0; f < flakes.length; f++) {
          var k = flakes[f];
          k.x -= (1.6 + k.s * 2.4) * gust * W / 620; k.y += (0.5 + k.s * 0.9) * W / 620 + Math.sin(t * 2 + k.ph) * 0.3;
          if (k.x < -6) { k.x = W + 6; k.y = Math.random() * H; } if (k.y > H + 6) { k.y = -6; k.x = Math.random() * W; }
          ctx.globalAlpha = 0.35 + 0.5 * k.s / 1.5;
          ctx.beginPath(); ctx.ellipse(k.x, k.y, k.r * 1.9, k.r, -0.35, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    });

    /* штора */
    var NF = 10, CH = 834, X0 = 22, DX = 15, bandsG = $('.cur-bands', hero), foldsG = $('.cur-folds', hero), edge = $('.cur-edge', hero), bands = [], folds = [];
    var NS = 'http://www.w3.org/2000/svg';
    for (var b = 0; b < NF - 1; b++) { var bp = document.createElementNS(NS, 'path'); bp.setAttribute('fill', b % 2 ? '#e3ebee' : 'url(#tul)'); bp.setAttribute('fill-opacity', b % 2 ? '.9' : '.96'); bandsG.appendChild(bp); bands.push(bp); }
    for (var f2 = 1; f2 < NF - 1; f2++) { var fp = document.createElementNS(NS, 'path'); foldsG.appendChild(fp); folds.push(fp); }
    function curtain(t, wind) {
      var pts = [], i, j, yy, y, x, hem, lean, wave, d, top = 14;
      for (i = 0; i < NF; i++) {
        var row = [], fi = i / (NF - 1);
        hem = CH - (i % 2 ? 9 : 0) - wind * (8 + 34 * fi) * (0.72 + 0.28 * Math.sin(t * 2.4 + i));
        for (j = 0; j <= 16; j++) {
          yy = j / 16; y = top + (hem - top) * yy;
          lean = -wind * 96 * Math.pow(yy, 1.7) * (0.78 + 0.22 * Math.sin(t * 1.3));
          wave = (1.6 + wind * 13) * yy * Math.sin(t * (1 + wind * 2.3) - yy * 4.4 + i * 0.85);
          x = X0 + DX * i * (1 + (0.16 + 0.62 * wind) * yy) + (i % 2 ? 3.5 : 0) * yy + lean + wave;
          row.push(x.toFixed(1) + ' ' + y.toFixed(1));
        }
        pts.push(row);
      }
      for (i = 0; i < NF - 1; i++) bands[i].setAttribute('d', 'M' + pts[i].join('L') + 'L' + pts[i + 1].slice().reverse().join('L') + 'Z');
      for (i = 1; i < NF - 1; i++) folds[i - 1].setAttribute('d', 'M' + pts[i].join('L'));
      d = 'M' + pts[0].join('L'); for (i = 1; i < NF; i++) d += 'L' + pts[i][16];
      d += 'L' + pts[NF - 1].slice().reverse().join('L') + 'Z';
      edge.setAttribute('d', d);
    }
    var leaves = $$('.plant .lf', hero);
    function plant(t, wind) {
      for (var i = 0; i < leaves.length; i++) leaves[i].style.transform = 'rotate(' + ((0.8 + wind * 5) * Math.sin(t * (1.4 + wind * 3) + i * 1.3) - wind * 5).toFixed(2) + 'deg)';
    }

    /* параллакс планов города */
    var plx = $$('.plx', hero), mx = 0, my = 0, cx = 0, cy = 0;
    hero.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; });

    var running = false, t0 = 0, visible = true;
    function loop(now) {
      if (!running) return;
      var t = now / 1000;
      room.step(true); out.step(true);
      curtain(t, S.wind); plant(t, S.wind);
      cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
      for (var i = 0; i < plx.length; i++) { var dpt = +plx[i].getAttribute('data-depth'); plx[i].style.transform = 'translate3d(' + (-cx * dpt).toFixed(2) + 'px,' + (-cy * dpt * 0.4).toFixed(2) + 'px,0)'; }
      requestAnimationFrame(loop);
    }
    function start() { if (running || RM || !visible || document.hidden) return; running = true; hero.classList.remove('is-off'); requestAnimationFrame(loop); }
    function stop() { running = false; hero.classList.add('is-off'); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0.02 }).observe(hero);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { room.size(); out.size(); if (RM) still(); }, 150); });
    function still() { curtain(0.6, S.wind); room.warm(140); out.warm(140); }
    curtain(0, 1);
    if (RM) still(); else { out.warm(60); start(); }
    window.addEventListener('load', function () { room.size(); out.size(); if (RM) still(); });

    /* состояние: до и после ремонта */
    var after = false, manualAt = 0;
    function setState(v, manual) {
      if (v === after) return; after = v;
      if (manual) manualAt = Date.now();
      hero.setAttribute('data-state', v ? 'after' : 'before');
      sceneBtn.setAttribute('aria-pressed', String(v));
      if (hasGsap && !RM) gsap.to(S, { wind: v ? 0 : 1, duration: v ? 1.5 : 1.1, ease: 'power2.out', overwrite: true });
      else { S.wind = v ? 0 : 1; if (RM) still(); }
    }
    sceneBtn.addEventListener('click', function () { setState(!after, true); });
    if (hasGsap && !RM) {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 900px)', function () {
        ScrollTrigger.create({
          trigger: hero, start: function () { return 'top ' + hdrH() + 'px'; }, end: '+=62%', pin: true, anticipatePin: 1,
          onUpdate: function (self) {
            if (Date.now() - manualAt < 2500) return;
            if (self.progress > 0.3 && !after) setState(true); else if (self.progress < 0.08 && after && self.direction < 0) setState(false);
          }
        });
      });
      mm.add('(max-width: 899px)', function () {
        ScrollTrigger.create({ trigger: hero, start: 'top+=120 top', onEnter: function () { setState(true); }, onLeaveBack: function () { if (Date.now() - manualAt > 2500) setState(false); } });
      });
      /* вход */
      gsap.from('.win', { y: 40, opacity: 0, duration: 1.1, ease: EASE, delay: 0.1 });
      gsap.from('.status .st', { y: 20, opacity: 0, duration: 0.6, ease: EASE, stagger: 0.07, delay: 0.5 });
      gsap.from('.hero .kicker, .hero-lead, .hero-btns, .hero-sub', { y: 24, opacity: 0, duration: 0.8, ease: EASE, stagger: 0.07, delay: 0.25 });
    }
  })();

  /* ---------- заголовки: строки из-под маски ---------- */
  function splitHeads() {
    if (!hasGsap || !window.SplitText || RM) return;
    $$('[data-split]').forEach(function (el) {
      var inHero = !!el.closest('.hero');
      if (inHero && window.innerWidth < 900) return;
      var s = SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 108, duration: 1, ease: EASE, stagger: 0.08, delay: inHero ? 0.1 : 0, scrollTrigger: inHero ? null : { trigger: el, start: 'top 88%', once: true } });
        }
      });
      splits.push(s);
    });
  }

  /* ---------- появление блоков ---------- */
  function reveals() {
    if (!hasGsap || RM) return;
    var groups = ['.cards > *', '.price > *', '.pts li', '.rows li', '.ct-list > div, .ct-btns', '.head .lead, .head .kicker', '.co-txt > .lead, .org-txt > .lead'];
    groups.forEach(function (sel) {
      var els = $$(sel); if (!els.length) return;
      gsap.set(els, { opacity: 0, y: 36, transition: 'none' });
      ScrollTrigger.batch(els, {
        start: 'top 90%', once: true,
        onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.07, clearProps: 'transform,opacity,transition' }); }
      });
    });
    $$('.pane img, .om img').forEach(function (img) {
      var fig = img.parentNode, dir = +(fig.getAttribute('data-par') || 0) > 0 ? 1 : -1, r = fig.classList.contains('pane') ? 19 : 15;
      gsap.fromTo(img, { yPercent: dir > 0 ? -r : 0 }, { yPercent: dir > 0 ? 0 : -r, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.from('.co-media', { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: EASE, stagger: 0.12, scrollTrigger: { trigger: '.co-media', start: 'top 80%', once: true } });
    gsap.from('.org-media .om', { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: EASE, stagger: 0.12, scrollTrigger: { trigger: '.org-media', start: 'top 80%', once: true } });
  }

  /* ---------- карточки услуг ---------- */
  (function cards() {
    var cards = $$('.card'); if (!('IntersectionObserver' in window)) return;
    var touch = window.matchMedia('(hover: none)').matches;
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { e.target.classList.toggle('in-view', e.isIntersecting); }); }, { rootMargin: '80px' });
    cards.forEach(function (c) { io.observe(c); });
    if (touch) {
      var io2 = new IntersectionObserver(function (en) { en.forEach(function (e) { e.target.classList.toggle('is-on', e.isIntersecting); }); }, { rootMargin: '-42% 0px -42% 0px' });
      cards.forEach(function (c) { io2.observe(c); });
    }
    var pr = $('.sec-price');
    if (pr) new IntersectionObserver(function (en) { pr.classList.toggle('in-view', en[0].isIntersecting); }).observe(pr);
  })();

  /* ---------- стоимость: счётчик ---------- */
  function counters() {
    if (!hasGsap || RM) return;
    $$('.num[data-count]').forEach(function (el) {
      var end = +el.getAttribute('data-count'), o = { v: 0 };
      function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () { gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = fmt(o.v); } }); } });
    });
  }

  /* ---------- порядок работ: линия успокаивается ---------- */
  function stepsLine() {
    var svg = $('.steps-line'), box = $('.steps'); if (!svg) return;
    var bg = $('.sl-bg', svg), fg = $('.sl-fg', svg), steps = $$('.step'), st = null;
    function build() {
      var W = box.clientWidth; if (!W) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' 120');
      var half = W * 0.2 / 6, d = 'M0 60', x, a;
      for (x = 0; x <= W; x += 4) { a = 46 * Math.pow(1 - x / W, 1.5); d += 'L' + x + ' ' + (60 + a * Math.sin(Math.PI * (x - W * 0.1) / half)).toFixed(1); }
      bg.setAttribute('d', d); fg.setAttribute('d', d);
      var L = fg.getTotalLength(); fg.style.strokeDasharray = L; fg.style.strokeDashoffset = (hasGsap && !RM) ? L : 0;
      return L;
    }
    var L = build();
    if (!hasGsap || RM) { steps.forEach(function (s) { s.classList.add('on'); }); return; }
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      L = build();
      st = ScrollTrigger.create({
        trigger: box, start: 'top 72%', end: 'bottom 62%', scrub: 0.6,
        onUpdate: function (self) {
          var p = self.progress;
          /* длина волны неравномерна по x, поэтому ищем долю длины под нужный x */
          fg.style.strokeDashoffset = L * (1 - p);
          var W = box.clientWidth, px = fg.getPointAtLength(L * p).x / W;
          steps.forEach(function (s, i) { s.classList.toggle('on', px >= 0.1 + 0.2 * i - 0.005); });
        }
      });
      var rz; function onR() { clearTimeout(rz); rz = setTimeout(function () { L = build(); ScrollTrigger.refresh(); }, 200); }
      window.addEventListener('resize', onR);
      return function () { window.removeEventListener('resize', onR); };
    });
    mm.add('(max-width: 899px)', function () {
      steps.forEach(function (s) { ScrollTrigger.create({ trigger: s, start: 'top 70%', onEnter: function () { s.classList.add('on'); }, onLeaveBack: function () { s.classList.remove('on'); } }); });
    });
  }

  /* ---------- объекты: лента, шторка, проявление ---------- */
  (function objects() {
    var view = $('.obj-view'); if (!view) return;
    var track = $('.obj-track', view), cases = $$('.case', view), prev = $('.arr.prev'), next = $('.arr.next'), dots = $$('.obj-dots i'), idx = 0, seen = false;
    $$('.cmp, .side', view).forEach(function (el) { if (!RM) el.classList.add('wipe'); });
    function show(i) {
      var c = cases[i]; if (c.shownOnce) return; c.shownOnce = true;
      $$('.wipe', c).forEach(function (el, n) { setTimeout(function () { el.classList.add('shown'); }, n * 140); });
      var r = $('.cmp-r', c), cmp = $('.cmp', c);
      if (hasGsap && !RM) { var o = { v: 96 }; gsap.to(o, { v: 50, duration: 1.6, delay: 0.5, ease: 'power2.inOut', onUpdate: function () { if (r.touched) return; cmp.style.setProperty('--p', o.v + '%'); r.value = o.v; } }); }
    }
    function go(i) {
      idx = Math.max(0, Math.min(cases.length - 1, i));
      track.style.transform = 'translateX(calc(' + (-idx) + ' * (100% + var(--pad))))';
      prev.disabled = idx === 0; next.disabled = idx === cases.length - 1;
      dots.forEach(function (d, n) { d.classList.toggle('on', n === idx); });
      cases.forEach(function (c, n) { if (n === idx) c.removeAttribute('inert'); else c.setAttribute('inert', ''); });
      if (seen) show(idx);
    }
    prev.addEventListener('click', function () { go(idx - 1); });
    next.addEventListener('click', function () { go(idx + 1); });
    view.addEventListener('keydown', function (e) { if (e.target !== view) return; if (e.key === 'ArrowRight') go(idx + 1); if (e.key === 'ArrowLeft') go(idx - 1); });
    var sx = null, sy = 0;
    view.addEventListener('touchstart', function (e) { if (e.target.closest('.cmp')) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    view.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(idx + (dx < 0 ? 1 : -1)); sx = null; }, { passive: true });
    $$('.cmp-r', view).forEach(function (r) {
      var cmp = r.parentNode;
      r.addEventListener('input', function () { r.touched = true; cmp.style.setProperty('--p', r.value + '%'); });
    });
    go(0);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en, io) { if (en[0].isIntersecting) { seen = true; show(idx); io.disconnect(); } }, { threshold: 0.25 }).observe(view);
    else { seen = true; show(0); }
  })();

  /* ---------- контакты: спокойный поток и форма ---------- */
  (function contacts() {
    var cv = $('.ct-wind'), sec = $('.sec-ct'), form = $('.form');
    if (cv && sec) {
      var flow = Flow(cv, {
        count: 60, rate: 0.05, hist: 60, w: [1, 1.8], color: 'rgba(127,227,223,', alpha: 0.55,
        spawn: function (p, W, H) { p.x = p.first === undefined ? Math.random() * W : -20; p.y = Math.random() * H; p.max = 900; p.vx = 1.5; },
        field: function (p, t, W) { var sp = Math.max(1.6, W / 700); p.vx += (sp - p.vx) * 0.05; p.vy += (0.18 * Math.sin(p.x * 0.004 + p.seed) - p.vy) * 0.05; }
      });
      var on = false;
      function tick() { if (!on) return; flow.step(true); requestAnimationFrame(tick); }
      if (RM) flow.warm(200);
      else if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { var v = en[0].isIntersecting; if (v && !on) { on = true; flow.size(); requestAnimationFrame(tick); } else if (!v) on = false; }).observe(sec);
      window.addEventListener('resize', function () { flow.size(); if (RM) flow.warm(200); });
    }
    if (!form) return;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en, io) { if (en[0].isIntersecting) { form.classList.add('shown'); io.disconnect(); } }, { threshold: 0.4 }).observe(form);
    else form.classList.add('shown');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, phone = form.elements.phone, what = form.elements.what, ok = true;
      [name, phone].forEach(function (f) { var bad = f === phone ? f.value.replace(/\D/g, '').length < 10 : !f.value.trim(); f.parentNode.classList.toggle('err', bad); if (bad && ok) { f.focus(); ok = false; } });
      if (!ok) return;
      var txt = tr('f.wa.head', FORM_RU.head) + ' ' + tr('f.name', FORM_RU.name) + ': ' + name.value.trim() + '. ' + tr('f.phone', FORM_RU.phone) + ': ' + phone.value.trim() + '.';
      if (what.value.trim()) txt += ' ' + tr('f.wa.what', FORM_RU.what) + ': ' + what.value.trim();
      window.open(WA + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      $('.form-ok', form).hidden = false;
    });
  })();

  /* ---------- запуск ---------- */
  function boot() {
    mqSize();
    var qs = new URLSearchParams(location.search).get('lang'), saved = null;
    try { saved = localStorage.getItem('adm-lang'); } catch (e) {}
    var want = qs === 'kk' || qs === 'ru' ? qs : (saved === 'kk' ? 'kk' : 'ru');
    var go = function () { splitHeads(); reveals(); counters(); stepsLine(); if (hasGsap) ScrollTrigger.refresh(); };
    if (want === 'kk') {
      var s = document.createElement('script'); s.src = 'assets/lang/kk.js' + (VER ? '?v=' + VER : '');
      s.onload = function () { lang = 'kk'; applyLang(); go(); }; s.onerror = go; document.head.appendChild(s);
    } else go();
  }
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var booted = false;
  function once() { if (booted) return; booted = true; boot(); }
  fontsReady.then(once); setTimeout(once, 1500);
  window.addEventListener('load', function () { mqSize(); if (hasGsap) ScrollTrigger.refresh(); });
})();
