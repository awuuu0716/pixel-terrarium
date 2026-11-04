import { TYPES } from './engine.js';
import { project, groundPoint, depthOrder, entityBounds } from './scene.js';
import { drawPlant, drawAnimal } from './sprites.js';
export { renderIcon } from './sprites.js';

const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function rect(c, color, x, y, w, h) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function path(c, points, fill, stroke, closed=true) {
  c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(Math.round(x),Math.round(y)) : c.moveTo(Math.round(x),Math.round(y))); if(closed)c.closePath();
  if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
}
function oval(c, color, x, y, rx, ry, alpha=1) {
  c.save();c.globalAlpha*=alpha;c.fillStyle=color;
  for(let row=-Math.ceil(ry);row<=ry;row+=2){const half=rx*Math.sqrt(Math.max(0,1-row*row/(ry*ry)));c.fillRect(Math.round(x-half),Math.round(y+row),Math.round(half*2),2);}
  c.restore();
}
const JAR=[[184,43],[296,43],[296,61],[308,61],[308,66],[398,66],[416,72],[428,84],[434,99],[434,243],[430,256],[422,264],[410,270],[70,270],[58,264],[50,256],[46,243],[46,99],[52,84],[64,72],[82,66],[172,66],[172,61],[184,61]];
const ROCKS=[{id:-4,type:'rock',x:83,y:218,size:8},{id:-3,type:'rock',x:349,y:234,size:10},{id:-2,type:'rock',x:272,y:211,size:5},{id:-1,type:'rock',x:186,y:224,size:4}];
const PALETTE={
  sunny:['#eef1e5','#e7edce','#cadcb3','#a5bb79','#7f9b60','#a78c60','#776345','#f9efc3'],
  rain: ['#e5ece5','#c2d5ce','#a8c3a6','#8da776','#6a885c','#937f5d','#695d46','#deead3'],
  night:['#dce4df','#203743','#425e55','#607957','#405d49','#70694e','#474b3b','#b6cebb']
};
function colors(weights) {
  return PALETTE.sunny.map((_,i)=>{
    const rgb=[0,0,0];
    for(const key of ['sunny','rain','night']){const value=parseInt(PALETTE[key][i].slice(1),16),weight=weights[key]||0;rgb[0]+=(value>>16)*weight;rgb[1]+=((value>>8)&255)*weight;rgb[2]+=(value&255)*weight;}
    return `rgb(${rgb.map(Math.round).join(',')})`;
  });
}
function groundPolygon(points,view){return points.map(([x,y])=>{const p=project({x,y},view);return[p.x,p.y];});}
function pond(c,t,view,night) {
  const p=project({x:237,y:222},view);
  oval(c,'#536d50',p.x,p.y+1,29,11,.5);
  oval(c,night>.5?'#638e89':'#8eb9aa',p.x,p.y,27,9);
  oval(c,night>.5?'#749b92':'#bad9bb',p.x-3,p.y-2,21,5,.6);
  for(let i=0;i<3;i++){const phase=(t*.28+i*.33)%1;c.globalAlpha=(1-phase)*.45;c.strokeStyle='#e1ecce';c.lineWidth=1;c.beginPath();c.ellipse(p.x+4,p.y+1,3+phase*17,1+phase*5,0,0,Math.PI*2);c.stroke();}c.globalAlpha=1;
  rect(c,'#618f64',p.x-14,p.y,8,3);rect(c,'#e4d8ac',p.x-11,p.y-2,3,2);
}
function rock(c,e,view) {
  const p=project(e,view),s=e.size*p.scale;
  oval(c,'#394c3a',p.x+2,p.y+1,s+2,s*.3,.24);
  path(c,[[p.x-s,p.y-3],[p.x-s*.6,p.y-s],[p.x+s*.4,p.y-s-2],[p.x+s,p.y-4],[p.x+s*.7,p.y+1],[p.x-s*.6,p.y+1]],'#7d8971');
  path(c,[[p.x-s,p.y-3],[p.x-s*.6,p.y-s],[p.x+s*.4,p.y-s-2],[p.x+s*.25,p.y-4]],'#b7bea0');
  rect(c,'#d4d5b3',p.x-s*.5,p.y-s,s*.7,2);
}
function entity(c,e,t,view,selected=false) {
  const p=project(e,view),plant=TYPES[e.type].plant;
  const radius=plant?(e.type==='tree'?23:e.type==='fern'?16:17)*e.size:e.type==='rabbit'?10:12;
  // Contact shadows stay on the floor while the rabbit jumps above them.
  oval(c,'#304a38',p.x+4,p.y+1,radius*p.scale,Math.max(2,radius*.22*p.scale),.19);
  if(e.type==='tree')oval(c,'#3b5138',p.x+12,p.y+3,32*e.size*p.scale,7*e.size*p.scale,.1);
  if(selected)oval(c,'#f0e7ac',p.x,p.y+1,Math.max(12,radius)*p.scale,4,.85);
  c.save();c.translate(p.x,p.y);c.scale(p.scale,p.scale);
  if(plant)drawPlant(c,{...e,x:0,y:0},t);else drawAnimal(c,{...e,x:0,y:0},t);
  c.restore();
  if(selected){const b=entityBounds(e,view);path(c,[[p.x-3,b.top-6],[p.x+3,b.top-6],[p.x,b.top-3]],'#f2e6ac');}
}

