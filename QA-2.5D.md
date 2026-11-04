# 2.5D branch verification — 2026-11-04

Branch: `feat/terrarium-2-5d`, based on `78284e0`.
Worktree: `C:/Users/awu/repos/forfun/pixel-terrarium-2-5d`.

## Completed

- `npm run check`: JavaScript syntax checks, including the new projection and sprite modules.
- `npm test`: 27 passing tests. Existing feeding, reproduction, capacity, drought, persistence, and long-running care tests still pass with the unified ground-distance metric.
- New tests cover projection and inverse projection with camera offsets, ground-boundary placement, foreground picking, empty space beside tree trunks, small seedling selection, keyboard boundary clamping, existing v1 save compatibility, equal movement speed in ground coordinates, and preventing feeding or mating across separated depths.
- Deployment verification now requires `scene.js` and `sprites.js`; its fixtures cover invalid MIME types for both modules.
- Offline native Canvas rendering produced sunny, rainy, night, placement-preview, and maximum-population PNGs. The three weather scenes were visually inspected; the initial closed-path reflection artifact was corrected and the updated sunny scene checked again.
- The 960 × 700 snapshot composition leaves the bottom 60-pixel caption area clear of the scene.
- Native Canvas sample: 65 mature trees and 18 residents, 90 warm frames at 960 × 640; median approximately 3.6 ms, 95th percentile approximately 5.1 ms. This measures the Node/Skia renderer only and is not browser FPS or mobile performance evidence.

Reproduce scene output with the optional commands in `README.md`. The application itself has no new installed dependencies; the QA-only Canvas package is under ignored `artifacts/qa-runtime/`.

## Browser verification remains open

The browser connection reported `The browser access host is unavailable`. The native Edge fallback then stopped because Computer Use could not confidently identify the current browser URL. No browser input was sent after that stop.

Consequently this branch is **not claimed to have passed interactive browser QA**. Before merging or publishing, use `npm start` in this worktree and check:

1. Desktop and narrow/mobile layouts: no clipped controls or horizontal overflow.
2. Place all five species at the back, center, and front. The ghost and actual position agree; clicking the sky or cutaway does not add anything.
3. Click a tree canopy, its trunk, a rabbit in front, and empty space beside the trunk. Foreground selection should match the visible object.
4. Keyboard: tab to the canvas, arrows move the cursor, Enter/Space place or inspect. Placement stays on the ground; inspection can reach canopies. Inspector close returns focus.
5. Touch: tapping places once; the camera remains steady. Mouse observation has only subtle parallax.
6. Switch sunny/rain/night, including while paused. Check color transitions, rain depth, ripples, and fireflies. Pause freezes the simulation and decorative animation; weather control still works.
7. Enable the OS reduced-motion preference while the page is open. Parallax and decorative animation stop, weather colors switch immediately, and controls still work.
8. Reload a pre-existing v1 save on the same origin, then save/reload after a placement. IDs, residents, and journal persist.
9. Download a PNG and check framing and caption. Test ambience, help, and reset cancellation.
10. Exercise the maximum population on a browser and a phone; measure frame timing there before making a device-performance claim.

Development is local to the feature worktree. This work does not merge into `main` or publish a Site/GitHub Pages release.
