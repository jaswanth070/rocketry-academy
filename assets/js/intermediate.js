/* Rocketry Academy — Level 02 labs */
(function () {
  const RA = window.RA, P = RA.phys, $ = RA.$, $$ = RA.$$;
  const classOf = (I) => (P.classes.find((c) => I <= c.hi) || P.classes[P.classes.length - 1]);
  const kms = (v) => (v >= 1000 ? (v / 1000).toFixed(2) + ' km/s' : v.toFixed(0) + ' m/s');

  /* =========================================================
     I1 — Thrust curves & grain geometry
     ========================================================= */
  (function thrust() {
    const gc = $('#grainCanvas'), tc = $('#thrustCanvas'), T = $('#tcT'), B = $('#tcB');
    let type = 'core', curve = [], peak = 0, cursor = null, play = null;
    RA.seg($('#grainType'), (d) => { type = d.g; calc(); });
    [T, B].forEach((e) => e.addEventListener('input', calc));
    function calc() {
      const raw = P.grainCurve(type), mean = raw.reduce((a, b) => a + b, 0) / raw.length;
      const avg = +T.value, tb = +B.value;
      curve = raw.map((c) => (avg * c) / mean);
      peak = Math.max(...curve);
      const I = avg * tb, c = classOf(I);
      $('#tcTv').textContent = avg + ' N';
      $('#tcBv').textContent = tb.toFixed(1) + ' s';
      $('#tcI').textContent = I.toFixed(1) + ' N·s';
      $('#tcC').textContent = c.name + (c.name.length === 1 ? ' class' : '');
      $('#tcP').textContent = peak.toFixed(1) + ' N';
    }
    calc();
    const pos = (e) => { const r = tc.getBoundingClientRect(); return (e.clientX - r.left) / r.width; };
    tc.addEventListener('pointermove', (e) => { cursor = pos(e); });
    tc.addEventListener('pointerdown', (e) => { cursor = pos(e); });
    tc.addEventListener('pointerleave', () => { cursor = null; $('#tcCur').textContent = '—'; });
    $('#tcPlay').addEventListener('click', () => { play = { t: 0 }; });

    function drawGrain(ctx, w, h, wf, t) {
      const cx = w / 2, cy = h / 2 + 6, R = Math.min(w, h) * 0.36;
      ctx.font = '10px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = RA.c.dim;
      ctx.fillText(type === 'end' ? 'SIDE VIEW' : 'CROSS-SECTION', cx, 16);
      const glow = 0.7 + 0.3 * Math.sin(t * 30);
      if (type === 'end') {
        const L = R * 2.2, x0 = cx - L / 2, hh = R * 1.1;
        ctx.strokeStyle = RA.c.line2; ctx.lineWidth = 2; ctx.strokeRect(x0, cy - hh / 2, L, hh);
        const left = x0 + L * wf;
        ctx.fillStyle = '#4a3a2a'; ctx.fillRect(left, cy - hh / 2 + 2, x0 + L - left - 2, hh - 4);
        if (wf < 1) { ctx.fillStyle = `rgba(255,140,50,${glow})`; ctx.fillRect(left - 3, cy - hh / 2 + 2, 4, hh - 4); }
        ctx.fillStyle = RA.c.dim; ctx.fillText('← burning face moves forward', cx, cy + hh / 2 + 18);
        return;
      }
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.clip();
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.beginPath();
      if (type === 'star') {
        const ri = R * (0.22 + 0.78 * wf), ro = R * (0.62 + 0.78 * wf), n = 6;
        for (let i = 0; i <= n * 2; i++) {
          const a = (i / (n * 2)) * 6.283 - Math.PI / 2, rr = i % 2 ? ri : ro;
          i ? ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        ctx.closePath();
      } else {
        const r0 = type === 'bates' ? 0.35 : 0.3;
        ctx.arc(cx, cy, R * (r0 + (1 - r0) * wf), 0, 6.283);
      }
      ctx.fillStyle = '#05070d'; ctx.fill();
      if (wf > 0 && wf < 1) {
        ctx.strokeStyle = `rgba(255,140,50,${glow})`; ctx.lineWidth = 3; ctx.shadowColor = RA.c.flame; ctx.shadowBlur = 12; ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = RA.c.line2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
      if (type === 'bates') { ctx.fillStyle = RA.c.dim; ctx.fillText('+ exposed segment ends', cx, h - 6); }
    }

    RA.animate(tc, (t, dt) => {
      const tb = +B.value;
      let tau = null;
      if (play) { play.t += dt / Math.max(1.6, tb); tau = Math.min(1, play.t); if (play.t > 1.3) play = null; }
      else if (cursor != null) tau = RA.clamp((cursor * tc.clientWidth - 46) / (tc.clientWidth - 60), 0, 1);

      const G = RA.fit(gc); G.ctx.clearRect(0, 0, G.w, G.h);
      drawGrain(G.ctx, G.w, G.h, tau == null ? 0 : tau, t);

      const { ctx, w, h } = RA.fit(tc);
      ctx.clearRect(0, 0, w, h);
      const pts = curve.map((v, i) => [(i / (curve.length - 1)) * tb, v]);
      const yMax = RA.niceMax(peak * 1.15);
      const ch = RA.chart(ctx, w, h, { xMax: tb, yMax, xLabel: 'time (s)', yLabel: 'thrust (N)', series: [{ pts, color: RA.c.flame, fill: 'rgba(255,107,44,.28)', width: 2.5 }] });
      if (tau != null) {
        const n = Math.round(tau * (curve.length - 1));
        const part = pts.slice(0, n + 1);
        if (part.length > 1) {
          ctx.save(); ctx.beginPath();
          part.forEach(([x, y], i) => (i ? ctx.lineTo(ch.X(x), ch.Y(y)) : ctx.moveTo(ch.X(x), ch.Y(y))));
          ctx.lineTo(ch.X(part[part.length - 1][0]), ch.Y(0)); ctx.lineTo(ch.X(0), ch.Y(0)); ctx.closePath();
          ctx.fillStyle = 'rgba(255,209,102,.35)'; ctx.fill(); ctx.restore();
        }
        const x = ch.X(tau * tb);
        ctx.strokeStyle = RA.c.yellow; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, ch.pad.t); ctx.lineTo(x, ch.pad.t + ch.ph); ctx.stroke();
        const imp = part.reduce((a, p, i) => (i ? a + ((p[1] + part[i - 1][1]) / 2) * (p[0] - part[i - 1][0]) : 0), 0);
        $('#tcCur').textContent = `${curve[n].toFixed(0)} N · ${imp.toFixed(0)} N·s`;
      }
    });
  })();

  /* =========================================================
     I2 — Rocket equation
     ========================================================= */
  (function rocketEq() {
    const I = $('#reI'), F = $('#reF'), cv = $('#reCanvas');
    let cur = {};
    function calc() {
      const isp = +I.value, f = +F.value / 100, mr = 1 / (1 - f), dv = P.deltaV(isp, 1, 1 - f);
      cur = { isp, mr, dv };
      $('#reIv').textContent = isp + ' s';
      $('#reFv').textContent = (+F.value).toFixed(1) + ' %';
      $('#reMR').textContent = mr.toFixed(2);
      $('#reVe').textContent = kms(isp * P.g0);
      $('#reDv').textContent = kms(dv);
      $('#reTank').style.height = f * 100 + '%';
      const bar = $('#reBar');
      bar.style.width = Math.min(100, (dv / 15000) * 100) + '%';
      bar.classList.toggle('orbit', dv >= 9400);
    }
    [I, F].forEach((e) => e.addEventListener('input', calc));
    calc();
    RA.animate(cv, () => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      const mk = (isp) => Array.from({ length: 120 }, (_, i) => { const mr = 1 + (i / 119) * 24; return [mr, P.deltaV(isp, mr, 1) / 1000]; });
      const ch = RA.chart(ctx, w, h, {
        xMin: 1, xMax: 25, yMax: 16, xLabel: 'mass ratio m₀/m_f', yLabel: 'Δv (km/s)',
        series: [
          { pts: mk(80), color: RA.c.dim, width: 1.5, dash: [4, 4] },
          { pts: mk(450), color: RA.c.violet, width: 1.5, dash: [4, 4] },
          { pts: mk(cur.isp), color: RA.c.flame, width: 2.5 },
        ],
      });
      ctx.strokeStyle = 'rgba(61,220,151,.6)'; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(ch.pad.l, ch.Y(9.4)); ctx.lineTo(ch.pad.l + ch.pw, ch.Y(9.4)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '10px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
      ctx.fillStyle = RA.c.green; ctx.fillText('LEO ≈ 9.4', ch.pad.l + 6, ch.Y(9.4) - 6);
      ctx.fillStyle = RA.c.violet; ctx.fillText('450 s', ch.X(22), ch.Y(P.deltaV(450, 22, 1) / 1000) - 8);
      ctx.fillStyle = RA.c.dim; ctx.fillText('80 s', ch.X(22), ch.Y(P.deltaV(80, 22, 1) / 1000) - 8);
      if (cur.mr <= 25) {
        const x = ch.X(cur.mr), y = ch.Y(Math.min(16, cur.dv / 1000));
        ctx.fillStyle = RA.c.flame2; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.fill();
        ctx.strokeStyle = 'rgba(255,179,71,.4)'; ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.283); ctx.stroke();
      }
    });
  })();

  /* =========================================================
     I3 — Isp comparison
     ========================================================= */
  (function isp() {
    const DATA = [
      { n: 'Black powder', sl: 80, vac: 85, c: '#a87b4f', t: 'Solid · hobby', d: 'Charcoal, sulfur and potassium nitrate. Low performance but cheap, reliable and safe to handle — the propellant in classic Estes-style model motors.' },
      { n: 'KNSU sugar', sl: 125, vac: 140, c: '#d9a441', t: 'Solid · amateur', d: 'Potassium nitrate + sucrose ("rocket candy"). A popular amateur-experimental propellant; only made by experienced builders under research rules.' },
      { n: 'APCP (hobby)', sl: 195, vac: 215, c: RA.c.flame2, t: 'Solid composite', d: 'Ammonium perchlorate, aluminium and a rubbery HTPB binder. Used in high-power reloads (Aerotech, Cesaroni). Grain geometry shapes the thrust curve.' },
      { n: 'APCP (Shuttle SRB)', sl: 242, vac: 268, c: RA.c.flame, t: 'Solid composite', d: 'The Space Shuttle boosters and SLS boosters use APCP at high chamber pressure, reaching ~268 s in vacuum.' },
      { n: 'NTO / UDMH', sl: 285, vac: 316, c: '#e8a0ff', t: 'Liquid · hypergolic', d: 'Ignites on contact — no igniter needed, and storable for years. Toxic. Used in Proton and many spacecraft thrusters.' },
      { n: 'LOX / RP-1', sl: 282, vac: 311, c: RA.c.cyan, t: 'Liquid · kerolox', d: 'Liquid oxygen and refined kerosene. Dense and relatively easy to handle: Saturn V first stage, Falcon 9 (Merlin 1D figures shown).' },
      { n: 'LOX / CH₄', sl: 327, vac: 350, c: '#7ad7ff', t: 'Liquid · methalox', d: 'Liquid oxygen and methane. Burns cleaner than kerosene and is easier to reuse; can in principle be made on Mars. Raptor 2 figures shown.' },
      { n: 'LOX / LH₂', sl: 366, vac: 452, c: RA.c.violet, t: 'Liquid · hydrolox', d: 'The highest-Isp chemical combination in use. Hydrogen is extremely light, so tanks are enormous and cryogenic. RS-25 figures shown.' },
      { n: 'Xenon ion', sl: 0, vac: 3100, c: RA.c.green, t: 'Electric · vacuum only', d: 'Ions accelerated electrostatically. Phenomenal Isp but millinewtons of thrust — useless for launch, perfect for long missions like Dawn.' },
    ];
    const MAX = 460;
    let mode = 'sl';
    const wrap = $('#ispBars'), info = $('#ispInfo');
    DATA.forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'bar-row'; b.type = 'button'; b.dataset.i = i;
      b.innerHTML = `<span class="bar-name">${p.n}</span><span class="bar-track"><span class="bar-fill" style="--c:${p.c}"></span></span><span class="bar-val"></span>`;
      wrap.appendChild(b);
    });
    function paint() {
      $$('.bar-row', wrap).forEach((b, i) => {
        const v = DATA[i][mode];
        $('.bar-fill', b).style.width = Math.min(100, (v / MAX) * 100) + '%';
        $('.bar-val', b).textContent = v ? (v > MAX ? v + ' ⟶' : v + ' s') : 'n/a';
      });
    }
    RA.seg($('#ispMode'), (d) => { mode = d.mode; paint(); });
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('.bar-row'); if (!b) return;
      const p = DATA[+b.dataset.i];
      $$('.bar-row', wrap).forEach((x) => x.classList.toggle('on', x === b));
      info.innerHTML = `<p class="part-name">${p.n}</p><p class="part-desc">${p.d}</p><p class="part-meta">${p.t.toUpperCase()} · SL ${p.sl || 'n/a'} s · VAC ${p.vac} s · vₑ ≈ ${(p.vac * P.g0 / 1000).toFixed(2)} km/s</p>`;
      info.classList.remove('on'); void info.offsetWidth; info.classList.add('on');
    });
    // animate bars in when visible
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { paint(); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(wrap);
  })();

  /* =========================================================
     I4 — Altitude simulator
     ========================================================= */
  (function simulator() {
    const cv = $('#simCanvas'), M = $('#simM'), D = $('#simD'), C = $('#simC');
    let motor = P.motors.C6, res = null, anim = 1;
    const seg = $('#simMotor');
    Object.values(P.motors).forEach((m) => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.m = m.name; b.textContent = m.name;
      if (m.name === 'C6') b.className = 'on';
      seg.appendChild(b);
    });
    RA.seg(seg, (d) => { motor = P.motors[d.m]; run(false); });
    [M, D, C].forEach((e) => e.addEventListener('input', () => { labels(); run(false); }));
    $('#simGo').addEventListener('click', () => run(true));
    function labels() {
      $('#simMv').textContent = M.value + ' g';
      $('#simDv').textContent = (+D.value).toFixed(1) + ' mm';
      $('#simCv').textContent = (+C.value).toFixed(2);
    }
    function run(animate) {
      labels();
      res = P.simulate({ dry: +M.value / 1000, motor, d: +D.value / 1000, cd: +C.value });
      anim = animate ? 0 : 1;
      const v = $('#simVerdict');
      if (!res.liftoff) {
        ['#smAp', '#smV', '#smA', '#smR', '#smDl', '#smBest'].forEach((id) => ($(id).textContent = '—'));
        v.className = 'verdict bad'; v.textContent = `No liftoff — ${motor.name} average thrust is less than the ${((+M.value / 1000 + motor.mass) * P.g0).toFixed(2)} N weight.`;
        return;
      }
      const best = motor.delays.reduce((a, b) => (Math.abs(b - res.idealDelay) < Math.abs(a - res.idealDelay) ? b : a));
      $('#smAp').textContent = res.apogee.toFixed(0) + ' m';
      $('#smV').textContent = res.maxV.toFixed(0) + ' m/s';
      $('#smA').textContent = (res.maxA / P.g0).toFixed(1) + ' g';
      $('#smR').textContent = res.railV.toFixed(1) + ' m/s';
      $('#smDl').textContent = res.idealDelay.toFixed(1) + ' s';
      $('#smBest').textContent = `${motor.name}-${best}`;
      const notes = [];
      let cls = 'good';
      if (+D.value < motor.dia + 1) { notes.push(`a ${motor.dia} mm motor won't fit a ${(+D.value).toFixed(1)} mm body`); cls = 'bad'; }
      if (res.railV < 15) { notes.push(`off-rod speed ${res.railV.toFixed(1)} m/s is below ~15 m/s — use a longer rod or a stronger motor`); if (cls === 'good') cls = 'warn'; }
      if (res.maxV > 300) { notes.push(`max speed approaches Mach 1 — drag rises sharply and this simple model underestimates it`); if (cls === 'good') cls = 'warn'; }
      if (Math.abs(best - res.idealDelay) > 1.5) { notes.push(`no ${motor.name} delay is within 1.5 s of the ideal ${res.idealDelay.toFixed(1)} s`); if (cls === 'good') cls = 'warn'; }
      v.className = 'verdict ' + cls;
      v.textContent = notes.length ? 'Check: ' + notes.join('; ') + '.' : `Clean flight: apogee ${res.apogee.toFixed(0)} m (${(res.apogee * 3.281).toFixed(0)} ft). Fly a ${motor.name}-${best}.`;
    }
    labels(); run(false);
    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      if (!res || !res.liftoff) {
        ctx.fillStyle = RA.c.red; ctx.font = '600 13px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
        ctx.fillText('NO LIFTOFF', w / 2, h / 2);
        return;
      }
      if (anim < 1) anim = Math.min(1, anim + dt / 2.6);
      const tMax = res.tApogee, n = Math.max(2, Math.round(res.t.length * anim));
      const hp = res.t.slice(0, n).map((x, i) => [x, res.h[i]]);
      const vp = res.t.slice(0, n).map((x, i) => [x, Math.max(0, res.v[i])]);
      const yMax = RA.niceMax(res.apogee * 1.1), vMax = RA.niceMax(res.maxV * 1.1);
      const ch = RA.chart(ctx, w, h, {
        xMax: RA.niceMax(tMax), yMax, xLabel: 'time (s)', yLabel: 'altitude (m)', y2: { max: vMax, label: 'velocity (m/s)', color: RA.c.cyan },
        series: [{ pts: hp, color: RA.c.flame, fill: 'rgba(255,107,44,.22)', width: 2.5 }, { pts: vp, color: RA.c.cyan, width: 2, y2: true }],
      });
      ctx.font = '10px "JetBrains Mono", monospace';
      // burnout marker
      if (hp[hp.length - 1][0] >= res.burnout.t) {
        const x = ch.X(res.burnout.t);
        ctx.strokeStyle = 'rgba(255,209,102,.5)'; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, ch.pad.t); ctx.lineTo(x, ch.pad.t + ch.ph); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = RA.c.yellow; ctx.textAlign = 'left'; ctx.fillText('burnout', x + 4, ch.pad.t + ch.ph - 8);
      }
      const [lx, ly] = hp[hp.length - 1];
      if (anim >= 1) {
        ctx.fillStyle = RA.c.flame2; ctx.beginPath(); ctx.arc(ch.X(lx), ch.Y(ly), 5, 0, 6.283); ctx.fill();
        ctx.textAlign = 'right'; ctx.fillText(`apogee ${res.apogee.toFixed(0)} m @ ${tMax.toFixed(1)} s`, ch.X(lx) - 8, ch.Y(ly) - 8);
      } else {
        RA.drawFlame(ctx, ch.X(lx), ch.Y(ly) + 8, 0.16, 0, lx < res.burnout.t ? 1 : 0, t);
        RA.drawRocket(ctx, ch.X(lx), ch.Y(ly) + 8, 0.16);
      }
    });
  })();

  /* =========================================================
     I5 — Recovery
     ========================================================= */
  (function recovery() {
    const cv = $('#chuteCanvas'), M = $('#chM'), D = $('#chD'), W = $('#chW'), H = $('#chH');
    let cd = 0.75, r = {}, fall = 0, drift = 0;
    RA.seg($('#chType'), (d) => { cd = +d.cd; calc(); });
    [M, D, W, H].forEach((e) => e.addEventListener('input', calc));
    function calc() {
      const m = +M.value / 1000, d = +D.value / 100, w = +W.value, h = +H.value;
      const v = P.descentRate(m, d, cd);
      r = { v, d, w, h, E: 0.5 * m * v * v, drift: (w * h) / v, ideal: P.chuteFor(m, 4.5, cd) };
      $('#chMv').textContent = (+M.value >= 1000 ? (+M.value / 1000).toFixed(2) + ' kg' : M.value + ' g');
      $('#chDv').textContent = D.value + ' cm';
      $('#chWv').textContent = W.value + ' m/s';
      $('#chHv').textContent = H.value + ' m';
      $('#chV').textContent = v.toFixed(1) + ' m/s';
      $('#chE').textContent = r.E.toFixed(r.E < 10 ? 2 : 0) + ' J';
      $('#chDr').textContent = r.drift.toFixed(0) + ' m';
      $('#chIdeal').textContent = (r.ideal * 100).toFixed(0) + ' cm';
      const el = $('#chVerdict');
      if (v > 6.5) { el.className = 'verdict bad'; el.textContent = `Too fast — ${v.toFixed(1)} m/s risks cracked fins. Go up to ~${(r.ideal * 100).toFixed(0)} cm.`; }
      else if (v > 5.5) { el.className = 'verdict warn'; el.textContent = 'A bit quick. Fine for sturdy rockets on soft ground.'; }
      else if (v < 3) { el.className = 'verdict warn'; el.textContent = `Very gentle, but it will drift ~${r.drift.toFixed(0)} m. Consider a smaller chute or a spill hole.`; }
      else { el.className = 'verdict good'; el.textContent = `Good descent rate. Expect it to land about ${r.drift.toFixed(0)} m downwind.`; }
    }
    calc();
    const clouds = Array.from({ length: 16 }, () => ({ x: Math.random(), y: Math.random(), r: 14 + Math.random() * 30 }));
    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      fall += r.v * dt * 18; drift += r.w * dt * 18;
      // parallax puffs: moving up = we fall; moving left = we drift right
      for (const c of clouds) {
        const y = (((c.y * h - fall * (c.r / 30)) % (h + 80)) + h + 80) % (h + 80) - 40;
        const x = (((c.x * w - drift * (c.r / 40)) % (w + 80)) + w + 80) % (w + 80) - 40;
        ctx.fillStyle = 'rgba(139,151,176,.08)';
        ctx.beginPath(); ctx.arc(x, y, c.r, 0, 6.283); ctx.arc(x + c.r * 0.8, y + 4, c.r * 0.7, 0, 6.283); ctx.fill();
      }
      const R = RA.clamp(r.d * 120, 14, w * 0.42), sway = Math.sin(t * 1.5) * 0.06 + r.w * 0.012;
      const cx = w / 2, cy = h * 0.28;
      RA.drawChute(ctx, cx, cy, R, sway);
      const ex = cx + Math.sin(sway) * R * 1.9, ey = cy + Math.cos(sway) * R * 1.9;
      RA.drawRocket(ctx, ex, ey + 70 * 0.5, 0.5, sway * 0.8);
      // drag/weight arrows
      RA.arrow(ctx, cx + R + 18, cy + R * 0.2, cx + R + 18, cy + R * 0.2 - 42, RA.c.red, 3, 'drag');
      RA.arrow(ctx, ex - 34, ey, ex - 34, ey + 42, RA.c.cyan, 3, 'weight');
      ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillStyle = RA.c.green;
      ctx.fillText(`↓ ${r.v.toFixed(1)} m/s`, 10, 20);
      ctx.fillStyle = RA.c.muted; ctx.fillText(`→ ${r.w} m/s wind`, 10, 38);
    });
  })();

  /* =========================================================
     I6 — Nozzle
     ========================================================= */
  (function nozzle() {
    const cv = $('#nozzleCanvas'), E = $('#nzE'), Pc = $('#nzP'), H = $('#nzH');
    const g = 1.2;
    let st = {};
    const fp = (p) => (p >= 1e6 ? (p / 1e6).toFixed(2) + ' MPa' : p >= 1000 ? (p / 1000).toFixed(1) + ' kPa' : p.toFixed(p < 10 ? 2 : 0) + ' Pa');
    function calc() {
      const eps = +E.value, p0 = +Pc.value * 1e6, hkm = +H.value;
      const Me = P.machFromAR(eps, g), pe = p0 * P.pRatio(Me, g), pa = P.pAtm(hkm * 1000);
      const cf = P.thrustCoef(g, pe / p0, pa / p0, eps);
      st = { eps, Me, pe, pa, ratio: pe / pa, cf };
      $('#nzEv').textContent = eps.toFixed(1);
      $('#nzPv').textContent = (+Pc.value).toFixed(1) + ' MPa';
      $('#nzHv').textContent = hkm.toFixed(1) + ' km';
      $('#nzM').textContent = Me.toFixed(2);
      $('#nzPe').textContent = fp(pe);
      $('#nzPa').textContent = fp(pa);
      $('#nzCf').textContent = cf.toFixed(3);
      // best ratio at this altitude: pe = pa
      let lo = 1.01, hi = 2000;
      for (let i = 0; i < 60; i++) { const mid = Math.sqrt(lo * hi); (p0 * P.pRatio(P.machFromAR(mid, g), g) > pa ? (lo = mid) : (hi = mid)); }
      const best = Math.sqrt(lo * hi);
      const v = $('#nzVerdict'), r = st.ratio;
      const tip = best > 1000 ? ' (near vacuum, ideal ε is impractically large)' : ` — ideal ε here ≈ ${best.toFixed(best < 10 ? 1 : 0)}`;
      if (r < 0.4) { v.className = 'verdict bad'; v.textContent = `Severely over-expanded (pₑ/pₐ = ${r.toFixed(2)}). Flow likely separates from the wall — side loads and lost thrust${tip}.`; }
      else if (r < 0.85) { v.className = 'verdict warn'; v.textContent = `Over-expanded (pₑ/pₐ = ${r.toFixed(2)}). Ambient air pinches the plume; shock diamonds form${tip}.`; }
      else if (r <= 1.18) { v.className = 'verdict good'; v.textContent = `Ideally expanded (pₑ ≈ pₐ). Maximum thrust coefficient for this altitude${tip}.`; }
      else { v.className = 'verdict warn'; v.textContent = `Under-expanded (pₑ/pₐ = ${r > 100 ? r.toExponential(1) : r.toFixed(1)}). The plume balloons outward — a longer bell would extract more thrust${tip}.`; }
    }
    [E, Pc, H].forEach((e) => e.addEventListener('input', calc));
    calc();
    RA.animate(cv, (t) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      // sky darkens with altitude
      const alt = +H.value / 80;
      ctx.fillStyle = `rgba(30,60,110,${0.35 * (1 - alt)})`; ctx.fillRect(0, 0, w, h);
      const cy = h / 2, maxR = h / 2 - 16;
      const rt = Math.min(16, maxR / Math.sqrt(st.eps)), re = rt * Math.sqrt(st.eps), rc = Math.min(maxR * 0.7, rt * 2.6);
      const xc0 = 14, xc1 = xc0 + 60, xt = xc1 + 34;
      const xe = xt + Math.min(w * 0.42, Math.max(30, (re - rt) / Math.tan(0.30)));
      // nozzle wall path (upper), mirrored
      const wall = (sg) => {
        ctx.beginPath();
        ctx.moveTo(xc0, cy - sg * rc); ctx.lineTo(xc1, cy - sg * rc);
        ctx.quadraticCurveTo(xc1 + 20, cy - sg * rc, xt, cy - sg * rt);
        ctx.quadraticCurveTo(xt + (xe - xt) * 0.3, cy - sg * (rt + (re - rt) * 0.55), xe, cy - sg * re);
      };
      // gas fill gradient: hot chamber → cooler exit
      const gg = ctx.createLinearGradient(xc0, 0, xe, 0);
      gg.addColorStop(0, 'rgba(255,240,200,.9)');
      gg.addColorStop((xt - xc0) / (xe - xc0), 'rgba(255,190,90,.9)');
      gg.addColorStop(1, `rgba(255,${Math.round(120 - 60 * Math.min(1, st.Me / 5))},40,.75)`);
      ctx.beginPath();
      ctx.moveTo(xc0, cy - rc); ctx.lineTo(xc1, cy - rc); ctx.quadraticCurveTo(xc1 + 20, cy - rc, xt, cy - rt);
      ctx.quadraticCurveTo(xt + (xe - xt) * 0.3, cy - (rt + (re - rt) * 0.55), xe, cy - re);
      ctx.lineTo(xe, cy + re);
      ctx.quadraticCurveTo(xt + (xe - xt) * 0.3, cy + (rt + (re - rt) * 0.55), xt, cy + rt);
      ctx.quadraticCurveTo(xc1 + 20, cy + rc, xc1, cy + rc); ctx.lineTo(xc0, cy + rc); ctx.closePath();
      ctx.fillStyle = gg; ctx.fill();
      // plume
      const r = st.ratio, L = w - xe;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const sep = r < 0.4;
      const startR = sep ? re * (0.55 + r) : re;
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const k = i / 40;
        let rr;
        if (r > 1.18) { const bulge = Math.min(2.8, Math.log10(r) * 0.9 + 0.3); rr = startR * (1 + bulge * Math.sin(Math.min(1, k * 1.6) * Math.PI / 2)); }
        else if (r >= 0.85) rr = startR * (1 + 0.15 * k);
        else { const pinch = 0.45 + 0.5 * r; rr = startR * (pinch + (1 - pinch) * Math.abs(Math.cos(k * Math.PI * 2.5))) * (1 + 0.2 * k); }
        rr *= 1 + 0.03 * Math.sin(t * 40 + i);
        pts.push([xe + k * L, Math.min(rr, cy - 2)]);
      }
      const pg = ctx.createLinearGradient(xe, 0, w, 0);
      pg.addColorStop(0, 'rgba(255,170,80,.55)'); pg.addColorStop(1, 'rgba(255,90,40,0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.moveTo(pts[0][0] - (sep ? 14 : 0), cy - pts[0][1]);
      pts.forEach(([x, y]) => ctx.lineTo(x, cy - y));
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], cy + pts[i][1]);
      ctx.closePath(); ctx.fill();
      // shock diamonds
      if (r < 0.85 || r > 2) {
        const cell = r < 0.85 ? L / 5 : L / 3.2;
        for (let i = 0; i < 5; i++) {
          const x = xe + cell * (i + 0.5), a = 0.55 * (1 - i / 5);
          const rd = ctx.createRadialGradient(x, cy, 0, x, cy, re * 0.6);
          rd.addColorStop(0, `rgba(255,255,230,${a})`); rd.addColorStop(1, 'rgba(255,200,120,0)');
          ctx.fillStyle = rd; ctx.beginPath(); ctx.ellipse(x, cy, re * 0.6, re * 0.35, 0, 0, 6.283); ctx.fill();
        }
      }
      ctx.restore();
      // walls on top
      ctx.strokeStyle = '#c9d2e3'; ctx.lineWidth = 3;
      wall(1); ctx.stroke(); wall(-1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xc0, cy - rc); ctx.lineTo(xc0, cy + rc); ctx.stroke();
      // labels
      ctx.font = '600 10px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#3a2410';
      ctx.fillText('CHAMBER', (xc0 + xc1) / 2, cy + 3);
      ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillStyle = RA.c.muted;
      ctx.fillText('M≈0', (xc0 + xc1) / 2, cy + rc + 12);
      ctx.fillText('THROAT M=1', xt, Math.min(h - 4, cy + rc + 12));
      ctx.fillText(`EXIT M=${st.Me.toFixed(1)}`, xe, Math.min(h - 4, cy + re + 12));
      ctx.textAlign = 'right'; ctx.fillStyle = RA.c.dim;
      ctx.fillText(`ALT ${(+H.value).toFixed(0)} km`, w - 8, 14);
    });
  })();

  /* =========================================================
     I7 — Staging
     ========================================================= */
  (function staging() {
    const cv = $('#stageCanvas'), Pp = $('#sgP'), S = $('#sgS'), I = $('#sgI'), F = $('#sgF');
    let r = {}, fly = null, debris = [];
    function calc() {
      const pay = +Pp.value, eps = +S.value / 100, isp = +I.value, f = +F.value / 100, Ms = 100 - pay;
      const dv1 = P.deltaV(isp, 100, pay + eps * Ms);
      const M1 = f * Ms, M2 = (1 - f) * Ms;
      const a = P.deltaV(isp, 100, 100 - (1 - eps) * M1), b = P.deltaV(isp, pay + M2, pay + eps * M2);
      r = { pay, eps, isp, f, Ms, M1, M2, dv1, dv2: a + b, a, b };
      $('#sgPv').textContent = pay.toFixed(1) + ' %';
      $('#sgSv').textContent = (+S.value).toFixed(1) + ' %';
      $('#sgIv').textContent = isp + ' s';
      $('#sgFv').textContent = F.value + ' %';
      $('#sgD1').textContent = kms(dv1);
      $('#sgD2').textContent = kms(r.dv2);
      $('#sgGain').textContent = '+' + ((r.dv2 / dv1 - 1) * 100).toFixed(0) + ' %';
      $('#sgOrbit').textContent = r.dv2 >= 9400 ? (dv1 >= 9400 ? 'Both ✓' : '2-stage ✓') : 'Neither';
      $('#sgOrbit').style.color = r.dv2 >= 9400 ? RA.c.green : RA.c.red;
    }
    [Pp, S, I, F].forEach((e) => e.addEventListener('input', () => { calc(); fly = null; debris = []; }));
    calc();
    $('#sgGo').addEventListener('click', () => { fly = { t: 0 }; debris = []; });

    function stack(ctx, x, y, segs, wd, t, burning) {
      // y = bottom; segs bottom→top [{h,c}]
      let yy = y;
      if (burning) RA.drawFlame(ctx, x, y, wd / 20, 0, 1, t);
      segs.forEach((s) => {
        ctx.fillStyle = s.c; ctx.fillRect(x - wd / 2, yy - s.h, wd, s.h);
        ctx.strokeStyle = 'rgba(5,7,13,.5)'; ctx.strokeRect(x - wd / 2, yy - s.h, wd, s.h);
        yy -= s.h;
      });
      ctx.fillStyle = RA.c.flame;
      ctx.beginPath(); ctx.moveTo(x - wd / 2, yy); ctx.quadraticCurveTo(x - wd / 2, yy - wd, x, yy - wd * 1.4); ctx.quadraticCurveTo(x + wd / 2, yy - wd, x + wd / 2, yy); ctx.fill();
      return yy;
    }
    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      const top = 26, gY = h - 18, lanes = [w * 0.3, w * 0.7];
      const dvMax = Math.max(9400, r.dv2) * 1.08;
      const Yv = (dv) => gY - 120 - (dv / dvMax) * (gY - 120 - top);
      // orbit line
      ctx.strokeStyle = 'rgba(61,220,151,.5)'; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(0, Yv(9400)); ctx.lineTo(w, Yv(9400)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillStyle = RA.c.green; ctx.textAlign = 'left';
      ctx.fillText('LEO 9.4 km/s', 6, Yv(9400) - 5);
      ctx.fillStyle = '#0a1120'; ctx.fillRect(0, gY, w, h - gY);
      // progress
      let p = 0;
      if (fly) { fly.t += dt; p = Math.min(1, fly.t / 3.6); }
      const used = p; // fraction of total propellant burned (same burn rate both rockets)
      // single stage
      const prop = (1 - r.eps) * r.Ms;
      const dvS = P.deltaV(r.isp, 100, 100 - used * prop);
      // two stage: stage 1 holds share f of propellant
      const s1 = r.f, dvT = used <= s1 ? P.deltaV(r.isp, 100, 100 - (used / s1) * (1 - r.eps) * r.M1)
        : r.a + P.deltaV(r.isp, r.pay + r.M2, r.pay + r.M2 - ((used - s1) / (1 - s1)) * (1 - r.eps) * r.M2);
      const k = 1.1; // px per mass unit for drawing
      const hTot = Math.min(110, r.Ms * k);
      // lane 1
      const y1 = Yv(dvS) + 110;
      stack(ctx, lanes[0], y1, [{ h: hTot * (1 - r.pay / 100) * (1 - 0.6 * used), c: '#c9d2e3' }, { h: 10, c: RA.c.cyan }], 18, t, fly && p < 1);
      // lane 2
      const y2 = Yv(dvT) + 110;
      const sepd = used > s1;
      if (sepd && !debris.length && fly) debris.push({ x: lanes[1], y: y2, vy: 0, a: 0, h: hTot * r.f * 0.55 });
      if (!sepd) stack(ctx, lanes[1], y2, [{ h: hTot * r.f * (1 - 0.6 * used / s1), c: '#9aa6bd' }, { h: hTot * (1 - r.f), c: '#e8edf5' }, { h: 10, c: RA.c.cyan }], 18, t, fly && p < 1);
      else stack(ctx, lanes[1], y2, [{ h: hTot * (1 - r.f) * (1 - 0.6 * (used - s1) / (1 - s1)), c: '#e8edf5' }, { h: 10, c: RA.c.cyan }], 14, t, p < 1);
      for (const d of debris) {
        d.vy += 140 * dt; d.y += d.vy * dt; d.a += dt * 2.4;
        ctx.save(); ctx.translate(d.x + d.a * 8, d.y); ctx.rotate(d.a);
        ctx.fillStyle = '#6b768c'; ctx.fillRect(-9, -d.h, 18, d.h); ctx.restore();
      }
      // labels
      ctx.textAlign = 'center'; ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = RA.c.text; ctx.fillText('1 STAGE', lanes[0], gY + 13); ctx.fillText('2 STAGES', lanes[1], gY + 13);
      ctx.fillStyle = dvS >= 9400 ? RA.c.green : RA.c.flame2; ctx.fillText(kms(dvS), lanes[0] + 54, Math.max(top + 10, Yv(dvS)));
      ctx.fillStyle = dvT >= 9400 ? RA.c.green : RA.c.flame2; ctx.fillText(kms(dvT), lanes[1] + 54, Math.max(top + 10, Yv(dvT)));
      if (sepd && fly && fly.t < 2.8) { ctx.fillStyle = RA.c.yellow; ctx.fillText('STAGE SEP', lanes[1] - 64, Yv(r.a) + 60); }
    });
  })();
})();
