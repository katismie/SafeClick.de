/* Loading reflects the actual hero GLB download. Errors and timeouts never lock the page. */
const loader=document.querySelector('.page-loader'),loaderBar=loader.querySelector('span'),heroModel=document.querySelector('#model');
document.body.classList.add('is-loading');
let ready=false,progress=0;
function showProgress(value){progress=Math.max(progress,Math.min(1,value));loaderBar.style.transform=`scaleX(${progress})`;loader.setAttribute('aria-valuenow',Math.round(progress*100))}
function finishLoading(){if(ready)return;ready=true;showProgress(1);setTimeout(()=>{loader.classList.add('is-done');document.body.classList.remove('is-loading');document.dispatchEvent(new Event('site-ready'))},250)}
heroModel.addEventListener('progress',e=>showProgress(e.detail.totalProgress));heroModel.addEventListener('load',finishLoading,{once:true});heroModel.addEventListener('error',finishLoading,{once:true});if(heroModel.loaded)finishLoading();setTimeout(finishLoading,15000);

/* One persistent product: hero → enlarged story → reverse. */
const story=document.querySelector('.story'),cards=[...document.querySelectorAll('.glass-card')],slot=document.querySelector('.product'),heading=document.querySelector('.heading'),heroCopy=document.querySelector('.copy'),title=document.querySelector('h1'),brand=document.querySelector('.header-brand');
const workflow=document.querySelector('.workflow'),stepPanels=[...document.querySelectorAll('.workflow-panel')];
function workflowTop(){return workflow.getBoundingClientRect().top+scrollY}
const heroPicker=document.querySelector('.hero-color-picker');
const specsSection=document.querySelector('.technical-specs'),showcaseSection=document.querySelector('.product-showcase'),showcaseModel=document.querySelector('#showcase-model');
function specsTop(){return specsSection.getBoundingClientRect().top+scrollY}
function showcaseScrollTop(){return showcaseSection.getBoundingClientRect().top+scrollY}
const lifestyle=document.querySelector('.lifestyle-stage'),lifestylePhoto=lifestyle.querySelector('.lifestyle-photo');
const lifestyleVideo=lifestyle.querySelector('.lifestyle-video');
const lifestylePin=lifestyle.querySelector('.lifestyle-pin');
const lifestylePlay=lifestyle.querySelector('.lifestyle-play');
let lifestyleVisible=false, lifestyleFullscreen=false;
function updateLifestylePlayback(){
 const available=Boolean(slideVideos[activeSlide])&&lifestyleVisible&&lifestyleFullscreen&&!document.hidden;
 lifestylePlay.hidden=!available;
 if(!available){
  lifestyleVideo.pause();
  lifestylePhoto.classList.remove('is-video');
 }
}
lifestylePlay.addEventListener('click',()=>{
 if(lifestylePlay.hidden)return;
 if(!lifestyleVideo.paused){lifestyleVideo.pause();return}
 lifestyleVideo.muted=true;
 lifestyleVideo.play().catch(()=>{
  lifestylePlay.setAttribute('aria-label','Video erneut abspielen');
 });
});
lifestyleVideo.addEventListener('playing',()=>{
 if(lifestylePlay.hidden){lifestyleVideo.pause();return}
 lifestylePhoto.classList.add('is-video');
 lifestylePlay.setAttribute('aria-label','Video pausieren');
});
lifestyleVideo.addEventListener('pause',()=>{lifestylePlay.setAttribute('aria-label','Video abspielen')});
lifestyleVideo.addEventListener('error',()=>lifestylePhoto.classList.remove('is-video'));
new IntersectionObserver(([entry])=>{
 lifestyleVisible=entry.isIntersecting;
 updateLifestylePlayback();
},{threshold:.2}).observe(lifestylePin);
document.addEventListener('visibilitychange',updateLifestylePlayback);
const lifestyleCopies=[...lifestyle.querySelectorAll('.lifestyle-copy')];
const slideVideos=[lifestyleVideo.getAttribute('src'),lifestyleVideo.dataset.schoolSrc,lifestyleVideo.dataset.seniorSrc];
const slidePhotos=[...lifestyle.querySelectorAll('.lifestyle-frames img')];
const slideButtons=[...lifestyle.querySelectorAll('[data-slide-step]')];
let activeSlide=0, slideTouch=null, lastHorizontalWheel=0;
function moveLifestyleSlide(step){
 const next=Math.max(0,Math.min(slidePhotos.length-1,activeSlide+step));
 if(next===activeSlide)return;
 lifestyleVideo.pause();
 lifestylePhoto.classList.remove('is-video');
 if(slideVideos[next])lifestyleVideo.setAttribute('src',slideVideos[next]);
 else{lifestyleVideo.removeAttribute('src');lifestyleVideo.load()}
 activeSlide=next;
 updateLifestylePlayback();
 lifestylePhoto.dataset.slide=String(next);
 lifestyleCopies.forEach((copy,index)=>{copy.hidden=index!==next});
 slidePhotos.forEach((photo,index)=>photo.setAttribute('aria-hidden',String(index!==next)));
 slideButtons.forEach(button=>{button.disabled=next+Number(button.dataset.slideStep)<0||next+Number(button.dataset.slideStep)>=slidePhotos.length});
 schedulePaint();
}
slideButtons.forEach(button=>button.addEventListener('click',()=>moveLifestyleSlide(Number(button.dataset.slideStep))));
lifestylePin.addEventListener('keydown',event=>{
 if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
 event.preventDefault();
 moveLifestyleSlide(event.key==='ArrowRight'?1:-1);
 const available=slideButtons.find(button=>!button.disabled);
 available?.focus({preventScroll:true});
});
lifestylePhoto.addEventListener('wheel',event=>{
 if(event.ctrlKey||Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;
 if(event.cancelable)event.preventDefault();
 if(performance.now()-lastHorizontalWheel>350){
  moveLifestyleSlide(Math.sign(event.deltaX));
  lastHorizontalWheel=performance.now();
 }
},{passive:false});
const photoReady=lifestyle.querySelector('img').hasAttribute('src');lifestyle.hidden=!photoReady;
function lifestyleTop(){return lifestyle.getBoundingClientRect().top+scrollY}
function sceneEnd(){return photoReady?9:7}
function controlledScrollEnd(){return photoReady?lifestyleTop()+2*sceneHeight():specsTop()}
const layer=document.createElement('div');layer.className='shared-product';layer.append(heroModel);document.body.append(layer);
const morph=document.createElement('div');morph.className='brand-morph';morph.textContent='SafeClick';morph.setAttribute('aria-hidden','true');morph.hidden=true;document.body.append(morph);
heroModel.removeAttribute('camera-controls');heroModel.setAttribute('disable-zoom','');heroModel.setAttribute('disable-pan','');heroModel.setAttribute('tabindex','-1');
heroModel.interpolationDecay=0;
heroModel.setAttribute('min-camera-orbit','auto auto 0.01m');heroModel.setAttribute('max-camera-orbit','auto auto 1m');
heroModel.addEventListener('load',()=>{heroModel.animationName='Device workflow';heroModel.pause();heroModel.currentTime=0});
let phase=0,angle=0,touchY=null,frameState=0,targetState=0,raf=0,lastFrame=0,lastWrite=0,mouseX=0,mouseY=0,mouseTargetX=0,mouseTargetY=0,needsPaint=true,lastSceneScroll=null,heroEntrance=null;
const motionReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let savedView=null;
try{const value=JSON.parse(sessionStorage.getItem('safeclick-view')||'null');if(value?.path===location.pathname&&Number.isFinite(value.y)&&Number.isFinite(value.state))savedView=value}catch{}
let restoring=Boolean(savedView&&savedView.y>2);
if('scrollRestoration' in history)history.scrollRestoration='manual';
window.addEventListener('pagehide',()=>{if(restoring)return;try{sessionStorage.setItem('safeclick-view',JSON.stringify({path:location.pathname,y:scrollY,state:frameState}))}catch{}});


function sceneHeight(){return document.querySelector('.screen').clientHeight}
function storyTop(){return story.getBoundingClientRect().top+scrollY}
function interpolate(a,b,t){return a+(b-a)*t}
function paint(state){
 if(state>0&&heroEntrance){heroEntrance.cancel();heroEntrance=null}
 frameState=state;const t=Math.max(0,Math.min(1,state)),rect=slot.getBoundingClientRect(),vh=sceneHeight(),vw=document.documentElement.clientWidth;
 const heroY=rect.top+scrollY;const mobile=vw<=760;
 const operation=smooth(3,4,state);
 const workflowExit=photoReady&&state>6?Math.min(0,workflowTop()-scrollY):0;
 const end={left:mobile?vw*.025:vw*.12,top:mobile?interpolate(vh*.09,vh*.2,operation):interpolate(vh*.12,vh*.16,operation),width:mobile?vw*.95:vw*.76,height:mobile?vh*.43:vh*.76};
 // Keep the WebGL viewport constant during scrolling. Only the compositor layer moves/scales.
 const visualHeight=interpolate(Math.max(80,rect.height-86)*1.09,end.height,t);
 const centerX=interpolate(rect.left+rect.width/2,end.left+end.width/2,t);
 const centerY=interpolate(heroY+Math.max(80,rect.height-86)/2,end.top+end.height/2,t)+workflowExit;
 const scale=visualHeight/end.height;
 layer.style.visibility=restoring?'hidden':'visible';
 layer.style.left='0px';layer.style.top='0px';
 layer.style.width=`${end.width}px`;layer.style.height=`${end.height}px`;
 layer.style.transform=`translate3d(${centerX-end.width/2}px,${centerY-end.height/2}px,0) scale(${scale})`;
 layer.style.opacity=(photoReady&&state>6&&workflow.getBoundingClientRect().bottom<=0)||scrollY>specsTop()+vh*.65?'0':'1';
 const spin=Math.max(0,Math.min(2,state-1));
 angle=interpolate(interpolate(0,-8,t)-35*Math.sin(spin*Math.PI),0,operation);
 const pointerGain=smooth(.9,1,state)*(photoReady?1-smooth(5.8,6,state):1);
 const tilt=interpolate(interpolate(85,82,t)-16*Math.sin(spin*Math.PI*2),85,operation)+mouseY*2*pointerGain;
 const roll=interpolate(interpolate(40,-12,t)+180*spin,360,operation);
 heroModel.orientation=`${-roll}deg ${28*Math.sin(spin*Math.PI)*(1-operation)}deg 0deg`;
 heroModel.shadowIntensity=0;
 if(heroModel.loaded){const time=photoReady&&state>=6?3:Math.max(0,Math.min(4,state-3));if(Math.abs(heroModel.currentTime-time)>.00001)heroModel.currentTime=time;}
 // Neutral-model fit in meters preserves the previous size without auto-framing each pose.
 const radius=.179346594*interpolate(.75,1.05,t);heroModel.cameraOrbit=`${angle+mouseX*3*pointerGain}deg ${tilt}deg ${radius}m`;heroModel.style.transform=`translate(${mouseX*6*pointerGain}px,${mouseY*4*pointerGain}px) rotate(0deg)`;
 const titleRect=title.getBoundingClientRect(),target=brand.getBoundingClientRect();const size=parseFloat(getComputedStyle(title).fontSize),brandSize=parseFloat(getComputedStyle(brand).fontSize);
 morph.style.left=`${interpolate(titleRect.left,target.left,t)}px`;morph.style.top=`${interpolate(titleRect.top+scrollY,target.top,t)}px`;morph.style.fontSize=`${interpolate(size,brandSize,t)}px`;morph.style.letterSpacing=`${interpolate(-.065*size,-1.2,t)}px`;
 morph.hidden=state===0;title.style.opacity=state===0?'1':'0';heading.querySelector('.eyebrow').style.opacity=String(1-t);
 heroCopy.style.opacity=String(1-smooth(.02,.85,t));
 // Entry masks never animate during exit: fade the complete paragraph block.
 heroCopy.querySelectorAll('.line-text').forEach(line=>{if(t>.001)line.getAnimations().forEach(animation=>animation.cancel());line.style.opacity='1';line.style.transform='none'});
 heroPicker.style.opacity=String(1-smooth(.01,.4,state));heroPicker.inert=state>.15;
 if(photoReady){const zoom=smooth(7,8,state),initialWidth=vw*(mobile?.88:.5);lifestylePhoto.style.width=`${interpolate(initialWidth,vw,zoom)}px`;lifestylePhoto.style.height=`${interpolate(initialWidth*941/1670,vh,zoom)}px`;lifestylePhoto.style.borderRadius=`${interpolate(24,0,zoom)}px`;const fullscreen=state>=7.999;if(fullscreen!==lifestyleFullscreen){lifestyleFullscreen=fullscreen;updateLifestylePlayback()}const shade=smooth(8,9,state),text=smooth(7.75,8,state);lifestylePhoto.style.setProperty('--photo-dim',String(shade*.18));lifestylePin.style.setProperty('--slide-width',lifestylePhoto.style.width);
 const activeCopy=lifestyleCopies[activeSlide];
 if(activeCopy){activeCopy.style.opacity=String(text);activeCopy.setAttribute('aria-hidden',String(text<.5))}lifestylePhoto.querySelector('.photo-scroll-hint').style.opacity=String(smooth(7.75,8,state))}
 updateCards(state);
 updateSteps(state);
 if(state>=3.25)positionWorkflowCopy(vh,mobile);
 brand.style.pointerEvents=t===1?'auto':'none';
 if(scrollY>specsTop()+vh*.7)morph.hidden=true;
}
// Use the product silhouette rather than paragraph height or the bottom of the screen.
function positionWorkflowCopy(vh,mobile){
 const dimensions=heroModel.loaded?heroModel.getDimensions():null;
 const productRadius=dimensions?Math.min(dimensions.x,dimensions.y,dimensions.z)/2:.015;
 const distance=.179346594*1.05;
 const viewportHeight=vh*(mobile?.43:.76),center=vh*(mobile?.415:.54);
 const focal=viewportHeight/(2*Math.tan(15*Math.PI/180));
 const productBottom=center+focal*productRadius/Math.sqrt(distance*distance-productRadius*productRadius);
 const preferredGap=parseFloat(getComputedStyle(workflow).getPropertyValue('--step-copy-gap'));
 const maxCopyHeight=Math.max(...stepPanels.map(panel=>panel.querySelector('.workflow-copy').getBoundingClientRect().height));
 const gap=Math.min(preferredGap,Math.max(24,vh-32-maxCopyHeight-productBottom));
 workflow.style.setProperty('--step-copy-top',`${productBottom+gap}px`);
}
function smooth(a,b,value){const x=Math.max(0,Math.min(1,(value-a)/(b-a)));return x*x*(3-2*x)}
function updateCards(state){
 const weights=[smooth(.32,1,state)*(1-smooth(1.15,2,state)),smooth(1.15,2,state)*(1-smooth(2.15,3,state)),smooth(2.15,3,state)];
 cards.forEach((card,i)=>{const opacity=weights[i]*(1-smooth(3,4,state)),entered=state>=i+1,offset=entered?-55*(1-opacity):55*(1-opacity);card.style.opacity=String(opacity);card.style.transform=`translateY(calc(-50% + ${offset}px))`;card.style.visibility=opacity>.001?'visible':'hidden';card.inert=opacity<.5;card.setAttribute('aria-hidden',String(opacity<.5));card.style.pointerEvents=opacity>=.5?'auto':'none'});
 phase=Math.round(state);story.dataset.slide=state<.3?'hero':String(Math.max(0,Math.round(state)-1));document.body.dataset.phase=phase;
}
function updateSteps(state){
 const weights=[smooth(3.25,4,state)*(1-smooth(4.15,5,state)),smooth(4.15,5,state)*(1-smooth(5.15,6,state)),smooth(5.15,6,state)];
 stepPanels.forEach((panel,i)=>{const opacity=weights[i]*(1-smooth(6,7,state));panel.style.opacity=String(opacity);[...panel.children].forEach(child=>{child.style.opacity=String(opacity)});panel.style.visibility=opacity>.001?'visible':'hidden';panel.inert=opacity<.5;panel.setAttribute('aria-hidden',String(opacity<.5))});
 const selectedStep=Math.max(0,Math.min(2,Math.round(state-4)));
 workflow.dataset.step=String(selectedStep);
 document.querySelectorAll('[data-goto-step]').forEach(button=>{const active=Number(button.dataset.gotoStep)===selectedStep;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
}
function sceneScroll(state){const before=storyTop()*Math.min(1,state)+(workflowTop()-storyTop())*smooth(3,4,state);return before+(photoReady?(lifestyleTop()-workflowTop())*smooth(6,7,state)+sceneHeight()*(smooth(7,8,state)+smooth(8,9,state)):(specsTop()-workflowTop())*smooth(6,7,state))}
let menuTransition=null,specsJumpTarget=null,photoGestureUntil=0;
function schedulePaint(){needsPaint=true;if(!raf)raf=requestAnimationFrame(tick)}
function tick(now){
 const dt=lastFrame?Math.min(40,now-lastFrame):16;lastFrame=now;
 const distance=targetState-frameState;
 const step=motionReduced?distance:Math.sign(distance)*Math.min(Math.abs(distance)*(1-Math.exp(-dt/160)),.022*dt/16);
 let state=Math.abs(distance)<.001?targetState:frameState+step,navigationScroll=null;
 if(menuTransition){
  const progress=motionReduced?1:Math.max(0,Math.min(1,(now-menuTransition.start)/650));
  const ease=progress*progress*(3-2*progress);
  state=interpolate(menuTransition.from,targetState,ease);
  if(menuTransition.scrollTo!==undefined)navigationScroll=interpolate(menuTransition.scrollFrom,menuTransition.scrollTo,ease);
  if(progress===1){state=targetState;menuTransition=null}
 }
 const sceneChanged=state!==frameState;
 const dx=mouseTargetX-mouseX,dy=mouseTargetY-mouseY;
 const pointerChanged=Math.abs(dx)>.001||Math.abs(dy)>.001;
 const follow=1-Math.exp(-dt/110);
 mouseX=pointerChanged?mouseX+dx*follow:mouseTargetX;mouseY=pointerChanged?mouseY+dy*follow:mouseTargetY;
 if(sceneChanged||navigationScroll!==null){const top=navigationScroll??sceneScroll(state);lastSceneScroll=top;lastWrite=now;if(Math.abs(scrollY-top)>.5)window.scrollTo({top,behavior:'instant'})}
 if(sceneChanged||pointerChanged||needsPaint){needsPaint=false;paint(state)}
 if(menuTransition||Math.abs(targetState-frameState)>.0001||Math.abs(mouseTargetX-mouseX)>.001||Math.abs(mouseTargetY-mouseY)>.001||needsPaint)raf=requestAnimationFrame(tick);
 else{raf=0;lastFrame=0}
}
function goTo(value){if(specsJumpTarget!==null){specsJumpTarget=null;window.scrollTo({top:scrollY,behavior:'instant'})}menuTransition=null;targetState=Math.max(0,Math.min(sceneEnd(),value));schedulePaint()}
function navigateTo(value){photoGestureUntil=0;goTo(value);menuTransition={from:frameState,start:performance.now()}}
function navigateToShowcase(){goTo(sceneEnd());menuTransition={from:frameState,start:performance.now(),scrollFrom:scrollY,scrollTo:showcaseScrollTop()}}
paint(0);
function jumpToSpecs(){specsJumpTarget=showcaseScrollTop();window.scrollTo({top:specsJumpTarget,behavior:motionReduced?'instant':'smooth'})}
function consume(delta){
 const end=controlledScrollEnd(),y=scrollY;
 const now=performance.now();
 if(delta>0&&now<photoGestureUntil){photoGestureUntil=now+180;return true}
 if(photoReady&&delta>0&&frameState>=7.999&&frameState<9&&targetState<9){navigateTo(9);photoGestureUntil=now+180;return true}
 if(photoReady&&delta>0&&menuTransition&&targetState===9&&frameState>=8){photoGestureUntil=now+180;return true}
 if(specsJumpTarget!==null){if(delta>0)return true;specsJumpTarget=null;window.scrollTo({top:y,behavior:'instant'})}
 if(photoReady&&delta>0&&frameState===sceneEnd()&&targetState===sceneEnd()&&y>=end-2&&y<showcaseScrollTop()-2){jumpToSpecs();return true}
 if(photoReady&&y>end+2)return false;
 if(y>end+innerHeight*.7)return false;
 if(y>end+25){if(delta<0){goTo(sceneEnd());return true}return false}
 if((targetState===0&&frameState===0&&delta<0)||(targetState===sceneEnd()&&frameState===sceneEnd()&&delta>0))return false;
 goTo(targetState+Math.max(-.14,Math.min(.14,delta/900)));return true;
}
function isConsentControl(e){return e.target instanceof Element && Boolean(e.target.closest('#CybotCookiebotDialog,#CookiebotWidget'))}
window.addEventListener('wheel',e=>{if(isConsentControl(e)||e.ctrlKey||!e.deltaY||Math.abs(e.deltaX)>Math.abs(e.deltaY)||document.body.classList.contains('is-loading'))return;const units=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;if(consume(e.deltaY*units))e.preventDefault()},{passive:false});
window.addEventListener('keydown',e=>{if(isConsentControl(e)||e.target.closest('input,textarea,select,button,summary'))return;const direction=['ArrowDown','PageDown',' '].includes(e.key)?1:['ArrowUp','PageUp'].includes(e.key)?-1:0;if(direction>0&&photoReady&&frameState===sceneEnd()&&scrollY>=controlledScrollEnd()-2&&scrollY<showcaseScrollTop()-2){e.preventDefault();jumpToSpecs();return}if(direction&&scrollY<=controlledScrollEnd()+2&&!(direction>0&&frameState===sceneEnd()&&targetState===sceneEnd())){e.preventDefault();goTo(direction>0?Math.floor(targetState+.01)+1:Math.ceil(targetState-.01)-1)}});
window.addEventListener('touchstart',e=>{touchY=isConsentControl(e)?null:e.touches[0].clientY;
 slideTouch=e.touches.length===1&&e.target.closest('.lifestyle-photo')?{x:e.touches[0].clientX,y:e.touches[0].clientY,axis:null}:null;
 photoGestureUntil=0},{passive:true});window.addEventListener('touchmove',e=>{if(touchY===null)return;
 if(slideTouch){
  const dx=e.touches[0].clientX-slideTouch.x,dy=e.touches[0].clientY-slideTouch.y;
  if(!slideTouch.axis){
   if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
   slideTouch.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
  }
  if(slideTouch.axis==='x'){if(e.cancelable)e.preventDefault();return}
 }
 const next=e.touches[0].clientY,d=touchY-next;touchY=next;if(consume(d*2))e.preventDefault()},{passive:false});window.addEventListener('touchend',e=>{
 if(slideTouch?.axis==='x'){
  const dx=e.changedTouches[0].clientX-slideTouch.x;
  if(Math.abs(dx)>35)moveLifestyleSlide(-Math.sign(dx));
 }
 slideTouch=null;
 touchY=null;
},{passive:true});
window.addEventListener('touchcancel',()=>{slideTouch=null;touchY=null},{passive:true});
let sceneEndBeforeResize=controlledScrollEnd(),layoutWidth=innerWidth,layoutHeight=sceneHeight();
window.addEventListener('resize',()=>{
 const width=document.documentElement.clientWidth,height=sceneHeight();
 if(width===layoutWidth&&Math.abs(height-layoutHeight)<2)return;
 layoutWidth=width;layoutHeight=height;
 const inScene=scrollY<=sceneEndBeforeResize+32;sceneEndBeforeResize=controlledScrollEnd();
 if(inScene){const top=sceneScroll(frameState);lastSceneScroll=top;lastWrite=performance.now();window.scrollTo({top,behavior:'instant'})}
 schedulePaint();
});new ResizeObserver(schedulePaint).observe(slot);
window.addEventListener('scroll',()=>{
 if(restoring)return;
 if(specsJumpTarget!==null&&Math.abs(scrollY-specsJumpTarget)<2)specsJumpTarget=null;
 if(lastSceneScroll!==null&&Math.abs(scrollY-lastSceneScroll)<2)return;
 if(Math.abs(targetState-frameState)>.0001||performance.now()-lastWrite<120)return;
 const base=storyTop();
 if(scrollY<base*.25&&frameState>0)goTo(0);
 else if(Math.abs(scrollY-controlledScrollEnd())<4&&frameState<sceneEnd())goTo(sceneEnd());
 else if(Math.abs(scrollY-workflowTop())<4&&frameState<4)goTo(4);
 else if(Math.abs(scrollY-base)<4&&frameState<1)goTo(1);
 else schedulePaint();
},{passive:true});
brand.addEventListener('click',e=>{e.preventDefault();navigateTo(0)});
document.querySelectorAll('[data-scene-target]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();navigateTo(Number(link.dataset.sceneTarget))}));
heroModel.addEventListener('error',()=>{document.querySelector('.story-error').hidden=false});

// A small, damped response to pointer motion; disabled for touch and reduced motion.
if(!motionReduced&&matchMedia('(pointer:fine)').matches){
 window.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;
  mouseTargetX=frameState>=1?(e.clientX/innerWidth-.5)*2:0;
  mouseTargetY=frameState>=1?(e.clientY/innerHeight-.5)*2:0;
  schedulePaint();
 });
 document.documentElement.addEventListener('pointerleave',()=>{mouseTargetX=mouseTargetY=0;schedulePaint()});
}
// Duplicate visual lettering only; controls retain one accessible label.
document.querySelectorAll('a:not(.header-brand),button:not(.menu-toggle):not(.lifestyle-play):not([data-slide-step]),summary').forEach(control=>{
 const label=control.textContent.trim();if(!label)return;
 if(!control.hasAttribute('aria-label'))control.setAttribute('aria-label',label);
 const wrap=document.createElement('span');wrap.className='roll-label';wrap.setAttribute('aria-hidden','true');
 for(const copy of [false,true]){
  const row=document.createElement('span');row.className=copy?'roll-row roll-copy':'roll-row roll-original';
  [...label].forEach((letter,index)=>{const char=document.createElement('span');char.className='roll-char';char.style.setProperty('--delay',`${Math.min(index*.012,.12)}s`);char.textContent=letter===' '?'\u00a0':letter;row.append(char)});
  wrap.append(row);
 }
 control.replaceChildren(wrap);control.classList.add('roll-control');
});

const finishes={black:{name:'Schwarz',hex:'#3c3e40',metallic:.75,roughness:.58},rose:{name:'Rosé',hex:'#d3a198',metallic:.78,roughness:.52},silver:{name:'Silber',hex:null},blue:{name:'Stahlblau',hex:'#8fb8ce',metallic:.7,roughness:.55}};
let selectedFinish='silver',originalFinishes=[],lockHighlightTexture=null,lockHighlightPromise=null,finishRaf=0;
function finishColor(hex){return [...hex.slice(1).match(/../g).map(value=>{const c=parseInt(value,16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}),1]}
function updateColorName(label,name,animate){
 const previous=label.dataset.colorName||label.textContent.trim();label.dataset.colorName=name;
 if(previous===name){if(!label.querySelector('.color-label-text')){const text=document.createElement('span');text.className='color-label-text';text.textContent=name;label.replaceChildren(text)}return}
 const next=document.createElement('span');next.className='color-label-text';next.textContent=name;
 if(!animate||motionReduced){label.replaceChildren(next);return}
 const old=document.createElement('span');old.className='color-label-text';old.textContent=previous;old.setAttribute('aria-hidden','true');old.style.cssText='position:absolute;inset:0';label.replaceChildren(old,next);
 old.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-18px)'}],{duration:260,easing:'ease-out',fill:'forwards'}).finished.then(()=>old.remove()).catch(()=>{});
 next.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'cubic-bezier(.16,1,.3,1)'});
}
function applyFinish(animate=false){
 if(finishRaf)cancelAnimationFrame(finishRaf);finishRaf=0;
 const finish=finishes[selectedFinish];
 const materials=originalFinishes.map(({material,color,metallic,roughness})=>{const pbr=material.pbrMetallicRoughness;return{pbr,from:[...pbr.baseColorFactor],to:finish.hex?finishColor(finish.hex):color,fromMetal:pbr.metallicFactor,toMetal:finish.hex?(material.name.includes('textile')?0:finish.metallic):metallic,fromRough:pbr.roughnessFactor,toRough:finish.hex?(material.name.includes('textile')?.86:finish.roughness):roughness}});
 const highlight=(selectedFinish==='black'||selectedFinish==='blue')&&lockHighlightTexture;
 const locks=[heroModel,showcaseModel].map(viewer=>viewer.model?.materials.find(material=>material.name==='Aluminum with printed lock symbols')).filter(Boolean).map(material=>({material,from:[...material.emissiveFactor],to:highlight?[.32,.36,.40]:[0,0,0]}));
 if(highlight)locks.forEach(({material})=>material.emissiveTexture.setTexture(highlight));
 document.querySelectorAll('.color-swatch').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.color===selectedFinish)));
 document.querySelectorAll('.color-name').forEach(label=>updateColorName(label,finish.name,animate));
 const start=performance.now();
 function render(now){const progress=animate&&!motionReduced?Math.min(1,(now-start)/650):1,ease=progress*progress*(3-2*progress);
  materials.forEach(m=>{m.pbr.setBaseColorFactor(m.from.map((v,i)=>interpolate(v,m.to[i],ease)));m.pbr.setMetallicFactor(interpolate(m.fromMetal,m.toMetal,ease));m.pbr.setRoughnessFactor(interpolate(m.fromRough,m.toRough,ease))});
  locks.forEach(({material,from,to})=>{material.setEmissiveFactor(from.map((v,i)=>interpolate(v,to[i],ease)));if(progress===1&&!highlight)material.emissiveTexture.setTexture(null)});
  finishRaf=progress<1?requestAnimationFrame(render):0;
 }
 render(start);
}
function rememberFinishes(viewer){
 const materials=viewer.model.materials.filter(material=>material.name!=='Recessed dark hardware');
 originalFinishes.push(...materials.map(material=>({material,color:[...material.pbrMetallicRoughness.baseColorFactor],metallic:material.pbrMetallicRoughness.metallicFactor,roughness:material.pbrMetallicRoughness.roughnessFactor})));
 applyFinish();
 if(viewer===heroModel)prepareLockHighlight().catch(error=>console.error('Lock highlights failed',error));
}
for(const viewer of [heroModel,showcaseModel]){viewer.addEventListener('load',()=>rememberFinishes(viewer),{once:true});if(viewer.loaded)rememberFinishes(viewer)}
showcaseModel.addEventListener('load',()=>{showcaseModel.animationName='Device workflow';showcaseModel.pause();showcaseModel.currentTime=0});
document.querySelectorAll('.color-swatch').forEach(button=>button.addEventListener('click',()=>{if(selectedFinish===button.dataset.color)return;selectedFinish=button.dataset.color;applyFinish(true)}));

