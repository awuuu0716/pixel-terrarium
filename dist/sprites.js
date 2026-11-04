const P={dark:'#355c42',deep:'#406c47',green:'#648b50',light:'#91b568',pale:'#bad08a',trunk:'#8f7650'};
const hash=n=>{ const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x); };
let makeCanvas=null;
const foliageCache=new Map();
export function prepareSprites(factory){makeCanvas=factory;foliageCache.clear();}
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function pixels(c,color,points,size=2){for(const [x,y]of points)rect(c,color,x,y,size,size);}
function path(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}}
function leafCloud(c,x,y,r,seed){
  if(makeCanvas){
    const key=`${r}:${seed}`;
    let image=foliageCache.get(key);
    if(!image){image=makeCanvas(r*2+12,r*2+12);paintLeaves(image.getContext('2d'),r+4,r+4,r,seed);if(foliageCache.size>=320)foliageCache.delete(foliageCache.keys().next().value);foliageCache.set(key,image);}
    c.drawImage(image,Math.round(x-r-4),Math.round(y-r-4));return;
  }
  paintLeaves(c,x,y,r,seed);
}
function paintLeaves(c,x,y,r,seed){
  for(let yy=-r;yy<=r;yy+=3)for(let xx=-r;xx<=r;xx+=3){const d=(xx*xx)/(r*r)+(yy*yy)/(r*r*.75);if(d<.94+hash(seed+xx*3+yy)*.26){const h=hash(seed+xx+yy*9)-(xx+yy)/r*.19;rect(c,h>.83?P.pale:h>.55?P.light:h>.2?P.green:P.deep,x+xx,y+yy,4,4)}}
}
export function drawPlant(c,p,t=0,icon=false){
  c.save();c.translate(Math.round(p.x),Math.round(p.y));const size=icon?1:Math.max(.28,p.size);c.scale(size,size);
  if(p.health<35)c.globalAlpha*=.55;
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
  const moving=a.state==='散步中'||a.state==='尋找點心'||a.state==='月下散步';const phase=t*5+(a.id||0);const hop=a.type==='rabbit'&&moving?Math.round(Math.max(0,Math.sin(phase))*5):0;c.translate(0,-hop);if(!icon){const breath=Math.sin(t*2+(a.id||0));c.scale(1+(moving?0:breath*.018),1+(a.state==='吃點心中'?Math.sin(t*9)*.025:breath*.025));}
  if(a.type==='rabbit'){
    rect(c,'#b5b9a0',-8,0,16,2);rect(c,'#e9e7d6',-8,-9,15,9);rect(c,'#fffcef',-6,-12,11,10);rect(c,'#fffcef',2,-14,9,10);
    rect(c,'#f7f3df',3,-24,3,12);rect(c,'#faf7e7',8,-23,3,10);rect(c,'#d7b8a4',4,-22,1,7);rect(c,'#d7b8a4',9,-21,1,6);
    rect(c,'#e2dec8',-8,-2,5,3);rect(c,'#f9f6e7',4,-2,5,3);rect(c,'#fffcef',-11,-9,4,4);rect(c,'#405142',9,-11,2,(!icon&&Math.sin(t*.7+(a.id||0))>.993)?1:2);rect(c,'#d7b39d',11,-8,2,2);rect(c,'#e9c9b2',7,-8,2,2);
    if(a.state==='吃點心中'){rect(c,P.green,10,-3,4,2);rect(c,P.light,12,-4,3,2)}
  }else{
    rect(c,'#c0bb8c',-9,-3,23,4);rect(c,'#99a475',6,-7,7,6);const feel=icon?0:Math.round(Math.sin(t*2+(a.id||0)));rect(c,'#91a071',11+feel,-10,1,5);rect(c,'#a3ae7a',7-feel,-11,1,5);rect(c,'#3f5844',11+feel,-11,2,2);rect(c,'#3f5844',7-feel,-12,2,2);
    rect(c,'#967147',-8,-13,14,11);rect(c,'#bd985d',-6,-16,11,13);rect(c,'#d2b372',-4,-15,7,11);rect(c,'#947245',-4,-12,6,2);rect(c,'#947245',0,-10,2,5);rect(c,'#947245',-4,-7,5,2);rect(c,'#ac8751',-4,-10,2,3);
  }
  if(a.energy<25){rect(c,'#b48766',-2,-30,2,5);rect(c,'#b48766',-2,-23,2,2)}c.restore();
}
export function renderIcon(canvas,type){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,40,40);if(type==='tree'){c.save();c.translate(20,37);c.scale(.34,.34);drawPlant(c,{type,x:0,y:0,size:1,health:100,seed:3},0,true);c.restore()}else if(type==='fern'){c.save();c.translate(20,36);c.scale(.75,.75);drawPlant(c,{type,x:0,y:0,size:1,health:100,seed:3},0,true);c.restore()}else if(type==='moss')drawPlant(c,{type,x:20,y:30,size:1,health:100,seed:3},0,true);else drawAnimal(c,{type,x:19,y:32,dir:1,state:'發呆中'},0,true)}
