import { createWorld, addEntity, step, note, vitality, restoreWorld, TYPES, clamp } from './engine.js';
import { render, renderIcon } from './render.js';
import { project, groundPoint, pickEntity, moveGroundCursor } from './scene.js';
import { prepareSprites } from './sprites.js';
import { DECORATIONS, placeDecoration } from './progression.js';
import { createProgressionUI } from './progression-ui.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='little-forest-v1';
let world,storageAvailable=true;
try{world=restoreWorld(localStorage.getItem(KEY));}catch{storageAvailable=false;}
world ||= createWorld();
let tool='inspect',speed=1,paused=false,cursor=null,selected=null,keyboard=false,last=0,accumulator=0,uiTimer=0,saveTimer=0,visualTime=0,toastTimer;
const canvas=$('#world'),ctx=canvas.getContext('2d');
prepareSprites((width,height)=>{const image=document.createElement('canvas');image.width=width;image.height=height;return image;});
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion=motionPreference.matches;
const view={x:0,y:0},viewTarget={x:0,y:0};
const visualWeather={sunny:0,rain:0,night:0};visualWeather[world.weather]=1;
motionPreference.addEventListener('change',e=>{reducedMotion=e.matches;if(reducedMotion){view.x=view.y=viewTarget.x=viewTarget.y=0;}});
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(world));storageAvailable=true;$('#save-status').textContent='已自動保存 · 只存在這台裝置';}catch{storageAvailable=false;$('#save-status').textContent='瀏覽器無法存檔 · 請保持頁面開啟';}}
const descriptions={moss:'苔蘚是小居民的點心，點綠色地面種下。',fern:'蕨類喜歡水分，記得偶爾下場雨。',tree:'小樹會慢慢長大，也會自然散播種子。',rabbit:'小兔需要植物作為食物；同伴能讓家族成長。',snail:'蝸牛走得慢，下雨時會更有活力。',inspect:'點一下植物或居民，看看它的小故事。'};
function selectTool(next){
  tool=next;const decoration=DECORATIONS[tool];
  $$('[data-tool]').forEach(b=>{b.classList.toggle('active',b.dataset.tool===tool);b.setAttribute('aria-pressed',String(b.dataset.tool===tool));});
  $('#tool-description').textContent=decoration?'點綠色地面擺放裝飾。':descriptions[tool];
  $('#placement-hint').textContent=tool==='inspect'?'點一下小居民，認識牠的日常':`已選${decoration?.name||TYPES[tool].name} · 點綠色地面放入`;
  $('#decoration-placement').hidden=!decoration;
  $('#decoration-instruction').textContent=decoration?`正在擺放${decoration.name}。點地面確認；方向鍵移動，Enter 擺放，Esc 取消。`:'';
  canvas.style.cursor=tool==='inspect'?'help':'crosshair';
}
function focusForest(){canvas.focus();canvas.scrollIntoView({block:'center',behavior:'auto'});}
const progressionUI=createProgressionUI({getWorld:()=>world,save,toast,selectTool,focusForest,setWeather,isPaused:()=>paused,getSpeed:()=>speed});
$('#cancel-decoration').onclick=()=>{selectTool('inspect');focusForest();toast('已取消擺放，裝飾仍在原處或收藏裡。');};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&Object.hasOwn(DECORATIONS,tool)){e.preventDefault();selectTool('inspect');focusForest();toast('已取消擺放，裝飾仍在原處或收藏裡。');}});
$$('[data-tool]').forEach(b=>b.addEventListener('click',()=>selectTool(b.dataset.tool)));
$$('[data-speed]').forEach(b=>b.addEventListener('click',()=>{speed=Number(b.dataset.speed);$$('[data-speed]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));});toast(`時間以 ${speed} 倍速流動`);}));
function setWeather(weather){world.weather=weather;note(world,{sunny:'陽光回來了。葉子開始收集暖意。',rain:'下了一場小雨，土壤慢慢喝飽水。',night:'把燈調暗，聽聽森林的夜晚。'}[weather]);updateUI();save();}
$$('[data-weather]').forEach(b=>b.addEventListener('click',()=>{if(world.weather!==b.dataset.weather)setWeather(b.dataset.weather);}));
$('#sunlight').addEventListener('input',e=>{world.sunlight=Number(e.target.value);$('#sun-value').textContent=world.sunlight+'%';});
$('#sunlight').addEventListener('change',save);
$('#pause').addEventListener('click',()=>{paused=!paused;$('#pause').textContent=paused?'▶':'Ⅱ';$('#pause').setAttribute('aria-label',paused?'繼續模擬':'暫停模擬');$('#pause').title=paused?'繼續模擬':'暫停模擬';updateUI();});
function position(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*480,y:(e.clientY-r.top)/r.height*320};}
canvas.addEventListener('pointermove',e=>{cursor=position(e);keyboard=false;if(!reducedMotion&&e.pointerType==='mouse'&&tool==='inspect'&&!paused){viewTarget.x=(cursor.x/480-.5)*6;viewTarget.y=(cursor.y/320-.5)*3;}else viewTarget.x=viewTarget.y=0;});
canvas.addEventListener('pointerleave',()=>{if(!keyboard)cursor=null;viewTarget.x=viewTarget.y=0;});
function interact(p){
  if(p.x<52||p.x>428||p.y<72||p.y>264){toast('小生命要放在瓶子裡喔。');return;}
  if(tool==='inspect'){
    const best=pickEntity([...world.plants,...world.animals],p,view);
    if(best){selected=best.id;updateInspector();}else{selected=null;$('#inspector').hidden=true;toast('靠近一株植物或小居民點一下。');}
  }else{
    const ground=groundPoint(p,view);
    if(!ground){toast('請點瓶內的綠色地面，選擇前後位置。');return;}
    if(Object.hasOwn(DECORATIONS,tool)){
      const name=DECORATIONS[tool].name;
      if(placeDecoration(world,tool,ground.x,ground.y)){note(world,`你在森林擺好了${name}。`);selectTool('inspect');updateUI();save();toast(`${name}擺好了。可以到「佈置森林」免費重擺或收回。`);}
      return;
    }
    const entity=addEntity(world,tool,ground.x,ground.y);
    if(!entity){toast(TYPES[tool].plant?'植物已達 65 株，留一點呼吸的空間。':'居民已達 18 位，這一瓶已經很熱鬧了。');return;}
    note(world,TYPES[tool].plant?`你種下了一株${TYPES[tool].name}。`:`小${TYPES[tool].name==='小兔'?'兔':TYPES[tool].name}「${entity.name}」加入森林。`);
    if(paused)toast('已放入森林。按 ▶ 就會繼續生長。');else if(!TYPES[tool].plant)toast(`${entity.name}搬進了新家！`);
    updateUI();save();
  }
}
canvas.addEventListener('click',e=>{keyboard=false;interact(position(e));if(e.pointerType==='touch')cursor=null;});
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key)){e.preventDefault();if(!keyboard){cursor=project({x:240,y:221});view.x=view.y=viewTarget.x=viewTarget.y=0;}keyboard=true;cursor||=project({x:240,y:221});if(tool==='inspect'){if(e.key==='ArrowLeft')cursor.x=clamp(cursor.x-6,55,425);if(e.key==='ArrowRight')cursor.x=clamp(cursor.x+6,55,425);if(e.key==='ArrowUp')cursor.y=clamp(cursor.y-6,80,250);if(e.key==='ArrowDown')cursor.y=clamp(cursor.y+6,80,250);}else{const dx=e.key==='ArrowLeft'?-8:e.key==='ArrowRight'?8:0,dy=e.key==='ArrowUp'?-3:e.key==='ArrowDown'?3:0;cursor=moveGroundCursor(cursor,dx,dy,view);}if(e.key==='Enter'||e.key===' ')interact(cursor);}});
canvas.addEventListener('blur',()=>{keyboard=false;cursor=null;});
const inspector=$('#inspector'),inspectorClose=document.createElement('button'),inspectorTitle=document.createElement('strong'),inspectorDetail=document.createElement('div'),inspectorAge=document.createElement('small');
inspectorClose.textContent='×';inspectorClose.setAttribute('aria-label','關閉居民資訊');
inspectorClose.onclick=()=>{selected=null;inspector.hidden=true;canvas.focus({preventScroll:true});};
inspector.append(inspectorClose,inspectorTitle,inspectorDetail,inspectorAge);
function updateInspector(){const e=[...world.plants,...world.animals].find(e=>e.id===selected);if(!e){inspector.hidden=true;return;}inspector.hidden=false;inspectorTitle.textContent=TYPES[e.type].plant?TYPES[e.type].name:e.name+' · '+TYPES[e.type].name;inspectorDetail.textContent=TYPES[e.type].plant?`成長 ${Math.round(e.size/1.35*100)}% · 健康 ${Math.round(e.health)}%`:`能量 ${Math.round(e.energy)}% · ${e.state}`;inspectorAge.textContent=`在森林的第 ${Math.floor(e.age/120)+1} 天`;}
let lastEvents='';
function updateUI(){
  const day=Math.floor(world.time/120)+1;$('#day').textContent='DAY '+String(day).padStart(2,'0');$('#time-label').textContent=world.weather==='night'?'夜晚':world.weather==='rain'?'雨天':['清晨','上午','午後','黃昏'][Math.floor(world.time%120/30)];
  $('#plant-count').textContent=world.plants.length;$('#animal-count').textContent=world.animals.length;$('#moisture-value').textContent=Math.round(world.moisture)+'%';$('#moisture-bar').style.width=world.moisture+'%';const health=vitality(world);$('#health-bar').style.width=health+'%';$('#health-value').textContent=health>75?'蓬勃生長':health>50?'安穩生活':'需要照顧';
  $('#pulse-note').textContent=world.moisture<28?'土壤有點乾了。讓森林下一場雨吧。':world.moisture>90?'土壤已經喝飽水，換回晴天透透氣吧。':world.plants.length<5?'多種一些植物，讓居民有足夠的點心。':world.animals.some(a=>a.energy<30)?'有居民肚子餓了。附近種些苔蘚吧。':'有植物，也有小居民。真好。';
  $('#sun-value').textContent=world.sunlight+'%';$('#sunlight').value=world.sunlight;$('#sunlight').disabled=world.weather==='night';
  $('#weather-caption').textContent={sunny:'☀ 微光正好，適合生長',rain:'☂ 一場小雨，森林在喝水',night:'☾ 晚安，還醒著的小生命'}[world.weather];
  $('#climate-note').textContent={sunny:'暖暖的陽光，讓植物慢慢累積能量。',rain:'雨會持續補充水分，濕度高時記得放晴。',night:'夜晚生長變慢，小居民的食量也會減少。'}[world.weather];
  $('#world-status').textContent=paused?'時間暫停，陪森林發個呆':speed>1?`${speed} 倍速，看生命悄悄發生`:'一切都在慢慢發生';
  $$('[data-weather]').forEach(b=>{b.classList.toggle('active',b.dataset.weather===world.weather);b.setAttribute('aria-pressed',String(b.dataset.weather===world.weather));});
  for(const key of ['garden','family','night'])$('#badge-'+key).classList.toggle('unlocked',world.badges[key]);
  const eventKey=JSON.stringify(world.events.slice(0,3));if(lastEvents!==eventKey){lastEvents=eventKey;$('#journal').replaceChildren(...world.events.slice(0,3).map(e=>{const li=document.createElement('li'),time=document.createElement('time'),text=document.createElement('span');time.textContent=`DAY ${String(Math.floor(e.time/120)+1).padStart(2,'0')} · ${String(Math.floor(e.time%120/2)).padStart(2,'0')} MIN`;text.textContent=e.text;li.append(time,text);return li;}));}
  updateInspector();
  progressionUI.update();
}
$('#snapshot').addEventListener('click',()=>{try{const photo=document.createElement('canvas');photo.width=960;photo.height=700;const p=photo.getContext('2d');p.save();p.beginPath();p.rect(0,0,960,640);p.clip();render(p,world,visualTime,{height:640,view,weather:visualWeather});p.restore();p.fillStyle='#f6f5ee';p.fillRect(0,640,960,60);p.fillStyle='#52765b';p.font='20px sans-serif';p.fillText(`瓶中森 · 第 ${Math.floor(world.time/120)+1} 天`,36,678);p.font='12px monospace';p.textAlign='right';p.fillText('A LITTLE LIVING WORLD',924,677);photo.toBlob(blob=>{if(!blob){toast('照片暫時無法輸出，請再試一次。');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`little-forest-day-${Math.floor(world.time/120)+1}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('把這一刻收進相簿裡了。');},'image/png');}catch{toast('瀏覽器無法輸出照片，請再試一次。');}});
$('#help').onclick=()=>$('#help-dialog').showModal();$('#balance-help').onclick=()=>toast('生態活力綜合了土壤濕度、植物健康與居民能量。');$('#reset').onclick=()=>$('#reset-dialog').showModal();
$$('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('#confirm-reset').onclick=()=>{world=createWorld();selected=null;accumulator=0;selectTool('inspect');$('#reset-dialog').close();updateUI();save();toast('新的一瓶，新的故事。');};
// Procedural ambience: no network requests or prerecorded audio.
let audio=null,master=null,soundOn=false;
$('#sound').addEventListener('click',async()=>{try{if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Unsupported');audio=new Audio();master=audio.createGain();master.gain.value=0;master.connect(audio.destination);const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+Math.random()*.04-.02)/1.015;data[i]=brown*2;}const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;noise.connect(filter).connect(master);noise.start();for(const frequency of [196,293.66,392]){const tone=audio.createOscillator(),gain=audio.createGain();tone.frequency.value=frequency;tone.type='sine';gain.gain.value=.014;tone.connect(gain).connect(master);tone.start();}}await audio.resume();soundOn=!soundOn;master.gain.setTargetAtTime(soundOn?.22:0,audio.currentTime,.4);$('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound span').textContent=soundOn?'環境音開':'環境音關';}catch{toast('這個瀏覽器暫時無法播放環境音。');}});
document.addEventListener('visibilitychange',()=>{last=0;accumulator=0;if(document.hidden){save();if(audio)audio.suspend();}else if(audio&&soundOn)audio.resume().catch(()=>{});});
window.addEventListener('pagehide',save);
$$('[data-icon]').forEach(el=>renderIcon(el,el.dataset.icon));
function frame(ms){
  const elapsed=last?Math.min((ms-last)/1000,.1):0;last=ms;
  if(!document.hidden){
    if(!paused){accumulator+=elapsed*speed;while(accumulator>=.1){step(world,.1);accumulator-=.1;}if(!reducedMotion)visualTime+=elapsed*Math.min(speed,2);}
    const ease=1-Math.exp(-elapsed*5);
    if(!paused){for(const axis of ['x','y'])view[axis]+=(viewTarget[axis]-view[axis])*ease;}
    for(const key of ['sunny','rain','night'])visualWeather[key]=reducedMotion?Number(key===world.weather):visualWeather[key]+(Number(key===world.weather)-visualWeather[key])*ease;
    render(ctx,world,visualTime,{tool,cursor,selected,keyboard,view,weather:visualWeather});uiTimer+=elapsed;saveTimer+=elapsed;if(uiTimer>.4){updateUI();uiTimer=0;}if(saveTimer>5){save();saveTimer=0;}
  }
  requestAnimationFrame(frame);
}
updateUI();if(!storageAvailable)$('#save-status').textContent='瀏覽器無法存檔 · 請保持頁面開啟';requestAnimationFrame(frame);
