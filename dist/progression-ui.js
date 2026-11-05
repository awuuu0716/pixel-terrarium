import { DECORATIONS, WISHES, currentWish, claimWish, buyDecoration, removeDecoration, dewRate } from './progression.js';
import { renderDecorationIcon } from './decorations.js';

export function createProgressionUI({getWorld,save,toast,selectTool,focusForest,setWeather,isPaused,getSpeed}) {
  const $=s=>document.querySelector(s),dialog=$('#shop-dialog'),cards=new Map();
  let lastWishState='',notice='';
  const openShop=()=>{notice='';selectTool('inspect');update();dialog.showModal();};
  $('#open-shop').onclick=openShop;
  $('#wish-toggle').onclick=()=>{const expanded=$('#wish-toggle').getAttribute('aria-expanded')==='true';$('#wish-toggle').setAttribute('aria-expanded',String(!expanded));$('#wish-details').hidden=expanded;$('#wish-toggle').textContent=expanded?'展開願望':'收起願望';};
  $('#wish-action').onclick=()=>{
    const w=getWorld(),wish=currentWish(w);
    if(!wish){openShop();return;}
    if(w.progression.evidence[wish.id]){
      if(claimWish(w,wish.id)){save();toast(`願望完成，收下 ${wish.reward} 森之露。`);update();}
      return;
    }
    if(wish.id==='decorated'){openShop();return;}
    if(wish.id==='night'){setWeather('night');selectTool('inspect');}
    else selectTool(wish.id==='family'?'inspect':'moss');
    focusForest();
  };
  for(const [key,def] of Object.entries(DECORATIONS)){
    const card=document.createElement('article');card.className='shop-card';
    const icon=document.createElement('canvas');icon.width=128;icon.height=96;icon.setAttribute('aria-hidden','true');renderDecorationIcon(icon,key);
    const title=document.createElement('h3');title.textContent=def.name;
    const description=document.createElement('p');description.textContent=def.description;
    const status=document.createElement('p');status.className='shop-status';status.id=`shop-status-${key}`;
    const action=document.createElement('button');action.className='primary';action.setAttribute('aria-describedby',status.id);
    action.onclick=()=>{
      const w=getWorld();
      if(!w.progression.owned[key]){
        if(buyDecoration(w,key)){save();notice=`已收好${def.name}。可以現在放進森林，也可以稍後佈置。`;update();}
      }else{dialog.close();selectTool(key);focusForest();toast(`選好位置後點一下。按 Esc 或「取消擺放」可取消。`);}
    };
    const remove=document.createElement('button');remove.className='quiet';remove.textContent='收回裝飾';remove.setAttribute('aria-label',`收回${def.name}`);
    remove.onclick=()=>{if(removeDecoration(getWorld(),key)){save();notice=`${def.name}已收回，仍在收藏裡。`;update();action.focus();}};
    card.append(icon,title,description,status,action,remove);$('#shop-items').append(card);cards.set(key,{status,action,remove});
  }
  function update(){
    const w=getWorld(),p=w.progression,wish=currentWish(w),ready=wish&&p.evidence[wish.id];
    const balance=Math.floor(p.dew).toLocaleString('zh-TW');$('#dew-balance').textContent=balance;$('#shop-balance').textContent=balance;
    $('#dew-rate').textContent=isPaused()?'已暫停累積':`1× 時每分鐘約 ${(dewRate(w)*60).toFixed(1)} 森之露 · 目前 ${getSpeed()}×`;
    $('#wish-position').textContent=wish?`森林願望 ${WISHES.indexOf(wish)+1} / ${WISHES.length}`:'森林願望 5 / 5';
    $('#wish-title').textContent=wish?wish.name:'小森林的願望，都實現了';
    $('#wish-state').textContent=wish?(ready?'已完成 · 可以領取':wish.id==='garden'?`${Math.min(12,w.plants.length)} / 12 株`:'等待小小的發現'):'全部完成';
    $('#wish-condition').textContent=wish?wish.condition:'繼續照顧居民、收藏裝飾，或拍下喜歡的風景。';
    $('#wish-hint').textContent=wish?(wish.id==='garden'&&!ready?`再補 ${Math.max(0,12-w.plants.length)} 株植物，替居民準備點心。`:wish.hint):'你的森林，還會慢慢寫下新的故事。';
    if(wish&&!ready&&isPaused()&&['fed','night','family'].includes(wish.id))$('#wish-hint').textContent='時間暫停中，按 ▶ 繼續後才會記錄進食、夜間發現或自然出生。';
    $('#wish-reward').textContent=wish?`完成獎勵 · ${wish.reward} 森之露`:'裝飾可以免費重擺，也能收回收藏。';
    $('#wish-action').textContent=wish?(ready?`領取 ${wish.reward} 森之露`:wish.action):'繼續佈置';
    const state=`${wish?.id||'done'}:${!!ready}`;
    if(lastWishState&&state!==lastWishState)$('#progress-notice').textContent=ready?`「${wish.name}」已完成，可以領取獎勵。`:wish?`下一個願望：${wish.name}`:'五個願望都完成了，繼續享受你的森林。';
    lastWishState=state;
    if($('#shop-notice').textContent!==notice)$('#shop-notice').textContent=notice;
    for(const [key,def] of Object.entries(DECORATIONS)){
      const {status,action,remove}=cards.get(key),owned=p.owned[key],placed=!!p.decorations[key];
      status.textContent=owned?(placed?'已擺在森林 · 重擺或收回都免費':'已收藏 · 尚未擺放'):p.dew<def.price?`${def.price} 森之露 · 還差 ${Math.ceil(def.price-p.dew)} 森之露`:`${def.price} 森之露 · 每款收藏一件`;
      action.textContent=owned?(placed?'重新擺放':'放進森林'):`購買 · ${def.price} 森之露`;
      action.setAttribute('aria-label',`${action.textContent} · ${def.name}`);
      action.disabled=!owned&&p.dew<def.price;remove.hidden=!placed;
    }
  }
  return {update,openShop};
}
