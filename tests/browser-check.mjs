import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Run against a dedicated headless Chrome profile on 127.0.0.1:9223.
// Synthetic data is intercepted only inside this isolated browser context, never in the application.
const origin = process.env.QA_ORIGIN ?? "http://127.0.0.1:3001";
const output = path.resolve("docs/responsive-ui/screenshots");
mkdirSync(output, { recursive: true });
const version = await fetch("http://127.0.0.1:9223/json/version").then(r => r.json());
const socket = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once:true }); socket.addEventListener("error", reject, { once:true }); });
let serial = 0;
const pending = new Map();
const listeners = new Map();
function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => { const id=++serial; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})); });
}
socket.addEventListener("message", ({data}) => {
  const message=JSON.parse(String(data));
  if(message.id){const entry=pending.get(message.id); if(entry){pending.delete(message.id); if(message.error)entry.reject(new Error(message.error.message));else entry.resolve(message.result);} }
  else for(const callback of listeners.get(message.method)??[]) callback(message.params,message.sessionId);
});
function on(event, callback){listeners.set(event,[...(listeners.get(event)??[]),callback]);}
const {browserContextId}=await send("Target.createBrowserContext");
const {targetId}=await send("Target.createTarget",{url:"about:blank",browserContextId});
const {sessionId}=await send("Target.attachToTarget",{targetId,flatten:true});
const command=(method,params)=>send(method,params,sessionId);
const evaluate=async(expression)=>{ const result=await command("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true}); if(result.exceptionDetails)throw new Error(result.exceptionDetails.text); return result.result.value; };
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(expression){for(let i=0;i<100;i++){try{if(await evaluate(`Boolean(${expression})`))return;}catch{}await sleep(80);}throw new Error(`Timed out: ${expression.slice(0,100)}; ${await evaluate("document.querySelector(\"#main\")?.innerText")}`);}
const errors=[],badAssets=[],postRequests=[];
on("Runtime.exceptionThrown",(event,sid)=>{if(sid===sessionId)errors.push(event.exceptionDetails.text);});
on("Network.responseReceived",(event,sid)=>{if(sid===sessionId&&event.response.status>=400&&!event.response.url.includes("/api/"))badAssets.push({status:event.response.status,path:new URL(event.response.url).pathname});});
on("Network.requestWillBeSent",(event,sid)=>{if(sid===sessionId&&event.request.method==="POST")postRequests.push(new URL(event.request.url).pathname);});
await command("Page.enable"); await command("Runtime.enable"); await command("Network.enable");
async function viewport(width){await command("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width<1024,screenWidth:width,screenHeight:900});}
async function navigate(url){await command("Page.navigate",{url:origin+url});await until(`document.readyState==='complete' && document.querySelector('#main') && location.pathname===${JSON.stringify(new URL(url,origin).pathname)}`);await until("!document.querySelector('.loading-bar')");await evaluate("document.fonts.ready");await evaluate("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");}
async function capture(name,width){
  const height=await evaluate("Math.max(900, Math.min(1900,document.documentElement.scrollHeight))");
  const {data}=await command("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});
  writeFileSync(path.join(output,`${width}-${name}.png`),Buffer.from(data,"base64"));
}
const results=[];
try {
  for(const width of [375,430,768,1440]){
    await viewport(width);
    for(const [name,url] of [["home","/"],["search","/search?q=UI_CHECK"],["photo","/identify?mode=photo"],["shape","/identify"],["library","/library"],["saved","/saved"],["detail","/medicines/000000001"]]){
      await navigate(url);
      const result=await evaluate(`(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('.site-shell').getBoundingClientRect().width,nav:getComputedStyle(document.querySelector('.bottom-nav')).display,colors:[...document.querySelectorAll('[data-brand] tspan')].slice(0,4).map(t=>t.getAttribute('fill')),logoPlate:document.querySelectorAll('[data-brand],.sisidetail-logo,.parent-brand').length,columns:document.querySelector('.original-quick-actions')?[...document.querySelectorAll('.original-quick-actions a')].map(a=>a.getBoundingClientRect().y):null}))()`);
      assert.equal(result.width,width);assert.ok(result.scroll<=width,`${width} ${name} overflows`);assert.ok(result.canvas<=(width>=1024?1120.1:width>=601?680.1:560.1));assert.equal(result.nav,"grid");assert.deepEqual(result.colors,name === "home" ? ["#244CC5","#FF8278","#D9CCF2","#D9E5EA"] : []);assert.equal(result.logoPlate,name === "home" ? 1 : 0);
      if(result.columns)assert.equal(result.columns[0],result.columns[1]);
      results.push({width,screen:name,overflow:false,canvas:result.canvas});
      await capture(name,width);
    }
  }
  for(const [width,height] of [[375,667],[430,740]]){
    await command("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:true,screenWidth:width,screenHeight:height});
    await navigate("/");
    assert.ok(await evaluate("document.querySelector('.original-quick-actions').getBoundingClientRect().bottom<=document.querySelector('.bottom-nav').getBoundingClientRect().top"),`${width}x${height}: home buttons hidden by navigation`);
    const {data}=await command("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
    writeFileSync(path.join(output,`${width}x${height}-home.png`),Buffer.from(data,"base64"));
  }
  await viewport(1440);await navigate("/");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.original-home')).display"),"grid");
  assert.ok(await evaluate("document.querySelector('.original-home-controls').getBoundingClientRect().left>document.querySelector('.original-home-visual').getBoundingClientRect().right"));
  await viewport(375); await navigate("/"); await until("[...document.querySelectorAll('.potion-frame img')].every(img=>img.complete&&img.naturalWidth>0)");
  const baselineMask=await evaluate("getComputedStyle(document.querySelector('.idle-potion')).clipPath");
  assert.ok(baselineMask.includes('12.2363%'),baselineMask);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.potion-character')).boxShadow"),"none");
  const animation=await evaluate(`(()=>{const el=document.querySelector('.potion-character.animated'),frames=[...el.querySelectorAll('.potion-frame')],animations=el.getAnimations({subtree:true});animations.forEach(a=>a.pause());const active=[];for(let i=0;i<8;i++){animations.forEach(a=>a.currentTime=i*500+250);active.push(frames.map((f,index)=>getComputedStyle(f).opacity==='1'?index:-1).filter(n=>n>=0));}animations.forEach(a=>a.currentTime=2000);const motion=new DOMMatrix(getComputedStyle(el.querySelector('.potion-motion')).transform);return{count:frames.length,active,duration:animations.map(a=>a.effect.getTiming().duration),x:motion.m41,y:motion.m42,uiTransform:getComputedStyle(document.querySelector('.original-home-controls')).transform};})()`);
  assert.equal(animation.count,1);assert.deepEqual(animation.active,Array.from({length:8},()=>[0]));assert.ok(animation.duration.every(n=>n===4000));assert.ok(Math.abs(animation.x-6)<.1);assert.equal(animation.uiTransform,"none");
  const motionSamples = await evaluate(`(()=>{const el=document.querySelector('.potion-character.animated'),animations=el.getAnimations({subtree:true});return [0,1000,2000,3000,4000].map(time=>{animations.forEach(a=>a.currentTime=time);const m=new DOMMatrix(getComputedStyle(el.querySelector('.potion-motion')).transform);return {time,x:m.m41,y:m.m42};});})()`);
  for(const [index,expected] of [[-6,0],[0,-5],[6,0],[0,5],[-6,0]].entries()){assert.ok(Math.abs(motionSamples[index].x-expected[0])<.01);assert.ok(Math.abs(motionSamples[index].y-expected[1])<.01);}
  const clipping = await evaluate(`(()=>{
    const el=document.querySelector('.potion-character.animated'),stage=document.querySelector('.home-potion-stage'),animations=el.getAnimations({subtree:true}),frames=[...el.querySelectorAll('.potion-frame')];
    const checks=[];
    for(const time of [0,250,500,750,1000,1250,1500,1750,2000,2250,2500,2750,3000,3250,3500,3750,3999,4000,4250]){
      animations.forEach(a=>a.currentTime=time);
      const sr=stage.getBoundingClientRect(),ui=document.querySelector('.original-home-controls').getBoundingClientRect();
      for(const [frameIndex,frame] of frames.entries()){
        const img=frame.querySelector('img'),r=img.getBoundingClientRect();
        const nativeRatio=img.naturalWidth/img.naturalHeight,layoutRatio=img.offsetWidth/img.offsetHeight;
        const ancestors=[];for(let p=img.parentElement;p;p=p.parentElement){const style=getComputedStyle(p);if(['hidden','clip','scroll','auto'].includes(style.overflowX)||['hidden','clip','scroll','auto'].includes(style.overflowY)){const b=p.getBoundingClientRect();if(r.left<b.left-.5||r.right>b.right+.5||r.top<b.top-.5||r.bottom>b.bottom+.5)ancestors.push(p.className);}}
        checks.push({time,frame:frameIndex+1,bounds:{top:r.top,bottom:r.bottom,left:r.left,right:r.right,stageTop:sr.top,stageBottom:sr.bottom},stage:r.left>=sr.left&&r.right<=sr.right&&r.top>=sr.top-.5&&r.bottom<=sr.bottom+.5,viewport:r.left>=0&&r.right<=innerWidth,ui:r.bottom<ui.top,clippedBy:ancestors,ratioError:Math.abs(nativeRatio-layoutRatio)});
      }
    }
    return checks;
  })()`);
  for(const check of clipping){assert.ok(check.stage&&check.viewport&&check.ui,JSON.stringify(check));assert.equal(check.clippedBy.length,0,JSON.stringify(check));assert.ok(check.ratioError<.02);}
  for(const [name,time] of [['left',0],['top',1000],['right',2000],['bottom',3000],['loop',4000]]){
    await evaluate(`document.querySelector('.potion-character.animated').getAnimations({subtree:true}).forEach(a=>a.currentTime=${time})`);
    await capture(`animation-${name}`,375);
  }
  await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  const reduced=await evaluate("(()=>({frames:[...document.querySelectorAll('.potion-frame')].map(f=>getComputedStyle(f).opacity),motion:getComputedStyle(document.querySelector('.potion-motion')).animationName}))()");
  assert.deepEqual(reduced.frames,["1"]);assert.equal(reduced.motion,"none");
  await command("Emulation.setEmulatedMedia",{features:[]});

  // Isolated browser-only fixture checks. These never reach the application's backend.
  const fixture={id:"000000001",name:"UI 검증 전용 · 실제 의약품 아님",manufacturer:"테스트 전용",source:"permit",category:"UI 검증용",form:"UI 검증용",efficacy:"레이아웃 검증용 문구입니다. 실제 복약 정보가 아닙니다.",dosage:"레이아웃 검증용 문구입니다. 실제 복약 정보가 아닙니다.",precautions:"레이아웃 검증용 문구입니다. 실제 복약 정보가 아닙니다.",ingredients:"실제 성분 정보가 아닙니다.",sourceErrors:[]};
  on("Fetch.requestPaused",async(event,sid)=>{if(sid!==sessionId)return;const url=new URL(event.request.url);let payload;if(url.pathname==="/api/medicines")payload={items:[fixture],page:1,pageSize:12,total:1};else if(url.pathname.startsWith("/api/medicines/"))payload=fixture;else{await command("Fetch.continueRequest",{requestId:event.requestId});return;}await command("Fetch.fulfillRequest",{requestId:event.requestId,responseCode:200,responseHeaders:[{name:"Content-Type",value:"application/json"}],body:Buffer.from(JSON.stringify(payload)).toString("base64")});});
  await command("Fetch.enable",{patterns:[{urlPattern:"*/api/medicines*",requestStage:"Request"}]});
  await navigate("/search?q=UI_TEST");await until("document.querySelector('.medicine-card')");
  await viewport(375);await capture("results-TEST-ONLY",375);
  await evaluate("document.querySelector('.medicine-card .favorite-button').click();document.querySelector('.medicine-card .card-actions button').click()");
  await until("JSON.parse(localStorage.getItem('yakmi:library:v1')).entries.some(e=>e.saved&&e.favorite)");
  await navigate("/library");await until("document.querySelector('.medicine-card')");
  await capture("library-TEST-ONLY",375);
  await navigate("/medicines/000000001");await until("document.querySelector('.detail-summary')");
  assert.equal(await evaluate("document.querySelectorAll('[role=tab]').length"),4);
  for(let index=0;index<4;index++){
    await evaluate(`document.getElementById('medicine-tab-${index}').click()`);
    await until(`document.getElementById('medicine-tab-${index}').getAttribute('aria-selected')==='true'`);
    assert.equal(await evaluate("document.querySelectorAll('[role=tabpanel] .detail-section').length"),[4,3,1,1][index]);
  }
  await evaluate("document.getElementById('medicine-tab-3').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}))");
  await until("document.getElementById('medicine-tab-0').getAttribute('aria-selected')==='true'");
  for(const width of [375,430,1440]){await viewport(width);await evaluate("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"));await capture("detail-TEST-ONLY",width);}
  const medicineImage=await evaluate("getComputedStyle(document.querySelector('.medicine-image')).imageRendering");assert.equal(medicineImage,"auto");
  await navigate("/saved");await until("document.querySelector('.storage-menu')");
  assert.ok(await evaluate("document.querySelector('.resting-character-scene img').src.includes('sleeping.png')"));
  await capture("saved-TEST-ONLY",375);
  const stored=await evaluate("JSON.parse(localStorage.getItem('yakmi:library:v1'))");assert.equal(stored.entries.length,1);assert.equal(stored.viewed[0].id,fixture.id);assert.ok(stored.recent.includes("UI_TEST"));
  await evaluate("[...document.querySelectorAll('.storage-menu button')].find(b=>b.textContent.includes('최근 본 약')).click()");await until("document.querySelector('.medicine-card')");
  await navigate("/identify?mode=photo");
  const {root}=await command("DOM.getDocument");const {nodeId}=await command("DOM.querySelector",{nodeId:root.nodeId,selector:'input[aria-label="사진 파일 선택"]'});
  await command("DOM.setFileInputFiles",{nodeId,files:[path.resolve("public/assets/character/states/idle.png")]});await until("document.querySelector('.photo-preview img')?.complete");
  assert.equal(await evaluate("document.querySelector('.identification-details').open"),true);
  assert.equal(postRequests.length,0,"Photo selection must not upload to server");
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='사진 지우기').click()");await until("!document.querySelector('.photo-preview img')");
  assert.equal(errors.length,0,`Browser runtime exceptions: ${errors.join(', ')}`);assert.equal(badAssets.length,0,JSON.stringify(badAssets));
  writeFileSync(path.resolve("docs/responsive-ui/browser-results.json"),JSON.stringify({checkedAt:new Date().toISOString(),screens:results,shortMobileHeights:[667,740],baselineMask,desktopHomeColumns:true,animation,motionSamples,clippingChecks:clipping,reducedMotion:reduced,storage:true,photoPreview:true,noPhotoUpload:true,runtimeErrors:errors,assetErrors:badAssets,authenticatedMfds:false},null,2));
  console.log(`PASS: ${results.length} responsive checks, intact idle PNG / 4-second float, reduced motion, save/favorite/history persistence, photo preview; 0 runtime exceptions / missing assets.`);
} finally { await send("Target.disposeBrowserContext",{browserContextId});socket.close(); }








