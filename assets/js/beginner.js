/* Rocketry Academy — Level 01 labs */
(function () {
  const RA = window.RA, P = RA.phys, $ = RA.$, $$ = RA.$$;

  /* =========================================================
     B1 — Anatomy
     ========================================================= */
  (function anatomy() {
    const PARTS = {
      nose: ['Nose cone', 'Splits the air smoothly at the front of the rocket. Ogive, conical and parabolic shapes trade drag against ease of manufacture. It also pops off at ejection so the parachute can come out.', 'Blow-moulded plastic, balsa, 3D-printed PLA/PETG · fibreglass on high power'],
      chute: ['Parachute', 'Folded inside the body tube. The ejection charge pushes it out near apogee, slowing the rocket to a gentle 3–6 m/s descent.', 'Ripstop nylon or thin plastic sheet · see I5 for sizing'],
      cord: ['Shock cord', 'Links the nose cone to the body. It absorbs the violent jolt of ejection so the nose cone isn\'t lost and the tube isn\'t "zippered".', 'Elastic, with Kevlar at the hot motor end'],
      wadding: ['Recovery wadding', 'Flame-resistant tissue packed between the motor and the parachute. It shields the chute from the hot ejection gases.', 'Treated paper · reusable Nomex blanket, piston or baffle'],
      body: ['Body tube', 'The airframe. Holds everything together and sets the reference diameter — the "caliber" — used for stability calculations.', 'Spiral-wound kraft paper · phenolic, fibreglass or carbon fibre on high power'],
      lug: ['Launch lug', 'A small tube on the side that slides over the launch rod, guiding the rocket until it is moving fast enough for the fins to work.', 'Paper straw · rail buttons on larger rockets'],
      mount: ['Motor mount', 'Inner tube plus centering rings. Keeps the motor centred and transfers its thrust into the airframe. An engine hook or retainer stops the motor kicking out backwards at ejection.', 'Paper tube, card or plywood rings, metal engine hook'],
      motor: ['Motor', 'Single-use solid motor: nozzle, propellant, delay element and ejection charge in one casing. The printed code tells you its power — see B5.', 'Black powder in a paper casing · composite (APCP) reloads on larger rockets'],
      fins: ['Fins', 'Three or four fins at the tail pull the centre of pressure rearward. That is what keeps the rocket flying straight — see B6.', 'Balsa, basswood, plywood · G10 fibreglass on high power'],
    };
    const svg = $('#anatomySvg'), info = $('#partInfo'), chips = $('#partChips');
    Object.entries(PARTS).forEach(([k, v]) => {
      const c = document.createElement('button');
      c.className = 'chip'; c.type = 'button'; c.dataset.part = k; c.textContent = v[0];
      chips.appendChild(c);
    });
    function select(k) {
      $$('.part', svg).forEach((p) => p.classList.toggle('on', p.dataset.part === k));
      $$('.chip', chips).forEach((c) => c.classList.toggle('on', c.dataset.part === k));
      svg.classList.add('dim');
      const [n, d, m] = PARTS[k];
      info.innerHTML = `<p class="part-name">${n}</p><p class="part-desc">${d}</p><p class="part-meta">MATERIAL · ${m}</p>`;
      info.classList.remove('on'); void info.offsetWidth; info.classList.add('on');
    }
    svg.addEventListener('click', (e) => { const p = e.target.closest('.part'); if (p) select(p.dataset.part); });
    svg.addEventListener('keydown', (e) => { const p = e.target.closest('.part'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(p.dataset.part); } });
    chips.addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (c) select(c.dataset.part); });
    const ex = $('#explodeBtn');
    ex.addEventListener('click', () => {
      const on = !svg.classList.contains('exploded');
      svg.classList.toggle('exploded', on);
      ex.setAttribute('aria-pressed', on);
      ex.textContent = on ? 'Assemble' : 'Explode view';
    });
  })();

  /* =========================================================
     B2 — Newton: thrust vs weight
     ========================================================= */
  (function newton() {
    const cv = $('#newtonCanvas'), T = $('#nwT'), M = $('#nwM'), go = $('#nwGo');
    let run = null; // {t, a, burn, scale, peak}
    const stars = RA.makeStars(60, 3);
    function calc() {
      const thrust = +T.value, mass = +M.value, W = mass * P.g0, r = thrust / W;
      const a = r > 1 ? (thrust - W) / mass : 0;
      $('#nwTv').textContent = thrust.toFixed(1) + ' N';
      $('#nwMv').textContent = mass.toFixed(2) + ' kg';
      $('#nwW').textContent = W.toFixed(2) + ' N';
      $('#nwR').textContent = r.toFixed(1) + ' : 1';
      $('#nwA').textContent = a.toFixed(1) + ' m/s²';
      $('#nwH').textContent = (0.5 * a).toFixed(1) + ' m';
      const v = $('#nwVerdict');
      if (r <= 1) { v.className = 'verdict bad'; v.textContent = 'Thrust is less than weight — the rocket stays on the pad. Net force is zero (first law).'; }
      else if (r < 5) { v.className = 'verdict warn'; v.textContent = `It lifts off, but only at ${(a / P.g0).toFixed(1)} g. Too slow off the rod to be stable — aim for at least 5 : 1.`; }
      else { v.className = 'verdict good'; v.textContent = `Healthy ${r.toFixed(1)} : 1 thrust-to-weight. Accelerating at ${(a / P.g0).toFixed(1)} g.`; }
      return { thrust, mass, W, r, a };
    }
    [T, M].forEach((el) => el.addEventListener('input', () => { calc(); run = null; }));
    calc();
    go.addEventListener('click', () => {
      const c = calc();
      const v1 = c.a * 1, h1 = 0.5 * c.a, coast = v1 / P.g0, peak = h1 + (v1 * v1) / (2 * P.g0);
      run = { t: 0, a: c.a, peak: Math.max(peak, 4), total: 1 + coast, warp: Math.max(1, (1 + coast) / 3.2), lift: c.r > 1 };
    });
    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      RA.drawStars(ctx, stars, w, h, t, 0.6);
      const ground = h - 26, top = 30, peak = run ? run.peak : 10;
      const k = (ground - top - 80) / peak; // px per m (leave room for rocket)
      // ruler
      const step = RA.niceMax(peak / 4) || 1;
      ctx.font = '10px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      for (let m = 0; m <= peak * 1.05; m += step) {
        const y = ground - m * k;
        ctx.strokeStyle = 'rgba(42,56,88,.6)'; ctx.beginPath(); ctx.moveTo(34, y); ctx.lineTo(w, y); ctx.stroke();
        ctx.fillStyle = RA.c.dim; ctx.fillText(Math.round(m) + 'm', 4, y);
      }
      ctx.fillStyle = '#0a1120'; ctx.fillRect(0, ground, w, h - ground);
      // state
      let alt = 0, burning = false, tt = 0;
      if (run) {
        run.t += dt * run.warp;
        tt = run.t;
        if (!run.lift) { burning = tt < 1; }
        else if (tt < 1) { alt = 0.5 * run.a * tt * tt; burning = true; }
        else {
          const tc = tt - 1, v1 = run.a;
          alt = Math.max(0, 0.5 * run.a + v1 * tc - 0.5 * P.g0 * tc * tc);
        }
        if (tt > run.total + 1.2 * run.warp) run = null;
      }
      const x = w / 2 + 20, y = ground - alt * k;
      const jitter = run && !run.lift && burning ? (Math.random() - 0.5) * 2 : 0;
      if (run && run.lift) {
        ctx.strokeStyle = 'rgba(255,209,102,.6)'; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(40, ground - run.peak * k); ctx.lineTo(w - 10, ground - run.peak * k); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = RA.c.yellow; ctx.textAlign = 'right'; ctx.fillText('apogee ' + run.peak.toFixed(1) + ' m', w - 10, ground - run.peak * k - 9);
      }
      RA.drawFlame(ctx, x + jitter, y - 6, 0.5, 0, burning ? 1 : 0, t);
      RA.drawRocket(ctx, x + jitter, y - 6, 0.5);
      // force arrows (to scale relative to weight)
      const W = +M.value * P.g0, Th = burning ? +T.value : 0, sc = 26 / Math.max(W, 0.5);
      const cy = y - 6 - 34;
      RA.arrow(ctx, x - 40, cy, x - 40, cy + Math.min(110, W * sc), RA.c.cyan, 3, 'W');
      if (Th) RA.arrow(ctx, x + 40, cy + 30, x + 40, cy + 30 - Math.min(140, Th * sc), RA.c.flame, 3, 'T');
      ctx.fillStyle = RA.c.muted; ctx.textAlign = 'right'; ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(run ? `t = ${tt.toFixed(2)} s · alt ${alt.toFixed(1)} m${run.warp > 1.05 ? ' · ×' + run.warp.toFixed(1) : ''}` : 'press Ignite', w - 10, 16);
    });
  })();

  /* =========================================================
     B3 — Four forces
     ========================================================= */
  (function forces() {
    const cv = $('#forcesCanvas'), txt = $('#forcePhaseText'), wind = $('#forceWind');
    const PH = {
      pad: { T: 0, W: 1, D: 0, N: 1, text: 'On the pad, weight pulls down and the launch pad pushes back up with an equal force. The net force is zero, so nothing moves — Newton\'s first law.' },
      boost: { T: 3.4, W: 1, D: 0.7, text: 'Thrust is several times the weight. The net force points up, so the rocket accelerates upward. Drag (pointing down, against the motion) grows quickly as speed builds.' },
      coast: { T: 0, W: 0.95, D: 0.55, text: 'The motor has burned out. The rocket is still climbing on momentum, but weight and drag both point down, so it decelerates until it momentarily stops at apogee.' },
      descent: { T: 0, W: 0.95, D: 0.95, up: true, text: 'Under the parachute, drag points up and equals weight. Net force ≈ 0, so the rocket falls at a steady terminal velocity instead of speeding up.' },
    };
    let phase = 'pad', shown = { T: 0, W: 1, D: 0, N: 1 }, ang = 0, angV = 0;
    const streaks = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), l: 10 + Math.random() * 30 }));
    const setText = () => { txt.textContent = PH[phase].text; txt.style.animation = 'none'; void txt.offsetWidth; txt.style.animation = ''; };
    RA.seg($('#forcePhases'), (d) => { phase = d.phase; setText(); });
    setText();
    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      const ph = PH[phase];
      for (const k of ['T', 'W', 'D', 'N']) shown[k] = RA.lerp(shown[k] || 0, ph[k] || 0, Math.min(1, dt * 6));
      // streaks (relative airflow)
      const speed = phase === 'boost' ? 520 : phase === 'coast' ? 220 : phase === 'descent' ? -120 : 0;
      ctx.strokeStyle = 'rgba(139,151,176,.25)'; ctx.lineWidth = 1;
      for (const s of streaks) {
        s.y = (s.y + (speed * dt) / h + 1) % 1;
        if (!speed) continue;
        ctx.beginPath(); ctx.moveTo(s.x * w, s.y * h); ctx.lineTo(s.x * w, s.y * h - s.l * Math.sign(speed)); ctx.stroke();
      }
      // gust → angle of attack + restoring lift
      const gust = wind.checked && (phase === 'boost' || phase === 'coast');
      const target = gust ? 0.14 * Math.sin(t * 1.3) + 0.06 : 0;
      angV += ((target - ang) * 30 - angV * 5) * dt; ang += angV * dt;
      const s = Math.min(1.3, h / 300);
      const x = w / 2, ny = h * 0.64 + (phase === 'descent' ? 30 : 0);
      ctx.save();
      ctx.translate(x, ny);
      ctx.rotate(ang);
      if (phase === 'pad') {
        ctx.fillStyle = '#1c2740'; ctx.fillRect(-60, 8 * s, 120, 10);
        ctx.strokeStyle = '#2a3858'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18 * s, 10); ctx.lineTo(18 * s, -160 * s); ctx.stroke();
      }
      if (phase === 'descent') RA.drawChute(ctx, 0, -230 * s, 48 * s, Math.sin(t * 1.4) * 0.05);
      RA.drawFlame(ctx, 0, 0, s, 0, shown.T / 3.4, t);
      RA.drawRocket(ctx, 0, 0, s);
      ctx.restore();

      const u = 46 * s, cgY = ny - 62 * s, cpY = ny - 30 * s;
      const rot = (px, py) => { const dx = px - x, dy = py - ny; return [x + dx * Math.cos(ang) - dy * Math.sin(ang), ny + dx * Math.sin(ang) + dy * Math.cos(ang)]; };
      // thrust
      if (shown.T > 0.05) RA.arrow(ctx, x + 72 * s, ny + 10, x + 72 * s, ny + 10 - shown.T * u * 0.6, RA.c.flame, 4, 'Thrust');
      // weight (always straight down, from CG)
      RA.arrow(ctx, x - 120 * s, cgY, x - 120 * s, cgY + shown.W * u, RA.c.cyan, 4, 'Weight');
      // drag
      if (shown.D > 0.05) {
        if (ph.up) RA.arrow(ctx, x + 70 * s, cgY - 40 * s, x + 70 * s, cgY - 40 * s - shown.D * u, RA.c.red, 4, 'Drag');
        else RA.arrow(ctx, x - 60 * s, ny - 175 * s, x - 60 * s, ny - 175 * s + shown.D * u, RA.c.red, 4, 'Drag');
      }
      // pad normal force
      if (shown.N > 0.05) RA.arrow(ctx, x + 72 * s, ny + 40, x + 72 * s, ny + 40 - shown.N * u, RA.c.muted, 3, 'Pad');
      // lift
      if (gust) {
        // gust from the right pushes the fins left, swinging the nose into the wind
        const L = Math.max(24, Math.abs(ang) * 320) * s;
        const [a, b] = rot(x - 28 * s, cpY);
        RA.arrow(ctx, a, b, a - Math.min(50, L), b, RA.c.green, 4);
        ctx.fillStyle = RA.c.green; ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('Lift', a - 25, b + 20);
        for (let i = 0; i < 3; i++) RA.arrow(ctx, w - 14, 60 + i * 34, w - 54 - 8 * Math.sin(t * 5 + i), 60 + i * 34, 'rgba(76,201,240,.7)', 2);
        ctx.fillStyle = 'rgba(76,201,240,.8)';
        ctx.font = '11px "JetBrains Mono", monospace'; ctx.textAlign = 'right';
        ctx.fillText('gust', w - 14, 44);
      }
      // net force label
      const net = shown.T - shown.W - (ph.up ? -shown.D : shown.D) + (shown.N || 0);
      ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.textAlign = 'right';
      ctx.fillStyle = Math.abs(net) < 0.08 ? RA.c.green : net > 0 ? RA.c.flame : RA.c.cyan;
      ctx.fillText(Math.abs(net) < 0.08 ? 'NET ≈ 0 · steady' : net > 0 ? 'NET ↑ accelerating up' : 'NET ↓ slowing / falling', w - 12, 20);
    });
  })();

  /* =========================================================
     B4 — Flight profile
     ========================================================= */
  (function flight() {
    const cv = $('#flightCanvas'), scrub = $('#flightScrub'), play = $('#flightPlay'), tl = $('#flightT'), list = $('#phaseList');
    const sim = P.simulate({ dry: 0.034, motor: P.motors.C6, d: 0.0248, cd: 0.75 });
    const tb = P.motors.C6.tb, tE = tb + 5, tA = sim.tApogee, ap = sim.apogee, vDesc = 4.5, wind = 3;
    const tL = tE + (ap - 2) / vDesc;
    const PHASES = [
      { t: 0, n: 'Ignition', d: 'The igniter heats the propellant. Thrust builds to a spike of ~14 N within a fraction of a second.' },
      { t: 0.12, n: 'Liftoff & rod clear', d: `Thrust exceeds weight and the rocket slides up the 1 m rod, leaving it at ~${sim.railV.toFixed(0)} m/s — fast enough for the fins to keep it pointing up.` },
      { t: 0.3, n: 'Powered ascent', d: 'The motor burns at a sustained ~5 N. Acceleration is highest just after liftoff, when the thrust spike meets the lightest drag.' },
      { t: tb, n: 'Burnout', d: `Propellant is gone at ${tb.toFixed(2)} s; top speed ≈ ${sim.maxV.toFixed(0)} m/s. The delay element now burns, leaving a smoke trail but no thrust.` },
      { t: tb + 0.2, n: 'Coast', d: 'Momentum carries the rocket up while gravity and drag bleed off speed.' },
      { t: tE, n: 'Ejection near apogee', d: `The 5 s delay burns through at T+${tE.toFixed(1)} s. The ejection charge pops the nose and deploys the parachute just before apogee (${ap.toFixed(0)} m), when the rocket is slowest.` },
      { t: tE + 0.6, n: 'Descent', d: `Under the parachute the rocket falls at a steady ~${vDesc} m/s, drifting downwind.` },
      { t: tL, n: 'Landing', d: `Touchdown at about T+${tL.toFixed(0)} s. Recover it, replace the motor and wadding, fly again.` },
    ];
    PHASES.forEach((p, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="ph-top"><span>${i + 1}. ${p.n}</span><span class="ph-t">T+${p.t.toFixed(1)} s</span></div><p>${p.d}</p>`;
      li.addEventListener('click', () => { setT(p.t + 0.001); playing = false; play.textContent = 'Play flight'; });
      list.appendChild(li);
    });
    // scrub 0..1000: first half covers 0..9 s, second half the descent
    const S2T = (s) => (s <= 500 ? (s / 500) * 9 : 9 + ((s - 500) / 500) * (tL - 9));
    const T2S = (t) => (t <= 9 ? (t / 9) * 500 : 500 + ((t - 9) / (tL - 9)) * 500);
    let tNow = 0, playing = false;
    const setT = (t) => { tNow = RA.clamp(t, 0, tL); scrub.value = T2S(tNow); RA.paintRange(scrub); };
    function altAt(t) {
      if (t <= tE) {
        let i = 0; while (i < sim.t.length - 1 && sim.t[i + 1] < t) i++;
        const t0 = sim.t[i], t1 = sim.t[i + 1] || t0 + 1e-3, k = RA.clamp((t - t0) / (t1 - t0), 0, 1);
        return { h: RA.lerp(sim.h[i], sim.h[i + 1] ?? sim.h[i], k), v: RA.lerp(sim.v[i], sim.v[i + 1] ?? sim.v[i], k) };
      }
      const hE = altAt(tE).h, dt = t - tE;
      const extra = Math.max(0, ap - hE) * Math.min(1, dt / 0.8); // finish rising
      return { h: Math.max(0, hE + extra - vDesc * Math.max(0, dt - 0.8)), v: -vDesc };
    }
    const xAt = (t, h) => (t <= tE ? -14 * (h / ap) ** 2 : -14 + wind * (t - tE));
    scrub.addEventListener('input', () => { tNow = S2T(+scrub.value); playing = false; play.textContent = 'Play flight'; });
    play.addEventListener('click', () => {
      if (tNow >= tL - 0.01) setT(0);
      playing = !playing;
      play.textContent = playing ? 'Pause' : 'Play flight';
    });
    const stars = RA.makeStars(80, 11);
    RA.animate(cv, (t, dt) => {
      if (playing) {
        const rate = tNow < 9 ? 1 : 14; // fast-forward the long descent
        setT(tNow + dt * rate);
        if (tNow >= tL) { playing = false; play.textContent = 'Replay'; }
      }
      tl.textContent = 'T+' + tNow.toFixed(1) + ' s';
      let cur = 0; PHASES.forEach((p, i) => { if (tNow >= p.t) cur = i; });
      $$('li', list).forEach((li, i) => { li.classList.toggle('on', i === cur); li.classList.toggle('past', i < cur); });

      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      RA.drawStars(ctx, stars, w, h * 0.6, t, 0.6);
      const gY = h - 28, top = 36;
      const xMin = -40, xMax = wind * (tL - tE) + 10;
      const X = (x) => 40 + ((x - xMin) / (xMax - xMin)) * (w - 80);
      const Y = (a) => gY - (a / (ap * 1.08)) * (gY - top);
      // ground + apogee line
      ctx.fillStyle = '#0a1120'; ctx.fillRect(0, gY, w, h - gY);
      ctx.strokeStyle = 'rgba(255,209,102,.35)'; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(0, Y(ap)); ctx.lineTo(w, Y(ap)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillStyle = RA.c.yellow; ctx.textAlign = 'right';
      ctx.fillText(`APOGEE ${ap.toFixed(0)} m`, w - 10, Y(ap) - 6);
      // wind indicator
      ctx.fillStyle = RA.c.dim; ctx.textAlign = 'right'; ctx.fillText(`wind ${wind} m/s →`, w - 10, gY + 18);
      // trail
      const N = 220;
      for (let i = 1; i <= N; i++) {
        const ta = (tNow * (i - 1)) / N, tb2 = (tNow * i) / N;
        const A = altAt(ta), B = altAt(tb2);
        ctx.strokeStyle = tb2 <= tb ? RA.c.flame : tb2 <= tE ? 'rgba(200,210,230,.55)' : 'rgba(61,220,151,.6)';
        ctx.lineWidth = tb2 <= tb ? 3 : 2;
        if (tb2 > tE) ctx.setLineDash([3, 4]); else ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(X(xAt(ta, A.h)), Y(A.h)); ctx.lineTo(X(xAt(tb2, B.h)), Y(B.h)); ctx.stroke();
      }
      ctx.setLineDash([]);
      // event markers
      [[tb, 'Burnout'], [tE, 'Ejection']].forEach(([te, n]) => {
        if (tNow < te) return;
        const a = altAt(te).h, px = X(xAt(te, a)), py = Y(a);
        ctx.fillStyle = RA.c.bg; ctx.strokeStyle = RA.c.flame2; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px, py, 4, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = RA.c.flame2; ctx.textAlign = 'left'; ctx.fillText(n, px + 9, py + 4);
      });
      // pad
      ctx.fillStyle = '#1c2740'; ctx.fillRect(X(0) - 14, gY - 5, 28, 5);
      // rocket
      const st = altAt(tNow), px = X(xAt(tNow, st.h)), py = Y(st.h);
      const s = Math.min(0.42, h / 900);
      if (tNow < tE) {
        const dx = -28 * (st.h / ap) / Math.max(5, st.v);
        const ang = Math.atan(dx);
        RA.drawFlame(ctx, px, py, s, ang, tNow < tb ? 1 : 0, t);
        RA.drawRocket(ctx, px, py, s, ang);
        if (tNow > tE - 0.1 && tNow < tE + 0.3) { ctx.fillStyle = 'rgba(255,209,102,.6)'; ctx.beginPath(); ctx.arc(px, py - 60 * s, 24, 0, 6.283); ctx.fill(); }
      } else if (st.h > 0.5) {
        const sway = Math.sin(t * 1.6) * 0.07;
        RA.drawChute(ctx, px, py - 110 * s, 60 * s, sway);
        RA.drawRocket(ctx, px, py, s, sway);
      } else {
        RA.drawRocket(ctx, px, gY - 4, s, 1.45);
      }
      // telemetry
      ctx.fillStyle = RA.c.cyan; ctx.textAlign = 'left'; ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText(`ALT ${st.h.toFixed(0).padStart(3, ' ')} m   VEL ${st.v.toFixed(0)} m/s`, 12, 20);
    });
  })();

  /* =========================================================
     B5 — Motor decoder
     ========================================================= */
  (function motors() {
    const sel = $('#mcClass'), T = $('#mcT'), D = $('#mcD');
    P.classes.forEach((c, i) => {
      const o = document.createElement('option');
      o.value = i; o.textContent = `${c.name} · ${fmtI(c.lo)}–${fmtI(c.hi)} N·s`;
      sel.appendChild(o);
    });
    function fmtI(v) { return v < 10 ? +v.toFixed(2) : Math.round(v); }
    const PRE = [['A8-3', 2, 8, 3], ['B6-4', 3, 6, 4], ['C6-5', 4, 6, 5], ['C6-0', 4, 6, 0], ['D12-5', 5, 12, 5], ['E12-6', 6, 12, 6], ['F15-6', 7, 15, 6], ['G80-7', 8, 80, 7], ['H128-10', 9, 128, 10]];
    const pr = $('#motorPresets');
    PRE.forEach(([n, c, t, d]) => {
      const b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.textContent = n;
      b.addEventListener('click', () => {
        sel.value = c; T.max = Math.max(120, t); T.value = t; D.max = Math.max(10, d); D.value = d; RA.paintAll(); upd(true);
        $$('.chip', pr).forEach((x) => x.classList.toggle('on', x === b));
      });
      pr.appendChild(b);
    });
    sel.value = 4;
    let prev = {};
    function upd(fromPreset) {
      if (!fromPreset) $$('.chip', pr).forEach((x) => x.classList.remove('on'));
      const c = P.classes[+sel.value], t = +T.value, d = +D.value;
      $('#mcTv').textContent = t + ' N';
      $('#mcDv').textContent = d === 0 ? '0 (booster)' : d + ' s';
      const cur = { L: c.name, T: t, D: d };
      [['L', '#ceL', c.name], ['T', '#ceT', t], ['D', '#ceD', d]].forEach(([k, id, v]) => {
        const el = $(id); el.textContent = v;
        if (prev[k] !== cur[k]) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
      });
      prev = cur;
      $('#mcI').textContent = `${fmtI(c.lo)}–${fmtI(c.hi)} N·s`;
      $('#mcB').textContent = `${(c.lo / t).toFixed(c.hi / t < 1 ? 2 : 1)}–${(c.hi / t).toFixed(c.hi / t < 1 ? 2 : 1)} s`;
      $('#mcC').textContent = c.name + ' class';
      $('#mcR').textContent = P.certFor(c.name);
    }
    [sel, T, D].forEach((el) => el.addEventListener('input', () => upd(false)));
    upd(true);

    // static fire animation
    const prop = $('#mcProp'), del = $('#mcDelay'), ej = $('#mcEject'), fl = $('#mcFlame'), bl = $('#mcBlast'), ph = $('#mcPhase'), fire = $('#mcFire');
    let raf = 0;
    fire.addEventListener('click', () => {
      cancelAnimationFrame(raf);
      const c = P.classes[+sel.value], tb = RA.clamp((c.hi * 0.9) / +T.value, 0.25, 6), dl = +D.value;
      const t0 = performance.now();
      fire.disabled = true;
      const step = (now) => {
        const t = (now - t0) / 1000;
        if (t < tb) {
          const k = t / tb;
          prop.setAttribute('x', 66 + 180 * k); prop.setAttribute('width', 180 * (1 - k));
          fl.setAttribute('opacity', 0.6 + 0.4 * Math.random());
          fl.setAttribute('transform', `scale(${1 + 0.15 * Math.random()},1)`);
          ph.textContent = `THRUST · ${t.toFixed(2)} / ${tb.toFixed(2)} s`;
        } else if (dl > 0 && t < tb + dl) {
          const k = (t - tb) / dl;
          prop.setAttribute('width', 0); fl.setAttribute('opacity', 0.15 * Math.random());
          del.setAttribute('x', 246 + 60 * k); del.setAttribute('width', 60 * (1 - k));
          ph.textContent = `DELAY (smoke, no thrust) · ${(t - tb).toFixed(1)} / ${dl} s`;
        } else if (t < tb + dl + 0.6) {
          fl.setAttribute('opacity', 0); del.setAttribute('width', 0);
          if (dl === 0) { ph.textContent = 'BURN-THROUGH → ignites upper stage'; bl.setAttribute('opacity', 0.5 + 0.5 * Math.random()); }
          else { ph.textContent = 'EJECTION! Parachute deploys'; ej.setAttribute('fill', '#fff3c4'); bl.setAttribute('opacity', 0.5 + 0.5 * Math.random()); }
        } else {
          bl.setAttribute('opacity', 0); ej.setAttribute('fill', '#d9a441');
          prop.setAttribute('x', 66); prop.setAttribute('width', 180);
          del.setAttribute('x', 246); del.setAttribute('width', 60);
          ph.textContent = 'SPENT · reload to fire again'; fire.disabled = false; fire.textContent = 'Fire again';
          return;
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
  })();

  /* =========================================================
     B6 — Stability bench
     ========================================================= */
  (function stability() {
    const cv = $('#stabCanvas'), nw = $('#stNw'), sp = $('#stS');
    let N = 3, motor = 24.1, r = null, fly = null;
    const geo = { d: 0.025, Ln: 0.075, Lb: 0.30, Cr: 0.065, Ct: 0.035, sweep: 0.03 };
    RA.seg($('#stN'), (d) => { N = +d.n; calc(); });
    RA.seg($('#stMotor'), (d) => { motor = +d.m; calc(); });
    [nw, sp].forEach((e) => e.addEventListener('input', calc));
    function calc() {
      r = P.stability({ ...geo, s: +sp.value / 100, N, noseW: +nw.value, motorMass: motor });
      $('#stNwv').textContent = (+nw.value).toFixed(1) + ' g';
      $('#stSv').textContent = (+sp.value).toFixed(1) + ' cm';
      $('#stCg').textContent = (r.cg * 100).toFixed(1) + ' cm';
      $('#stCp').textContent = (r.cp * 100).toFixed(1) + ' cm';
      $('#stM').textContent = r.margin.toFixed(2) + ' cal';
      $('#stMass').textContent = r.mass.toFixed(0) + ' g';
      $('#stNeedle').style.left = RA.clamp(((r.margin + 1) / 5) * 100, 0, 100) + '%';
      const v = $('#stVerdict');
      if (r.margin < 0) { v.className = 'verdict bad'; v.textContent = 'UNSTABLE — CP is ahead of CG. This rocket will tumble or loop. Add nose weight or enlarge the fins.'; }
      else if (r.margin < 1) { v.className = 'verdict warn'; v.textContent = 'MARGINAL — it may wobble or cone in a gust. Push the margin above 1 caliber.'; }
      else if (r.margin <= 2.2) { v.className = 'verdict good'; v.textContent = 'STABLE — a healthy margin. It will correct gusts cleanly.'; }
      else { v.className = 'verdict warn'; v.textContent = 'OVER-STABLE — very safe, but it will weathercock hard into the wind and lose altitude.'; }
    }
    calc();
    $('#stFly').addEventListener('click', () => { fly = { t: 0, th: 0, w: 0, x: 0 }; });
    const streaks = Array.from({ length: 24 }, () => ({ x: Math.random(), y: Math.random(), l: 8 + Math.random() * 22 }));

    function drawBench(ctx, w, h) {
      const L = r.L, pad = 30, k = (w - pad * 2 - 30) / L, x0 = pad, cy = h / 2 + 6, R = Math.max(6, geo.d * k * 0.5);
      const span = (+sp.value / 100) * k, Cr = geo.Cr * k, Ct = geo.Ct * k, sw = geo.sweep * k, xe = x0 + L * k;
      // fins
      ctx.fillStyle = RA.c.flame;
      [[-1], [1]].forEach(([sg]) => {
        ctx.beginPath(); ctx.moveTo(xe - Cr, cy + sg * R); ctx.lineTo(xe - Cr + sw, cy + sg * (R + span)); ctx.lineTo(xe - Cr + sw + Ct, cy + sg * (R + span)); ctx.lineTo(xe, cy + sg * R); ctx.closePath(); ctx.fill();
      });
      if (N === 4) { ctx.globalAlpha = 0.6; ctx.fillRect(xe - Cr, cy - 1.5, Cr, 3); ctx.globalAlpha = 1; }
      // body
      const g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
      g.addColorStop(0, '#8792a8'); g.addColorStop(0.45, '#f4f7fc'); g.addColorStop(1, '#8792a8');
      ctx.fillStyle = g; ctx.fillRect(x0 + geo.Ln * k, cy - R, geo.Lb * k, R * 2);
      // nose (ogive, pointing left)
      ctx.fillStyle = RA.c.flame;
      ctx.beginPath(); ctx.moveTo(x0 + geo.Ln * k, cy - R); ctx.quadraticCurveTo(x0 + geo.Ln * k * 0.35, cy - R, x0, cy); ctx.quadraticCurveTo(x0 + geo.Ln * k * 0.35, cy + R, x0 + geo.Ln * k, cy + R); ctx.closePath(); ctx.fill();
      // nose weight
      if (+nw.value > 0) { ctx.fillStyle = '#c9a36b'; ctx.beginPath(); ctx.arc(x0 + 0.35 * geo.Ln * k + 4, cy, Math.min(R - 1, 2 + +nw.value * 0.35), 0, 6.283); ctx.fill(); }
      // motor
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(xe - 0.07 * k, cy - R * 0.55, 0.07 * k, R * 1.1);
      // markers
      const cgx = x0 + r.cg * k, cpx = x0 + r.cp * k;
      ctx.strokeStyle = 'rgba(230,235,245,.25)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cgx, 12); ctx.lineTo(cgx, h - 12); ctx.moveTo(cpx, 12); ctx.lineTo(cpx, h - 12); ctx.stroke(); ctx.setLineDash([]);
      // CG symbol
      ctx.fillStyle = '#05070d'; ctx.beginPath(); ctx.arc(cgx, cy, 8, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(cgx, cy); ctx.arc(cgx, cy, 8, -Math.PI / 2, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cgx, cy); ctx.arc(cgx, cy, 8, Math.PI / 2, Math.PI); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cgx, cy, 8, 0, 6.283); ctx.stroke();
      // CP symbol
      ctx.fillStyle = RA.c.red; ctx.beginPath(); ctx.arc(cpx, cy, 7, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cpx, cy, 2, 0, 6.283); ctx.fill();
      ctx.font = '600 11px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#fff'; ctx.fillText('CG', cgx, 14);
      ctx.fillStyle = RA.c.red; ctx.fillText('CP', cpx, h - 4);
      // margin bracket
      const by = cy - R - 16;
      ctx.strokeStyle = r.margin < 0 ? RA.c.red : r.margin < 1 ? RA.c.yellow : r.margin <= 2.2 ? RA.c.green : RA.c.yellow;
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cgx, by); ctx.lineTo(cpx, by); ctx.stroke();
    }

    function drawFly(ctx, w, h, t, dt) {
      fly.t += dt;
      const m = r.margin, gust = fly.t > 0.9 && fly.t < 2.4;
      const wind = gust ? 0.32 : 0;
      const target = m > 0 ? wind * Math.min(1.4, 0.5 + m / 3) : 0;
      const K = 16 * m, C = m > 0 ? 1.2 + 1.6 * m : 0.3;
      let acc = -K * (fly.th - target) - C * fly.w + (gust && m <= 0 ? 1.6 : 0);
      if (Math.abs(fly.th) > 1.4 && m <= 0) acc = 6 * Math.sign(fly.w || 1);
      fly.w += acc * dt; fly.th += fly.w * dt;
      fly.x += Math.sin(fly.th) * 60 * dt;
      // streaks
      ctx.strokeStyle = 'rgba(139,151,176,.25)';
      for (const s of streaks) {
        s.y = (s.y + dt * 1.6) % 1;
        const sx = s.x * w + (gust ? -s.y * 30 : 0);
        ctx.beginPath(); ctx.moveTo(sx, s.y * h); ctx.lineTo(sx, s.y * h - s.l); ctx.stroke();
      }
      if (gust) {
        ctx.fillStyle = RA.c.cyan; ctx.font = '600 11px "JetBrains Mono", monospace'; ctx.textAlign = 'right';
        for (let i = 0; i < 3; i++) RA.arrow(ctx, w - 20, 40 + i * 40, w - 70 - 10 * Math.sin(t * 6 + i), 40 + i * 40, RA.c.cyan, 2);
        ctx.fillText('GUST', w - 20, 20);
      }
      const x = RA.clamp(w / 2 + fly.x, 40, w - 40);
      const s = h / 330;
      ctx.save(); ctx.translate(x, h / 2); ctx.rotate(fly.th);
      RA.drawFlame(ctx, 0, 60 * s, s, 0, 1, t); RA.drawRocket(ctx, 0, 60 * s, s);
      ctx.restore();
      ctx.fillStyle = RA.c.muted; ctx.font = '11px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
      ctx.fillText(`attitude ${(fly.th * 57.3).toFixed(0)}°`, 10, 18);
      if (fly.t > 4.2) {
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillStyle = m < 0 ? RA.c.red : m < 1 ? RA.c.yellow : m <= 2.2 ? RA.c.green : RA.c.yellow;
        ctx.fillText(m < 0 ? 'TUMBLED' : m < 1 ? 'WOBBLY' : m <= 2.2 ? 'CORRECTED' : 'WEATHERCOCKED', 10, h - 12);
      }
      if (fly.t > 5.4) fly = null;
    }

    RA.animate(cv, (t, dt) => {
      const { ctx, w, h } = RA.fit(cv);
      ctx.clearRect(0, 0, w, h);
      if (fly) drawFly(ctx, w, h, t, dt); else drawBench(ctx, w, h);
    });
  })();

  /* =========================================================
     B7 — Safety checklist
     ========================================================= */
  (function safety() {
    const ITEMS = [
      ['Certified motor, unmodified', 'Commercially made and certified by NAR / Tripoli / your national body.'],
      ['Recovery packed', 'Wadding between motor and parachute; chute folded loosely; shock cord attached.'],
      ['Stability checked', 'CG at least one caliber ahead of CP — with the motor installed.'],
      ['Launch rod / rail ready', 'Within 30° of vertical, blast deflector fitted, rod cap removed only at launch.'],
      ['Safe distance', 'Everyone ≥ 15 ft (5 m) back for motors up to D; ≥ 30 ft (10 m) for E–G.'],
      ['Field and sky clear', 'No aircraft overhead, no people downrange, clear of trees, power lines and buildings.'],
      ['Wind under 20 mph', 'Below about 32 km/h. Gusts blow rockets off course and parachutes into trees.'],
      ['Key in, continuity OK', 'Igniter continuity confirmed; the safety key never leaves the launch operator.'],
    ];
    const ul = $('#checklist');
    ITEMS.forEach(([a, b], i) => {
      const li = document.createElement('li');
      li.innerHTML = `<label><input type="checkbox" data-i="${i}" /><span>${a}<small>${b}</small></span></label>`;
      ul.appendChild(li);
    });
    const st = $('#armStatus'), btn = $('#armLaunch');
    $('#armTotal').textContent = ITEMS.length;
    let counting = false;
    function upd() {
      if (counting) return;
      const n = $$('input:checked', ul).length;
      $('#armCount').textContent = n;
      const ok = n === ITEMS.length;
      btn.disabled = !ok;
      st.classList.toggle('armed', ok);
      st.firstChild.textContent = ok ? 'ARMED · ' : 'SAFE · ';
    }
    ul.addEventListener('change', upd);
    btn.addEventListener('click', () => {
      counting = true; btn.disabled = true;
      st.classList.remove('armed'); st.classList.add('live');
      let n = 5;
      const tick = () => {
        if (n > 0) { st.textContent = `COUNTDOWN · ${n}…`; n--; setTimeout(tick, 1000); }
        else {
          st.textContent = 'LIFTOFF! Now remove the key.';
          RA.toast('Liftoff! Remember: remove the safety key after every launch.');
          setTimeout(() => {
            counting = false; st.classList.remove('live');
            st.innerHTML = 'SAFE · <span id="armCount">0</span>/<span id="armTotal">' + ITEMS.length + '</span>';
            $$('input', ul).forEach((c) => (c.checked = false));
            upd();
          }, 3000);
        }
      };
      tick();
    });
    upd();
  })();
})();
