/* Rocketry Academy — Level 03 labs (orbital mechanics) */
(function () {
  const RA = window.RA, P = RA.phys, $ = RA.$, $$ = RA.$$;
  const TAU = Math.PI * 2;
  const km = (m) => (Math.abs(m) >= 1e6 ? Math.round(m / 1000).toLocaleString('en') : (m / 1000).toFixed(0)) + ' km';
  const kms = (v) => (v / 1000).toFixed(2) + ' km/s';
  const dur = (s) => (s < 7200 ? (s / 60).toFixed(1) + ' min' : s < 172800 ? (s / 3600).toFixed(2) + ' h' : (s / 86400).toFixed(1) + ' days');
  const ms = (v) => Math.round(v).toLocaleString('en') + ' m/s';

  function drawEarth(ctx, x, y, r) {
    const atm = ctx.createRadialGradient(x, y, r, x, y, r * 1.12 + 3);
    atm.addColorStop(0, 'rgba(76,201,240,.35)'); atm.addColorStop(1, 'rgba(76,201,240,0)');
    ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(x, y, r * 1.12 + 3, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#3d7fd6'); g.addColorStop(0.7, '#1d4f9a'); g.addColorStop(1, '#0d2a5a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (r > 30) { // a hint of continents
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
      ctx.fillStyle = 'rgba(61,220,151,.22)';
      [[-0.3, -0.2, 0.32, 0.22], [0.25, 0.15, 0.28, 0.35], [-0.1, 0.45, 0.2, 0.12]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.ellipse(x + a * r, y + b * r, c * r, d * r, 0.5, 0, TAU); ctx.fill(); });
      ctx.restore();
    }
  }
  function drawSun(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
    g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.3, 'rgba(255,190,90,.9)'); g.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, TAU); ctx.fill();
  }
  function dot(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function label(ctx, txt, x, y, c, align = 'left') {
    ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillStyle = c; ctx.textAlign = align; ctx.fillText(txt, x, y);
  }
  function ship(ctx, x, y, ang, c = '#e6ebf5', s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -5); ctx.lineTo(-3, 0); ctx.lineTo(-6, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function flash(ctx, x, y, k) {
    if (k <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 26);
    g.addColorStop(0, `rgba(255,220,140,${k})`); g.addColorStop(1, 'rgba(255,107,44,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill();
  }

  /* =========================================================
     A1 — Kepler's laws
     ========================================================= */
  (function kepler() {
    const cv = $('#keplerCanvas'), E = $('#kpE'), sect = $('#kpSectors');
    const stars = RA.makeStars(90, 21);
    let e = 0.5, M = 0;
    function upd() {
      e = +E.value;
      $('#kpEv').textContent = e.toFixed(2);
      $('#kpRp').textContent = (1 - e).toFixed(2) + ' AU';
      $('#kpRa').textContent = (1 + e).toFixed(2) + ' AU';
      $('#kpRatio').textContent = ((1 + e) / (1 - e)).toFixed(2) + ' ×';
    }
    E.addEventListener('input', upd); upd();
    const posAt = (Mx, a, Sx, cy) => {
      const Ek = P.kepler(((Mx % TAU) + TAU) % TAU, e), nu = P.trueAnomaly(Ek, e), r = a * (1 - e * Math.cos(Ek));
      return [Sx + r * Math.cos(nu), cy - r * Math.sin(nu), r];
    };
    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      RA.drawStars(ctx, stars, w, h, t, 0.5);
      M = (M + (dt * TAU) / 8) % TAU;
      const a = Math.min((w - 60) / 2, (h - 50) / 2 / Math.sqrt(1 - e * e) * 0.98, (h - 50) / 2 / 0.75);
      const b = a * Math.sqrt(1 - e * e), cx = w / 2, cy = h / 2, Sx = cx + a * e;
      // equal-time sectors
      const N = 8, cur = Math.floor(M / (TAU / N));
      if (sect.checked) {
        for (let k = 0; k < N; k++) {
          ctx.beginPath(); ctx.moveTo(Sx, cy);
          for (let j = 0; j <= 24; j++) { const [x, y] = posAt((TAU * (k + j / 24)) / N, a, Sx, cy); ctx.lineTo(x, y); }
          ctx.closePath();
          ctx.fillStyle = k === cur ? 'rgba(155,140,255,.42)' : k % 2 ? 'rgba(155,140,255,.12)' : 'rgba(76,201,240,.10)';
          ctx.fill();
        }
      }
      // ellipse
      ctx.strokeStyle = 'rgba(230,235,245,.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy, a, b, 0, 0, TAU); ctx.stroke();
      // axes + foci
      ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(139,151,176,.35)';
      ctx.beginPath(); ctx.moveTo(cx - a, cy); ctx.lineTo(cx + a, cy); ctx.stroke(); ctx.setLineDash([]);
      drawSun(ctx, Sx, cy, 7);
      if (e > 0.02) {
        ctx.strokeStyle = RA.c.muted; ctx.lineWidth = 1.5;
        const fx = cx - a * e;
        ctx.beginPath(); ctx.moveTo(fx - 4, cy - 4); ctx.lineTo(fx + 4, cy + 4); ctx.moveTo(fx + 4, cy - 4); ctx.lineTo(fx - 4, cy + 4); ctx.stroke();
        label(ctx, 'empty focus', fx, cy - 10, RA.c.dim, 'center');
      }
      label(ctx, 'Sun (focus)', Sx, cy - 16, RA.c.flame2, 'center');
      label(ctx, 'periapsis', cx + a - 4, cy + 16, RA.c.dim, 'right');
      label(ctx, 'apoapsis', cx - a + 4, cy + 16, RA.c.dim, 'left');
      // planet + velocity
      const [px, py, r] = posAt(M, a, Sx, cy), [qx, qy] = posAt(M + 0.01, a, Sx, cy);
      const speed = Math.sqrt(2 / (r / a) - 1); // in units of mean orbital speed
      const dl = Math.hypot(qx - px, qy - py) || 1;
      ctx.strokeStyle = 'rgba(155,140,255,.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Sx, cy); ctx.lineTo(px, py); ctx.stroke();
      RA.arrow(ctx, px, py, px + ((qx - px) / dl) * 26 * speed, py + ((qy - py) / dl) * 26 * speed, RA.c.green, 2);
      dot(ctx, px, py, 6, RA.c.cyan);
      $('#kpV').textContent = (29.78 * speed).toFixed(1) + ' km/s';
      label(ctx, 'speed at a = 1 AU around the Sun', 10, h - 10, RA.c.dim);
      if (sect.checked) label(ctx, 'each sector: same area, same time (1/8 orbit)', 10, 16, RA.c.violet);
    });

    // Third law, log–log
    const tc = $('#thirdCanvas'), A = $('#kpA');
    const PL = [['Mercury', 0.387, 0.241], ['Venus', 0.723, 0.615], ['Earth', 1, 1], ['Mars', 1.524, 1.881], ['Ceres', 2.77, 4.6], ['Jupiter', 5.203, 11.86], ['Saturn', 9.537, 29.46], ['Uranus', 19.19, 84.01], ['Neptune', 30.07, 164.8]];
    const aMin = 0.3, aMax = 40;
    const aOf = (v) => aMin * Math.pow(aMax / aMin, v / 1000);
    A.value = Math.round((1000 * Math.log(1 / aMin)) / Math.log(aMax / aMin)); RA.paintRange(A);
    function upd3() {
      const a = aOf(+A.value), T = Math.pow(a, 1.5);
      $('#kpAv').textContent = a.toFixed(2) + ' AU';
      $('#kpT').textContent = T < 1 ? (T * 365.25).toFixed(0) + ' days' : T.toFixed(2) + ' years';
      const near = PL.reduce((p, q) => (Math.abs(Math.log(q[1] / a)) < Math.abs(Math.log(p[1] / a)) ? q : p));
      $('#kpK').textContent = `${near[0]} ${((near[2] ** 2) / (near[1] ** 3)).toFixed(3)}`;
    }
    A.addEventListener('input', upd3); upd3();
    RA.animate(tc, () => {
      const { ctx, w, h } = RA.fit(tc);
      ctx.clearRect(0, 0, w, h);
      const pad = { l: 46, r: 14, t: 16, b: 30 }, pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
      const lx0 = Math.log10(aMin), lx1 = Math.log10(aMax), ly0 = -1, ly1 = Math.log10(300);
      const X = (a) => pad.l + ((Math.log10(a) - lx0) / (lx1 - lx0)) * pw;
      const Y = (T) => pad.t + ph - ((Math.log10(T) - ly0) / (ly1 - ly0)) * ph;
      ctx.font = '11px "JetBrains Mono", monospace'; ctx.lineWidth = 1;
      [0.3, 1, 3, 10, 30].forEach((v) => { ctx.strokeStyle = 'rgba(42,56,88,.4)'; ctx.beginPath(); ctx.moveTo(X(v), pad.t); ctx.lineTo(X(v), pad.t + ph); ctx.stroke(); label(ctx, String(v), X(v), pad.t + ph + 16, RA.c.dim, 'center'); });
      [0.1, 1, 10, 100].forEach((v) => { ctx.strokeStyle = 'rgba(42,56,88,.55)'; ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + pw, Y(v)); ctx.stroke(); label(ctx, String(v), pad.l - 6, Y(v) + 4, RA.c.dim, 'right'); });
      label(ctx, 'a (AU)', pad.l + pw, h - 2, RA.c.muted, 'right');
      label(ctx, 'T (years)', pad.l + 6, pad.t + 10, RA.c.muted, 'left');
      ctx.strokeStyle = RA.c.violet; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(aMin), Y(aMin ** 1.5)); ctx.lineTo(X(aMax), Y(aMax ** 1.5)); ctx.stroke();
      label(ctx, 'T² = a³  (slope 1.5)', pad.l + 8, pad.t + 26, RA.c.violet);
      PL.forEach(([n, a, T], i) => { dot(ctx, X(a), Y(T), 4, RA.c.cyan); label(ctx, n, X(a) + (i % 2 ? 6 : -6), Y(T) + (i % 2 ? 14 : -8), RA.c.muted, i % 2 ? 'left' : 'right'); });
      const a = aOf(+A.value), T = a ** 1.5;
      ctx.strokeStyle = 'rgba(255,179,71,.5)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(a), pad.t + ph); ctx.lineTo(X(a), Y(T)); ctx.lineTo(pad.l, Y(T)); ctx.stroke(); ctx.setLineDash([]);
      dot(ctx, X(a), Y(T), 6, RA.c.flame2);
    });
  })();

  /* =========================================================
     A2 — Newton's cannon
     ========================================================= */
  (function cannon() {
    const cv = $('#cannonCanvas'), V = $('#cnV'), H = $('#cnH');
    const stars = RA.makeStars(110, 33);
    let path = [], type = '', idx = 0, k = null, color = RA.c.green;
    const pre = $('#cnPresets');
    [['Falls back', 0.72], ['Circular', 1], ['Ellipse', 1.18], ['Escape', 1.4143]].forEach(([n, f]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = n;
      b.addEventListener('click', () => { V.value = ((P.vCirc(P.RE + +H.value * 1000) * f) / 1000).toFixed(2); RA.paintRange(V); compute(); });
      pre.appendChild(b);
    });
    function compute() {
      const v = +V.value * 1000, h = +H.value * 1000, r0 = P.RE + h;
      $('#cnVv').textContent = (+V.value).toFixed(2) + ' km/s';
      $('#cnHv').textContent = H.value + ' km';
      const vc = P.vCirc(r0), ve = P.vEsc(r0), el = P.elements(0, r0, v, 0);
      $('#cnVc').textContent = kms(vc);
      $('#cnVe').textContent = kms(ve);
      const T = el.e < 1 ? P.period(el.a) : null;
      const dt = T ? T / 700 : 40;
      let s = [0, r0, v, 0], prev = Math.PI / 2, swept = 0;
      path = [[0, r0]]; type = el.e >= 1 ? 'escape' : el.e < 0.004 ? 'circular' : 'ellipse';
      for (let i = 0; i < 3000; i++) {
        for (let j = 0; j < 4; j++) s = P.twoBody(s, dt / 4);
        const r = Math.hypot(s[0], s[1]);
        path.push([s[0], s[1]]);
        if (r < P.RE) { type = 'crash'; break; }
        const a = Math.atan2(s[1], s[0]); let d = a - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
        swept += Math.abs(d); prev = a;
        if (swept >= TAU) break;
        if (r > 14 * P.RE) break;
      }
      idx = 0;
      const names = { crash: 'Falls back', circular: 'Circular orbit', ellipse: 'Elliptical orbit', escape: el.e < 1.01 ? 'Escape (≈parabolic)' : 'Escape (hyperbolic)' };
      color = { crash: RA.c.red, circular: RA.c.green, ellipse: RA.c.cyan, escape: RA.c.violet }[type];
      const tEl = $('#cnType'); tEl.textContent = names[type]; tEl.style.color = color;
      $('#cnPe').textContent = km(el.rp - P.RE);
      $('#cnAp').textContent = el.e < 1 ? km(el.ra - P.RE) : '∞';
      $('#cnT').textContent = type === 'crash' || !T ? '—' : dur(T);
    }
    [V, H].forEach((e) => e.addEventListener('input', compute));
    compute();
    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      RA.drawStars(ctx, stars, w, h, t, 0.5);
      let ext = 1.25 * P.RE;
      for (const [x, y] of path) ext = Math.max(ext, Math.abs(x), Math.abs(y));
      ext = Math.min(ext, 9 * P.RE);
      const kt = (Math.min(w, h) / 2 - 16) / ext;
      k = k == null ? kt : RA.lerp(k, kt, Math.min(1, dt * 4));
      const cx = w / 2, cy = h / 2, S = (x, y) => [cx + x * k, cy - y * k];
      drawEarth(ctx, cx, cy, P.RE * k);
      // tower to scale
      const r0 = P.RE + +H.value * 1000;
      ctx.strokeStyle = '#c9d2e3'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy - P.RE * k); ctx.lineTo(cx, cy - r0 * k); ctx.stroke();
      ctx.fillStyle = '#c9d2e3'; ctx.fillRect(cx - 6, cy - r0 * k - 3, 10, 5);
      // full path
      ctx.strokeStyle = color; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); path.forEach(([x, y], i) => { const [sx, sy] = S(x, y); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); }); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      // flying shot (equal time between points → Kepler's 2nd law visible)
      idx += dt * (path.length / 5);
      if (idx >= path.length + (type === 'circular' || type === 'ellipse' ? 0 : 40)) idx = 0;
      const n = Math.min(path.length - 1, Math.floor(idx));
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = Math.max(0, n - 60); i <= n; i++) { const [sx, sy] = S(...path[i]); i === Math.max(0, n - 60) ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy); }
      ctx.stroke();
      const [sx, sy] = S(...path[n]);
      if (type === 'crash' && n === path.length - 1) flash(ctx, sx, sy, 0.9); else dot(ctx, sx, sy, 4.5, '#fff');
      label(ctx, `1 px ≈ ${(1 / k / 1000).toFixed(0)} km`, 10, h - 10, RA.c.dim);
    });
  })();

  /* =========================================================
     A3 — Gravity turn ascent
     ========================================================= */
  (function gravityTurn() {
    const cv = $('#gtCanvas'), mapCv = $('#gtMap'), A = $('#gtA'), K = $('#gtK');
    const A0 = 100, A1 = 3000, K0 = 1, K1 = 15, NG = 14;
    let res = null, anim = 1, grid = null;
    const OC = { orbit: RA.c.green, 'orbit-low': RA.c.yellow, suborbital: RA.c.flame, crash: RA.c.red };
    function run(animate) {
      $('#gtAv').textContent = A.value + ' m';
      $('#gtKv').textContent = (+K.value).toFixed(1) + '°';
      res = P.ascent({ kickAlt: +A.value, kickDeg: +K.value });
      anim = animate ? 0 : 1;
      $('#gtQ').textContent = `${(res.maxQ.q / 1000).toFixed(1)} kPa @ ${(res.maxQ.h / 1000).toFixed(1)} km`;
      $('#gtM').textContent = res.meco ? `T+${res.meco.t.toFixed(0)} s · ${kms(res.meco.v)}` : '—';
      $('#gtO').textContent = res.final && res.outcome !== 'suborbital' ? `${(res.final.rp / 1000).toFixed(0)} × ${(res.final.ra / 1000).toFixed(0)} km` : '—';
      $('#gtLg').textContent = ms(res.lossG);
      $('#gtLd').textContent = ms(res.lossD);
      const mar = $('#gtMar');
      mar.textContent = res.margin != null ? (res.margin >= 0 ? '+' : '−') + ms(Math.abs(res.margin)) : '—';
      mar.style.color = res.margin >= 0 ? RA.c.green : RA.c.red;
      const v = $('#gtVerdict');
      if (res.outcome === 'orbit') { v.className = 'verdict good'; v.textContent = `Orbit! 200 km circular with ${ms(res.margin)} of Δv to spare. Gravity cost ${ms(res.lossG)} — can you find a kick that leaves a bigger margin?`; }
      else if (res.outcome === 'orbit-low') { v.className = 'verdict warn'; v.textContent = `In orbit, but not circular: periapsis ${(res.final.rp / 1000).toFixed(0)} km. A touch more efficiency would close the gap.`; }
      else if (res.outcome === 'crash') { v.className = 'verdict bad'; v.textContent = 'Crashed — the turn was too aggressive. The rocket pitched over while still slow and low, and gravity pulled it down. Kick later or by less.'; }
      else { v.className = 'verdict bad'; v.textContent = `Suborbital — the path was too steep. ${ms(res.lossG)} went to fighting gravity, leaving too little horizontal speed. Kick earlier or harder.`; }
    }
    [A, K].forEach((e) => e.addEventListener('input', () => run(false)));
    $('#gtGo').addEventListener('click', () => run(true));
    run(false);
    // outcome map, computed in small chunks so the page stays responsive
    function buildGrid() {
      grid = [];
      let i = 0;
      const step = () => {
        for (let n = 0; n < NG && i < NG * NG; n++, i++) {
          const ai = Math.floor(i / NG), ki = i % NG;
          const r = P.ascent({ kickAlt: A0 + (ai / (NG - 1)) * (A1 - A0), kickDeg: K0 + (ki / (NG - 1)) * (K1 - K0) });
          grid.push({ ai, ki, o: r.outcome, m: r.margin || 0 });
        }
        $('#gtMapState').textContent = i < NG * NG ? `${Math.round((100 * i) / (NG * NG))}%` : `${grid.filter((g) => g.o === 'orbit').length} / ${NG * NG} reach orbit`;
        if (i < NG * NG) setTimeout(step, 0);
      };
      step();
    }
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { buildGrid(); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(mapCv);
    const mapPad = { l: 34, b: 18, t: 4, r: 4 };
    mapCv.addEventListener('click', (e) => {
      const r = mapCv.getBoundingClientRect(), pw = r.width - mapPad.l - mapPad.r, ph = r.height - mapPad.t - mapPad.b;
      const fx = RA.clamp((e.clientX - r.left - mapPad.l) / pw, 0, 1), fy = RA.clamp(1 - (e.clientY - r.top - mapPad.t) / ph, 0, 1);
      K.value = (K0 + fx * (K1 - K0)).toFixed(1); A.value = Math.round(A0 + fy * (A1 - A0));
      RA.paintRange(K); RA.paintRange(A); run(true);
    });
    RA.animate(mapCv, () => {
      const { ctx, w, h } = RA.fit(mapCv);
      ctx.clearRect(0, 0, w, h);
      const pw = w - mapPad.l - mapPad.r, ph = h - mapPad.t - mapPad.b, cw = pw / NG, ch = ph / NG;
      if (grid) for (const g of grid) {
        ctx.fillStyle = OC[g.o];
        ctx.globalAlpha = g.o === 'orbit' ? RA.clamp(0.35 + g.m / 700, 0.35, 1) : 0.55;
        ctx.fillRect(mapPad.l + g.ki * cw + 0.5, mapPad.t + (NG - 1 - g.ai) * ch + 0.5, cw - 1, ch - 1);
      }
      ctx.globalAlpha = 1;
      const px = mapPad.l + ((+K.value - K0) / (K1 - K0)) * pw, py = mapPad.t + (1 - (+A.value - A0) / (A1 - A0)) * ph;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.stroke();
      label(ctx, '1°', mapPad.l, h - 4, RA.c.dim, 'left'); label(ctx, 'kick angle', mapPad.l + pw / 2, h - 4, RA.c.dim, 'center'); label(ctx, '15°', w - 4, h - 4, RA.c.dim, 'right');
      label(ctx, '3 km', 2, mapPad.t + 9, RA.c.dim); label(ctx, '0.1', 2, mapPad.t + ph, RA.c.dim);
    });
    // trajectory chart
    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      if (!res) return;
      if (anim < 1) anim = Math.min(1, anim + dt / 5);
      const pts = res.path.map(([x, y, tt, pw]) => [(P.RE * Math.atan2(x, y)) / 1000, (Math.hypot(x, y) - P.RE) / 1000, tt, pw]);
      if (!pts.length) return;
      const tEnd = pts[pts.length - 1][2], tNow = anim * tEnd;
      const shown = pts.filter((p) => p[2] <= tNow);
      const xMax = RA.niceMax(Math.max(50, ...pts.map((p) => p[0])) * 1.05), yMax = RA.niceMax(Math.max(220, ...pts.map((p) => p[1])) * 1.05);
      const ch = RA.chart(ctx, w, h, {
        xMax, yMax, xLabel: 'downrange (km)', yLabel: 'altitude (km)',
        series: [
          { pts: shown.filter((p) => p[3]).map((p) => [p[0], p[1]]), color: RA.c.flame, width: 2.5 },
          { pts: shown.filter((p, i, a) => !p[3] || (a[i + 1] && !a[i + 1][3])).map((p) => [p[0], p[1]]), color: RA.c.cyan, width: 2, dash: [5, 4] },
        ],
      });
      // target orbit
      ctx.strokeStyle = 'rgba(61,220,151,.55)'; ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(ch.pad.l, ch.Y(200)); ctx.lineTo(ch.pad.l + ch.pw, ch.Y(200)); ctx.stroke(); ctx.setLineDash([]);
      label(ctx, 'target 200 km', ch.pad.l + 8, ch.Y(200) - 6, RA.c.green);
      // atmosphere band
      const ga = ctx.createLinearGradient(0, ch.Y(0), 0, ch.Y(Math.min(yMax, 80)));
      ga.addColorStop(0, 'rgba(76,201,240,.10)'); ga.addColorStop(1, 'rgba(76,201,240,0)');
      ctx.fillStyle = ga; ctx.fillRect(ch.pad.l, ch.Y(Math.min(yMax, 80)), ch.pw, ch.Y(0) - ch.Y(Math.min(yMax, 80)));
      // events
      const ev = [];
      const qp = pts.reduce((b, p) => (Math.abs(p[2] - res.maxQ.t) < Math.abs(b[2] - res.maxQ.t) ? p : b));
      ev.push([qp, 'max-Q']);
      const lastP = [...pts].reverse().find((p) => p[3]);
      if (res.meco && lastP) ev.push([lastP, 'cutoff']);
      if (res.outcome !== 'crash' && res.meco) ev.push([pts[pts.length - 1], res.outcome === 'suborbital' ? 'apoapsis' : 'circularise']);
      ev.forEach(([p, n]) => {
        if (p[2] > tNow) return;
        const x = ch.X(p[0]), y = ch.Y(p[1]);
        ctx.fillStyle = RA.c.bg; ctx.strokeStyle = RA.c.flame2; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); ctx.stroke();
        label(ctx, n, x + 7, y + (n === 'max-Q' ? 12 : -7), RA.c.flame2);
      });
      // rocket
      if (shown.length > 1 && anim < 1) {
        const p = shown[shown.length - 1], q = shown[Math.max(0, shown.length - 3)];
        const x = ch.X(p[0]), y = ch.Y(p[1]), ang = Math.atan2(x - ch.X(q[0]), -(y - ch.Y(q[1])));
        RA.drawFlame(ctx, x, y, 0.13, ang, p[3] ? 1 : 0, t);
        RA.drawRocket(ctx, x, y, 0.13, ang);
        label(ctx, `T+${p[2].toFixed(0)} s`, ch.pad.l + 8, ch.pad.t + 22, RA.c.cyan);
      }
      label(ctx, 'altitude and downrange use different scales', ch.pad.l + ch.pw - 4, ch.pad.t + 10, RA.c.dim, 'right');
    });
  })();

  /* =========================================================
     A4 — Hohmann transfer
     ========================================================= */
  (function hohmann() {
    const cv = $('#hohmannCanvas'), R1 = $('#hmR1'), R2 = $('#hmR2');
    const stars = RA.makeStars(110, 44);
    const altOf = (v) => 200e3 * Math.pow(400000 / 200, v / 1000); // 200 km … 400,000 km
    const PRE = {
      geo: { mu: P.MU, r1: P.RE + 400e3, r2: P.RE + 35786e3, body: 'earth', inner: 'LEO', outer: 'GEO', target: 'GEO satellite' },
      moon: { mu: P.MU, r1: P.RE + 400e3, r2: 384400e3, body: 'earth', inner: 'LEO', outer: 'Moon orbit', target: 'Moon' },
      mars: { mu: P.MU_SUN, r1: P.AU, r2: 1.524 * P.AU, body: 'sun', inner: 'Earth orbit', outer: 'Mars orbit', target: 'Mars', planet: true },
      custom: { mu: P.MU, body: 'earth', inner: 'inner', outer: 'outer' },
    };
    let cfg = PRE.geo, hm = null, clock = 0;
    R2.value = Math.round((1000 * Math.log(35786 / 200)) / Math.log(2000)); RA.paintRange(R2);
    function calc() {
      if (cfg === PRE.custom) {
        cfg.r1 = P.RE + altOf(+R1.value); cfg.r2 = P.RE + altOf(+R2.value);
        $('#hmR1v').textContent = Math.round(altOf(+R1.value) / 1000).toLocaleString('en') + ' km';
        $('#hmR2v').textContent = Math.round(altOf(+R2.value) / 1000).toLocaleString('en') + ' km';
      }
      hm = P.hohmann(cfg.r1, cfg.r2, cfg.mu);
      $('#hmD1').textContent = ms(hm.dv1);
      $('#hmD2').textContent = ms(hm.dv2);
      $('#hmD').textContent = kms(hm.dv);
      $('#hmT').textContent = dur(hm.t);
      $('#hmE').textContent = hm.e.toFixed(3);
      const ph = ((((hm.phase * 180) / Math.PI) % 360) + 540) % 360 - 180;
      $('#hmPh').textContent = cfg.target ? (ph >= 0 ? '+' : '') + ph.toFixed(1) + '°' : '—';
      clock = 0;
    }
    RA.seg($('#hmPreset'), (d) => { cfg = PRE[d.p]; $('#hmCustom').hidden = d.p !== 'custom'; calc(); });
    [R1, R2].forEach((e) => e.addEventListener('input', calc));
    calc();
    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      RA.drawStars(ctx, stars, w, h, t, 0.5);
      const up = cfg.r2 >= cfg.r1, rOut = Math.max(cfg.r1, cfg.r2), rIn = Math.min(cfg.r1, cfg.r2);
      const Rmax = Math.min(w, h) / 2 - 26, k = Rmax / rOut;
      const p1 = Math.max(cfg.r1 * k, up ? 18 : 0), p2 = Math.max(cfg.r2 * k, up ? 0 : 18);
      const cx = w / 2, cy = h / 2 + 4, scaled = rIn * k >= 18;
      // central body
      if (cfg.body === 'sun') drawSun(ctx, cx, cy, 6); else drawEarth(ctx, cx, cy, Math.max(4, Math.min(P.RE * k, Math.min(p1, p2) - 3)));
      // orbits
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(76,201,240,.65)'; ctx.beginPath(); ctx.arc(cx, cy, p1, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(155,140,255,.65)'; ctx.beginPath(); ctx.arc(cx, cy, p2, 0, TAU); ctx.stroke();
      // transfer half-ellipse in screen space (periapsis/apoapsis on the x-axis)
      const aS = (p1 + p2) / 2, eS = Math.abs(p2 - p1) / (p1 + p2), bS = aS * Math.sqrt(1 - eS * eS);
      const ecx = cx + (up ? -1 : 1) * (aS * eS);
      ctx.strokeStyle = 'rgba(255,107,44,.85)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(ecx, cy, aS, bS, 0, Math.PI, TAU, false); ctx.stroke(); ctx.setLineDash([]);
      label(ctx, cfg.inner, cx - p1 * 0.71 - 4, cy + p1 * 0.71 + 12, RA.c.cyan, 'right');
      label(ctx, cfg.outer, cx - p2 * 0.71 - 4, cy - p2 * 0.71 - 6, RA.c.violet, 'right');
      // timeline: inner orbit → transfer → outer orbit
      const T1 = P.period(cfg.r1, cfg.mu), T2 = P.period(cfg.r2, cfg.mu);
      const s = 3.2 / hm.t; // visual seconds per real second during the transfer
      const dIn = RA.clamp(T1 * s, 1.4, 4.5), dTr = 3.2, dOut = RA.clamp(T2 * s * 0.5, 1.6, 3);
      clock = (clock + dt) % (dIn + dTr + dOut);
      let ang, rpx, tReal, phase;
      if (clock < dIn) { phase = 0; ang = -TAU * (1 - clock / dIn); rpx = p1; tReal = -(1 - clock / dIn) * T1; }
      else if (clock < dIn + dTr) {
        phase = 1; const u = (clock - dIn) / dTr, e = hm.e;
        const M = up ? Math.PI * u : Math.PI + Math.PI * u;
        const E = P.kepler(M, e), nu = P.trueAnomaly(E, e), r = hm.a * (1 - e * Math.cos(E));
        ang = up ? nu : nu - Math.PI;
        rpx = (r * k - rIn * k) / ((rOut - rIn) * k || 1) * (Math.max(p1, p2) - Math.min(p1, p2)) + Math.min(p1, p2);
        tReal = u * hm.t;
      } else { phase = 2; const u = (clock - dIn - dTr); ang = Math.PI + (TAU * u) / (T2 * s); rpx = p2; tReal = hm.t + u / s; }
      // target body
      if (cfg.target) {
        const ta = hm.phase + (TAU * tReal) / T2;
        const tx = cx + p2 * Math.cos(ta), ty = cy - p2 * Math.sin(ta);
        dot(ctx, tx, ty, cfg.planet ? 6 : 5, cfg.planet ? '#e0703a' : '#d8dde8');
        label(ctx, cfg.target, tx + 9, ty - 6, RA.c.text);
      }
      if (cfg.planet) { const ea = (TAU * tReal) / T1; dot(ctx, cx + p1 * Math.cos(ea), cy - p1 * Math.sin(ea), 5, '#3d7fd6'); label(ctx, 'Earth', cx + p1 * Math.cos(ea) + 8, cy - p1 * Math.sin(ea) + 12, RA.c.cyan); }
      const sx = cx + rpx * Math.cos(ang), sy = cy - rpx * Math.sin(ang);
      ship(ctx, sx, sy, -ang - Math.PI / 2, '#fff', 1.1);
      // burns
      const b1 = clock - dIn, b2 = clock - dIn - dTr;
      if (b1 > -0.05 && b1 < 0.5) { flash(ctx, cx + p1, cy, 1 - b1 / 0.5); label(ctx, `Δv₁ ${ms(hm.dv1)}`, cx + p1 + 10, cy + 4, RA.c.flame2); }
      if (b2 > -0.05 && b2 < 0.5) { flash(ctx, cx - p2, cy, 1 - b2 / 0.5); label(ctx, `Δv₂ ${ms(hm.dv2)}`, cx - p2 + 10, cy + 16, RA.c.flame2); }
      label(ctx, phase === 0 ? 'parking orbit' : phase === 1 ? `coasting · ${dur(tReal)}` : 'arrived · circular', 10, 16, RA.c.muted);
      if (!scaled) label(ctx, 'inner orbit enlarged for visibility', 10, h - 10, RA.c.dim);
    });
  })();

  /* =========================================================
     A5 — Maneuver sandbox + plane change
     ========================================================= */
  (function maneuvers() {
    const cv = $('#mnCanvas');
    const stars = RA.makeStars(100, 55);
    const r0 = P.RE + 400e3;
    let s, spent, trail, dead, warp = 600, step = 50, burnFx = 0, k = null, done;
    const CH = [
      ['Raise apoapsis to 1,000 km or more', (el) => el.ra - P.RE >= 1000e3],
      ['Circularise at 1,000 km (both apsides 950–1,050 km)', (el) => el.rp - P.RE >= 950e3 && el.ra - P.RE <= 1050e3],
      ['…using at most 400 m/s in total (Hohmann minimum: 319 m/s)', (el) => done[1] && spent <= 400],
      ['De-orbit: drop periapsis into the atmosphere (< 100 km)', (el) => el.rp - P.RE < 100e3],
    ];
    const ul = $('#mnChallenges');
    CH.forEach(([n]) => { const li = document.createElement('li'); li.textContent = n; ul.appendChild(li); });
    function reset() { s = [r0, 0, 0, P.vCirc(r0)]; spent = 0; trail = []; dead = false; done = CH.map(() => false); paintCh(); }
    function paintCh() { $$('li', ul).forEach((li, i) => li.classList.toggle('done', done[i])); }
    reset();
    RA.seg($('#mnStep'), (d) => { step = +d.dv; });
    $('#mnReset').addEventListener('click', reset);
    const wb = $('#mnWarp');
    wb.addEventListener('click', () => { const on = warp === 600; warp = on ? 2400 : 600; wb.setAttribute('aria-pressed', on); wb.textContent = on ? 'Time warp ×1' : 'Time warp ×4'; });
    $$('.burn').forEach((b) => b.addEventListener('click', () => {
      if (dead) return;
      const v = Math.hypot(s[2], s[3]), r = Math.hypot(s[0], s[1]);
      const d = { pro: [s[2] / v, s[3] / v], retro: [-s[2] / v, -s[3] / v], out: [s[0] / r, s[1] / r], in: [-s[0] / r, -s[1] / r] }[b.dataset.dir];
      s[2] += d[0] * step; s[3] += d[1] * step; spent += step; burnFx = 1;
      check();
    }));
    function check() {
      const el = P.elements(...s);
      CH.forEach(([n, f], i) => { if (!done[i] && f(el)) { done[i] = true; RA.toast('Challenge complete: ' + n.replace('…', '')); } });
      paintCh();
    }
    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      RA.drawStars(ctx, stars, w, h, t, 0.5);
      if (!dead) {
        const simT = dt * warp, n = Math.max(1, Math.ceil(simT / 8));
        for (let i = 0; i < n; i++) {
          s = P.twoBody(s, simT / n);
          if (Math.hypot(s[0], s[1]) < P.RE + 100e3) { dead = true; check(); break; }
        }
      }
      const el = P.elements(...s), r = Math.hypot(s[0], s[1]);
      let ext = Math.max(P.RE + 1500e3, r);
      if (el.e < 1) ext = Math.max(ext, Math.min(el.ra, 12 * P.RE)); else ext = Math.max(ext, 8 * P.RE);
      const kt = (Math.min(w, h) / 2 - 18) / ext;
      k = k == null ? kt : RA.lerp(k, kt, Math.min(1, dt * 3));
      const cx = w / 2, cy = h / 2, S = (x, y) => [cx + x * k, cy - y * k];
      drawEarth(ctx, cx, cy, P.RE * k);
      ctx.strokeStyle = 'rgba(255,77,109,.35)'; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, (P.RE + 100e3) * k, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      // orbit conic
      ctx.strokeStyle = el.e < 1 ? RA.c.green : RA.c.violet; ctx.lineWidth = 1.8;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i <= 360; i++) {
        const th = (i / 360) * TAU, den = 1 + el.e * Math.cos(th - el.w);
        if (den <= 0.03) { first = true; continue; }
        const rr = el.p / den; if (rr > 30 * P.RE) { first = true; continue; }
        const [x, y] = S(rr * Math.cos(th), rr * Math.sin(th));
        first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false;
      }
      ctx.stroke();
      // apsides
      if (el.e > 0.002) {
        const [pxp, pyp] = S(el.rp * Math.cos(el.w), el.rp * Math.sin(el.w));
        dot(ctx, pxp, pyp, 4, RA.c.cyan); label(ctx, 'Pe ' + km(el.rp - P.RE), pxp + 8, pyp + 4, RA.c.cyan);
        if (el.e < 1 && el.ra < 30 * P.RE) {
          const [pxa, pya] = S(-el.ra * Math.cos(el.w), -el.ra * Math.sin(el.w));
          dot(ctx, pxa, pya, 4, RA.c.flame2); label(ctx, 'Ap ' + km(el.ra - P.RE), pxa + 8, pya + 4, RA.c.flame2);
        }
      }
      // trail + ship
      trail.push(S(s[0], s[1])); if (trail.length > 90) trail.shift();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); trail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      const [sx, sy] = S(s[0], s[1]);
      if (burnFx > 0) { flash(ctx, sx, sy, burnFx); burnFx -= dt * 2.5; }
      if (dead) {
        flash(ctx, sx, sy, 0.6 + 0.4 * Math.sin(t * 10));
        ctx.font = '600 13px "JetBrains Mono", monospace'; ctx.fillStyle = RA.c.red; ctx.textAlign = 'center';
        ctx.fillText('RE-ENTRY — press Reset orbit', cx, 22);
      } else ship(ctx, sx, sy, Math.atan2(-s[3], s[2]), '#fff', 1.2);
      label(ctx, `time ×${warp}`, w - 10, h - 10, RA.c.dim, 'right');
      // readouts
      $('#mnAp').textContent = el.e < 1 ? km(el.ra - P.RE) : '∞ (escape)';
      $('#mnPe').textContent = km(el.rp - P.RE);
      $('#mnE').textContent = el.e.toFixed(3);
      $('#mnT').textContent = el.e < 1 ? dur(P.period(el.a)) : '—';
      $('#mnV').textContent = kms(Math.hypot(s[2], s[3]));
      $('#mnDv').textContent = ms(spent);
    });

    // plane change
    const I = $('#pcI');
    let alt = 400e3;
    function pc() {
      const v = P.vCirc(P.RE + alt), di = (+I.value * Math.PI) / 180;
      $('#pcIv').textContent = (+I.value).toFixed(1) + '°';
      $('#pcV').textContent = kms(v);
      $('#pcDv').textContent = kms(P.planeChange(v, di));
    }
    RA.seg($('#pcWhere'), (d) => { alt = +d.alt * 1000; pc(); });
    I.addEventListener('input', pc);
    pc();
  })();
})();
