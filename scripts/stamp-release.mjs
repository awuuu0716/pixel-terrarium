import { writeFileSync } from 'node:fs';

const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('GITHUB_SHA must be a complete commit SHA.');
writeFileSync(new URL('../dist/version.json', import.meta.url), JSON.stringify({ commit }, null, 2) + '\n');
console.log(`Packaged commit ${commit}`);
