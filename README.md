# 瓶中森 · Little Forest

A small browser-based pixel ecosystem, now rendered as a fixed-view 2.5D miniature. Plant moss, ferns, and trees; watch rabbits and snails feed and reproduce; change the weather and discover fireflies.

[遊戲規格書](docs/GAME_SPEC.md) — 目前版本的玩法、介面、生態邏輯、數值、2.5D 呈現與存檔規則。

[PM RD UIUX 協作方式](docs/TEAM_WORKFLOW.md) — 由 PM 統一承接產品方向與需求，協調研發、設計及驗收。

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

- Select a species and click the green ground to choose both horizontal position and depth. The translucent preview shows where it will appear; the sky and soil cross-section do not accept placement.
- Select 觀察 and click an inhabitant to inspect it. The canvas also supports arrow keys and Enter / Space.
- Sunny weather grows plants and dries soil; rain replenishes water; night reduces growth and appetite. Weather stays selected until changed.
- Pause or choose 1×, 2×, or 4× speed. Each simulated day lasts 120 seconds at normal speed.
- Save a PNG snapshot, enable synthesized ambience, or start a new forest after confirmation.

## 2.5D view

The ground is projected into a trapezoid, with depth scaling, stable back-to-front painting, contact shadows, shaded foliage, soil thickness, and glass reflections. Plants and residents share the same projection for rendering, selection, and placement. Movement, food searches, and mating proximity use one ground-distance metric, so residents must approach food and partners in depth as well as horizontally. The pond and stones remain decorative.

Mouse movement gives a small parallax effect in observation mode. Touch and keyboard operation use a steady camera. Weather colors fade between conditions. Rabbit hops, breathing, blinking, snail feelers, water ripples, and particles bring the scene to life. Decorative animation is capped at 2× even when the simulation runs at 4×. Reduced-motion preferences stop the decorative clock and parallax, and switch weather colors immediately; the ecosystem continues to simulate.

Existing `little-forest-v1` saves load directly: logical coordinates, IDs, ages, journal entries, and badges retain their original format. The new projection changes their screen position without rewriting the saved world. Saves remain specific to browser profile and origin; opening a different local port does not import a production save.

## Simulation and persistence

Fixed simulation steps, bounded populations (65 plants / 18 animals), nearby mates and sufficient energy required for reproduction. Food is consumed from actual plants. Plant growth depends on sunlight, moisture, and health. This is a playful model, not a scientific simulation.

Progress saves to browser localStorage every five seconds and after major actions. Hidden tabs pause; there is no offline progression. Data stays within this browser profile and origin. Corrupt saves fall back to a new forest. Google Fonts is optional; system fonts work without it. All art and ambience are generated locally.

`dist/` is the complete static site. `engine.js` contains the simulation; `scene.js` owns projection, ground distances, and picking; `sprites.js` draws inhabitants and caches foliage; `render.js` composes the diorama; `app.js` connects the UI and persistence. No runtime packages or build step are required. `npm test` uses Node's built-in test runner.

For optional offline scene PNGs and a native Canvas performance sample, run:

```sh
npm install --prefix artifacts/qa-runtime --no-save --package-lock=false @napi-rs/canvas@1.1.0
node scripts/render-preview.mjs
```

Outputs go to ignored `artifacts/`. This checks scene rendering, not browser layout, input, audio, or mobile performance. See `QA-2.5D.md` for this branch's verification and remaining browser checks.

## CI/CD

[Play the public website](https://awuuu0716.github.io/pixel-terrarium/)

The [Test and deploy workflow](https://github.com/awuuu0716/pixel-terrarium/actions/workflows/ci-cd.yml) runs on pull requests to `main`, pushes to `main`, and manual dispatches.

1. Check JavaScript syntax and run all regression tests on Node.js 22 and 24.
2. After both test jobs pass, package only `dist/` from the same commit.
3. Deploy that artifact to GitHub Pages, then check the live commit marker, page, JavaScript, CSS, and favicon over HTTPS.

Pull requests never deploy. Publication is enabled only when the repository variable `PAGES_ENABLED` is `true`, Pages is configured for GitHub Actions, and the run targets `main`. Immediately before publishing, the workflow checks that its commit is still the current `main` revision, rejecting reruns of outdated releases. Deploy jobs use GitHub's short-lived workflow token and OIDC; no personal token or Sites credentials are stored in this repository. Action versions are pinned to commit SHAs.

GitHub Pages is a separate, public hosting target. The existing private ChatGPT Sites address is managed separately; this workflow does not update it. Moving between domains also means a separate browser-local save.

### Enable publication

- In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**.
- Set **Settings → Secrets and variables → Actions → Variables → `PAGES_ENABLED`** to `true`.
- Limit the `github-pages` environment's deployment branches to `main`.
- Run **Actions → Test and deploy → Run workflow**, selecting `main`, or push a new commit to `main`.

Leave `PAGES_ENABLED` unset or set it to `false` to keep CI active while pausing future deployments. This does not remove an already published website. A failed test blocks deployment; a failed post-deployment HTTP check marks the workflow failed but does not automatically roll back the published site. For rollback, revert the unwanted commit on `main` and let the workflow deploy the revert.

HTTP checks verify availability and release identity, not animation, sound, or browser interaction. See [QA.md](QA.md) for the manual acceptance checklist.
