import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const base = new URL(process.env.DEPLOYMENT_URL);
const commit = process.env.GITHUB_SHA;
assert.match(commit ?? '', /^[a-f0-9]{40}$/, 'GITHUB_SHA must be a complete commit SHA');
assert.equal(base.protocol, 'https:', 'Deployment verification requires HTTPS');
if (!base.pathname.endsWith('/')) base.pathname += '/';

async function fetchText(path) {
  const url = new URL(path, base);
  url.searchParams.set('release', commit);
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
  assert.equal(response.status, 200, `${url.pathname} must return HTTP 200`);
  return { body: await response.text(), type: response.headers.get('content-type') ?? '' };
}

// Pages edge caches may take a moment to catch up with a successful deployment.
for (let attempt = 1; ; attempt++) {
  try {
    const version = await fetchText('version.json');
    assert.equal(JSON.parse(version.body).commit, commit, 'Published commit must match the tested commit');
    break;
  } catch (error) {
    if (attempt >= 12) throw error;
    console.log(`Waiting for release ${commit.slice(0, 7)} (${attempt}/12): ${error.message}`);
    await delay(10000);
  }
}

const page = await fetchText('');
assert.match(page.type, /text\/html/i);
assert.match(page.body, /id="world"/, 'The game canvas must be present');
for (const file of ['app.js', 'engine.js', 'render.js', 'scene.js', 'sprites.js', 'style.css', 'favicon.svg']) {
  const asset = await fetchText(file);
  assert.ok(asset.body.length > 0, `${file} must not be empty`);
  assert.doesNotMatch(asset.type, /text\/html/i, `${file} must not be an HTML fallback`);
  if (file.endsWith('.js')) assert.match(asset.type, /javascript/i, `${file} must have a JavaScript MIME type`);
  if (file.endsWith('.css')) assert.match(asset.type, /^text\/css(?:;|$)/i, `${file} must have a CSS MIME type`);
  if (file.endsWith('.svg')) assert.match(asset.type, /^image\/svg\+xml(?:;|$)/i, `${file} must have an SVG MIME type`);
}
console.log(`Verified ${base.href} at ${commit}`);
console.log('HTTP and asset verification passed; this does not replace browser interaction tests.');
