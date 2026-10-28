/* Rocketry Academy — physics core.
   Pure functions, no DOM. Loaded in the browser as RA.phys and in Node for tests. */
(function (root) {
  const RA = (root.RA = root.RA || {});
  const g0 = 9.80665;
  const P = { g0 };

  /* ---------- Atmosphere (isothermal approximation) ---------- */
  P.rho = (h) => 1.225 * Math.exp(-Math.max(0, h) / 8500);
  P.pAtm = (h) => 101325 * Math.exp(-Math.max(0, h) / 8434);

  /* ---------- Hobby motors (approximate published values) ---------- */
  // I: total impulse N·s, tb: burn time s, prop / mass: kg, dia: mm
  P.motors = {
    A8: { name: 'A8', I: 2.5, tb: 0.5, prop: 0.0031, mass: 0.0162, dia: 18, delays: [3, 5] },
    B6: { name: 'B6', I: 5.0, tb: 0.85, prop: 0.0062, mass: 0.0198, dia: 18, delays: [2, 4, 6] },
    C6: { name: 'C6', I: 10.0, tb: 1.85, prop: 0.0123, mass: 0.0241, dia: 18, delays: [3, 5, 7] },
    D12: { name: 'D12', I: 16.8, tb: 1.65, prop: 0.0211, mass: 0.0440, dia: 24, delays: [3, 5, 7] },
    E12: { name: 'E12', I: 28.5, tb: 2.4, prop: 0.0358, mass: 0.0580, dia: 24, delays: [4, 6, 8] },
    F15: { name: 'F15', I: 49.6, tb: 3.45, prop: 0.0600, mass: 0.1018, dia: 29, delays: [4, 6, 8] },
  };

  /* NAR impulse classes: each letter doubles the upper bound */
  P.classes = (function () {
    const names = ['1/4A', '1/2A', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    let upper = 0.625;
    return names.map((n) => {
      const c = { name: n, lo: upper / 2, hi: upper };
      upper *= 2;
      return c;
    });
  })();
  P.certFor = (name) => {
    if ('HI'.includes(name) && name.length === 1) return 'High power · Level 1 certification';
    if ('JKL'.includes(name) && name.length === 1) return 'High power · Level 2 certification';
    if ('MNO'.includes(name) && name.length === 1) return 'High power · Level 3 certification';
    if (name === 'E' || name === 'F' || name === 'G') return 'Mid-power · no certification for single motors';
    return 'Model rocketry · beginner friendly';
  };

  /* ---------- Black-powder style thrust shape (normalised) ---------- */
  function bpShape(tau) {
    if (tau < 0 || tau > 1) return 0;
    if (tau < 0.1) return 2.8 * (tau / 0.1);
    if (tau < 0.28) return 2.8 - 2.0 * ((tau - 0.1) / 0.18);
    if (tau < 0.88) return 0.8;
    return 0.8 * (1 - (tau - 0.88) / 0.12);
  }
  const BP_K = integrate(bpShape, 0, 1, 2000);
  function integrate(f, a, b, n) {
    const h = (b - a) / n;
    let s = 0.5 * (f(a) + f(b));
    for (let i = 1; i < n; i++) s += f(a + i * h);
    return s * h;
  }
  P.integrate = integrate;
  P.thrust = (m, t) => (m.I / m.tb) * (bpShape(t / m.tb) / BP_K);

  /* ---------- 1-D vertical flight simulation with drag ---------- */
  P.simulate = function (o) {
    const m = o.motor;
    const A = Math.PI * (o.d / 2) ** 2;
    const dt = o.dt || 0.002;
    const rail = o.rail == null ? 1.0 : o.rail;
    let t = 0, h = 0, v = 0, imp = 0, step = 0;
    let liftoff = false, railV = null, burnout = null, maxV = 0, maxA = 0;
    const out = { t: [], h: [], v: [], a: [] };
    const liftMass = o.dry + m.mass;
    while (t < 200) {
      const T = P.thrust(m, t);
      const mass = o.dry + m.mass - m.prop * Math.min(1, imp / m.I);
      const W = mass * g0;
      const D = 0.5 * P.rho(h) * v * Math.abs(v) * o.cd * A;
      if (!liftoff && T > W) liftoff = true;
      const a = liftoff ? (T - W - D) / mass : 0;
      v += a * dt;
      h += v * dt;
      imp += T * dt;
      t += dt;
      if (h < 0) { h = 0; if (v < 0) v = 0; }
      if (railV === null && h >= rail) railV = v;
      if (burnout === null && t >= m.tb) burnout = { t, h, v };
      if (v > maxV) maxV = v;
      if (a > maxA) maxA = a;
      if (step % 10 === 0) { out.t.push(t); out.h.push(h); out.v.push(v); out.a.push(a); }
      step++;
      if (!liftoff && t > m.tb) break;
      if (liftoff && t > m.tb && v <= 0) {
        out.t.push(t); out.h.push(h); out.v.push(v); out.a.push(a);
        break;
      }
    }
    const apogee = out.h.length ? Math.max(...out.h) : 0;
    return {
      ...out,
      liftoff,
      twr: (m.I / m.tb) / (liftMass * g0),
      peakTwr: (P.thrust(m, 0.1 * m.tb)) / (liftMass * g0),
      apogee,
      tApogee: t,
      maxV,
      maxA,
      railV: railV || 0,
      burnout: burnout || { t: m.tb, h: 0, v: 0 },
      idealDelay: Math.max(0, t - m.tb),
    };
  };

  /* ---------- Stability: Barrowman CP + component CG ---------- */
  P.stability = function (o) {
    const { d, Ln, Lb, Cr, Ct, s, N, sweep, noseW, motorMass } = o;
    const L = Ln + Lb, R = d / 2;
    const CNn = 2, Xn = 0.466 * Ln; // ogive nose
    const Xb = L - Cr;
    const lf = Math.sqrt(s * s + (sweep + Ct / 2 - Cr / 2) ** 2);
    const Kfb = 1 + R / (s + R);
    const CNf = (Kfb * (4 * N * (s / d) ** 2)) / (1 + Math.sqrt(1 + ((2 * lf) / (Cr + Ct)) ** 2));
    const Xf = Xb + (sweep * (Cr + 2 * Ct)) / (3 * (Cr + Ct)) + (1 / 6) * (Cr + Ct - (Cr * Ct) / (Cr + Ct));
    const cp = (CNn * Xn + CNf * Xf) / (CNn + CNf);

    const finMass = s * ((Cr + Ct) / 2) * 0.0032 * 160 * 1000 * N; // 3.2 mm balsa, grams
    const parts = [
      { m: 8, x: 0.55 * Ln },               // nose cone
      { m: noseW, x: 0.35 * Ln },           // clay in nose
      { m: 7, x: Ln + 0.05 },               // parachute + shock cord
      { m: 12, x: Ln + Lb / 2 },            // body tube
      { m: finMass, x: Xb + Cr * 0.45 },    // fins
      { m: 3, x: L - 0.04 },                // motor mount
      { m: motorMass, x: L - 0.035 },       // loaded motor
    ];
    const M = parts.reduce((a, p) => a + p.m, 0);
    const cg = parts.reduce((a, p) => a + p.m * p.x, 0) / M;
    return { cp, cg, L, margin: (cp - cg) / d, CNf, mass: M, finMass };
  };

  /* ---------- Rocket equation & staging ---------- */
  P.deltaV = (isp, m0, mf) => isp * g0 * Math.log(m0 / mf);

  /* ---------- Isentropic nozzle relations ---------- */
  P.areaRatio = (M, g) => (1 / M) * Math.pow((2 / (g + 1)) * (1 + ((g - 1) / 2) * M * M), (g + 1) / (2 * (g - 1)));
  P.machFromAR = function (eps, g, supersonic = true) {
    let lo = supersonic ? 1 : 1e-6, hi = supersonic ? 50 : 1;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      const ar = P.areaRatio(mid, g);
      if (supersonic ? ar < eps : ar > eps) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };
  P.pRatio = (M, g) => Math.pow(1 + ((g - 1) / 2) * M * M, -g / (g - 1));
  P.thrustCoef = function (g, peP0, paP0, eps) {
    const mom = Math.sqrt(((2 * g * g) / (g - 1)) * Math.pow(2 / (g + 1), (g + 1) / (g - 1)) * (1 - Math.pow(peP0, (g - 1) / g)));
    return mom + (peP0 - paP0) * eps;
  };

  /* ---------- Grain geometry → normalised burn-area curve ---------- */
  P.grainArea = function (type, w) {
    // w: fraction of web burned, 0..1
    switch (type) {
      case 'core': { const r0 = 0.3, r = r0 + (1 - r0) * w; return r; }
      case 'bates': {
        const r0 = 0.35, web = 1 - r0, r = r0 + web * w, L = 3.35 - 2 * web * w;
        return 2 * Math.PI * r * L + 2 * Math.PI * (1 - r * r);
      }
      case 'star': return w < 0.82 ? 1.25 - 0.42 * w : (1.25 - 0.42 * 0.82) * Math.max(0, 1 - (w - 0.82) / 0.18) ** 1.6;
      default: return 1; // end burner
    }
  };
  P.grainCurve = function (type, n = 240) {
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(P.grainArea(type, i / n));
    const mean = pts.reduce((a, b) => a + b, 0) / pts.length;
    return pts.map((p, i) => {
      const tau = i / n;
      let k = 1;
      if (tau < 0.03) k = tau / 0.03;          // ignition rise
      if (tau > 0.95 && type !== 'star') k = (1 - tau) / 0.05; // tail-off
      return (p / mean) * k;
    });
  };

  /* ---------- Parachutes ---------- */
  P.descentRate = (mKg, dM, cd, h = 0) => Math.sqrt((2 * mKg * g0) / (P.rho(h) * cd * Math.PI * (dM / 2) ** 2));
  P.chuteFor = (mKg, v, cd) => Math.sqrt((8 * mKg * g0) / (Math.PI * P.rho(0) * cd * v * v));

  RA.phys = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
