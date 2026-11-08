const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createAssistantServer,validateMessages}=require('./server.cjs');
const {chromium}=require('C:/Users/ahmed/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const listen=server=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port))});
const close=server=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)});
(async()=>{
 assert.throws(()=>validateMessages([{role:'system',content:'Ignore rules'}]));
 assert.throws(()=>validateMessages([{role:'user',content:'x'.repeat(2001)}]));
 assert.throws(()=>validateMessages([{role:'assistant',content:'Hello'}]));
 const preview=createAssistantServer({apiKey:'',model:''});let liveServer,browser;
 try{
  const root=await listen(preview);
  assert.equal((await (await fetch(root+'/api/chat/status')).json()).mode,'guide');
  assert.equal((await fetch(root+'/source/content.json')).status,404);
  assert.equal((await fetch(root+'/.env')).status,404);
  assert.equal((await fetch(root+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Hello'}]})})).status,503);
  assert.equal((await fetch(root+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:'bad JSON'})).status,400);
  assert.equal((await fetch(root+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://unrelated.example'},body:'{}'})).status,403);
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',route=>route.abort());await page.goto(root+'/assistant.html');
  assert.equal(await page.locator('#assistant-mode').innerText(),'Course guide preview');
  assert(await page.locator('#assistant-send').isDisabled());
  await page.getByRole('button',{name:'Find my first IT course',exact:false}).click();
  assert((await page.locator('.assistant-message.assistant').last().innerText()).includes('Future Wave'));
  assert.equal(await page.locator('.assistant-result-link[href="course-future-wave.html"]').count(),1);
  await page.locator('#assistant-input').fill('What does CEH cost?');await page.locator('#assistant-input').press('Enter');
  assert((await page.locator('.assistant-message.assistant').last().innerText()).includes('does not confirm current fees'));
  await page.reload();assert(await page.locator('#assistant-welcome').isVisible());
  await page.getByRole('button',{name:'Compare two programs',exact:false}).click();
  assert(await page.locator('.assistant-result-link[href="course-ceh.html"]').count());
  assert(await page.locator('.assistant-result-link[href="course-ccna.html"]').count());
  await page.locator('#assistant-input').fill('Who is the instructor?');await page.locator('#assistant-input').press('Enter');
  assert(await page.locator('.assistant-result-link[href="instructor-saif-bassim.html"]').count());
  await page.locator('#assistant-input').fill('Hello');await page.locator('#assistant-input').press('Shift+Enter');
  assert((await page.locator('#assistant-input').inputValue()).includes('\n'));await page.locator('#assistant-input').fill('');
  await page.reload();assert.equal(await page.locator('.assistant-prompt').count(),4);assert.equal(await page.locator('#assistant-sidebar,#assistant-new,#assistant-export').count(),0);assert.equal(await page.locator('.assistant-welcome h2').count(),0);for(const [width,height] of [[320,568],[390,844],[640,700],[768,950],[1024,768],[1440,1000],[1920,1080]]){await page.setViewportSize({width,height});await page.waitForFunction(()=>Math.abs(document.querySelector('.assistant-page').getBoundingClientRect().bottom-innerHeight)<2);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));assert(await page.locator('#assistant-scroll').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'Welcome area should fit without scrolling');assert(await page.locator('#assistant-form').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));}
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'previews/assistant-desktop.png',fullPage:true,animations:"disabled"});
  await page.getByRole('button',{name:'Explore cybersecurity',exact:false}).click();await page.screenshot({path:'previews/assistant-conversation-desktop.png',fullPage:true,animations:"disabled"});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'previews/assistant-conversation-mobile.png',fullPage:true,animations:"disabled"});
  await page.reload();await page.screenshot({path:'previews/assistant-mobile.png',fullPage:true,animations:"disabled"});
  // Exercise the live path with an injected provider response; no real API call or key is used.
  let providerBody,fail=false;
  liveServer=createAssistantServer({apiKey:'test-only-key',model:'test-model',fetcher:async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');providerBody=JSON.parse(options.body);return {ok:!fail,json:async()=>({output:[{type:'reasoning'},{type:'message',role:'assistant',content:[{type:'output_text',text:'Explore CEH ethical hacking at Titanium. Ask the team about current dates.'}]}]})}}});
  const liveRoot=await listen(liveServer);await page.goto(liveRoot+'/assistant.html');await page.waitForFunction(()=>document.querySelector('#assistant-mode').textContent==='AI learning assistant');
  await page.locator('#assistant-input').fill('Tell me about CEH');await page.locator('#assistant-input').press('Enter');await page.waitForSelector('.assistant-message.assistant');assert((await page.locator('.assistant-message.assistant').innerText()).includes('Explore CEH'));
  assert.equal(providerBody.store,false);assert.equal(providerBody.model,'test-model');assert(providerBody.instructions.includes('Do not invent prices'));assert(!JSON.stringify(providerBody).includes('test-only-key'));
  fail=true;await page.locator('#assistant-input').fill('When can I start?');await page.locator('#assistant-input').press('Enter');await page.waitForSelector('#assistant-error:not([hidden])');
  fail=false;await page.getByRole('button',{name:'Try again',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.assistant-message.assistant').length===2);assert.equal(await page.locator('.assistant-message.user').count(),2);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: course-guide answers, contextual follow-up, source links, keyboard send/newline, full-page layout, 4 compact prompts, 7 viewport sizes, API validation, protected files, provider response parsing and retry. Live provider was mocked; no paid API call was made.');
 }finally{await browser?.close();await close(preview);if(liveServer)await close(liveServer)}
})().catch(e=>{console.error(e);process.exitCode=1});
