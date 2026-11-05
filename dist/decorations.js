import { project } from './scene.js';
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
export function drawDecoration(c,type) {
  if(type==='mushroom'){
    rect(c,'#d9cb94',-3,-18,6,17);rect(c,'#a49569',2,-17,2,17);
    rect(c,'#a9614a',-14,-23,28,8);rect(c,'#c9825c',-10,-29,20,8);rect(c,'#dcac76',-5,-32,10,5);
    rect(c,'#fff1bb',-8,-25,4,3);rect(c,'#fff1bb',4,-23,4,3);rect(c,'#fff1bb',-1,-29,3,3);
    rect(c,'#f5df8a',-2,-15,4,7);
  }else if(type==='sign'){
    rect(c,'#80674b',-2,-27,4,28);rect(c,'#a58658',-18,-29,33,13);rect(c,'#c4a777',-17,-28,30,3);
    rect(c,'#526a46',-10,-23,18,2);rect(c,'#526a46',5,-26,3,8);rect(c,'#526a46',8,-24,3,4);
  }else if(type==='path'){
    for(const [x,y,w,h] of [[-23,-7,12,6],[-9,-3,12,7],[5,-8,13,6],[17,-3,10,5]]){
      rect(c,'#737c69',x,y,w,h);rect(c,'#aeb59b',x+1,y,w-2,h-2);rect(c,'#cbd0b7',x+3,y,w-6,1);
    }
  }
}
export function renderDecoration(c,e,view={},selected=false){
  const p=project(e,view);c.save();c.translate(p.x,p.y);c.scale(p.scale,p.scale);
  c.fillStyle=selected?'#f0e7ac':'#304a3833';c.beginPath();c.ellipse(1,1,e.type==='path'?28:18,4,0,0,Math.PI*2);c.fill();
  drawDecoration(c,e.type);c.restore();
}
export function renderDecorationIcon(canvas,type){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(canvas.width/64,canvas.height/48);c.translate(32,39);drawDecoration(c,type);c.restore();}
