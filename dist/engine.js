export const TYPES = {
  moss: { name: '苔蘚', plant: true, growth: .0028, food: .9 },
  fern: { name: '蕨類', plant: true, growth: .0018, food: 1.1 },
  tree: { name: '小樹', plant: true, growth: .0009, food: .5 },
  rabbit: { name: '小兔', speed: 9, hunger: .15 },
  snail: { name: '蝸牛', speed: 2.4, hunger: .075 }
};
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const NAMES = { rabbit: ['麻糬', '米粒', '雪球', '豆花', '奶酥', '小麥', '棉花', '布丁'], snail: ['慢慢', '露珠', '阿捲', '抹茶', '小雨', '栗子', '圈圈', '青苔'] };
export function note(w, text) { w.events.unshift({ time: w.time, text }); w.events.length = Math.min(20, w.events.length); }
export function addEntity(w, type, x, y, rng = Math.random, baby = false) {
  if (!Object.hasOwn(TYPES, type)) return null;
  const def = TYPES[type];
  const group = def.plant ? w.plants : w.animals;
  if (group.length >= (def.plant ? 65 : 18)) return null;
  const entity = { id: w.nextId++, type, x: clamp(x, 62, 418), y: clamp(y, 205, 237), age: 0 };
  if (def.plant) Object.assign(entity, { size: baby ? .2 : .35 + rng() * .25, health: 95, seed: rng() * 100, seedTimer: 45 + rng() * 100 });
  else Object.assign(entity, { energy: baby ? 65 : 85, dir: rng() > .5 ? 1 : -1, targetX: x, targetY: y, wander: 0, breed: baby ? 150 : 50 + rng() * 40, name: NAMES[type][Math.floor(rng() * NAMES[type].length)], state: '散步中' });
  group.push(entity);
  if (w.plants.length >= 12 && !w.badges.garden) { w.badges.garden = true; note(w, '小小里程碑：這裡已經是一片小森林了。'); }
  return entity;
}
export function createWorld(rng = Math.random) {
  const w = { version: 1, time: 0, moisture: 68, sunlight: 65, weather: 'sunny', plants: [], animals: [], events: [], nextId: 1, badges: { garden: false, family: false, night: false }, births: 0, seedClock: 0 };
  for (const [type, x, y, size] of [['tree',116,218,.92],['tree',324,213,.75],['fern',166,227,.85],['fern',363,228,.8],['fern',265,215,.7],['moss',86,230,.85],['moss',198,232,.9],['moss',288,233,.7],['moss',387,219,.75]]) { const p = addEntity(w,type,x,y,rng); p.size=size; }
  addEntity(w,'rabbit',229,229,rng); addEntity(w,'rabbit',309,229,rng); addEntity(w,'snail',140,235,rng);
  note(w,'麻糬、米粒和慢慢，搬進了新家。'); w.animals.forEach((a,i)=>a.name=['麻糬','米粒','慢慢'][i]);
  note(w,'第 1 天。一座小森林，從這裡開始。'); return w;
}
export function vitality(w) {
  if (!w.plants.length && !w.animals.length) return 0;
  const moisture = 100 - Math.abs(w.moisture - 65) * 1.2;
  const health = w.plants.length ? w.plants.reduce((s,p)=>s+p.health,0)/w.plants.length : 0;
  const energy = w.animals.length ? w.animals.reduce((s,a)=>s+a.energy,0)/w.animals.length : 65;
  return Math.round(clamp(moisture*.3 + health*.4 + energy*.3,0,100));
}
export function step(w, dt, rng = Math.random) {
  dt = clamp(dt, 0, 1); if (!dt) return;
  w.time += dt; const rain = w.weather === 'rain', night = w.weather === 'night';
  const light = night ? .06 : (w.sunlight / 100) * (rain ? .48 : 1);
  w.moisture = clamp(w.moisture + dt * (rain ? .48 : -.028 - light*.055 - w.plants.length*.0006), 0, 100);
  const moistureFactor = clamp(1-Math.abs(w.moisture-65)/70,.05,1);
  for (const p of [...w.plants]) {
    p.age += dt;
    const wetNeed = p.type === 'fern' ? .65 : .4;
    p.health = clamp(p.health + dt * (w.moisture < 15 ? -.18 : w.moisture > 96 ? -.06 : .07),0,100);
    p.size = clamp(p.size + dt * TYPES[p.type].growth * light * moistureFactor * (p.health/100) * (w.moisture/100 + wetNeed), .08, 1.35);
    p.seedTimer -= dt;
    if (p.seedTimer <= 0) {
      p.seedTimer = 100 + rng()*160;
      if (p.size > .72 && p.health > 65 && w.moisture > 28 && w.plants.length < 45 && rng()<.65) {
        const child = addEntity(w,p.type,clamp(p.x+(rng()-.5)*65,66,414),205+rng()*31,rng,true);
        if (child) note(w,`一株${TYPES[p.type].name}悄悄冒出新芽。`);
      }
    }
    if (p.health <= 0) { w.plants.splice(w.plants.indexOf(p),1); note(w,`一株${TYPES[p.type].name}回到了土壤裡。記得照顧濕度。`); }
  }
  for (const a of [...w.animals]) {
    a.age += dt; a.breed -= dt; a.wander -= dt;
    a.energy = clamp(a.energy - dt*TYPES[a.type].hunger*(night ? .6 : 1),0,100);
    let food = null;
    if (a.energy < 88) {
      let nearest = Infinity;
      for (const p of w.plants) { if (p.size < .2 || p.health < 15) continue; const d = Math.hypot(p.x-a.x,(p.y-a.y)*2); if (d<nearest) { nearest=d; food=p; } }
    }
    if (food) {
      a.targetX = food.x; a.targetY = food.y;
      if (Math.hypot(a.x-food.x,a.y-food.y)<8) {
        const portion = Math.min(Math.max(0,food.size-.12),dt*.005);
        food.size -= portion; a.energy = clamp(a.energy+portion*520*TYPES[food.type].food,0,100); a.state='吃點心中';
      } else a.state='尋找點心';
    } else if (a.wander <= 0) { a.targetX=66+rng()*348; a.targetY=207+rng()*29; a.wander=5+rng()*14; a.state=night?'月下散步':'散步中'; }
    const dx=a.targetX-a.x, dy=a.targetY-a.y, d=Math.hypot(dx,dy);
    if (d>3 && a.state!=='吃點心中') { const movement=Math.min(d,TYPES[a.type].speed*dt*(rain && a.type==='snail'?1.8:1)*(night?.7:1)); a.x+=dx/d*movement; a.y+=dy/d*movement; a.dir=dx>0?1:-1; }
    else if (!food) a.state=night?'打盹中':'發呆中';
    if (a.energy > 83 && a.breed <= 0 && w.plants.length >= 5 && w.moisture > 25 && w.moisture < 94 && w.animals.length < 18) {
      const mate=w.animals.find(b=>b!==a && b.type===a.type && b.energy>75 && b.breed<=0 && Math.abs(b.x-a.x)<75);
      if (mate) { const child=addEntity(w,a.type,a.x+8,a.y,rng,true); if (child) { a.energy-=20; mate.energy-=15; a.breed=160; mate.breed=160; w.births++; w.badges.family=true; note(w,`新生命！${a.name}的家族迎來小${child.name}。`); } }
    }
    if (a.energy <= 0) { w.animals.splice(w.animals.indexOf(a),1); note(w,`${a.name}化作了森林的養分。多種一點植物吧。`); w.moisture=clamp(w.moisture+3,0,100); }
  }
  if (night && w.plants.length>=5 && !w.badges.night) { w.badges.night=true; note(w,'夜裡亮起一點微光。原來是螢火蟲！'); }
}
export function restoreWorld(raw) {
  try {
    const w=JSON.parse(raw);
    if (!w || w.version!==1 || !Array.isArray(w.plants) || !Array.isArray(w.animals) || !Array.isArray(w.events) || !w.badges || typeof w.badges!=='object' || !['sunny','rain','night'].includes(w.weather)) return null;
    const validNumber=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
    if (!validNumber(w.time,0,1e10)||!validNumber(w.moisture,0,100)||!validNumber(w.sunlight,10,100)||!validNumber(w.nextId,1,1e9)||!validNumber(w.births,0,1e9)||w.plants.length>65||w.animals.length>18) return null;
    const ids=new Set();
    for (const p of [...w.plants,...w.animals]) {
      if (!p || !Object.hasOwn(TYPES,p.type)||!validNumber(p.id,1,w.nextId-1)||ids.has(p.id)||!validNumber(p.x,50,430)||!validNumber(p.y,200,240)||!validNumber(p.age,0,1e10)) return null;
      ids.add(p.id);
      if (TYPES[p.type].plant) { if (!w.plants.includes(p)||!validNumber(p.size,.08,1.35)||!validNumber(p.health,0,100)||!Number.isFinite(p.seed)||!Number.isFinite(p.seedTimer)) return null; }
      else { if (!w.animals.includes(p)||!validNumber(p.energy,0,100)||!validNumber(p.targetX,50,440)||!validNumber(p.targetY,200,245)||!Number.isFinite(p.wander)||!Number.isFinite(p.breed)||![-1,1].includes(p.dir)||typeof p.name!=='string'||p.name.length>20||typeof p.state!=='string'||p.state.length>30) return null; }
    }
    w.events=w.events.filter(e=>e&&Number.isFinite(e.time)&&typeof e.text==='string'&&e.text.length<180).slice(0,20);
    w.badges={garden:w.badges.garden===true,family:w.badges.family===true,night:w.badges.night===true};
    return w;
  } catch { return null; }
}
