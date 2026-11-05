// Optional v1 save extension. Ecology remains playable when this data is absent.
export const DECORATIONS = Object.freeze({
  mushroom: { name: '蘑菇小燈', price: 20, description: '一朵暖暖的小燈，替林間留一點光。' },
  sign: { name: '林間木牌', price: 35, description: '在綠意之間，留下一個小小路標。' },
  path: { name: '石頭小徑', price: 50, description: '幾塊圓石，串起森林裡的散步時光。' }
});
export const WISHES = Object.freeze([
  { id: 'garden', name: '準備一桌點心', reward: 25, condition: '讓森林有 12 株植物。', hint: '選苔蘚，在居民附近的綠色地面種下。植物也是牠們的食物。', action: '種下苔蘚' },
  { id: 'fed', name: '居民開飯了', reward: 15, condition: '讓一位居民實際吃到植物。', hint: '在居民附近補種苔蘚，繼續模擬，等牠自己找到點心。', action: '準備點心' },
  { id: 'night', name: '夜裡的微光', reward: 15, condition: '保有至少 5 株植物，在夜晚遇見螢火蟲。', hint: '切換夜晚並繼續模擬。看見微光後，也記得讓植物曬曬太陽。', action: '看看夜晚' },
  { id: 'decorated', name: '佈置我的森林', reward: 20, condition: '買一件喜歡的裝飾，放進森林。', hint: '已買的裝飾可以免費重擺或收回，不需要再次購買。', action: '佈置森林' },
  { id: 'family', name: '新生命報到', reward: 30, condition: '迎接一次自然出生的小生命。', hint: '至少 5 株植物、濕度 26～93%，讓兩位同種居民在附近吃飽並休息。自然出生需要一點時間。', action: '看看居民' }
]);
const MAX_DEW = 1e9;
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
export function restoreProgression(w) {
  const raw=object(w.progression), evidence=object(raw.evidence), claimed=Array.isArray(raw.claimed)?raw.claimed:[];
  const owned=object(raw.owned), decorations=object(raw.decorations);
  const p={ dew:Number.isFinite(raw.dew)?Math.min(MAX_DEW,Math.max(0,raw.dew)):0, claimed:[], evidence:{}, owned:{}, decorations:{} };
  for(const wish of WISHES){if(claimed.includes(wish.id))p.claimed.push(wish.id);p.evidence[wish.id]=evidence[wish.id]===true||p.claimed.includes(wish.id);}
  for(const key of Object.keys(DECORATIONS)){
    p.owned[key]=owned[key]===true;
    const point=object(decorations[key]);
    if(p.owned[key]&&validPosition(point.x,point.y))p.decorations[key]={x:point.x,y:point.y};
  }
  w.progression=p; recordDiscoveries(w); return p;
}
export function recordDiscoveries(w) {
  const p=w.progression;
  if(!p)return;
  if(w.plants.length>=12||w.badges.garden)p.evidence.garden=true;
  if(w.badges.night)p.evidence.night=true;
  if(w.births>0||w.badges.family)p.evidence.family=true;
  if(Object.keys(p.decorations).length)p.evidence.decorated=true;
}
export function recordFeeding(w, portion) { if(portion>0&&w.progression)w.progression.evidence.fed=true; }
export function dewRate(w) {
  const plants={},animals={};
  for(const p of w.plants)if(p.health>=65)plants[p.type]=(plants[p.type]||0)+1;
  for(const a of w.animals)if(a.energy>=75)animals[a.type]=(animals[a.type]||0)+1;
  return Object.values(plants).reduce((n,count)=>n+Math.min(3,count)*.01,0)+Object.values(animals).reduce((n,count)=>n+Math.min(2,count)*.02,0);
}
export function advanceProgression(w,dt) {
  if(!w.progression)restoreProgression(w);
  if(Number.isFinite(dt)&&dt>0)w.progression.dew=Math.min(MAX_DEW,w.progression.dew+dewRate(w)*dt);
  recordDiscoveries(w);
}
export function currentWish(w) { return WISHES.find(wish=>!w.progression.claimed.includes(wish.id))||null; }
export function claimWish(w,id) {
  const wish=currentWish(w);
  if(!wish||wish.id!==id||!w.progression.evidence[id])return false;
  w.progression.claimed.push(id);w.progression.dew=Math.min(MAX_DEW,w.progression.dew+wish.reward);return true;
}
export function buyDecoration(w,key) {
  if(!Object.hasOwn(DECORATIONS,key)||w.progression.owned[key]||w.progression.dew<DECORATIONS[key].price)return false;
  w.progression.dew-=DECORATIONS[key].price;w.progression.owned[key]=true;return true;
}
function validPosition(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&x>=62&&x<=418&&y>=205&&y<=237;}
export function placeDecoration(w,key,x,y) {
  if(!Object.hasOwn(DECORATIONS,key)||!w.progression.owned[key]||!validPosition(x,y))return false;
  w.progression.decorations[key]={x,y};w.progression.evidence.decorated=true;return true;
}
export function removeDecoration(w,key) {
  if(!Object.hasOwn(DECORATIONS,key)||!w.progression.decorations[key])return false;
  delete w.progression.decorations[key];return true;
}
export function decorationEntities(w) {
  return Object.entries(w.progression?.decorations||{}).map(([type,point],index)=>({...point,type,id:-100-index,decoration:true}));
}
