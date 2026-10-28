# Rocketry Academy

An interactive learning site covering **beginner and intermediate rocketry and orbital mechanics**. Every module pairs a short explanation with a live, animated lab.

## Modules

**Level 01 — Beginner**

| # | Module | Lab |
|---|--------|-----|
| B1 | Anatomy of a model rocket | Clickable cutaway with exploded view |
| B2 | Newton's three laws | Thrust-vs-weight launch simulator |
| B3 | The four forces | Force diagram by flight phase, with crosswind lift |
| B4 | Anatomy of a flight | Animated flight timeline (Alpha III on a C6-5) |
| B5 | Reading a motor code | Motor decoder + static-fire cutaway |
| B6 | Stability: CG vs CP | Barrowman stability bench + gust test |
| B7 | Safety code | Pre-flight checklist with armed countdown |

**Level 02 — Intermediate**

| # | Module | Lab |
|---|--------|-----|
| I1 | Thrust curves & grain geometry | Grain burn-back + thrust/impulse chart |
| I2 | Tsiolkovsky rocket equation | Δv budget vs. LEO |
| I3 | Specific impulse | Propellant comparison (sea level / vacuum) |
| I4 | Altitude simulator | 1-D flight sim with drag and mass burn-off |
| I5 | Recovery | Parachute sizing + drift calculator |
| I6 | de Laval nozzle | Isentropic nozzle with over/under-expanded plume |
| I7 | Staging | One stage vs. two |

**Level 03 — Advanced: orbital mechanics**

| # | Module | Lab |
|---|--------|-----|
| A1 | Kepler's three laws | Equal-area orbit sweep + T² = a³ log–log chart |
| A2 | Orbits & vis-viva | Newton's cannon, to scale |
| A3 | Gravity turn | 2-D ascent simulator with outcome map, gravity and drag losses |
| A4 | Hohmann transfers | LEO→GEO, LEO→Moon, Earth→Mars with phase angles |
| A5 | Orbital maneuvers | Prograde/retrograde/radial burn sandbox with challenges, plane-change cost |

Plus a 16-question knowledge check and a searchable glossary. Progress is saved in the browser.

## Running locally

It is a static site with no build step and no dependencies:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying

Works as-is on GitHub Pages, Vercel, Netlify or any static host — point it at the repository root.

## Structure

```
index.html
assets/css/style.css
assets/js/physics.js       # pure physics: sim, Barrowman, nozzle, rocket equation, orbits, ascent
assets/js/core.js          # canvas helpers, rocket/flame drawing, progress, hero
assets/js/beginner.js      # B1–B7 labs
assets/js/intermediate.js  # I1–I7 labs
assets/js/advanced.js      # A1–A5 orbital labs
assets/js/extras.js        # quiz + glossary
```

Physics models are simplified for teaching. For real flights use dedicated tools (e.g. OpenRocket) and follow your national association's safety code.

---

© 2026 Jaswanth Madiya. All rights reserved.
