import { createCanvas } from '../artifacts/qa-runtime/node_modules/@napi-rs/canvas/index.js';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createWorld, addEntity } from '../dist/engine.js';
import { render } from '../dist/render.js';
import { prepareSprites } from '../dist/sprites.js';
import { project } from '../dist/scene.js';
prepareSprites(createCanvas);
let seed=123;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const world=createWorld(random),canvas=createCanvas(1440,960),c=canvas.getContext('2d');
for(const weather of ['sunny','rain','night']){
  world.weather=weather;render(c,world,8,{selected:world.animals[0].id});
  await writeFile(new URL(`../artifacts/${weather}.png`,import.meta.url),canvas.toBuffer('image/png'));
}
world.weather='sunny';
render(c,world,8,{tool:'tree',cursor:project({x:250,y:207}),view:{x:0,y:0}});
await writeFile(new URL('../artifacts/placement.png',import.meta.url),canvas.toBuffer('image/png'));
const photo=createCanvas(960,700),p=photo.getContext('2d');render(p,world,8,{height:640});
assert.equal(p.getImageData(10,660,1,1).data[3],0,'scene must not stretch into snapshot caption');
const trees=createWorld(random);trees.plants=[];
for(let i=0;i<65;i++){const tree=addEntity(trees,'tree',62+random()*356,205+random()*32,random);tree.size=.8+random()*.55;}
while(trees.animals.length<18)addEntity(trees,'rabbit',62+random()*356,205+random()*32,random);
const bench=createCanvas(960,640),bc=bench.getContext('2d');render(bc,trees,8);
const times=[];for(let i=0;i<90;i++){const start=performance.now();render(bc,trees,i*.016);times.push(performance.now()-start);}
times.sort((a,b)=>a-b);
await writeFile(new URL('../artifacts/capacity.png',import.meta.url),bench.toBuffer('image/png'));
console.log(JSON.stringify({mode:'native Canvas offline; not browser FPS',entities:83,p50ms:times[45],p95ms:times[85],snapshotCaptionClear:true},null,2));
