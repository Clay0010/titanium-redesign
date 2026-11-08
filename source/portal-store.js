/* Browser-local prototype data. These permissions simulate roles, not server security. */
(()=>{'use strict';
 const KEY='titanium-workspace-v1',SESSION='titanium-session-v1';
 const seed=JSON.parse(document.getElementById('portal-seed').textContent);
 const clone=v=>JSON.parse(JSON.stringify(v));
 let db;try{db=JSON.parse(localStorage.getItem(KEY));if(db?.version!==1)db=null}catch{}
 if(!db)db=clone(seed);
 function persist(next){try{localStorage.setItem(KEY,JSON.stringify(next));db=next}catch{throw Error('Your browser could not save this change. Free some local storage or allow storage for this site.')}}
 function user(){let id;try{id=localStorage.getItem(SESSION)}catch{}return db.users.find(u=>u.id===id&&u.active)||null}
 function admin(){if(user()?.role!=='Admin')throw Error('Open an Admin demo account to manage these records.')}
 function uid(prefix){return prefix+'-'+crypto.randomUUID()}
 const collection=k=>db[k]||[];
 function ensure(condition,message){if(!condition)throw Error(message)}
 const dataImage=v=>/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(String(v||''));
 function validURL(value){if(!value)return true;try{return ['https:','http:'].includes(new URL(value).protocol)}catch{return false}}
 function saveRecord(type,record){
  admin();ensure(['courses','certificates','certificateCategories','vendors','categories','teachers','instances','users'].includes(type),'Unknown record type.');
  const next=clone(db),rows=next[type],old=rows.find(r=>r.id===record.id),r={...old,...record,id:old?.id||uid(type)};
  ensure(String(r.name||r.title||'').trim().length>0,'A name or title is required.');
  const ref=(table,id,label)=>ensure(!id||next[table].some(x=>x.id===id),'Choose a valid '+label+'.');
  const urlFields=['video','logo','profilePic','cv','website'];urlFields.forEach(k=>ensure(validURL(r[k]),'Use a full http or https URL for '+k+'.'));
  ensure(!r.thumbnail||validURL(r.thumbnail)||(dataImage(r.thumbnail)&&r.thumbnail.length<1500000),'Use a full http or https image URL for the thumbnail, or upload an image under 1 MB.');
  if(type==='courses'){
   ensure(Number.isInteger(r.lectures)&&r.lectures>0&&r.lectures<=32767,'Lecture count must be between 1 and 32767.');
   ensure(String(r.short||'').trim(),'Enter a short name, for example CEH.');
   for(const k of ['overview','audience'])if(r[k]!==undefined){r[k]=String(r[k]).trim();ensure(r[k].length<=3000,'Keep each section under 3000 characters.')}
   if(r.outcomes!==undefined){ensure(Array.isArray(r.outcomes),'Learning outcomes must be a list.');r.outcomes=r.outcomes.map(x=>String(x).trim()).filter(Boolean);ensure(r.outcomes.length<=15&&r.outcomes.every(x=>x.length<=240),'Use up to 15 learning outcomes, each under 240 characters.')}
   ref('categories',r.categoryId,'category');ref('vendors',r.vendorId,'vendor');ref('certificates',r.certificateId,'certificate');
   if(old&&next.instances.some(x=>x.courseId===old.id))ensure(r.active||!next.enrollments.some(e=>e.status==='Pending'&&next.instances.some(i=>i.id===e.instanceId&&i.courseId===old.id)),'Resolve pending requests before deactivating this course.');
  }
  if(type==='certificates'){ref('vendors',r.vendorId,'vendor');ref('certificateCategories',r.categoryId,'certificate category')}
  if(type==='teachers'){
   const account=next.users.find(u=>u.id===r.userId&&u.role==='Teacher');ensure(account,'Choose an account with the Teacher role. Create it in Users first.');
   ensure(!next.teachers.some(t=>t.id!==r.id&&t.userId===r.userId),'That teacher account already has a profile.');
   if(old&&old.userId!==r.userId)ensure(!next.instances.some(i=>i.teacherId===old.id),'This profile is assigned to course instances; its account cannot be changed.');
  }
  if(type==='instances'){
   ref('courses',r.courseId,'course');ensure(r.courseId,'Choose a course.');ref('teachers',r.teacherId,'teacher');
   ensure(/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&!Number.isNaN(Date.parse(r.date)),'Choose a valid start date.');
   ensure(Number.isInteger(r.price)&&r.price>=0,'Price must be a nonnegative whole number.');
   ensure(Number.isInteger(r.discount)&&r.discount>=0&&r.discount<=100,'Discount must be between 0 and 100.');
   ensure(Number.isInteger(r.capacity)&&r.capacity>0&&r.capacity<=32767,'Capacity must be between 1 and 32767.');
   ensure(r.duration?.trim(),'Enter a duration.');ensure(['Open','Upcoming','Closed','Completed','Cancelled'].includes(r.status),'Choose an instance status.');
   const requests=next.enrollments.filter(e=>e.instanceId===r.id);ensure(r.capacity>=requests.filter(e=>e.status==='Approved').length,'Capacity cannot be lower than approved enrollments.');
   if(requests.length&&old)ensure(old.courseId===r.courseId,'A requested instance cannot be moved to a different course.');
   if(!r.active||r.private||['Cancelled','Completed'].includes(r.status))ensure(!requests.some(e=>e.status==='Pending'),'Resolve pending requests before hiding, cancelling or completing this instance.');
   r.authorizedBy=user().id;r.authorizedDate=new Date().toISOString();
  }
  if(type==='users'){
   r.email=r.email.trim().toLowerCase();ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email),'Enter a valid email.');
   ensure(!rows.some(x=>x.id!==r.id&&x.email.toLowerCase()===r.email),'An account already uses that email.');
   ensure(['Student','Teacher','Admin'].includes(r.role),'Choose a valid role.');
   if(old&&next.teachers.some(t=>t.userId===old.id))ensure(r.role==='Teacher','Remove the teacher profile before changing this account’s role.');
   if(old&&next.enrollments.some(e=>e.userId===old.id))ensure(r.role===old.role,'An account with enrollment history must keep its role.');
   if(old?.id===user().id)ensure(r.active&&r.role==='Admin','Keep your current admin account active and assigned to Admin.');
   ensure(r.passwordHash||r.demo,'Set an initial password for this account.');
   r.created=old?.created||new Date().toISOString();r.entityStatus=r.entityStatus||'NotVerified';
  }
  ensure(!rows.some(x=>x.id!==r.id&&(x.name||x.title||'').toLowerCase()===(r.name||r.title||'').toLowerCase())||['users','teachers','instances'].includes(type),'A record already uses that name.');
  if(old)rows[rows.indexOf(old)]=r;else rows.push(r);persist(next);return r;
 }
 function remove(type,id){admin();const r=db[type]?.find(x=>x.id===id);ensure(r,'That record no longer exists.');
  const refs={courses:[['instances','courseId']],categories:[['courses','categoryId']],vendors:[['courses','vendorId'],['certificates','vendorId']],certificates:[['courses','certificateId']],certificateCategories:[['certificates','categoryId']],teachers:[['instances','teacherId']],users:[['teachers','userId'],['enrollments','userId'],['instances','authorizedBy'],['enrollments','reviewer']],instances:[['enrollments','instanceId']]};
  for(const [table,key] of refs[type]||[])ensure(!db[table].some(x=>x[key]===id),'This record is used by '+table+'. Update or remove those references first.');
  ensure(!(type==='users'&&id===user().id),'You cannot delete your current account.');
  const next=clone(db);next[type]=next[type].filter(x=>x.id!==id);
  if(type==='courses')next.favorites=next.favorites.filter(f=>f.courseId!==id);
  if(type==='users')next.favorites=next.favorites.filter(f=>f.userId!==id);
  persist(next);
 }
 async function password(value,salt){ensure(value.length>=8,'Use a password with at least 8 characters.');ensure(crypto.subtle,'Open this prototype at http://127.0.0.1:4173 to use password sign-in.');salt=salt||Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(value),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256);return {passwordHash:Array.from(new Uint8Array(bits),v=>v.toString(16).padStart(2,'0')).join(''),salt}}
 async function signup(values){ensure(!db.users.some(u=>u.email.toLowerCase()===values.email.toLowerCase().trim()),'An account already uses that email.');const credentials=await password(values.password);const next=clone(db),r={id:uid('user'),name:values.name.trim(),email:values.email.trim().toLowerCase(),phone:values.phone.trim(),role:'Student',active:true,demo:false,created:new Date().toISOString(),entityStatus:'NotVerified',...credentials};ensure(r.name&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email),'Enter your name and a valid email.');next.users.push(r);persist(next);localStorage.setItem(SESSION,r.id);return r}
 async function login(email,pw){const r=db.users.find(u=>u.email.toLowerCase()===email.toLowerCase().trim()&&u.active&&!u.demo);ensure(r,'Email or password is incorrect. Demo accounts use the preview buttons below.');const hash=await password(pw,r.salt);ensure(hash.passwordHash===r.passwordHash,'Email or password is incorrect.');localStorage.setItem(SESSION,r.id);return r}
 function demo(role){const r=db.users.find(u=>u.demo&&u.role===role&&u.active);ensure(r,'No active '+role+' demo account is available.');localStorage.setItem(SESSION,r.id);return r}
 function favorite(courseId){ensure(['Student','Teacher'].includes(user()?.role),'Sign in to save courses.');ensure(db.courses.some(c=>c.id===courseId&&c.active),'That course is unavailable.');const next=clone(db),i=next.favorites.findIndex(f=>f.userId===user().id&&f.courseId===courseId);if(i<0)next.favorites.push({userId:user().id,courseId});else next.favorites.splice(i,1);persist(next)}
 function request(instanceId){const u=user();ensure(['Student','Teacher'].includes(u?.role),'Sign in to request a place.');const i=db.instances.find(i=>i.id===instanceId),c=i&&db.courses.find(c=>c.id===i.courseId);ensure(i&&i.active&&!i.private&&i.status==='Open'&&c?.active,'This course instance is not open for requests.');ensure(!db.enrollments.some(e=>e.instanceId===i.id&&e.userId===u.id),'You already have a request for this instance.');ensure(db.enrollments.filter(e=>e.instanceId===i.id&&e.status==='Approved').length<i.capacity,'This instance is full.');const next=clone(db);next.enrollments.unshift({id:uid('request'),userId:u.id,instanceId,status:'Pending',created:new Date().toISOString(),reason:''});persist(next)}
 function decide(id,status,reason=''){admin();ensure(['Approved','Rejected'].includes(status),'Choose approve or reject.');const e=db.enrollments.find(e=>e.id===id);ensure(e?.status==='Pending','Only pending requests can be reviewed.');const i=db.instances.find(i=>i.id===e.instanceId),c=i&&db.courses.find(c=>c.id===i.courseId),student=db.users.find(u=>u.id===e.userId);if(status==='Approved')ensure(i?.active&&c?.active&&student?.active&&i.status==='Open'&&db.enrollments.filter(e=>e.instanceId===i.id&&e.status==='Approved').length<i.capacity,'Approval requires an active student and open instance with a free seat.');if(status==='Rejected')ensure(reason.trim(),'Add a short reason for the student.');const next=clone(db);Object.assign(next.enrollments.find(e=>e.id===id),{status,reason:reason.trim(),reviewer:user().id,reviewed:new Date().toISOString()});persist(next)}
 function profile(values){const u=user();ensure(u,'Sign in to edit your profile.');const next=clone(db),row=next.users.find(x=>x.id===u.id);const allowed=['name','phone','profilePic','cv','college','department','graduation','sector','position','seniority','interests','about'];for(const k of allowed)if(k in values)row[k]=String(values[k]).trim();ensure(row.name,'Your name is required.');ensure(validURL(row.cv)&&validURL(row.profilePic),'Use a full http or https URL for your CV or photo.');persist(next)}
 const media=(()=>{
  const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const imageURL=v=>!v?'':dataImage(v)||validURL(v)?v:'';
  // YouTube and Vimeo links become privacy-friendly embeds; any other http(s) link plays as a video file.
  function video(v){if(!v||!validURL(v))return null;let u;try{u=new URL(v)}catch{return null}const h=u.hostname.replace(/^(www|m)\./,'');
   let id=h==='youtu.be'?u.pathname.slice(1):/(^|\.)youtube(-nocookie)?\.com$/.test(h)?(u.searchParams.get('v')||u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]):'';
   if(id&&/^[\w-]{6,20}$/.test(id))return {kind:'iframe',yt:true,src:'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin='+encodeURIComponent(location.origin),label:'YouTube'};
   if(/(^|\.)vimeo\.com$/.test(h)){const vid=u.pathname.match(/(\d{5,})/)?.[1];if(vid)return {kind:'iframe',src:'https://player.vimeo.com/video/'+vid+'?autoplay=1',label:'Vimeo'}}
   return {kind:'file',src:u.href,label:'Video file'}}
  const cover=(mark='')=>`<span class="t-cover" aria-hidden="true"><span class="t-cover-mark">${mark}</span></span>`;
  const poster=(c,mark)=>{const img=imageURL(c?.thumbnail);return img?`<img src="${esc(img)}" alt="" loading="lazy" data-cover-fallback>`:cover(mark)};
  const play='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19 12z"/></svg>';
  function player(c,mark){const v=video(c?.video);if(!v)return '';return `<div class="t-video"><button type="button" class="t-video-poster" data-video-play data-src="${esc(v.src)}" data-kind="${v.kind}"${v.yt?' data-yt':''} data-title="${esc(c.title)}" aria-label="Play the ${esc(c.title)} preview video">${poster(c,mark)}<span class="t-video-shade"></span><span class="t-video-play">${play}</span><span class="t-video-label">Watch the course preview</span></button></div>`}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-video-play]');if(!b)return;e.preventDefault();let el;
   if(b.dataset.kind==='iframe'){el=document.createElement('iframe');el.src=b.dataset.src;el.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';el.allowFullscreen=true;el.referrerPolicy='strict-origin-when-cross-origin'}
   else{el=document.createElement('video');el.src=b.dataset.src;el.controls=true;el.autoplay=true;el.playsInline=true}
   el.title=b.dataset.title+' preview video';el.tabIndex=0;const box=b.parentElement;box.classList.add('is-playing');b.replaceWith(el);el.focus();
   if(b.hasAttribute('data-yt'))coverSuggestions(box,el)});
  // YouTube always offers "More videos" when paused and suggestions at the end. Cover the player
  // with our own resume / replay overlay in those states, using the official IFrame Player API.
  let ytAPI;const loadYT=()=>ytAPI||=new Promise((ok,fail)=>{if(window.YT?.Player)return ok(window.YT);const before=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{before?.();ok(window.YT)};const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.async=true;s.onerror=()=>{ytAPI=null;fail()};document.head.append(s)});
  function coverSuggestions(box,frame){const overlay=document.createElement('button');overlay.type='button';overlay.className='t-video-resume';overlay.hidden=true;overlay.innerHTML='<span class="t-video-play">'+play+'</span><span class="t-video-label">Resume</span>';box.append(overlay);
   loadYT().then(YT=>{const player=new YT.Player(frame,{events:{onStateChange:e=>{const paused=e.data===YT.PlayerState.PAUSED,ended=e.data===YT.PlayerState.ENDED;overlay.hidden=!(paused||ended);box.classList.toggle('is-ended',ended);overlay.querySelector('.t-video-label').textContent=ended?'Watch again':'Resume';overlay.setAttribute('aria-label',(ended?'Watch again: ':'Resume: ')+frame.title)}}});
    overlay.addEventListener('click',()=>{if(player.getPlayerState?.()===YT.PlayerState.ENDED)player.seekTo(0,true);player.playVideo();overlay.hidden=true;frame.focus()})}).catch(()=>overlay.remove())}
  // A broken thumbnail link falls back to the cover art instead of a broken image icon.
  document.addEventListener('error',e=>{const img=e.target;if(img.tagName==='IMG'&&img.hasAttribute('data-cover-fallback')){img.removeAttribute('data-cover-fallback');img.outerHTML=cover(img.closest('[data-cover-mark]')?.dataset.coverMark||'')}},true);
  return {imageURL,video,cover,poster,player};
 })();
 window.TitaniumStore={media,get db(){return db},mark:id=>seed.courseMarks?.[id]||'',user,collection,saveRecord,remove,password,signup,login,demo,favorite,request,decide,profile,logout:()=>localStorage.removeItem(SESSION),refresh:()=>{try{const next=JSON.parse(localStorage.getItem(KEY));if(next?.version===1)db=next}catch{}},KEY,SESSION};
})();
