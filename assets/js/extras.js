/* Rocketry Academy — quiz + glossary */
(function () {
  const RA = window.RA, $ = RA.$, $$ = RA.$$;

  /* ---------- Quiz ---------- */
  const Q = [
    ['What does the letter "C" in a C6-5 motor tell you?', ['Average thrust', 'Total impulse class (5–10 N·s)', 'Delay before ejection', 'Motor diameter'], 1, 'The letter is the total impulse class. Each letter doubles the maximum: C = 5.01–10 N·s.', 'B5'],
    ['For a stable rocket, where must the centre of gravity be?', ['Behind the centre of pressure', 'Exactly on the centre of pressure', 'Ahead of the centre of pressure, by about 1–2 calibers', 'It doesn\'t matter if the fins are big'], 2, 'CG ahead of CP means aerodynamic forces rotate the nose back into the airflow.', 'B6'],
    ['Your rocket has a 0.3-caliber margin. What is the best fix?', ['Add clay to the nose cone', 'Shorten the fins', 'Add weight near the tail', 'Use a motor with a longer delay'], 0, 'Nose weight moves the CG forward, increasing the margin. Bigger fins (moving CP back) would also work.', 'B6'],
    ['Why does a model motor have a delay element?', ['To cool the motor down', 'So the parachute deploys near apogee, when the rocket is slowest', 'To make the burn last longer', 'To light the igniter'], 1, 'The delay lets the rocket coast to near apogee; ejecting at high speed can shred the parachute.', 'B4'],
    ['Why do rockets work in the vacuum of space?', ['They push against the vacuum', 'They carry air to push on', 'They push against their own exhaust — action and reaction', 'Gravity is weaker there'], 2, 'Newton\'s third law: the rocket throws mass backwards and is pushed forwards. No air required.', 'B2'],
    ['What thrust-to-weight ratio do hobby guidelines recommend at minimum?', ['1 : 1', '2 : 1', '5 : 1', '50 : 1'], 2, 'At 5 : 1 or better the rocket leaves the launch rod fast enough for the fins to stabilise it.', 'B2'],
    ['A motor misfires. What do you do?', ['Walk up and check the igniter immediately', 'Remove the safety key and wait 60 seconds', 'Press the button again repeatedly', 'Pour water on it'], 1, 'Motors can "chuff" and ignite late. Remove the key, wait a full minute, then approach.', 'B7'],
    ['Which grain geometry gives a progressive (rising) thrust curve?', ['End burner', 'Core burner burning outward', 'Star grain', 'All grains are neutral'], 1, 'A hollow core grows as it burns outward, so burning area — and thrust — rise over time.', 'I1'],
    ['Isp = 300 s and mass ratio = e (≈2.718). What is Δv?', ['≈ 0.3 km/s', '≈ 2.94 km/s', '≈ 8.15 km/s', '≈ 30 km/s'], 1, 'Δv = 300 × 9.81 × ln(e) = 300 × 9.81 × 1 ≈ 2,943 m/s.', 'I2'],
    ['You double a parachute\'s diameter. What happens to descent rate?', ['It doubles', 'It halves', 'It drops by a quarter', 'No change'], 1, 'Area goes up 4×, and v ∝ 1/√A, so the descent rate halves.', 'I5'],
    ['What is the Mach number at the throat of a working de Laval nozzle?', ['0', '0.5', '1', 'Equal to the exit Mach number'], 2, 'The flow is choked at the throat — exactly Mach 1 — and becomes supersonic in the diverging bell.', 'I6'],
    ['Why does staging increase Δv?', ['The upper stage has a bigger engine', 'Dropping empty tanks gives the remaining rocket a better mass ratio', 'It reduces drag', 'Separation gives an extra push'], 1, 'Empty structure is dead weight. Discarding it means the next stage accelerates less mass.', 'I7'],
  ];
  const box = $('#quizBox');
  let answered = 0, score = 0;
  function render() {
    answered = 0; score = 0;
    box.innerHTML = '';
    Q.forEach(([q, opts, ans, why, mod], i) => {
      const el = document.createElement('div');
      el.className = 'q';
      el.innerHTML = `<div class="q-head"><span class="q-n">${String(i + 1).padStart(2, '0')} · ${mod}</span><span class="q-text">${q}</span></div><div class="q-opts">${opts.map((o, j) => `<button type="button" data-j="${j}">${o}</button>`).join('')}</div>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-j]');
        if (!b || el.dataset.done) return;
        el.dataset.done = 1;
        const j = +b.dataset.j, ok = j === ans;
        $$('button', el).forEach((x, k) => { x.disabled = true; if (k === ans) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        const p = document.createElement('p');
        p.className = 'q-explain';
        p.innerHTML = `<strong style="color:${ok ? 'var(--green)' : 'var(--red)'}">${ok ? 'Correct.' : 'Not quite.'}</strong> ${why}`;
        el.appendChild(p);
        answered++; if (ok) score++;
        if (answered === Q.length) finish();
      });
      box.appendChild(el);
    });
  }
  function finish() {
    const rank = score === Q.length ? 'Flight Director' : score >= 9 ? 'Range Safety Officer' : score >= 6 ? 'Pad Technician' : 'Trainee';
    const msg = score === Q.length ? 'Perfect score. You\'re ready for real flights.' : score >= 9 ? 'Strong result — review the questions you missed.' : score >= 6 ? 'Solid foundation. Revisit the modules tagged on the questions you missed.' : 'Work back through the modules and try again.';
    const el = document.createElement('div');
    el.className = 'quiz-score';
    el.innerHTML = `<div><b>${score} / ${Q.length}</b> &nbsp;<span class="mono" style="color:var(--flame-2)">${rank.toUpperCase()}</span><p>${msg}</p></div><button class="btn btn-primary" type="button">Retake</button>`;
    $('button', el).addEventListener('click', () => { render(); box.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    box.prepend(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    RA.toast(`Quiz complete: ${score}/${Q.length} · ${rank}`);
  }
  render();

  /* ---------- Glossary ---------- */
  const G = [
    ['Apogee', 'The highest point of the flight, where vertical velocity is zero.'],
    ['Burnout', 'The moment the propellant is used up and thrust ends.'],
    ['Caliber', 'One body-tube diameter. Stability margin is measured in calibers.'],
    ['Centre of gravity (CG)', 'The balance point of the rocket\'s mass. Measure it with the motor installed.'],
    ['Centre of pressure (CP)', 'The point where the total aerodynamic force effectively acts. Fins pull it rearward.'],
    ['Coast', 'The unpowered climb between burnout and apogee.'],
    ['Delay element', 'Slow-burning composition between propellant and ejection charge that times parachute deployment.'],
    ['Drag coefficient (Cd)', 'Dimensionless number describing how "draggy" a shape is. Typical model rockets: 0.5–0.8.'],
    ['Δv (delta-v)', 'Total change in velocity a rocket can produce, from the rocket equation.'],
    ['Dual deployment', 'Two-event recovery: small drogue at apogee, main parachute at low altitude.'],
    ['Ejection charge', 'Small powder charge that pressurises the body tube to push out the recovery system.'],
    ['Expansion ratio (ε)', 'Nozzle exit area divided by throat area. Sets exit Mach and pressure.'],
    ['Grain', 'A shaped block of solid propellant. Its geometry defines the thrust curve.'],
    ['Impulse (total)', 'Thrust integrated over time, in newton-seconds — the area under the thrust curve.'],
    ['Isp (specific impulse)', 'Thrust per unit weight-flow of propellant, in seconds. A measure of engine efficiency.'],
    ['Launch lug / rail button', 'Guides that keep the rocket on the rod or rail until it is fast enough to be stable.'],
    ['Mass ratio', 'Fully fuelled mass divided by empty mass (m₀ / m_f).'],
    ['Max-Q', 'The point of maximum dynamic pressure (½ρv²) — highest aerodynamic load on the airframe.'],
    ['Motor mount', 'Inner tube and centering rings that hold the motor and carry its thrust.'],
    ['Over-stable', 'Margin well above ~2.5 calibers; the rocket weathercocks strongly into wind.'],
    ['Shock cord', 'Elastic or Kevlar line that ties nose cone to body and absorbs ejection shock.'],
    ['Shock diamonds', 'Bright repeating pattern in an exhaust plume caused by pressure mismatch with ambient air.'],
    ['Stability margin', '(CP − CG) / diameter. 1–2 calibers is the usual target.'],
    ['Staging', 'Dropping spent stages so the remaining rocket has a better mass ratio.'],
    ['Streamer', 'Long strip of material used instead of a parachute for small, light rockets.'],
    ['Terminal velocity', 'Steady speed where drag equals weight — e.g. under a parachute.'],
    ['Throat', 'Narrowest point of a nozzle, where the flow is exactly Mach 1.'],
    ['Thrust curve', 'Graph of thrust versus time for a motor.'],
    ['Thrust-to-weight ratio', 'Thrust divided by weight. Must exceed 1 to lift off; aim for 5 or more.'],
    ['Wadding', 'Flame-resistant material protecting the parachute from ejection gases.'],
    ['Weathercocking', 'A stable rocket turning into the wind after leaving the rod.'],
  ];
  const dl = $('#glossList'), inp = $('#glossSearch');
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function paint(q = '') {
    const re = q ? new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig') : null;
    const hit = G.filter(([t, d]) => !q || (t + ' ' + d).toLowerCase().includes(q.toLowerCase()));
    dl.innerHTML = hit.length
      ? hit.map(([t, d]) => `<div><dt>${re ? esc(t).replace(re, '<mark>$1</mark>') : esc(t)}</dt><dd>${re ? esc(d).replace(re, '<mark>$1</mark>') : esc(d)}</dd></div>`).join('')
      : '<div><dt>No matches</dt><dd>Try a broader term.</dd></div>';
  }
  inp.addEventListener('input', () => paint(inp.value.trim()));
  paint();
})();
