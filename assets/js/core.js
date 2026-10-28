/* Rocketry Academy — shared UI + drawing helpers */
(function () {
  const RA = (window.RA = window.RA || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  RA.$ = $;
  RA.$$ = $$;
  RA.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = getComputedStyle(document.documentElement);
  RA.c = {};
  ['bg', 'surface', 'line', 'line-2', 'text', 'muted', 'dim', 'flame', 'flame-2', 'cyan', 'green', 'red', 'yellow', 'violet'].forEach((k) => {
    RA.c[k.replace('-2', '2')] = css.getPropertyValue('--' + k).trim();
  });

  RA.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  RA.lerp = (a, b, t) => a + (b - a) * t;
  RA.fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—');

  /* ---------- storage (best effort) ---------- */
  RA.store = {
    get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  /* ---------- canvas ---------- */
  RA.fit = function (c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    if (c._w !== w || c._h !== h || c._d !== dpr) {
      c.width = Math.max(1, Math.round(w * dpr));
      c.height = Math.max(1, Math.round(h * dpr));
      c._w = w; c._h = h; c._d = dpr;
    }
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  };

  /* Run frame(t, dt) only while el is on screen. Returns {kick} to force a frame. */
  RA.animate = function (el, frame) {
    let vis = false, raf = 0, last = 0;
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      frame(now / 1000, dt);
      if (vis) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting && !vis) { vis = true; last = performance.now(); raf = requestAnimationFrame(tick); }
        else if (!e.isIntersecting && vis) { vis = false; cancelAnimationFrame(raf); }
      });
    }, { rootMargin: '120px' });
    io.observe(el);
    return { kick: () => { if (!vis) frame(performance.now() / 1000, 0); } };
  };

  /* Star field shared by several canvases */
  RA.makeStars = (n, seed = 1) => {
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: n }, () => ({ x: rnd(), y: rnd(), r: rnd() * 1.2 + 0.2, p: rnd() * 6.28, s: rnd() * 1.5 + 0.5 }));
  };
  RA.drawStars = (ctx, stars, w, h, t, alpha = 1, drift = 0) => {
    for (const st of stars) {
      const a = (0.45 + 0.55 * Math.sin(t * st.s + st.p)) * alpha;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#dfe8ff';
      const y = ((st.y * h + drift * st.r) % h + h) % h;
      ctx.beginPath();
      ctx.arc(st.x * w, y, st.r, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- rocket + flame ---------- */
  // origin = nozzle exit centre, rocket points up (angle 0)
  RA.drawRocket = function (ctx, x, y, s = 1, ang = 0, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(s, s);
    const fin = o.fin || RA.c.flame;
    // rear fins
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-10, -34); ctx.lineTo(-26, -4); ctx.lineTo(-26, 6); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, -34); ctx.lineTo(26, -4); ctx.lineTo(26, 6); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill();
    // body
    const g = ctx.createLinearGradient(-10, 0, 10, 0);
    g.addColorStop(0, '#9aa6bd'); g.addColorStop(0.45, '#f4f7fc'); g.addColorStop(1, '#8792a8');
    ctx.fillStyle = g;
    ctx.fillRect(-10, -96, 20, 96);
    // band + window
    ctx.fillStyle = fin; ctx.fillRect(-10, -62, 20, 5);
    ctx.fillStyle = '#0b1220'; ctx.beginPath(); ctx.arc(0, -78, 4, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#c9d2e3'; ctx.lineWidth = 1.2; ctx.stroke();
    // nose
    ctx.fillStyle = o.nose || fin;
    ctx.beginPath(); ctx.moveTo(-10, -96); ctx.bezierCurveTo(-10, -118, -4, -132, 0, -140); ctx.bezierCurveTo(4, -132, 10, -118, 10, -96); ctx.closePath(); ctx.fill();
    // centre fin
    ctx.fillStyle = fin; ctx.globalAlpha = 0.85; ctx.fillRect(-1.6, -30, 3.2, 34); ctx.globalAlpha = 1;
    // nozzle
    ctx.fillStyle = '#4b5468';
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(8, 7); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  RA.drawFlame = function (ctx, x, y, s, ang, k, t) {
    if (k <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(s, s);
    const L = (38 + 26 * k) * (0.85 + 0.15 * Math.sin(t * 47) * Math.sin(t * 13));
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 6, 0, 6 + L);
    g.addColorStop(0, 'rgba(255,255,240,.95)');
    g.addColorStop(0.2, 'rgba(255,200,90,.9)');
    g.addColorStop(0.6, 'rgba(255,107,44,.55)');
    g.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-7, 6);
    ctx.quadraticCurveTo(-11 * k - 2, 6 + L * 0.45, 0, 6 + L);
    ctx.quadraticCurveTo(11 * k + 2, 6 + L * 0.45, 7, 6);
    ctx.closePath();
    ctx.fill();
    const glow = ctx.createRadialGradient(0, 12, 0, 0, 12, 40 * k + 10);
    glow.addColorStop(0, 'rgba(255,160,60,.45)');
    glow.addColorStop(1, 'rgba(255,107,44,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 12, 40 * k + 10, 0, 6.283); ctx.fill();
    ctx.restore();
  };
  RA.drawChute = function (ctx, x, y, r, sway = 0, color) {
    // x,y = canopy apex; rocket hangs below
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);
    ctx.fillStyle = color || RA.c.cyan;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.35);
    ctx.quadraticCurveTo(-r, -r * 0.55, 0, -r * 0.55);
    ctx.quadraticCurveTo(r, -r * 0.55, r, r * 0.35);
    for (let i = 3; i >= -3; i--) ctx.quadraticCurveTo((i + 0.5) * r / 3.5, r * 0.15, i * r / 3.5, r * 0.35);
    ctx.closePath();
    ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(230,235,245,.55)'; ctx.lineWidth = 1;
    ctx.beginPath();
    [-r, -r / 2, 0, r / 2, r].forEach((lx) => { ctx.moveTo(lx, r * 0.35); ctx.lineTo(0, r * 1.9); });
    ctx.stroke();
    ctx.restore();
  };
  RA.arrow = function (ctx, x1, y1, x2, y2, color, w = 3, label) {
    const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 2) return;
    ctx.save();
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.lineWidth = w;
    ctx.shadowColor = color; ctx.shadowBlur = 10;
    const hl = Math.min(12, len * 0.5);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(ang) * hl * 0.8, y2 - Math.sin(ang) * hl * 0.8); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(ang - 0.45), y2 - hl * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - hl * Math.cos(ang + 0.45), y2 - hl * Math.sin(ang + 0.45));
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    if (label) {
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText(label, x2 + (Math.cos(ang) > 0.3 ? 8 : Math.cos(ang) < -0.3 ? -8 - ctx.measureText(label).width : 8), y2 + (Math.sin(ang) > 0.3 ? 14 : Math.sin(ang) < -0.3 ? -6 : 4));
    }
    ctx.restore();
  };

  /* ---------- particles ---------- */
  RA.Particles = class {
    constructor(max = 600) { this.p = []; this.max = max; }
    emit(o) { if (this.p.length < this.max) this.p.push({ age: 0, ...o }); }
    update(dt, gy = 0) {
      for (const q of this.p) {
        q.age += dt;
        q.x += q.vx * dt; q.y += q.vy * dt;
        q.vx *= 1 - (q.drag || 0.8) * dt; q.vy = q.vy * (1 - (q.drag || 0.8) * dt) + gy * dt;
        q.r += (q.grow || 0) * dt;
      }
      this.p = this.p.filter((q) => q.age < q.life);
    }
    draw(ctx) {
      for (const q of this.p) {
        const k = q.age / q.life;
        if (q.kind === 'fire') {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = `rgba(255,${Math.round(200 - 140 * k)},${Math.round(80 - 60 * k)},${(1 - k) * 0.8})`;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          const c = q.shade || 170;
          ctx.fillStyle = `rgba(${c},${c + 5},${c + 15},${(1 - k) * (q.alpha || 0.35)})`;
        }
        ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(0.1, q.r), 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    clear() { this.p = []; }
  };

  /* ---------- line chart ---------- */
  function niceStep(range, n) {
    const raw = range / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }
  RA.niceMax = (v) => { const st = niceStep(v, 5); return Math.ceil(v / st) * st; };
  RA.chart = function (ctx, w, h, o) {
    const pad = { l: 46, r: o.y2 ? 46 : 14, t: 16, b: 32 };
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    const xMin = o.xMin || 0, yMin = o.yMin || 0;
    const X = (x) => pad.l + ((x - xMin) / (o.xMax - xMin)) * pw;
    const Y = (y) => pad.t + ph - ((y - yMin) / (o.yMax - yMin)) * ph;
    const Y2 = o.y2 ? (y) => pad.t + ph - (y / o.y2.max) * ph : null;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.lineWidth = 1;
    // grid
    const ys = niceStep(o.yMax - yMin, 4);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let v = Math.ceil(yMin / ys) * ys; v <= o.yMax + 1e-9; v += ys) {
      ctx.strokeStyle = 'rgba(42,56,88,.55)';
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + pw, Y(v)); ctx.stroke();
      ctx.fillStyle = RA.c.dim;
      ctx.fillText((o.yFmt || ((q) => +q.toFixed(2)))(v), pad.l - 6, Y(v));
    }
    if (o.y2) {
      const s2 = niceStep(o.y2.max, 4);
      ctx.textAlign = 'left'; ctx.fillStyle = o.y2.color;
      for (let v = 0; v <= o.y2.max + 1e-9; v += s2) ctx.fillText(+v.toFixed(2), pad.l + pw + 6, Y2(v));
    }
    const xs = niceStep(o.xMax - xMin, Math.max(3, Math.floor(pw / 70)));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = RA.c.dim;
    for (let v = Math.ceil(xMin / xs) * xs; v <= o.xMax + 1e-9; v += xs) {
      ctx.strokeStyle = 'rgba(42,56,88,.3)';
      ctx.beginPath(); ctx.moveTo(X(v), pad.t); ctx.lineTo(X(v), pad.t + ph); ctx.stroke();
      ctx.fillText((o.xFmt || ((q) => +q.toFixed(2)))(v), X(v), pad.t + ph + 6);
    }
    ctx.strokeStyle = RA.c.line2;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ph); ctx.lineTo(pad.l + pw, pad.t + ph); ctx.stroke();
    // labels
    ctx.fillStyle = RA.c.muted;
    if (o.xLabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(o.xLabel, pad.l + pw, h - 2); }
    if (o.yLabel) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(o.yLabel, pad.l + 6, pad.t - 2); }
    if (o.y2 && o.y2.label) { ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillStyle = o.y2.color; ctx.fillText(o.y2.label, pad.l + pw - 6, pad.t - 2); }
    // series
    for (const s of o.series || []) {
      const map = s.y2 ? Y2 : Y;
      if (!s.pts.length) continue;
      ctx.save();
      ctx.beginPath(); ctx.rect(pad.l, pad.t - 2, pw, ph + 4); ctx.clip();
      ctx.beginPath();
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), map(y)) : ctx.moveTo(X(x), map(y))));
      if (s.fill) {
        ctx.lineTo(X(s.pts[s.pts.length - 1][0]), map(0));
        ctx.lineTo(X(s.pts[0][0]), map(0));
        ctx.closePath();
        const g = ctx.createLinearGradient(0, pad.t, 0, pad.t + ph);
        g.addColorStop(0, s.fill); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath();
        s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), map(y)) : ctx.moveTo(X(x), map(y))));
      }
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2; ctx.lineJoin = 'round';
      if (s.dash) ctx.setLineDash(s.dash);
      ctx.stroke();
      ctx.restore();
    }
    return { X, Y, Y2, pad, pw, ph };
  };

  /* ---------- toast ---------- */
  let toastT = 0;
  RA.toast = (msg) => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2400);
  };

  /* ---------- range inputs: filled track ---------- */
  RA.paintRange = (r) => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%');
  document.addEventListener('input', (e) => { if (e.target.type === 'range') RA.paintRange(e.target); });
  RA.paintAll = () => $$('input[type=range]').forEach(RA.paintRange);

  /* ---------- segmented controls ---------- */
  RA.seg = function (el, cb) {
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !el.contains(b)) return;
      e.preventDefault();
      $$('button', el).forEach((x) => x.classList.toggle('on', x === b));
      cb(b.dataset, b);
    });
  };

  /* ---------- tabs ---------- */
  $$('[data-tabs]').forEach((tl) => {
    const mod = tl.closest('.module');
    tl.addEventListener('click', (e) => {
      const b = e.target.closest('[role=tab]');
      if (!b) return;
      $$('[role=tab]', tl).forEach((x) => x.setAttribute('aria-selected', x === b));
      $$('[data-panel]', mod).forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
      mod.dispatchEvent(new CustomEvent('tab', { detail: b.dataset.tab }));
    });
  });

  /* ---------- progress ---------- */
  const KEY = 'ra.progress.v1';
  const modules = $$('[data-module]').map((m) => m.dataset.module);
  let done = new Set(RA.store.get(KEY, []).filter((id) => modules.includes(id)));
  $('#progressTotal').textContent = modules.length;

  function buildRoadmap() {
    const titles = {};
    $$('[data-module]').forEach((m) => {
      titles[m.dataset.module] = { title: $('h2', m).textContent, time: ($('.module-tag', m).textContent.match(/(\d+) min/) || [])[1] };
    });
    modules.forEach((id) => {
      const list = id[0] === 'b' ? $('#roadB') : $('#roadI');
      const li = document.createElement('li');
      li.innerHTML = `<a href="#${$(`[data-module="${id}"]`).id}" data-mod="${id}"><span class="rc">${id.toUpperCase()}</span>${titles[id].title}<small>${titles[id].time} min</small></a>`;
      list.appendChild(li);
    });
  }
  function paintProgress() {
    $$('[data-mod]').forEach((a) => a.classList.toggle('done', done.has(a.dataset.mod)));
    $$('[data-complete]').forEach((b) => {
      const d = done.has(b.dataset.complete);
      b.classList.toggle('done', d);
      b.textContent = d ? 'Completed' : 'Mark complete';
    });
    $('#progressCount').textContent = done.size;
    $('#progressRing').style.strokeDashoffset = 97.4 * (1 - done.size / modules.length);
  }
  buildRoadmap();
  paintProgress();
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-complete]');
    if (!b) return;
    const id = b.dataset.complete;
    if (done.has(id)) done.delete(id);
    else {
      done.add(id);
      RA.toast(done.size === modules.length ? 'All modules complete — you are cleared for orbit.' : `${id.toUpperCase()} complete · ${done.size}/${modules.length}`);
    }
    RA.store.set(KEY, [...done]);
    paintProgress();
  });
  $('#resetProgress').addEventListener('click', () => {
    done = new Set();
    RA.store.set(KEY, []);
    paintProgress();
    RA.toast('Progress reset');
  });

  /* ---------- nav: active section, scroll bar, mobile menu ---------- */
  const railLinks = $$('.rail a');
  const sections = $$('main section[id], .track-banner[id]');
  const spy = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      railLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      const lvl = id.startsWith('b') ? 'beginner' : id.startsWith('i') ? 'intermediate' : id;
      $$('.top-nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + lvl));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => spy.observe(s));

  const bar = $('#scrollBar');
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menu = $('#menuBtn'), rail = $('#rail');
  menu.addEventListener('click', () => {
    const open = !rail.classList.contains('open');
    rail.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', open);
  });
  rail.addEventListener('click', (e) => {
    if (e.target.closest('a')) { rail.classList.remove('open'); menu.setAttribute('aria-expanded', false); }
  });

  /* ---------- reveal on scroll ---------- */
  const rv = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => rv.observe(el));

  $('#year').textContent = new Date().getFullYear();

  /* =========================================================
     HERO — launch animation
     ========================================================= */
  (function hero() {
    const cv = $('#heroCanvas');
    const stars = RA.makeStars(220, 7);
    const parts = new RA.Particles(900);
    let state = 'idle', st = 0, ry = 0, vy = 0, shake = 0, count = 5, launches = 0;
    const btn = $('#heroLaunch'), cnt = $('#heroCount'), status = $('#heroStatus');
    cnt.textContent = 'T-05';

    btn.addEventListener('click', () => {
      if (state !== 'idle') return;
      state = 'count'; st = 0; count = 5;
      btn.disabled = true;
      status.textContent = 'TERMINAL COUNT';
      status.style.color = RA.c.yellow;
    });

    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      const narrow = w < 760;
      const padX = narrow ? w * 0.82 : w - 150;
      const groundY = h - 34;
      const s = narrow ? 0.8 : 1.1;
      st += dt;

      // state machine
      if (state === 'count') {
        const c = Math.max(0, 5 - Math.floor(st));
        if (c !== count) count = c;
        cnt.textContent = 'T-0' + count;
        if (st >= 5) { state = 'ignite'; st = 0; cnt.textContent = 'T+00'; status.textContent = 'IGNITION'; status.style.color = RA.c.flame; }
      } else if (state === 'ignite' && st > 0.6) {
        state = 'flight'; st = 0; status.textContent = 'LIFTOFF'; vy = 0;
      } else if (state === 'flight') {
        vy += (60 + st * 140) * dt;
        ry -= vy * dt;
        cnt.textContent = 'T+' + String(Math.floor(st + 0.6)).padStart(2, '0');
        if (st > 1.4) status.textContent = 'MAX-Q';
        if (st > 2.6) status.textContent = 'NOMINAL';
        if (groundY + ry < -260) { state = 'gone'; st = 0; launches++; }
      } else if (state === 'gone' && st > 2.6) {
        state = 'reset'; st = 0; ry = 0; vy = 0;
      } else if (state === 'reset' && st > 1.2) {
        state = 'idle'; btn.disabled = false; cnt.textContent = 'T-05';
        status.textContent = launches > 2 ? 'FLIGHT PROVEN' : 'GO FOR LAUNCH';
        status.style.color = RA.c.green;
      }
      const burning = state === 'ignite' || state === 'flight';
      shake = burning ? (state === 'ignite' ? 1.5 : Math.max(0, 2.5 - st)) : 0;

      // sky
      ctx.clearRect(0, 0, w, h);
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#04060c'); sky.addColorStop(0.7, '#070c18'); sky.addColorStop(1, '#0d1426');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      RA.drawStars(ctx, stars, w, h, t, 0.9, state === 'flight' ? st * st * 8 : 0);
      // planet glow
      const pg = ctx.createRadialGradient(w * 0.25, h * 1.9, h * 0.9, w * 0.25, h * 1.9, h * 1.25);
      pg.addColorStop(0, 'rgba(76,201,240,.0)'); pg.addColorStop(0.92, 'rgba(76,201,240,.08)'); pg.addColorStop(1, 'rgba(76,201,240,0)');
      ctx.fillStyle = pg; ctx.fillRect(0, 0, w, h);

      ctx.save();
      if (shake) ctx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);

      // distant hills
      ctx.fillStyle = '#0a1120';
      ctx.beginPath(); ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 20) ctx.lineTo(x, groundY - 18 - 14 * Math.sin(x * 0.006) - 8 * Math.sin(x * 0.017 + 1));
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#060a14'; ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = 'rgba(255,107,44,.25)'; ctx.beginPath(); ctx.moveTo(0, groundY + 0.5); ctx.lineTo(w, groundY + 0.5); ctx.stroke();

      // tower
      const tx = padX + 46 * s, ttop = groundY - 190 * s;
      ctx.strokeStyle = '#2a3858'; ctx.lineWidth = 1.5;
      ctx.strokeRect(tx, ttop, 16 * s, groundY - ttop);
      ctx.beginPath();
      for (let y = ttop; y < groundY - 8; y += 16 * s) { ctx.moveTo(tx, y); ctx.lineTo(tx + 16 * s, y + 16 * s); ctx.moveTo(tx + 16 * s, y); ctx.lineTo(tx, y + 16 * s); }
      ctx.stroke();
      const armOpen = state === 'idle' || state === 'count' ? 0 : 1;
      ctx.strokeStyle = '#3a4a6e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(tx, ttop + 40 * s); ctx.lineTo(tx - 26 * s + armOpen * 18 * s, ttop + 40 * s - armOpen * 12 * s); ctx.stroke();
      ctx.fillStyle = Math.sin(t * 4) > 0 ? RA.c.red : '#3a1520'; ctx.beginPath(); ctx.arc(tx + 8 * s, ttop - 4, 3, 0, 6.283); ctx.fill();
      // pad
      ctx.fillStyle = '#1c2740'; ctx.fillRect(padX - 40 * s, groundY - 12 * s, 80 * s, 12 * s);
      ctx.fillStyle = '#2a3858'; ctx.fillRect(padX - 28 * s, groundY - 20 * s, 56 * s, 8 * s);

      // exhaust particles
      const ny = groundY - 20 * s - 8 * s + ry;
      if (burning || (state === 'count' && Math.random() < 0.3)) {
        const n = burning ? 9 : 1;
        for (let i = 0; i < n; i++) {
          if (burning) {
            parts.emit({ kind: 'fire', x: padX + (Math.random() - 0.5) * 8 * s, y: ny + 12 * s, vx: (Math.random() - 0.5) * 60, vy: 260 + Math.random() * 160, r: 3 + Math.random() * 4, grow: 6, life: 0.35 + Math.random() * 0.25, drag: 2 });
            const nearGround = ny + 30 > groundY - 40;
            parts.emit({ kind: 'smoke', x: padX + (Math.random() - 0.5) * 10, y: Math.min(ny + 30, groundY - 10), vx: (nearGround ? (Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 180) : (Math.random() - 0.5) * 40), vy: nearGround ? -Math.random() * 30 : 60 + Math.random() * 40, r: 6 + Math.random() * 8, grow: 22, life: 2.5 + Math.random() * 2, drag: 0.9, shade: 150 + Math.random() * 60, alpha: 0.28 });
          } else {
            parts.emit({ kind: 'smoke', x: padX + 10 * s, y: ny - 70 * s, vx: 20 + Math.random() * 20, vy: -10, r: 2, grow: 10, life: 1.6, drag: 0.6, shade: 220, alpha: 0.4 });
          }
        }
      }
      parts.update(dt, -6);
      parts.draw(ctx);

      // rocket
      if (state !== 'gone') {
        if (state === 'reset') ctx.globalAlpha = Math.min(1, st / 1.0);
        RA.drawFlame(ctx, padX, ny, s, 0, burning ? (state === 'ignite' ? st / 0.6 : 1) : 0, t);
        RA.drawRocket(ctx, padX, ny, s);
        ctx.globalAlpha = 1;
      }
      // ground glow
      if (burning && ny > groundY - 220) {
        const gg = ctx.createRadialGradient(padX, groundY, 0, padX, groundY, 180);
        gg.addColorStop(0, `rgba(255,140,60,${0.35 * (1 - (groundY - ny) / 220)})`);
        gg.addColorStop(1, 'rgba(255,107,44,0)');
        ctx.fillStyle = gg; ctx.fillRect(padX - 200, groundY - 200, 400, 240);
      }
      ctx.restore();
      // fade under hero text for legibility on narrow screens
      if (narrow) {
        const fg = ctx.createLinearGradient(0, 0, w, 0);
        fg.addColorStop(0, 'rgba(5,7,13,.75)'); fg.addColorStop(0.7, 'rgba(5,7,13,.2)'); fg.addColorStop(1, 'rgba(5,7,13,0)');
        ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h);
      }
    });
  })();

  RA.paintAll();
})();