export function render(c,w,t,options={}) {
  const view=options.view||{},weather=options.weather||{[w.weather]:1};
  const night=weather.night||0,rain=weather.rain||0,sun=weather.sunny||0;
  const [paper,sky,horizon,grass,moss,soil,soilDark,light]=colors(weather);
  c.save();c.scale(c.canvas.width/480,(options.height||c.canvas.height)/320);c.imageSmoothingEnabled=false;
  rect(c,paper,0,0,480,320);
  const backdrop=c.createRadialGradient(235,145,30,240,180,260);backdrop.addColorStop(0,'#fffdf363');backdrop.addColorStop(1,'#b6c7a200');c.fillStyle=backdrop;c.fillRect(0,0,480,320);
  rect(c,'#c2ceb5',0,277,480,1);
  oval(c,'#9cad8e',242,278,190,11,.12);oval(c,'#7e9575',242,276,157,6,.17);
  path(c,JAR,sky,'#9eaf97');c.save();path(c,JAR);c.clip();
  const atmosphere=c.createLinearGradient(0,70,0,245);atmosphere.addColorStop(0,sky);atmosphere.addColorStop(1,horizon);c.fillStyle=atmosphere;c.fillRect(46,43,388,228);
  // Distant silhouettes move less than the ground, reinforcing depth.
  for(let i=0;i<13;i++){const x=65+hash(i+8)*354+(view.x||0)*-.2,y=176+hash(i+31)*13,h=18+hash(i+71)*36;c.globalAlpha=.055;path(c,[[x-14,y],[x-9,y-h*.6],[x-4,y-h*.6],[x,y-h],[x+6,y-h*.65],[x+15,y],[x+4,y]],'#426b50');}c.globalAlpha=1;
  if(sun>.001){c.globalAlpha=sun*(.12+w.sunlight/650);path(c,[[272,45],[305,45],[189,240],[113,240]],'#fff9d3');c.globalAlpha=sun*.12;path(c,[[321,47],[334,47],[286,240],[249,240]],'#fffbe1');c.globalAlpha=1;}
  if(night>.001){for(let i=0;i<24;i++){c.globalAlpha=night*(.25+Math.sin(t+i)*.12);rect(c,'#e6ebc6',70+hash(i+18)*337,84+hash(i+55)*80,1,1);}c.globalAlpha=night;oval(c,'#ecdfad',365,101,10,10);oval(c,sky,361,97,9,10);c.globalAlpha=1;}
  const top=groundPolygon([[62,205],[418,205],[418,237],[62,237]],view);
  const left=project({x:62,y:237},view),right=project({x:418,y:237},view);
  // Soil cutaway: top rim, sunlit front face and darker lower strata.
  path(c,[[left.x,left.y],[right.x,right.y],[right.x,259],[402,268],[78,268],[left.x,258]],soilDark);
  path(c,[[left.x,left.y],[right.x,right.y],[right.x,250],[401,259],[79,259],[left.x,250]],soil);
  for(let i=0;i<185;i++){const x=70+hash(i+7)*340,y=247+hash(i+20)*19;rect(c,i%3===0?'#bda272':i%3===1?'#564f3c':'#8b7853',x,y,1+i%3,1+i%2);}
  for(let i=0;i<15;i++){const x=85+i*22;rect(c,'#b49b6d',x,245,1,9+hash(i)*10);rect(c,'#b49b6d',x,254,4,1);}
  path(c,top,grass,'#819767');c.save();path(c,top);c.clip();
  const turf=c.createLinearGradient(0,178,0,246);turf.addColorStop(0,'#d1d69a55');turf.addColorStop(1,'#2f614b22');c.fillStyle=turf;c.fillRect(50,176,380,74);
  for(let i=0;i<320;i++){const p=project({x:62+hash(i+5)*356,y:205+hash(i+100)*32},view);rect(c,[moss,grass,light,'#8ca369'][i%4],p.x,p.y,1+i%3,1);}
  path(c,groundPolygon([[205,205],[224,205],[205,213],[193,222],[209,230],[245,237],[223,237],[191,231],[178,222],[190,213]],view),'#beb38255');
  pond(c,t,view,night);c.restore();
  path(c,groundPolygon([[62,237],[418,237],[418,239],[62,239]],view),moss);
  for(let i=0;i<40;i++){const p=project({x:76+i*8.4,y:236+hash(i)*.8},view);rect(c,i%3?moss:grass,p.x,p.y-2,2,3+hash(i+3)*4);}
  const preview=options.cursor&&options.tool!=='inspect'?groundPoint(options.cursor,view):null;
  const ghost=preview?{...preview,id:Number.MAX_SAFE_INTEGER,type:options.tool,size:.55,health:100,seed:12,dir:1,age:40,state:'發呆中',ghost:true}:null;
  for(const e of depthOrder([...w.plants,...w.animals,...ROCKS,...(ghost?[ghost]:[])])){
    if(e.type==='rock'){rock(c,e,view);continue;}
    if(e.ghost){c.save();c.globalAlpha=.48;entity(c,e,t,view,true);c.restore();}else entity(c,e,t,view,options.selected===e.id);
  }
  for(let i=0;i<12;i++){const p=project({x:70+hash(i+66)*340,y:235+hash(i+93)*2},view),sway=Math.round(Math.sin(t+i)*.6);rect(c,'#63824c',p.x,p.y-5,1,5);rect(c,i%3?'#eee6b7':'#d6af99',p.x-1+sway,p.y-7,3,3);}
  if(rain>.001){c.globalAlpha=rain*.52;for(let i=0;i<80;i++){const depth=hash(i+54),x=61+hash(i+30)*357+(view.x||0)*(depth-.5),floor=178+depth*66,span=floor-77,y=77+((hash(i)*span+t*(48+depth*38))%span);rect(c,'#c2d9cf',x,y,1,3+depth*4);if(y>floor-6)rect(c,'#e0ead0',x-2,floor,5,1);}c.globalAlpha=1;}
  if(night>.001){c.globalAlpha=night*.14;rect(c,'#163241',46,69,388,201);c.globalAlpha=1;if(w.plants.length>=5)for(let i=0;i<14;i++){const x=85+hash(i+4)*310+Math.sin(t*.5+i)*12,y=135+hash(i+8)*94+Math.cos(t*.8+i)*9,a=night*(.5+Math.sin(t*1.5+i)*.4);oval(c,'#edf4a6',x,y,5,4,a*.12);c.globalAlpha=a;rect(c,'#f6efad',x,y,2,2);}c.globalAlpha=1;}
  if(sun>.001){for(let i=0;i<9;i++){c.globalAlpha=sun*(.25+hash(i)*.25);rect(c,'#fff9d8',110+hash(i+42)*240+Math.sin(t*.4+i)*5,105+((hash(i+62)*110-t*2)%110+110)%110,1,1);}c.globalAlpha=1;for(let i=0;i<2;i++){const x=208+Math.sin(t*.16+i*2)*112,y=134+Math.sin(t*.5+i)*18,wing=Math.sin(t*9+i)>0?3:1;c.globalAlpha=sun;rect(c,'#f4e4b6',x-wing,y,wing,3);rect(c,'#f4e4b6',x+1,y-1,wing,3);rect(c,'#9b9972',x,y,1,3);}c.globalAlpha=1;}
  c.restore();
  // Glass is drawn last: thick base, rim, and restrained reflections.
  path(c,JAR,null,'#9eb49c');c.globalAlpha=.65;
  path(c,[[53,109],[58,88],[67,79],[80,74],[166,72]],null,'#fffef2',false);
  rect(c,'#ffffff',55,108,3,94);rect(c,'#ffffff',60,101,7,60);rect(c,'#ffffff',419,111,2,89);
  path(c,[[59,250],[72,261],[406,261],[420,250]],null,'#eef2d8',false);c.globalAlpha=.3;rect(c,'#fffef0',81,265,317,2);c.globalAlpha=1;
  oval(c,'#647b5c',240,47,57,4,.2);rect(c,'#927a53',181,34,118,11);rect(c,'#b99b69',183,30,114,11);rect(c,'#d6bd89',187,27,106,5);rect(c,'#ead5a4',191,27,97,2);
  for(let i=0;i<32;i++)rect(c,i%2?'#947952':'#d0b783',186+hash(i)*108,33+hash(i+6)*7,2,1);
  rect(c,'#8a9e79',286,32,1,18);rect(c,'#ece8d0',278,48,18,22);rect(c,'#a9b394',284,54,6,2);rect(c,'#a9b394',283,59,8,1);rect(c,'#a9b394',285,63,4,1);
  c.fillStyle='#8a9a7b';c.font='5px monospace';c.textAlign='center';c.fillText('A LITTLE LIVING WORLD',240,290);
  if(options.keyboard&&options.cursor){const p=options.cursor;c.strokeStyle='#f8edb9';c.lineWidth=1;c.strokeRect(Math.round(p.x)-5,Math.round(p.y)-5,10,10);}
  c.restore();
}
