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