// Only the printed glyph pixels receive a light gray contribution on dark finishes.
function prepareLockHighlight(){
 if(lockHighlightPromise)return lockHighlightPromise;
 lockHighlightPromise=(async()=>{
  const image=new Image();image.src='./assets/collar-locks-source.png';await image.decode();
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
  const pixels=context.getImageData(0,0,canvas.width,canvas.height);
  for(let i=0;i<pixels.data.length;i+=4){const value=Math.round(255*Math.max(0,Math.min(1,(155-pixels.data[i])/45)));pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255}
  context.putImageData(pixels,0,0);lockHighlightTexture=await heroModel.createTexture(canvas.toDataURL('image/png'));applyFinish();
 })();return lockHighlightPromise;
}

document.querySelectorAll('[data-goto-step]').forEach(button=>button.addEventListener('click',()=>goTo(4+Number(button.dataset.gotoStep))));


// Restore a refreshed page after layout and fonts settle, before revealing the shared model.
document.addEventListener('site-ready',()=>{if(!restoring)return;document.fonts.ready.then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
 let state=Math.max(0,Math.min(sceneEnd(),savedView.state)),top=savedView.y;
 if(photoReady&&(top>=lifestyleTop()-2||state>=7)){state=9;top=Math.max(top,controlledScrollEnd())}
 else top=sceneScroll(state);
 restoring=false;targetState=frameState=state;window.scrollTo({top,behavior:'instant'});lastSceneScroll=scrollY;lastWrite=performance.now();paint(state);schedulePaint();
})))},{once:true});

