import test from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../server.mjs';

test('preview server returns honest status codes and serves the playable entry point', async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(origin);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);
    assert.match(await page.text(), /id="world"/);
    for(const file of ['progression.js','progression-ui.js','decorations.js']){
      const asset=await fetch(`${origin}/${file}`);assert.equal(asset.status,200);assert.match(asset.headers.get('content-type'),/javascript/);assert.ok((await asset.text()).length>0);
    }
    const missing = await fetch(origin + '/definitely-missing.js');
    assert.equal(missing.status, 404);
    assert.equal(await missing.text(), 'Not found');
    const invalid = await fetch(origin + '/%ZZ');
    assert.equal(invalid.status, 400);
    const forbidden = await fetch(origin + '/..%2Fpackage.json');
    assert.equal(forbidden.status, 403);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
