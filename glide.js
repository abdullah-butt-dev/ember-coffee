/* Ashgrove cinematic glide: a hands-free tour of the real page.
   Never autostarts. G or 1-4 to start, Space pauses, any user input takes over.
   ?duration=20  ?loop  ?clean  (?pill shows a tiny status dot)
   window.AshgroveGlide.start(seconds) */
(()=>{
'use strict';
const q=new URLSearchParams(location.search);
const PRESET={'1':20,'2':40,'3':60,'4':90};
const clampDur=n=>Math.min(600,Math.max(5,n));
let defDur=clampDur(parseFloat(q.get('duration'))||20);
const LOOP=q.has('loop'),CLEAN=q.has('clean'),PILL=q.has('pill')&&!CLEAN;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const SPEED=900,HERO_SPEED=420;          // natural px/s used by the dry run
let run=null,pillEl=null;

/* ----- step library ----- */
const vh=()=>innerHeight;
const heroEl=()=>$('#hero');
const heroTop=()=>heroEl().getBoundingClientRect().top+scrollY;
const heroTot=()=>heroEl().offsetHeight-vh();
const cfg=()=>window.AshgroveConfig||{STARTS:[0,.15,.25,.34,.46,.62,.77,.88]};
const focusY=el=>()=>{const r=el.getBoundingClientRect(),y=r.top+scrollY;return Math.max(0,r.height>vh()?y-70:y-(vh()-r.height)/2)};
const maxY=()=>document.documentElement.scrollHeight-vh();

function buildSteps(){
  const S=[];
  const scroll=(to,speed,lin)=>S.push({k:'scroll',to,speed:speed||SPEED,lin:!!lin});
  const dwell=ms=>S.push({k:'dwell',nat:ms});
  const act=fn=>S.push({k:'act',fn});
  S.push({k:'jump'});
  // hero: continuous scrub through every caption beat
  cfg().STARTS.forEach((s,n)=>{
    scroll(()=>heroTop()+Math.min(.999,(s+(n?.018:.004)))*heroTot(),HERO_SPEED,true);
    dwell(n===0?260:230)});
  scroll(()=>heroTop()+heroTot()+vh()*.1,HERO_SPEED,true);
  // menu wheel
  const wheel=$('#wheel');
  scroll(focusY($('#menu')));
  dwell(1300);act(()=>$('#wnext').click());dwell(1500);act(()=>$('#wnext').click());dwell(1100);
  // roast dial
  const rd=$('#rd');
  const setR=v=>()=>{rd.value=v;rd.dispatchEvent(new Event('input',{bubbles:true}))};
  scroll(focusY($('#roast')));
  dwell(700);act(setR(2));dwell(1500);act(setR(0));dwell(1400);act(setR(1));dwell(800);
  // reviews
  scroll(focusY($('#reviews')));
  dwell(1700);act(()=>$('#rnext').click());dwell(1700);
  // visit: synthetic hover on the map
  scroll(focusY($('#visit')));
  const map=$('#map'),pins=$$('.pin',map);
  const ev=(el,type,x,y)=>el.dispatchEvent(new PointerEvent(type,{bubbles:type!=='pointerenter'&&type!=='pointerleave',clientX:x,clientY:y,pointerType:'mouse',isPrimary:true}));
  const hover=(i)=>()=>{const p=pins[i],r=p.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    ev(map,'pointerenter',x,y);ev(map,'pointermove',x,y);ev(p,'pointerenter',x,y)};
  dwell(300);
  [1,2,3].forEach(i=>{act(hover(i));dwell(850)});
  act(()=>{ev(map,'pointerleave',0,0)});
  act(()=>{const t=$('#tab-info');if(t&&t.offsetParent)t.click()});
  dwell(900);
  // footer
  scroll(()=>maxY(),SPEED);
  dwell(1200);
  return S;
}

/* ----- dry run: natural length of the tour ----- */
function dryRun(steps){
  let pos=0,total=0;
  steps.forEach(s=>{
    if(s.k==='scroll'){const t=s.to();const nat=Math.min(7000,Math.max(300,Math.abs(t-pos)/s.speed*1000));s.nat=nat;pos=t}
    else if(s.k==='jump'){pos=0;s.nat=0}
    else if(s.k==='act')s.nat=0;
    total+=s.nat});
  return total;
}

/* ----- engine ----- */
function start(seconds){
  stop(true);
  const dur=clampDur(+seconds||defDur)*1000;
  document.documentElement.style.scrollBehavior='auto';
  const steps=buildSteps();
  scrollTo(0,0);
  const natural=dryRun(steps),scale=dur/natural;
  steps.forEach(s=>s.dur=s.nat*scale);
  run={steps,i:-1,el:0,from:0,to:0,paused:false,raf:0,last:performance.now(),scale,dur};
  if(PILL)showPill();
  nextStep();
  run.raf=requestAnimationFrame(tick);
}
function nextStep(){
  const r=run;r.i++;r.el=0;
  if(r.i>=r.steps.length){
    if(LOOP){const sc=r.scale,d=r.dur;stop(true);setTimeout(()=>start(d/1000),600*sc);return}
    stop();return}
  const s=r.steps[r.i];
  if(s.k==='jump'){scrollTo(0,0);nextStep();return}
  if(s.k==='act'){try{s.fn()}catch(e){}nextStep();return}
  if(s.k==='scroll'){r.from=scrollY;r.to=Math.max(0,Math.min(maxY(),s.to()))}
}
function tick(now){
  const r=run;if(!r)return;
  r.raf=requestAnimationFrame(tick);
  const dt=Math.min(.05,(now-r.last)/1000)*1000;r.last=now;
  if(r.paused)return;
  const s=r.steps[r.i];if(!s)return;
  r.el+=dt;
  if(s.k==='scroll'){
    const t=s.dur>0?Math.min(1,r.el/s.dur):1,e=s.lin?t:ease(t);
    scrollTo(0,r.from+(r.to-r.from)*e);
    if(t>=1)nextStep()}
  else if(s.k==='dwell'){if(r.el>=s.dur)nextStep()}
}
function stop(silent){
  if(run){cancelAnimationFrame(run.raf);run=null}
  if(pillEl){pillEl.remove();pillEl=null}
}
function pause(){if(run)run.paused=true;if(pillEl)pillEl.dataset.p='1'}
function resume(){if(run){run.paused=false;run.last=performance.now()}if(pillEl)pillEl.dataset.p='0'}
function showPill(){
  pillEl=document.createElement('div');
  pillEl.setAttribute('aria-hidden','true');
  pillEl.style.cssText='position:fixed;left:50%;bottom:14px;translate:-50% 0;z-index:300;width:10px;height:10px;border-radius:50%;background:#e0652a;opacity:.8;pointer-events:none';
  document.body.appendChild(pillEl);
}

/* ----- inputs ----- */
const typing=t=>t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable);
addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(typing(e.target))return;
  const k=e.key;
  if(!e.isTrusted)return;
  if(k==='g'||k==='G'){e.preventDefault();start(defDur);return}
  if(PRESET[k]){e.preventDefault();start(PRESET[k]);return}
  if(!run)return;
  if(k===' '){e.preventDefault();run.paused?resume():pause();return}
  stop();                               // any other key = takeover
},true);
['wheel','touchstart','pointerdown'].forEach(t=>addEventListener(t,e=>{if(run&&e.isTrusted)stop()},{capture:true,passive:true}));

window.AshgroveGlide={
  start:s=>start(s),stop:()=>stop(),pause,resume,
  estimate:()=>{const s=buildSteps();return dryRun(s)/1000},
  get running(){return !!run}
};
})();
