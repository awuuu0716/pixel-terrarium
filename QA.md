# Verification report — 2026-11-04

## Independent code review and logic testing

Completed by a separate review agent, then rechecked after fixes. All 12 Node tests pass. Coverage includes feeding, paired reproduction, population caps, weather and moisture, save validation, long-running mixed-weather simulation, three one-hour runs at the actual 0.1-second tick, drought recovery, and HTTP responses.

Resolved findings:

- Missing local preview assets incorrectly returned HTTP 200. Files are now read before sending success; regression checks cover 200, 400, 403, and 404.
- Species validation could accept inherited object properties such as `constructor` and produce invalid energy values. Species now require an own property in the definition table.
- The inspection card recreated its close button every 400ms. Its DOM nodes are now stable, and closing returns focus to the canvas.
- Animation time now follows the selected simulation speed.

## Independent hands-on testing

A second agent was started only after the first review completed. Browser access was unavailable. Selecting the native Edge window then triggered a Computer Use policy stop because its current URL could not be determined confidently. The agent stopped immediately, without opening a test tab or interacting with the game.

**Hands-on testing is not passed.** No claim is made that appearance, keyboard interaction, sound, downloads, mobile layout, or browser persistence were verified in a live browser. Code-level checks cannot replace those checks.

## Manual acceptance checklist

1. Load the forest; verify the bottle, plants, and moving residents appear.
2. Add each species, inspect a resident, and close its card with the keyboard.
3. Switch to rain and verify moisture rises; switch to night and look for fireflies.
4. Pause and resume; try 2× and 4×. Confirm movement remains comfortable.
5. Reload after adding a plant; verify the same world is restored.
6. Enable ambience, download a PNG, and open the help dialog.
7. Try a narrow/mobile viewport for scrolling, tap targets, and readability.
8. Cancel a reset and confirm the world remains; optionally confirm a reset on a disposable test forest.

Saving is local to the browser profile and site origin. The world pauses while the page is hidden or closed. Selected weather persists; leaving sunshine running without watering eventually causes drought, especially at 4× speed.
