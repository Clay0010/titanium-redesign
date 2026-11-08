/* Account navigation belongs to the public website; only admins have a dashboard. */
(()=>{'use strict';const S=window.TitaniumStore;if(!S)return;
 const dialog=document.getElementById('header-notifications'),trigger=document.getElementById('notification-toggle');let returnFocus;
 const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const initials=s=>String(s||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
 const photo=s=>{try{return ['https:','http:'].includes(new URL(s).protocol)?s:''}catch{return ''}};
 const icons={profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',book:'<path d="M12 6v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',teach:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'};
 const svg=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[n]}</svg>`;
 // Account menu: avatar button in the header with a dropdown of the member's pages.
 const actions=document.querySelector('.header-actions'),menu=document.createElement('div');menu.className='account-menu';menu.hidden=true;
 menu.innerHTML=`<button class="account-trigger" type="button" aria-expanded="false" aria-controls="account-dropdown"><span class="account-avatar" data-account-avatar></span><svg class="account-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="account-dropdown" id="account-dropdown" hidden><div class="account-head"><span class="account-avatar large" data-account-avatar></span><div><strong data-account-name></strong><small data-account-email></small></div></div><nav class="account-links" aria-label="Your account"></nav><button type="button" class="account-signout" data-site-logout>${svg('out')}<span>Sign out</span></button></div>`;
 actions?.append(menu);
 const menuButton=menu.querySelector('.account-trigger'),dropdown=menu.querySelector('.account-dropdown');
 function setOpen(open,focusButton){dropdown.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));if(open)dropdown.querySelector('a,button')?.focus();else if(focusButton)menuButton.focus()}
 menuButton.addEventListener('click',()=>setOpen(dropdown.hidden));
 document.addEventListener('click',e=>{if(!dropdown.hidden&&!menu.contains(e.target))setOpen(false)});
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dropdown.hidden){e.preventDefault();setOpen(false,true)}});
 menu.addEventListener('focusout',e=>{if(!dropdown.hidden&&e.relatedTarget&&!menu.contains(e.relatedTarget))setOpen(false)});
 const signIn=document.querySelector('.header-signin');signIn?.addEventListener('click',()=>{const here=location.pathname.split('/').pop()||'index.html';if(!['login.html','signup.html'].includes(here))try{sessionStorage.setItem('titanium-next-route',here+location.hash)}catch{}});
 function sync(){const u=S.user(),here=location.pathname.split('/').pop()||'index.html';
  if(signIn){signIn.hidden=!!u;if(here==='login.html')signIn.setAttribute('aria-current','page');else signIn.removeAttribute('aria-current')}
  menu.hidden=!u;if(!u)setOpen(false);
  if(u){const pic=photo(u.profilePic);menu.querySelectorAll('[data-account-avatar]').forEach(a=>{a.innerHTML=pic?`<img src="${esc(pic)}" alt="">`:esc(initials(u.name));a.querySelector('img')?.addEventListener('error',()=>{a.textContent=initials(u.name)},{once:true})});
   menu.querySelector('[data-account-name]').textContent=u.name;menu.querySelector('[data-account-email]').textContent=u.email||u.role;menuButton.setAttribute('aria-label','Account menu for '+u.name);
   const admin=u.role==='Admin',items=admin?[['Admin dashboard','workspace.html#admin','grid'],['Profile','workspace.html#admin/profile','profile'],['Settings','settings.html','settings']]:[['Profile','profile.html','profile'],['Settings','settings.html','settings'],['My courses','my-courses.html','book'],['Saved courses','saved-courses.html','heart'],...(u.role==='Teacher'?[['My teaching','teaching.html','teach']]:[])];
   menu.querySelector('.account-links').innerHTML=items.map(([label,href,icon])=>`<a href="${href}"${href===here?' aria-current="page"':''}>${svg(icon)}<span>${label}</span></a>`).join('')}
  document.querySelectorAll('[data-member-only]').forEach(e=>e.hidden=!u);document.querySelectorAll('[data-teacher-only]').forEach(e=>e.hidden=u?.role!=='Teacher');document.querySelectorAll('[data-member-route]').forEach(a=>{const active=location.pathname.endsWith('/'+a.dataset.memberRoute);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 }
 trigger?.addEventListener('click',()=>{returnFocus=document.activeElement;dialog.showModal()});dialog?.querySelector('[data-close-notifications]')?.addEventListener('click',()=>dialog.close());dialog?.addEventListener('click',e=>{const b=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom))dialog.close()});dialog?.addEventListener('close',()=>returnFocus?.focus());
 document.querySelectorAll('[data-site-logout]').forEach(button=>button.addEventListener('click',()=>{S.logout();location.href='index.html'}));
 window.TitaniumMemberNav={sync};addEventListener('storage',e=>{if([S.KEY,S.SESSION].includes(e.key)){S.refresh();sync()}});sync();
 const header=document.querySelector('.header');if(header)new ResizeObserver(()=>document.body.style.setProperty('--site-header-height',header.getBoundingClientRect().height+'px')).observe(header);
})();
