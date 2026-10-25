(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],cl=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const red=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=matchMedia('(max-width:767px)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

/* ---------- loader ---------- */
const ld=$('#ld'),pb=$('#pb');
const hide=()=>{if(!ld.isConnected)return;document.body.classList.remove('lock');ld.classList.add('out');setTimeout(()=>ld.remove(),1100)};

/* ---------- hero engine ---------- */
const TOTAL=200,LERP=.14,HOLD=.94,STARTS=[0,.15,.25,.34,.46,.62,.77,.88];
window.EmberConfig={STARTS,HOLD,TOTAL};
const DIR=mobile?'frames/m/':'frames/';
const hero=$('#hero'),cv=$('#cv'),cx=cv.getContext('2d',{alpha:false});
const caps=$$('.cap'),dots=$$('.rail li');
const frames=new Array(TOTAL).fill(null),queue=[];
const step=mobile?2:1;
for(let i=0;i<TOTAL;i+=step)queue.push(i);
if(queue[queue.length-1]!==TOTAL-1)queue.push(TOTAL-1);
const GATE=Math.min(mobile?30:48,queue.length);
let cw=0,ch=0,cur=0,last=-1,job=0,settled=0,ready=false,act=-1,init=false;
const near=i=>{if(frames[i])return frames[i];for(let d=1;d<TOTAL;d++){if(frames[i-d])return frames[i-d];if(frames[i+d])return frames[i+d]}return null};
function draw(i){const im=near(i);if(!im||!cw)return;const s=Math.max(cw/im.naturalWidth,ch/im.naturalHeight),w=im.naturalWidth*s,h=im.naturalHeight*s;cx.drawImage(im,(cw-w)/2,(ch-h)/2,w,h);last=i}
async function load(i){
  try{const im=new Image();im.src=`${DIR}frame-${String(i+1).padStart(3,'0')}.webp`;await im.decode();frames[i]=im;
    if(!ready){ready=true;cv.classList.add('r')}
    if(i===0)draw(0)}
  catch(e){frames[i]=null}
  settled++;
  if(settled<=GATE)pb.style.transform=`scaleX(${settled/GATE})`
  if(settled===GATE)hide();
  last=-1}
async function worker(){while(job<queue.length)await load(queue[job++])}
function resize(){const d=Math.min(devicePixelRatio||1,1.5),r=cv.getBoundingClientRect();cw=Math.max(1,Math.round(r.width*d));ch=Math.max(1,Math.round(r.height*d));cv.width=cw;cv.height=ch;last=-1;if(ready)draw(Math.round(cur))}

/* ---------- elements for other effects ---------- */
const nav=$('#nav'),sbf=$('#sbf');
const vis={};
const io=new IntersectionObserver(es=>es.forEach(e=>{vis[e.target.dataset.v]=e.isIntersecting}),{rootMargin:'120px 0px'});
$$('[data-v]').forEach(el=>io.observe(el));
const rvio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rvio.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
$$('.rv').forEach(el=>rvio.observe(el));

let docH=1;const measure=()=>{docH=Math.max(1,document.documentElement.scrollHeight-innerHeight)};
new ResizeObserver(measure).observe(document.body);addEventListener('load',measure);

/* ---------- menu wheel ---------- */
const wheel=$('#wheel'),cards=$$('.card',wheel),N=cards.length;
const MENU=[
  ['Ember No. 7','Cocoa nib, burnt honey and silk milk. Our signature latte.','$5.80'],
  ['Double Ristretto','Two thin streams, twenty-eight seconds, pure syrup.','$3.60'],
  ['Copper Cortado','Equal parts espresso and warm milk, served in glass.','$4.20'],
  ['Slow Cold Brew','Eighteen-hour steep, orange oil, over one big cube.','$5.40'],
  ['V60 Flight','Three single origins, poured by hand, one tasting card.','$9.50'],
  ['Affogato Nero','Vanilla gelato drowned in hot espresso, dark chocolate on top.','$6.90'],
  ['House Roast, 250 g','Whole bean, roasted on Monday, packed on Tuesday.','$16.00']
];
const wt=$('#wt'),wd=$('#wd'),wp=$('#wp'),winfo=$('#winfo');
let pos=0,vel=0,autoV=0,snap=null,wdrag=false,whover=false,wfocus=false,wi=0,cwid=300,wstep=200,fadeA=2.3,fadeB=3.2;
let dsx=0,dpos=0,dlast=0,dlt=0,dmoved=0,dtarget=null;
const AUTO=.2;
function wmeasure(){cwid=cards[0].offsetWidth||300;const nar=innerWidth<768;wstep=cwid*(nar?.78:.74);fadeA=nar?1.5:2.3;fadeB=nar?2.5:3.2}
function wrap(d){return((d%N)+N+N/2)%N-N/2}
function wrender(){
  for(let i=0;i<N;i++){
    const d=wrap(i-pos),ad=Math.abs(d),sg=d<0?-1:1;
    const x=sg*(Math.min(ad,1)*wstep*1.02+Math.max(0,ad-1)*wstep*.46);
    const z=-Math.min(ad,3)*110,ry=-cl(d,-1,1)*48,sc=1-Math.min(ad,3)*.06;
    const op=ad<fadeA?1:Math.max(0,1-(ad-fadeA)/(fadeB-fadeA));
    const c=cards[i];
    c.style.transform=`translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
    c.style.opacity=op.toFixed(3);c.style.zIndex=String(100-Math.round(ad*10));
    c.style.setProperty('--dim',(Math.min(ad,1.6)*.42).toFixed(2));
    c.style.visibility=op<=0?'hidden':'visible'}
  const a=((Math.round(pos)%N)+N)%N;
  if(a!==wi){wi=a;winfo.classList.add('out');setTimeout(()=>{wt.textContent=MENU[wi][0];wd.textContent=MENU[wi][1];wp.textContent=MENU[wi][2];winfo.classList.remove('out')},180)}
}
function nudge(n){snap=(snap===null?Math.round(pos):snap)+n;vel=0}
$('#wprev').addEventListener('click',()=>nudge(-1));
$('#wnext').addEventListener('click',()=>nudge(1));
wheel.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){nudge(-1);e.preventDefault()}else if(e.key==='ArrowRight'){nudge(1);e.preventDefault()}});
wheel.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')whover=true});
wheel.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')whover=false});
wheel.addEventListener('focusin',()=>wfocus=true);
wheel.addEventListener('focusout',()=>wfocus=false);
wheel.addEventListener('pointerdown',e=>{
  if(e.button>0)return;wdrag=true;dtarget=e.target.closest('.card');dsx=e.clientX;dpos=pos;dlast=pos;dlt=performance.now();dmoved=0;snap=null;vel=0;
  wheel.classList.add('drag');try{wheel.setPointerCapture(e.pointerId)}catch(_){}});
wheel.addEventListener('pointermove',e=>{
  if(!wdrag)return;const dx=e.clientX-dsx;dmoved=Math.max(dmoved,Math.abs(dx));
  pos=dpos-dx/wstep;const now=performance.now(),dt=(now-dlt)/1000;
  if(dt>0){vel=vel*.6+((pos-dlast)/dt)*.4;dlast=pos;dlt=now}});
const wup=e=>{
  if(!wdrag)return;wdrag=false;wheel.classList.remove('drag');
  if(dmoved<6){vel=0;if(e.type!=='pointerup')return;const c=dtarget;if(c){const i=cards.indexOf(c);if(i>-1)snap=Math.round(pos)+Math.round(wrap(i-pos))}}
  else vel=cl(vel,-6,6)};
wheel.addEventListener('pointerup',wup);wheel.addEventListener('pointercancel',wup);

/* ---------- order builder ---------- */
const bform=$('#bform'),bimgs=$$('#bimgs img'),plus=$('#plus'),bn=$('#bn'),bpr=$('#bpr'),bd=$('#bd'),bsum=$('#bsum'),btot=$('#btot'),bbar=$('#bbar'),bgo=$('#bgo'),milkset=$('#milkset');
const DR={
  latte:{n:'No. 7 Latte',d:'Cocoa nib, burnt honey and silk milk. Our signature.',p:5.8,milk:true},
  cortado:{n:'Copper Cortado',d:'Equal parts espresso and warm milk, served in glass.',p:4.2,milk:true},
  cold:{n:'Slow Cold Brew',d:'Eighteen-hour steep, orange oil, over one big cube.',p:5.4,milk:true},
  pour:{n:'V60 Pour-over',d:'Single origin, poured by hand. Ask the bar for today\u2019s farm.',p:6.5,milk:false},
  affo:{n:'Affogato Nero',d:'Vanilla gelato drowned in hot espresso, dark chocolate on top.',p:6.9,milk:false}
};
const SZ={s:['Small',0],m:['Medium',.6],l:['Large',1.2]};
const ML={whole:['whole',0],oat:['oat',.6],almond:['almond',.6]};
const EX={shot:['extra shot',.9],vanilla:['vanilla',.6],croissant:['a butter croissant',3.5]};
let bt=6.4,bc=6.4,placed=false,lastDrink='';
const money=v=>'$'+v.toFixed(2);
function brender(){
  const f=new FormData(bform),d=f.get('drink'),D=DR[d],sz=f.get('size'),ml=f.get('milk'),pk=f.get('pickup');
  const ex=f.getAll('extra');
  bimgs.forEach(im=>im.classList.toggle('on',im.dataset.drink===d));
  plus.classList.toggle('on',ex.includes('croissant'));
  $$('input',milkset).forEach(i=>i.disabled=!D.milk);
  milkset.style.opacity=D.milk?'':'.45';
  if(d!==lastDrink){lastDrink=d;bn.textContent=D.n;bd.textContent=D.d;bpr.textContent='from '+money(D.p)}
  let t=D.p+SZ[sz][1]+(D.milk?ML[ml][1]:0);ex.forEach(k=>t+=EX[k][1]);
  bt=t;
  const bits=[`${SZ[sz][0]} ${D.n}`];if(D.milk)bits.push(`${ML[ml][0]} milk`);ex.forEach(k=>bits.push(EX[k][0]));
  if(placed){bsum.textContent=`Order #${placed} is confirmed. It will be waiting on the bar in ${pk} minutes at 14 Cooper\u2019s Row.`;bbar.classList.add('done');bgo.textContent='Build another'}
  else{bsum.textContent=bits.join(', ');bbar.classList.remove('done');bgo.textContent='Place pickup order'}
}
bform.addEventListener('change',()=>{placed=false;brender()});
bform.addEventListener('submit',e=>{e.preventDefault();
  if(placed){placed=false;brender();return}
  placed='E-'+(2080+Math.floor(Math.random()*420));brender()});
brender();bc=bt;btot.textContent=money(bc);

/* ---------- reviews ---------- */
const slides=$$('.slide'),RN=slides.length,rdots=$('#rdots'),rbar=$('#rbar'),rcar=$('#rcar');
const RT=7;let ri=0,rtimer=0,rhover=false,rdrag=false,rsx=0;
slides.forEach((s,n)=>{
  const p=$('blockquote p',s),words=p.textContent.trim().split(/\s+/);
  p.textContent='';words.forEach((w,k)=>{const sp=document.createElement('span');sp.className='w';sp.style.setProperty('--k',k);sp.textContent=w;p.appendChild(sp);if(k<words.length-1)p.appendChild(document.createTextNode(' '))});
  s.setAttribute('role','group');s.setAttribute('aria-roledescription','slide');s.setAttribute('aria-label',`${n+1} of ${RN}`);
  if(n){s.setAttribute('aria-hidden','true');s.inert=true}
  const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Show review ${n+1}`);b.addEventListener('click',()=>showR(n));rdots.appendChild(b)});
function showR(n){
  ri=((n%RN)+RN)%RN;rtimer=0;
  slides.forEach((s,k)=>{s.classList.toggle('on',k===ri);s.setAttribute('aria-hidden',k!==ri);s.inert=k!==ri});
  $$('button',rdots).forEach((b,k)=>b.setAttribute('aria-current',k===ri?'true':'false'))}
showR(0);
$('#rprev').addEventListener('click',()=>showR(ri-1));
$('#rnext').addEventListener('click',()=>showR(ri+1));
rcar.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')rhover=true});
rcar.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')rhover=false});
const sl=$('#slides');
sl.addEventListener('pointerdown',e=>{rdrag=true;rsx=e.clientX});
const rup=e=>{if(!rdrag)return;rdrag=false;const dx=e.clientX-rsx;if(Math.abs(dx)>45)showR(ri+(dx<0?1:-1))};
sl.addEventListener('pointerup',rup);sl.addEventListener('pointercancel',()=>rdrag=false);

/* ---------- visit ---------- */
const HRS={Mon:[390,1080],Tue:[390,1080],Wed:[390,1080],Thu:[390,1080],Fri:[390,1080],Sat:[420,1140],Sun:[480,960]};
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const fm=m=>{const h=Math.floor(m/60),mm=m%60,ap=h>=12?'pm':'am',h12=h%12||12;return `${h12}:${String(mm).padStart(2,'0')} ${ap}`};
function status(){
  let wd='Mon',min=0;
  try{const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date());
    wd=p.find(x=>x.type==='weekday').value;min=(+p.find(x=>x.type==='hour').value)*60+(+p.find(x=>x.type==='minute').value)}catch(_){}
  const [o,c]=HRS[wd]||HRS.Mon,el=$('#status'),tx=$('#stxt');
  $$('.hours tr').forEach(r=>r.classList.toggle('today',r.dataset.d.split(' ').includes(wd)));
  if(min>=o&&min<c){el.className='status open';tx.textContent=`Open now · until ${fm(c)}`}
  else{el.className='status closed';
    if(min<o)tx.textContent=`Closed · opens today ${fm(o)}`;
    else{const nx=DAYS[(DAYS.indexOf(wd)+1)%7];tx.textContent=`Closed · opens tomorrow ${fm(HRS[nx][0])}`}}}
status();setInterval(status,30000);

const vgrid=$('#vgrid'),tabs=$$('.vtabs [role=tab]');
tabs.forEach(t=>{
  t.addEventListener('click',()=>selTab(t));
  t.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const o=tabs[tabs.indexOf(t)^1];o.focus();selTab(o);e.preventDefault()}})});
function selTab(t){tabs.forEach(x=>{const on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1});vgrid.dataset.tab=t.dataset.t}

const mapcard=$('#p-map'),map=$('#map'),pv=$('#pv'),pvk=$('#pvk'),pvt=$('#pvt'),pvd=$('#pvd'),pins=$$('.pin');
const dflt=pins[0];
let mx=0,my=0,px=0,py=0,mw=1,pw=250,mapRect=null,follow=false,pvshow=false;
if(fine){follow=true;mapcard.classList.add('follow')}
function setPin(p){pins.forEach(x=>x.classList.toggle('on',x===p));pvk.textContent=p.dataset.k;pvt.textContent=p.dataset.t;pvd.textContent=p.dataset.d;pw=pv.offsetWidth||250}
pins.forEach(p=>{
  p.addEventListener('pointerenter',()=>setPin(p));
  p.addEventListener('focus',()=>setPin(p));
  p.addEventListener('click',()=>setPin(p))});
map.addEventListener('pointerleave',()=>{pvshow=false;pv.classList.remove('show');setPin(dflt)});
const mpos=e=>{if(e.pointerType==='touch')return;mapRect=mapcard.getBoundingClientRect();mw=mapRect.width;mx=e.clientX-mapRect.left;my=e.clientY-mapRect.top;if(!pvshow){px=mx;py=my}if(follow&&!pvshow){pvshow=true;pv.classList.add('show')}};
map.addEventListener('pointerenter',mpos);map.addEventListener('pointermove',mpos);

/* ---------- footer ---------- */
$('#news').addEventListener('submit',e=>{e.preventDefault();const em=$('#em'),m=$('#nmsg');
  if(!em.value||!em.checkValidity()){m.textContent='Please enter a valid email address.';em.focus();return}
  m.textContent='Thank you. The first letter is on its way.';em.value=''});

/* ---------- nav, anchors, magnetic ---------- */
const sheet=$('#sheet'),burger=$('#burger');
function sheetSet(o){sheet.classList.toggle('open',o);sheet.setAttribute('aria-hidden',!o);burger.setAttribute('aria-expanded',o);burger.setAttribute('aria-label',o?'Close menu':'Open menu');document.body.classList.toggle('lock',o)}
burger.addEventListener('click',()=>sheetSet(!sheet.classList.contains('open')));
addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet.classList.contains('open')){sheetSet(false);burger.focus()}});
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href').slice(1),t=id==='top'?document.body:document.getElementById(id);if(!t)return;
  e.preventDefault();if(sheet.classList.contains('open'))sheetSet(false);
  if(id==='top')scrollTo({top:0,behavior:red?'auto':'smooth'});
  else{const y=t.getBoundingClientRect().top+scrollY;scrollTo({top:Math.max(0,y),behavior:red?'auto':'smooth'})}}));
$$('[data-mag]').forEach(el=>{
  el.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||red)return;const r=el.getBoundingClientRect();el.style.transform=`translate(${((e.clientX-r.left-r.width/2)*.28).toFixed(1)}px,${((e.clientY-r.top-r.height/2)*.4).toFixed(1)}px)`});
  el.addEventListener('pointerleave',()=>{el.style.transform=''})});

/* ---------- single rAF loop ---------- */
let pt=performance.now(),lastY=scrollY,navHide=false,navSolid=false,sbv=-1;
function loop(t){
  requestAnimationFrame(loop);
  const dt=Math.min(.05,Math.max(.001,(t-pt)/1000));pt=t;
  const y=scrollY,hr=hero.getBoundingClientRect();

  /* hero */
  if(!red&&hr.bottom>-100&&hr.top<innerHeight+100){
    const tot=hr.height-innerHeight,p0=tot>0?cl(-hr.top/tot):0,tgt=Math.min(1,p0/HOLD)*(TOTAL-1);
    if(!init){cur=tgt;init=true}
    cur=Math.abs(tgt-cur)<.01?tgt:cur+(tgt-cur)*LERP;
    const prog=Math.min(1,(cur/(TOTAL-1))*HOLD);let ci=0;
    for(let n=STARTS.length-1;n>=0;n--)if(prog>=STARTS[n]){ci=n;break}
    if(ci!==act){act=ci;
      caps.forEach((c,n)=>{c.classList.toggle('on',n===ci);c.setAttribute('aria-hidden',n!==ci);c.inert=n!==ci});
      dots.forEach((d,n)=>d.classList.toggle('on',n===ci))}
    const i=Math.round(cur);if(i!==last&&ready)draw(i)}

  /* nav + progress bar */
  const solid=hr.bottom<80;
  if(solid!==navSolid){navSolid=solid;nav.classList.toggle('solid',solid)}
  let hd=navHide;
  if(hr.bottom<0&&!sheet.classList.contains('open')){if(y>lastY+4)hd=true;else if(y<lastY-4)hd=false}else hd=false;
  if(hd!==navHide){navHide=hd;nav.classList.toggle('hide',hd)}
  if(Math.abs(y-lastY)>4)lastY=y;
  const sp=cl(y/docH);if(Math.abs(sp-sbv)>.001){sbv=sp;sbf.style.transform=`scaleY(${sp.toFixed(4)})`}

  /* wheel */
  if(vis.wheel){
    if(!wdrag){
      if(snap!==null){
        pos+=(snap-pos)*Math.min(1,dt*7);
        if(Math.abs(snap-pos)<.003){pos=snap;snap=null}
        autoV=0}
      else{
        const want=(red||whover||wfocus)?0:AUTO;
        autoV+=(want-autoV)*Math.min(1,dt*2.5);
        pos+=(vel+autoV)*dt;vel*=Math.exp(-dt*3);if(Math.abs(vel)<.002)vel=0}}
    if(pos>1e6||pos<-1e6)pos=((pos%N)+N)%N;
    wrender()}

  /* order total count-up */
  if(Math.abs(bt-bc)>.004){bc=red?bt:bc+(bt-bc)*(1-Math.exp(-dt*9));if(Math.abs(bt-bc)<.005)bc=bt;btot.textContent=money(bc)}

  /* reviews */
  if(vis.reviews&&!red){
    if(!rhover&&!rdrag&&!document.hidden){rtimer+=dt;if(rtimer>=RT)showR(ri+1)}
    rbar.style.transform=`scaleX(${cl(rtimer/RT).toFixed(3)})`}

  /* visit pointer-follow card */
  if(vis.visit&&follow&&pvshow){
    px+=(mx-px)*.2;py+=(my-py)*.2;
    const x=Math.min(px+18,Math.max(8,mw-pw-8)),yy=Math.max(8,py+18);
    pv.style.transform=`translate3d(${x.toFixed(1)}px,${yy.toFixed(1)}px,0)`}

}
wmeasure();wrender();
addEventListener('resize',()=>{wmeasure();resize()});
loop(performance.now());

if(red)hide();
else{let rtm=0;new ResizeObserver(()=>{clearTimeout(rtm);rtm=setTimeout(resize,120)}).observe(cv);resize();for(let n=0;n<6;n++)worker();setTimeout(hide,9000)}
})();
