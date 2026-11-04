import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, step, restoreWorld, vitality } from '../dist/engine.js';

function random(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test('stored animal types must be own species definitions, not inherited object properties', () => {
  for (const type of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    const world = createWorld(random(1));
    world.animals[0].type = type;
    assert.equal(restoreWorld(JSON.stringify(world)), null, `must reject ${type}`);
  }
});

test('one hour of moisture-managed care remains viable at the real 0.1 second tick', () => {
  for (const seed of [1, 123, 2026]) {
    const rng = random(seed);
    const world = createWorld(rng);
    for (let tick = 0; tick < 36000; tick++) {
      if (world.moisture < 45) world.weather = 'rain';
      if (world.moisture > 75) world.weather = 'sunny';
      step(world, 0.1, rng);
    }
    assert.ok(world.plants.length > 0 && world.plants.length <= 65, `plants, seed ${seed}`);
    assert.ok(world.animals.length >= 3 && world.animals.length <= 18, `animals, seed ${seed}`);
    assert.ok(world.births > 0, `births, seed ${seed}`);
    assert.ok(vitality(world) > 70, `vitality, seed ${seed}`);
    assert.ok(restoreWorld(JSON.stringify(world)), `reload, seed ${seed}`);
  }
});

test('unattended drought removes dead entities and leaves a valid recoverable world', () => {
  const rng = random(123);
  const world = createWorld(rng);
  for (let tick = 0; tick < 30000; tick++) step(world, 0.1, rng);
  assert.equal(world.plants.length, 0);
  assert.equal(world.animals.length, 0);
  assert.equal(vitality(world), 0);
  assert.ok(restoreWorld(JSON.stringify(world)));
  assert.ok(world.events.length <= 20);
});
