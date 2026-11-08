(()=>{'use strict';const S=window.TitaniumStore;if(!S)return;
 const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const grid=document.getElementById('course-catalog');
 const categoryKey=id=>{const cat=S.db.categories.find(c=>c.id===id);return ({Cybersecurity:'security',Networking:'networking',Programming:'programming',Databases:'systems',Systems:'systems',Beginners:'beginners'}[cat?.name])||'local-'+id};
 const filterGroup=document.querySelector('.page-catalog .filters');if(filterGroup){for(const cat of S.db.categories.filter(c=>c.active&&S.db.courses.some(x=>x.active&&x.categoryId===c.id))){const key=categoryKey(cat.id);if(!filterGroup.querySelector('[data-filter="'+key+'"]')){const button=document.createElement('button');button.className='filter';button.dataset.filter=key;button.setAttribute('aria-pressed','false');button.textContent=cat.name;filterGroup.append(button)}}}
 if(grid){const existing=new Set([...grid.querySelectorAll('.course-card a.course-button')].map(a=>a.getAttribute('href').match(/course-(.+)\.html/)?.[1]));for(const c of S.db.courses.filter(c=>c.active&&!existing.has(c.id))){const card=document.createElement('article');card.className='course-card';card.dataset.courseId=c.id;card.dataset.category='other';card.dataset.name=c.title+' '+c.short;card.innerHTML=`<div class="course-top"><span class="subject">${esc(S.db.categories.find(x=>x.id===c.categoryId)?.name||'Training')}</span><span>New</span></div><div class="course-code">${esc(c.short)}</div><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><div class="course-bottom"><a class="course-button" href="course-instances.html#course/${esc(c.id)}">Explore course →</a></div>`;grid.append(card)}}
 document.querySelectorAll('.course-card').forEach(card=>{const link=card.querySelector('.course-button'),id=card.dataset.courseId||link?.getAttribute('href')?.match(/course-(.+)\.html/)?.[1];if(!id)return;const c=S.db.courses.find(c=>c.id===id);if(!c?.active){card.remove();return}card.dataset.category=categoryKey(c.categoryId);card.dataset.name=c.title+' '+c.short+' '+(S.db.vendors.find(x=>x.id===c.vendorId)?.name||'');const h=card.querySelector('h3');if(h)h.textContent=c.title;const desc=card.querySelector(':scope > p');if(desc)desc.textContent=c.description;const label=card.querySelector('.subject');if(label)label.textContent=S.db.categories.find(x=>x.id===c.categoryId)?.name||'Training';
  const top=card.querySelector('.course-top'),u=S.user();if(top&&!(u&&!['Student','Teacher'].includes(u.role))){const save=document.createElement('button');save.type='button';save.className='course-save';save.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';const sync=()=>{const on=S.db.favorites.some(f=>f.userId===S.user()?.id&&f.courseId===id);save.setAttribute('aria-pressed',String(on));save.setAttribute('aria-label',on?'Remove '+c.title+' from saved courses':'Save '+c.title);save.title=on?'Saved':'Save course'};sync();save.addEventListener('click',()=>{if(!S.user()){try{sessionStorage.setItem('titanium-next-route',location.pathname.split('/').pop()||'index.html')}catch{}location.href='login.html';return}try{S.favorite(id)}catch(err){save.title=err.message}sync()});const num=[...top.children].find(el=>!el.classList.contains('subject')&&/^\d+$/.test(el.textContent.trim()));if(num)num.replaceWith(save);else top.append(save)}
  if(!card.querySelector('.course-thumb')){const mark=card.querySelector('.course-identity>svg')?.outerHTML||S.mark(id)||'',thumb=document.createElement('div');thumb.className='course-thumb';thumb.dataset.coverMark=mark;thumb.innerHTML=S.media.poster(c,mark);if(top)thumb.append(top);card.prepend(thumb);card.classList.add('has-thumb')}
 });
 // Course page: list upcoming cohorts and let learners request a place without leaving the page.
 const id=location.pathname.match(/course-(.+)\.html$/)?.[1];if(id){const course=S.db.courses.find(c=>c.id===id),body=document.querySelector('.program-card-body'),prose=document.querySelector('.course-prose');
  if(!course?.active){if(body){const notice=document.createElement('div');notice.className='p-note';notice.textContent='This program is archived in your local catalog. Visit the workspace to explore active courses.';body.prepend(notice)}}
  else if(prose){
   const page=location.pathname.split('/').pop();
   // Admin edits: heading, content sections, thumbnail and the preview video.
   const setText=(sel,v)=>{const el=document.querySelector(sel);if(el&&v)el.textContent=v};
   setText('.course-detail-title',course.title);setText('.course-lead',course.overview);setText('.breadcrumb [aria-current]',course.short);
   setText('.course-introduction .kicker',S.db.categories.find(x=>x.id===course.categoryId)?.name);
   setText('#audience p',course.audience);
   const checks=document.querySelector('#learning .check-list');if(checks&&course.outcomes?.length){const tick=checks.querySelector('svg')?.outerHTML||'';checks.innerHTML=course.outcomes.map(o=>'<li>'+tick+'<span>'+esc(o)+'</span></li>').join('')}
   const art=document.querySelector('.program-card-art'),image=S.media.imageURL(course.thumbnail),mark=art?.querySelector(':scope>svg')?.outerHTML||S.mark(id)||'';
   if(art&&image){art.classList.add('has-image');art.style.backgroundImage='linear-gradient(180deg,rgba(24,25,22,.15),rgba(24,25,22,.85)),url("'+image.replaceAll('"','%22')+'")'}
   const player=S.media.player(course,mark);
   if(player){const preview=document.createElement('section');preview.id='preview';preview.className='course-preview';preview.setAttribute('aria-labelledby','preview-title');preview.innerHTML='<h2 id="preview-title">Course preview.</h2>'+player;prose.prepend(preview);const links=document.querySelector('.detail-nav');if(links){const a=document.createElement('a');a.href='#preview';a.textContent='Preview';links.prepend(a)}}
   const fmtDate=s=>s?new Date(s.length===10?s+'T12:00:00':s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'To be confirmed';
   const money=i=>new Intl.NumberFormat('en').format(Math.round(i.price*(1-(i.discount||0)/100)))+' '+i.currency;
   const approved=i=>S.db.enrollments.filter(e=>e.instanceId===i.id&&e.status==='Approved').length;
   const labels={Pending:'Request pending',Approved:'You’re enrolled',Rejected:'Not approved'};
   const button=(label,action,iid,extra='')=>`<button class="course-date-btn${extra.includes('secondary')?' secondary':''}" type="button" data-action="${action}" data-id="${esc(iid)}"${extra.includes('disabled')?' disabled':''}>${label}</button>`;
   const section=document.createElement('section');section.id='dates';section.className='course-dates';section.setAttribute('aria-labelledby','dates-title');
   prose.insertBefore(section,document.getElementById('next-step'));
   const nav=document.querySelector('.detail-nav');if(nav){const a=document.createElement('a');a.href='#dates';a.textContent='Upcoming dates';nav.insertBefore(a,nav.querySelector('a[href="#next-step"]'))}
   if(body){const notice=document.createElement('div');notice.className='p-note';notice.innerHTML=`<a class="p-link" href="#dates">See upcoming dates &amp; request to join ↓</a><br>Track your requests in <a class="p-link" href="my-courses.html">My courses</a>.`;body.prepend(notice)}
   let confirming='',message=null;
   function action(i,u,e,seats){
    if(e)return `<div class="course-date-state"><span class="p-status ${esc(e.status)}">${labels[e.status]||esc(e.status)}</span>${e.status==='Pending'?'<small>An admin will review it soon.</small>':''}</div>`;
    const open=i.status==='Open'&&seats>0,closed=seats<1?'Cohort full':'Not open yet';
    if(!open)return button(closed,'none',i.id,'disabled');
    if(!u)return button('Sign in to request','signin',i.id);
    if(!['Student','Teacher'].includes(u.role))return '<span class="course-date-quiet">Student enrollment only</span>';
    if(confirming===i.id)return `<div class="course-date-confirm" role="group" aria-label="Confirm your request for ${esc(i.name)}"><p>An admin reviews every request. Sending one doesn’t reserve a place, and no payment is taken.</p><div>${button('Send request','send',i.id)}${button('Cancel','cancel',i.id,'secondary')}</div></div>`;
    return button('Request to join','ask',i.id);
   }
   function render(focus){
    const u=S.user(),mine=S.db.enrollments.filter(e=>e.userId===u?.id);
    const rows=S.db.instances.filter(i=>i.courseId===id&&i.active&&!i.private).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const cards=rows.map(i=>{const e=mine.find(e=>e.instanceId===i.id),t=S.db.teachers.find(t=>t.id===i.teacherId&&t.active),seats=Math.max(0,i.capacity-approved(i));
     const teacher=t?(t.publicPage?`<a href="${esc(t.publicPage)}">${esc(t.name)}</a>`:esc(t.name)):'To be assigned';
     const note=message?.id===i.id?`<p class="course-date-msg${message.error?' error':''}" role="${message.error?'alert':'status'}" tabindex="-1">${esc(message.text)}</p>`:'';
     return `<article class="course-date"><div class="course-date-head"><h3>${esc(i.name)}</h3><span class="p-status ${esc(i.status)}">${esc(i.status)}</span></div><dl class="course-date-facts"><div><dt>Starts</dt><dd>${fmtDate(i.date)}${i.duration?' · '+esc(i.duration):''}</dd></div><div><dt>Schedule</dt><dd>${esc(i.days||'To be confirmed')}</dd></div><div><dt>Instructor</dt><dd>${teacher}</dd></div><div><dt>Places</dt><dd>${seats} of ${esc(i.capacity)} available</dd></div></dl><div class="course-date-bottom"><div class="course-date-price"><strong>${money(i)}</strong><small>Sample price${i.discount?' · '+esc(i.discount)+'% discount':''}</small></div>${action(i,u,e,seats)}</div>${e?.status==='Rejected'&&e.reason?`<p class="course-date-reason">${esc(e.reason)}</p>`:''}${note}</article>`}).join('');
    section.innerHTML=`<h2 id="dates-title">Upcoming dates.</h2><p>Choose a cohort and request your place. The Titanium team reviews each request and confirms with you.</p>${cards?`<div class="course-date-list">${cards}</div>`:`<div class="course-date-empty"><strong>No dates scheduled yet.</strong><p>Ask the team about the next intake for this program.</p></div>`}<p class="course-date-disclaimer">Local prototype: dates, prices and requests are sample data saved in this browser.</p>`;
    if(focus)section.querySelector(focus)?.focus();
   }
   section.addEventListener('click',ev=>{const b=ev.target.closest('button[data-action]');if(!b||b.disabled)return;const iid=b.dataset.id,act=b.dataset.action;
    if(act==='signin'){try{sessionStorage.setItem('titanium-next-route',page+'#dates')}catch{}location.href='login.html';return}
    if(act==='ask'){confirming=iid;message=null;render(`[data-action="send"][data-id="${CSS.escape(iid)}"]`);return}
    if(act==='cancel'){confirming='';render(`[data-action="ask"][data-id="${CSS.escape(iid)}"]`);return}
    if(act==='send'){confirming='';try{S.request(iid);message={id:iid,text:'Request sent. You can follow it in My courses.'}}catch(err){message={id:iid,text:err.message,error:true}}render(`.course-date-msg`)}
   });
   render();
  }
 }
})();
