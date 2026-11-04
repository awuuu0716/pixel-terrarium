import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Run the actual verification entry point with in-memory HTTP responses.
// This checks failure propagation without relying on a live deployment.
function verify(overrides = {}) {
  const script = new URL('../scripts/verify-deployment.mjs', import.meta.url).href;
  const code = `
    const overrides = ${JSON.stringify(overrides)};
    const responses = {
      'version.json': [JSON.stringify({commit: process.env.GITHUB_SHA}), 'application/json'],
      '': ['<canvas id="world"></canvas>', 'text/html'],
      'app.js': ['export {};', 'text/javascript'],
      'engine.js': ['export {};', 'application/javascript'],
      'render.js': ['export {};', 'text/javascript'],
      'style.css': ['body {}', 'text/css; charset=utf-8'],
      'favicon.svg': ['<svg/>', 'image/svg+xml']
    };
    globalThis.fetch = async url => {
      if (!url.pathname.startsWith('/pixel-terrarium/')) throw new Error('Lost project base path');
      const file = url.pathname.slice('/pixel-terrarium/'.length);
      const [body, type] = responses[file] ?? ['', 'text/plain'];
      return new Response(body, {status: overrides.missing === file ? 404 : 200,
        headers: {'content-type': overrides[file] ?? type}});
    };
    await import(${JSON.stringify(script)});
  `;
  return spawnSync(process.execPath, ['--input-type=module', '--eval', code], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, DEPLOYMENT_URL: 'https://example.test/pixel-terrarium/', GITHUB_SHA: 'a'.repeat(40) }
  });
}

test('release verification accepts a complete deployment under a project subpath', () => {
  const result = verify();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Verified https:\/\/example.test\/pixel-terrarium\//);
});
for (const [file, type] of [['style.css', 'text/plain'], ['favicon.svg', 'text/plain'], ['app.js', 'text/html']]) {
  test(`release verification rejects an unusable MIME type for ${file}`, () => {
    const result = verify({ [file]: type });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(file.replace('.', '\\.')));
  });
}
test('release verification fails when a required asset is missing', () => {
  const result = verify({ missing: 'engine.js' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must return HTTP 200/);
});