// Reveal complete sections without resizing either WebGL canvas.
if(!motionReduced){
 const footer=document.querySelector('.site-footer');
 showcaseSection.classList.add('reveal-ready');footer.classList.add('reveal-ready');
 [showcaseModel,showcaseSection.querySelector('.color-options'),showcaseSection.querySelector('.color-name'),showcaseSection.querySelector('.showcase-price')].forEach((el,index)=>el.style.setProperty('--entrance-delay',`${index*100}ms`));
 const entranceObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');
  if(entry.target===showcaseSection){showcaseSection.querySelectorAll('.color-swatch').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(10px) scale(.75)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:700,delay:180+i*70,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}))}
  else{footer.querySelectorAll('.footer-company,.footer-address-line,.footer-email,.footer-copyright,.footer-links a,.footer-links button').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:850,delay:Math.min(i*70,420),easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}))}
  entranceObserver.unobserve(entry.target)}}),{threshold:.2});
 entranceObserver.observe(showcaseSection);entranceObserver.observe(footer);
 document.addEventListener('site-ready',()=>{if(restoring||frameState>0)return;heroPicker.querySelectorAll('.color-swatch').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(10px) scale(.75)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:700,delay:450+i*70,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));heroEntrance=heroModel.animate([{opacity:0,transform:'translateY(16px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:950,delay:180,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'})},{once:true});
}

