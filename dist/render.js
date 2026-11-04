import { TYPES } from './engine.js';
const P={dark:'#355c42',deep:'#406c47',green:'#648b50',light:'#91b568',pale:'#bad08a',trunk:'#8f7650'};
const hash=n=>{ const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x); };
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function pixels(c,color,points,size=2){for(const [x,y]of points)rect(c,color,x,y,size,size);}
function path(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}}
function leafCloud(c,x,y,r,seed){
  for(let yy=-r;yy<=r;yy+=3)for(let xx=-r;xx<=r;xx+=3){const d=(xx*xx)/(r*r)+(yy*yy)/(r*r*.75);if(d<.94+hash(seed+xx*3+yy)*.26){const h=hash(seed+xx+yy*9);rect(c,h>.83?P.pale:h>.55?P.light:h>.2?P.green:P.deep,x+xx,y+yy,4,4)}}
}
export function drawPlant(c,p,t=0,icon=false){
  c.save();c.translate(Math.round(p.x),Math.round(p.y));const size=icon?1:Math.max(.28,p.size);c.scale(size,size);
  if(p.health<35)c.globalAlpha=.55;
  if(p.type==='tree'){
    const sway=icon?0:Math.round(Math.sin(t*.6+p.seed)*1.1);
    rect(c,'#55714b',-12,-2,25,3);rect(c,P.trunk,-3,-58,7,58);rect(c,'#b59c64',1,-50,2,48);rect(c,'#705e44',-3,-49,2,48);
    path(c,[[-2,-25],[-18,-43],[-17,-46],[2,-30]],P.trunk);path(c,[[2,-40],[20,-58],[21,-54],[3,-33]],P.trunk);
    leafCloud(c,-18+sway,-53,21,p.seed+3);leafCloud(c,19+sway,-62,23,p.seed+7);leafCloud(c,sway,-77,25,p.seed+9);leafCloud(c,-5+sway,-47,17,p.seed+6);
    pixels(c,'#d6db8c',[[-15,-75],[9,-88],[24,-64],[-29,-55]],3);
  }else if(p.type==='fern'){
    rect(c,P.deep,-1,-35,2,35);const sway=icon?0:Math.sin(t+p.seed)*2;
    for(let i=0;i<6;i++){const h=8+i*5;const spread=21-i*2.5;for(const dir of [-1,1]){for(let j=0;j<4;j++){const xx=dir*(j*spread/4),yy=-h-j*2;rect(c,i%2?P.light:P.green,xx+sway*j/4,yy,dir<0?5:6,3);rect(c,P.deep,xx,yy+3,4,2)}}}
    pixels(c,P.pale,[[0,-37],[-12,-29],[12,-25]],2);
  }else{
    rect(c,'#527447',-15,-4,30,5);rect(c,P.green,-18,-7,36,5);rect(c,P.light,-14,-10,28,5);rect(c,'#aac77b',-9,-12,16,4);
    for(let i=0;i<13;i++){let x=hash(p.seed+i)*30-15,y=-hash(p.seed+i+23)*8-4;rect(c,i%3?P.pale:P.deep,x,y,2,2)}
    if(p.size>.8){rect(c,'#e5dca2',9,-12,2,3);rect(c,'#f5e7b8',7,-14,6,2)}
  }c.restore();
}
export function drawAnimal(c,a,t=0,icon=false){
  c.save();c.translate(Math.round(a.x),Math.round(a.y));c.scale(a.dir||1,1);
  const young=!icon&&a.age<35; if(young)c.scale(.8,.8);
  const moving=a.state==='散步中'||a.state==='尋找點心'||a.state==='月下散步';const hop=a.type==='rabbit'&&moving?Math.round(Math.abs(Math.sin(t*5+a.id))*2):0;c.translate(0,-hop);
  if(a.type==='rabbit'){
    rect(c,'#b5b9a0',-8,0,16,2);rect(c,'#e9e7d6',-8,-9,15,9);rect(c,'#fffcef',-6,-12,11,10);rect(c,'#fffcef',2,-14,9,10);
    rect(c,'#f7f3df',3,-24,3,12);rect(c,'#faf7e7',8,-23,3,10);rect(c,'#d7b8a4',4,-22,1,7);rect(c,'#d7b8a4',9,-21,1,6);
    rect(c,'#e2dec8',-8,-2,5,3);rect(c,'#f9f6e7',4,-2,5,3);rect(c,'#fffcef',-11,-9,4,4);rect(c,'#405142',9,-11,2,2);rect(c,'#d7b39d',11,-8,2,2);rect(c,'#e9c9b2',7,-8,2,2);
    if(a.state==='吃點心中'){rect(c,P.green,10,-3,4,2);rect(c,P.light,12,-4,3,2)}
  }else{
    rect(c,'#c0bb8c',-9,-3,23,4);rect(c,'#99a475',6,-7,7,6);rect(c,'#91a071',11,-10,1,5);rect(c,'#a3ae7a',7,-11,1,5);rect(c,'#3f5844',11,-11,2,2);rect(c,'#3f5844',7,-12,2,2);
    rect(c,'#967147',-8,-13,14,11);rect(c,'#bd985d',-6,-16,11,13);rect(c,'#d2b372',-4,-15,7,11);rect(c,'#947245',-4,-12,6,2);rect(c,'#947245',0,-10,2,5);rect(c,'#947245',-4,-7,5,2);rect(c,'#ac8751',-4,-10,2,3);
  }
  if(a.energy<25){rect(c,'#b48766',-2,-30,2,5);rect(c,'#b48766',-2,-23,2,2)}c.restore();
}
const JAR=[[184,43],[296,43],[296,61],[308,61],[308,66],[398,66],[398,70],[416,70],[416,78],[428,78],[428,94],[434,94],[434,243],[430,243],[430,256],[422,256],[422,264],[410,264],[410,269],[70,269],[70,264],[58,264],[58,256],[50,256],[50,243],[46,243],[46,94],[52,94],[52,78],[64,78],[64,70],[82,70],[82,66],[172,66],[172,61],[184,61]];
export function render(c,w,now,options={}){
  const t=now; const night=w.weather==='night',rain=w.weather==='rain';
  c.save();c.scale(2,2);c.imageSmoothingEnabled=false;
  rect(c,night?'#e3e8de':'#eef1e5',0,0,480,320);
  // Soft botanical backdrop and a quiet tabletop.
  c.globalAlpha=.28;rect(c,'#d9e2c8',0,260,480,1);for(let i=0;i<22;i++){const x=hash(i+2)*480,y=hash(i+43)*235+30;rect(c,'#bccbad',x,y,1,1)}c.globalAlpha=1;
  rect(c,'#e4e8d7',77,277,328,5);rect(c,'#dce3ce',103,274,276,6);rect(c,'#d3ddc5',136,273,208,4);
  path(c,JAR,night?'#263e43':rain?'#dce7d6':'#e3edd5','#aabd9c');
  c.save();path(c,JAR);c.clip();
  const grad=c.createLinearGradient(0,65,0,236);grad.addColorStop(0,night?'#243b46':rain?'#cddfce':'#edf0cd');grad.addColorStop(1,night?'#536a4a':'#d5e4ba');c.fillStyle=grad;c.fillRect(47,44,386,225);
  if(!night){c.globalAlpha=rain?.08:.16+w.sunlight/700;path(c,[[280,50],[314,50],[220,231],[150,231]],'#fffde2');path(c,[[322,50],[332,50],[284,231],[246,231]],'#fffde2');c.globalAlpha=1;}
  if(night){for(let i=0;i<27;i++){const x=64+hash(i+13)*350,y=82+hash(i+14)*100;c.globalAlpha=.3+Math.sin(t+i)*.2;rect(c,'#e6ebba',x,y,i%5===0?2:1,1)}c.globalAlpha=1;rect(c,'#ece7b5',361,94,13,13);rect(c,'#ece7b5',358,97,19,7);rect(c,'#2e4547',357,91,12,12);}
  // Mossy hills behind the foreground plants.
  path(c,[[48,216],[48,208],[62,208],[62,203],[89,203],[89,199],[123,199],[123,202],[157,202],[157,209],[199,209],[199,213],[265,213],[265,208],[292,208],[292,204],[338,204],[338,199],[368,199],[368,202],[403,202],[403,207],[434,207],[434,236],[48,236]],night?'#607a4e':'#9db77a');
  path(c,[[48,224],[72,224],[72,219],[104,219],[104,224],[143,224],[143,220],[180,220],[180,225],[229,225],[229,221],[273,221],[273,223],[319,223],[319,219],[362,219],[362,223],[404,223],[404,219],[434,219],[434,270],[48,270]],'#8b7751');
  rect(c,'#ab9565',49,232,384,7);rect(c,'#7a6b4b',49,250,384,18);rect(c,'#9d875a',49,240,384,9);rect(c,'#6e6347',49,263,384,6);
  // Soil grains, mineral layers, roots.
  for(let i=0;i<170;i++){const x=50+hash(i+7)*380,y=235+hash(i+20)*32;rect(c,['#c0ac77','#6e6248','#b09b68','#8a7954'][i%4],x,y,i%3+1,i%2+1)}
  for(let i=0;i<11;i++){const x=76+i*31;rect(c,'#b3a06b',x,235,1,12+hash(i)*10);rect(c,'#b3a06b',x+1,247,4,1)}
  path(c,[[49,224],[72,224],[72,219],[104,219],[104,224],[143,224],[143,220],[180,220],[180,225],[229,225],[229,221],[273,221],[273,223],[319,223],[319,219],[362,219],[362,223],[404,223],[404,219],[433,219],[433,229],[404,229],[404,231],[362,231],[362,227],[320,227],[320,231],[274,231],[274,229],[230,229],[230,233],[181,233],[181,228],[144,228],[144,232],[105,232],[105,227],[72,227],[72,232],[49,232]],night?'#698552':'#7f9f5d');
  for(let i=0;i<120;i++){const x=56+hash(i+5)*368,y=207+hash(i+100)*27;rect(c,['#9cb771','#b5c982','#577c49','#799a56'][i%4],x,y,2,i%3+1)}
  // A tiny pond, stepping stones, and wildflowers.
  path(c,[[210,224],[222,224],[222,221],[245,221],[245,224],[258,224],[258,230],[250,230],[250,233],[220,233],[220,230],[210,230]],night?'#779896':'#91b8ac');rect(c,night?'#91b2a4':'#c1d8c3',224,224,18,2);rect(c,'#b3cfc0',237+Math.sin(t)*3,229,8,1);
  for(const [x,y,s]of [[77,216,8],[345,231,7],[277,220,5],[188,218,4]]){rect(c,'#8a977d',x-s,y-4,s*2,5);rect(c,'#b6bea2',x-s+2,y-7,s*2-4,4);rect(c,'#d4d6b8',x-s+3,y-7,s-1,2)}
  for(let i=0;i<13;i++){const x=69+hash(i+66)*343,y=212+hash(i+93)*20;rect(c,'#63824c',x,y-6,1,6);rect(c,i%3?'#eee6ac':'#d6b895',x-1,y-7,3,3);rect(c,'#bba66b',x,y-6,1,1)}
  const entities=[...w.plants,...w.animals].sort((a,b)=>a.y-b.y);
  for(const e of entities){if(TYPES[e.type].plant)drawPlant(c,e,t);else drawAnimal(c,e,t);if(options.selected===e.id){c.strokeStyle='#f5f5c8';c.lineWidth=1;c.strokeRect(Math.round(e.x)-10,Math.round(e.y)+3,20,3)}}
  // Rain waters the entire bottle, not the surrounding page.
  if(rain){c.globalAlpha=.5;for(let i=0;i<65;i++){const x=57+hash(i+30)*364;const y=74+((hash(i)*160+t*(55+hash(i)*25))%160);rect(c,'#9cb9af',x,y,1,5);if(y>225)rect(c,'#dbe8cc',x-2,230,5,1)}c.globalAlpha=1;}
  if(night){c.fillStyle='#182e3b';c.globalAlpha=.22;c.fillRect(47,69,386,200);c.globalAlpha=1;if(w.plants.length>=5)for(let i=0;i<12;i++){const x=90+hash(i+4)*300+Math.sin(t*.5+i)*9,y=120+hash(i+8)*94+Math.cos(t*.8+i)*9;const a=.5+Math.sin(t*1.5+i)*.4;c.globalAlpha=a*.14;rect(c,'#eff8aa',x-3,y-3,8,8);c.globalAlpha=a;rect(c,'#eff8aa',x,y,2,2)}c.globalAlpha=1;}
  else if(!rain){for(let i=0;i<3;i++){const x=190+Math.sin(t*.16+i*2)*120,y=130+Math.sin(t*.5+i)*20;const wing=Math.sin(t*9+i)>0?3:1;rect(c,i%2?'#e3c998':'#f2edbf',x-wing,y,wing,3);rect(c,i%2?'#e3c998':'#f2edbf',x+1,y-1,wing,3);rect(c,'#9c9e71',x,y,1,3)}}
  c.restore();
  // Stepped glass edge and light catching on the bottle.
  path(c,JAR,null,'#aabd9c');c.globalAlpha=.45;rect(c,'#ffffff',55,99,3,107);rect(c,'#ffffff',59,85,3,38);rect(c,'#ffffff',65,78,16,2);rect(c,'#ffffff',78,74,89,2);rect(c,'#ffffff',187,48,3,15);rect(c,'#ffffff',419,113,2,83);rect(c,'#fffef0',83,263,316,2);c.globalAlpha=.23;rect(c,'#fffef0',60,106,9,75);rect(c,'#fffef0',414,99,4,110);c.globalAlpha=1;
  // Cork lid.
  rect(c,'#a98c5e',181,33,118,12);rect(c,'#bda477',184,29,112,6);rect(c,'#d2bb8a',187,28,106,3);rect(c,'#8f7955',184,43,112,3);
  for(let i=0;i<28;i++){rect(c,i%2?'#9b8059':'#d0b783',186+hash(i)*107,34+hash(i+6)*7,2,1)}
  rect(c,'#8a9e79',286,33,1,17);rect(c,'#e9e7ce',278,48,18,22);rect(c,'#a9b394',284,54,6,2);rect(c,'#a9b394',283,59,8,1);rect(c,'#a9b394',285,63,4,1);
  // Specimen label.
  c.fillStyle='#8a9a7b';c.font='5px monospace';c.textAlign='center';c.fillText('A LITTLE LIVING WORLD',240,290);c.fillStyle='#a4af96';c.font='4px monospace';c.fillText('GROW AT YOUR OWN PACE',240,299);
  if(options.cursor && options.tool!=='inspect') {const {x,y}=options.cursor;if(x>50&&x<430&&y>75&&y<265){const py=Math.max(205,Math.min(237,y));c.globalAlpha=.45;const e={type:options.tool,x,y:py,size:.6,health:100,seed:12,dir:1,age:40,state:'發呆中'};if(TYPES[e.type]?.plant)drawPlant(c,e,t);else drawAnimal(c,e,t);c.globalAlpha=1;c.strokeStyle='#6f8e57';c.setLineDash([2,2]);c.strokeRect(x-12,py+3,24,4);c.setLineDash([])}}
  if(options.keyboard && options.cursor){const {x,y}=options.cursor;c.strokeStyle='#52765b';c.lineWidth=1;c.strokeRect(x-5,y-5,10,10)}
  c.restore();
}
export function renderIcon(canvas,type){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,40,40);if(type==='tree'){c.save();c.translate(20,37);c.scale(.34,.34);drawPlant(c,{type,x:0,y:0,size:1,health:100,seed:3},0,true);c.restore()}else if(type==='fern'){c.save();c.translate(20,36);c.scale(.75,.75);drawPlant(c,{type,x:0,y:0,size:1,health:100,seed:3},0,true);c.restore()}else if(type==='moss')drawPlant(c,{type,x:20,y:30,size:1,health:100,seed:3},0,true);else drawAnimal(c,{type,x:19,y:32,dir:1,state:'發呆中'},0,true)}
