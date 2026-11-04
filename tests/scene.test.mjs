import test from 'node:test';
import assert from 'node:assert/strict';
import { project, unproject, groundPoint, depthOrder, pickEntity, entityBounds, moveGroundCursor, groundDistance } from '../dist/scene.js';
import { createWorld, restoreWorld, step } from '../dist/engine.js';

test('projected ground round-trips through picking at all depths and camera offsets',()=>{
  for(const view of [{x:0,y:0},{x:3,y:1.5},{x:-3,y:-1.5}]){
    for(const x of [62,120,240,350,418])for(const y of [205,210,221,237]){
      const screen=project({x,y},view),world=unproject(screen,view);
      assert.ok(Math.abs(world.x-x)<1e-8);assert.ok(Math.abs(world.y-y)<1e-8);
      assert.ok(groundPoint(screen,view),'visible ground including edges accepts placement');
    }
  }
});
test('sky, soil cross-section and outside the tapered ground reject placement',()=>{
  for(const point of [{x:240,y:100},{x:240,y:260},{x:65,y:180},{x:430,y:235},{x:NaN,y:220}])assert.equal(groundPoint(point),null);
  assert.ok(project({x:62,y:205}).x>project({x:62,y:237}).x);
  assert.ok(project({x:240,y:205}).scale<project({x:240,y:237}).scale);
});
test('overlapping residents select the frontmost visible bounds in deterministic order',()=>{
  const back={id:1,type:'tree',x:240,y:215,size:1};
  const front={id:2,type:'rabbit',x:240,y:218,age:50};
  const point=project(front);point.y-=6;
  assert.equal(pickEntity([front,back],point)?.id,front.id);
  const canopy=project(back);canopy.y-=60;
  assert.equal(pickEntity([front,back],canopy)?.id,back.id);
  assert.equal(pickEntity([back,front],{x:50,y:100}),null);
  const tie={...front,id:3};assert.equal(pickEntity([tie,front],point)?.id,3);
  const input=[front,back];assert.deepEqual(depthOrder(input),[back,front]);assert.equal(input[0],front);
  const trunk=project(back);assert.equal(pickEntity([back],{x:trunk.x+24,y:trunk.y-8}),null);
});
test('small seedlings stay selectable at their minimum displayed size',()=>{
  const seed={id:1,type:'tree',x:240,y:215,size:.08},p=project(seed),b=entityBounds(seed);
  assert.ok(p.y-b.top>20);
  assert.equal(pickEntity([seed],{x:p.x,y:p.y-15}),seed);
});
test('keyboard placement remains on the visible floor at every boundary',()=>{
  for(const view of [{x:0,y:0},{x:3,y:-1.5}]){
    let p=project({x:240,y:220},view);
    for(const [dx,dy] of [[-500,-50],[1000,0],[0,100],[-1000,0],[0,-100]]){
      p=moveGroundCursor(p,dx,dy,view);assert.ok(groundPoint(p,view));
    }
  }
});
test('legacy v1 save loads without losing identities, dates, or resident positions',()=>{
  const legacy=createWorld(()=>.4),raw=JSON.stringify(legacy),loaded=restoreWorld(raw);
  assert.deepEqual(loaded,legacy);
  for(const entity of [...loaded.plants,...loaded.animals])assert.ok(groundPoint(project(entity)));
  step(loaded,.1,()=>.4);assert.ok(restoreWorld(JSON.stringify(loaded)));
});
test('ground movement uses the same physical speed in horizontal and depth directions',()=>{
  for(const [targetX,targetY] of [[300,210],[200,235]]){
    const w=createWorld(()=>.4);w.plants=[];w.animals=[w.animals[0]];
    Object.assign(w.animals[0],{x:200,y:210,targetX,targetY,energy:100,wander:100});
    const before={...w.animals[0]};step(w,1,()=>.4);
    assert.ok(Math.abs(groundDistance(w.animals[0],before)-9)<1e-8);
  }
});
test('residents separated in ground depth do not eat or breed across the scene',()=>{
  const w=createWorld(()=>.4),a=w.animals[0],b=w.animals[1];w.animals=[a,b];
  Object.assign(a,{x:220,y:205,energy:100,breed:0});Object.assign(b,{x:220,y:237,energy:100,breed:0});
  step(w,.1,()=>.4);assert.equal(w.births,0);
  const p=w.plants[0];Object.assign(p,{x:220,y:237,size:1});w.plants=[p];w.animals=[a];a.energy=40;
  step(w,.1,()=>.4);assert.ok(a.energy<40,'must walk toward food before eating');
});