// Fit the full product at every screen size, including vertical and diagonal rotations.
let showcaseFitKey='';
function fitShowcaseCamera(){
 if(!showcaseModel.loaded)return;
 const width=showcaseModel.clientWidth,height=showcaseModel.clientHeight;
 if(!width||!height)return;
 const vertical=showcaseModel.getFieldOfView()*Math.PI/180;
 const key=`${innerWidth}x${width}x${height}x${vertical.toFixed(6)}`;if(key===showcaseFitKey)return;showcaseFitKey=key;
 const orbit=showcaseModel.getCameraOrbit(),theta=orbit.theta*180/Math.PI,phi=orbit.phi*180/Math.PI;
 const d=showcaseModel.getDimensions(),radius=Math.hypot(d.x,d.y,d.z)/2;
 const horizontal=2*Math.atan(Math.tan(vertical/2)*width/height);
 const distance=1.04*radius/Math.sin(Math.min(vertical,horizontal)/2);
 showcaseModel.cameraOrbit=`${theta}deg ${phi}deg ${distance}m`;
 showcaseModel.jumpCameraToGoal();
}
showcaseModel.setAttribute('min-camera-orbit','auto auto 0.01m');showcaseModel.setAttribute('max-camera-orbit','auto auto 1m');
showcaseModel.addEventListener('load',()=>{showcaseFitKey='';requestAnimationFrame(fitShowcaseCamera)});
new ResizeObserver(fitShowcaseCamera).observe(showcaseModel);
showcaseModel.addEventListener('camera-change',fitShowcaseCamera);
if(showcaseModel.loaded)fitShowcaseCamera();
