import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, addEntity, step, restoreWorld } from '../dist/engine.js';
import { WISHES, currentWish, claimWish, buyDecoration, placeDecoration, removeDecoration, dewRate, advanceProgression } from '../dist/progression.js';

test('first wish is actionable immediately; reward funds a visible decoration without waiting',()=>{
  const w=createWorld(()=>.5);
  assert.equal(currentWish(w).id,'garden');assert.equal(claimWish(w,'garden'),false);
  for(let i=0;i<3;i++)addEntity(w,'moss',220+i*10,230,()=>.5);
  assert.equal(claimWish(w,'garden'),true);assert.equal(w.progression.dew,25);
  assert.equal(buyDecoration(w,'mushroom'),true);assert.equal(w.progression.dew,5);
  assert.equal(placeDecoration(w,'mushroom',160,225),true);assert.equal(w.progression.evidence.decorated,true);
});
test('ordered claims retain early discoveries and cannot pay twice after reload',()=>{
  const w=createWorld(()=>.5);w.weather='night';step(w,1,()=>.5);
  assert.equal(w.progression.evidence.night,true);assert.equal(claimWish(w,'night'),false);
  for(let i=0;i<3;i++)addEntity(w,'moss',220,230,()=>.5);
  const a=w.animals[0],p=w.plants[0];a.x=p.x;a.y=p.y;a.energy=40;step(w,1,()=>.5);
  assert.equal(w.progression.evidence.fed,true);
  for(const id of ['garden','fed','night'])assert.equal(claimWish(w,id),true);
  const loaded=restoreWorld(JSON.stringify(w)),balance=loaded.progression.dew;
  for(const id of ['garden','fed','night'])assert.equal(claimWish(loaded,id),false);
  assert.equal(loaded.progression.dew,balance);assert.equal(currentWish(loaded).id,'decorated');
});
test('no food consumed means no feeding evidence; hand-added babies do not count as births',()=>{
  const w=createWorld(()=>.5);w.plants=[];w.animals.forEach(a=>a.energy=100);step(w,1,()=>.5);
  assert.equal(w.progression.evidence.fed,false);addEntity(w,'rabbit',220,220,()=>.5,true);
  assert.equal(w.progression.evidence.family,false);
});
test('natural births are remembered before reaching the final wish',()=>{
  const w=createWorld(()=>.5),[a,b]=w.animals;a.x=b.x=220;a.y=b.y=220;a.breed=b.breed=0;a.energy=b.energy=100;
  step(w,.1,()=>.5);assert.equal(w.births,1);assert.equal(w.progression.evidence.family,true);
  const loaded=restoreWorld(JSON.stringify(w));assert.equal(loaded.progression.evidence.family,true);assert.equal(claimWish(loaded,'family'),false);
});
test('healthy diverse species produce at capped per-type rates; sick and hungry do not',()=>{
  const w=createWorld(()=>.5);w.plants=[];w.animals=[];
  for(let i=0;i<20;i++)addEntity(w,'moss',220,220,()=>.5);
  assert.equal(dewRate(w),.03);addEntity(w,'fern',220,220,()=>.5);assert.equal(dewRate(w),.04);
  for(let i=0;i<6;i++)addEntity(w,'rabbit',220,220,()=>.5);
  assert.equal(dewRate(w),.08);
  w.plants.forEach(p=>p.health=64);w.animals.forEach(a=>a.energy=74);assert.equal(dewRate(w),0);
  advanceProgression(w,100);assert.equal(w.progression.dew,0);
});
test('production follows elapsed simulation time and zero steps do nothing',()=>{
  const w=createWorld(()=>.5),rate=dewRate(w);advanceProgression(w,10);assert.ok(Math.abs(w.progression.dew-rate*10)<1e-8);
  const saved=JSON.stringify(w);step(w,0);assert.equal(JSON.stringify(w),saved);
  advanceProgression(w,0);advanceProgression(w,-10);advanceProgression(w,NaN);assert.equal(JSON.stringify(w),saved);
});
test('ownership and coordinates survive reload; invalid placement and duplicate buys are harmless',()=>{
  const w=createWorld(()=>.5);w.progression.dew=105;
  for(const key of ['mushroom','sign','path'])assert.equal(buyDecoration(w,key),true);
  assert.equal(w.progression.dew,0);assert.equal(buyDecoration(w,'mushroom'),false);assert.equal(buyDecoration(w,'unknown'),false);
  assert.equal(placeDecoration(w,'mushroom',62,205),true);
  for(const [x,y] of [[0,0],[419,220],[200,238],[NaN,220]])assert.equal(placeDecoration(w,'mushroom',x,y),false);
  assert.deepEqual(w.progression.decorations.mushroom,{x:62,y:205});
  const loaded=restoreWorld(JSON.stringify(w));assert.deepEqual(loaded.progression,w.progression);
  assert.equal(removeDecoration(loaded,'mushroom'),true);assert.equal(loaded.progression.owned.mushroom,true);
  assert.equal(loaded.progression.evidence.decorated,true);assert.equal(placeDecoration(loaded,'mushroom',418,237),true);
});
test('legacy full forests migrate without loss or impossible first wish; damaged extension is repaired locally',()=>{
  const w=createWorld(()=>.5);while(w.plants.length<65)addEntity(w,'moss',220,220,()=>.5);
  delete w.progression;const original=structuredClone(w),loaded=restoreWorld(JSON.stringify(w));
  assert.deepEqual(loaded.plants,original.plants);assert.deepEqual(loaded.events,original.events);assert.deepEqual(loaded.badges,original.badges);
  assert.equal(claimWish(loaded,'garden'),true);
  loaded.progression={dew:-5,claimed:['garden','fake'],evidence:null,owned:{mushroom:true,path:true},decorations:{mushroom:{x:200,y:220},path:{x:NaN,y:220}}};
  const repaired=restoreWorld(JSON.stringify(loaded));assert.ok(repaired);assert.equal(repaired.progression.dew,0);
  assert.deepEqual(repaired.progression.claimed,['garden']);assert.deepEqual(repaired.progression.decorations,{mushroom:{x:200,y:220}});
  assert.equal(claimWish(repaired,'garden'),false);
});
test('all wishes have a terminal state; new forest clears economy',()=>{
  const w=createWorld();for(const wish of WISHES){w.progression.evidence[wish.id]=true;assert.equal(claimWish(w,wish.id),true);}
  assert.equal(currentWish(w),null);assert.equal(w.progression.dew,105);
  const fresh=createWorld();assert.equal(fresh.progression.dew,0);assert.deepEqual(fresh.progression.claimed,[]);assert.deepEqual(fresh.progression.decorations,{});
});
