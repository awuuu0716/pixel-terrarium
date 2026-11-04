# 瓶中森 · Little Forest

A small browser-based pixel ecosystem. Plant moss, ferns, and trees; watch rabbits and snails feed and reproduce; change the weather and discover fireflies.

## Run locally

Requires Node.js 20.11 or newer. No packages to install.

```sh
npm start
```

Open http://127.0.0.1:4173. Use an HTTP server rather than opening `index.html` directly because the app uses JavaScript modules.

```sh
npm test
```

## Controls

- Select a species and click inside the bottle to place it. Plants are rooted in the soil at the selected horizontal position.
- Select 觀察 and click an inhabitant to inspect it. The canvas also supports arrow keys and Enter / Space.
- Sunny weather grows plants and dries soil; rain replenishes water; night reduces growth and appetite. Weather stays selected until changed.
- Pause or choose 1×, 2×, or 4× speed. Each simulated day lasts 120 seconds at normal speed.
- Save a PNG snapshot, enable synthesized ambience, or start a new forest after confirmation.

## Simulation and persistence

Fixed simulation steps, bounded populations (65 plants / 18 animals), nearby mates and sufficient energy required for reproduction. Food is consumed from actual plants. Plant growth depends on sunlight, moisture, and health. This is a playful model, not a scientific simulation.

Progress saves to browser localStorage every five seconds and after major actions. Hidden tabs pause; there is no offline progression. Data stays within this browser profile and origin. Corrupt saves fall back to a new forest. Google Fonts is optional; system fonts work without it. All art and ambience are generated locally.

`dist/` is the complete static site. `engine.js` contains the testable simulation; `render.js` draws pixel art; `app.js` connects the UI and persistence. `npm test` uses Node's built-in test runner.
