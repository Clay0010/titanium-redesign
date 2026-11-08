(()=>{
 'use strict';
 // Custom select: every native <select> gets a styled dropdown; the native element stays the source of truth for forms and scripts.
 (()=>{let uid=0,current=null;const P=HTMLSelectElement.prototype,pv=Object.getOwnPropertyDescriptor(P,'value'),pi=Object.getOwnPropertyDescriptor(P,'selectedIndex');
  function enhance(sel){if(sel._cs||sel.multiple||sel.size>1||sel.closest('[data-native-select]'))return;
   const id='cs-'+(++uid),wrap=document.createElement('div'),btn=document.createElement('button'),list=document.createElement('ul');let active=-1,typed='',typedAt=0;
   wrap.className='cselect';btn.type='button';btn.className='cselect-trigger';btn.setAttribute('role','combobox');btn.setAttribute('aria-haspopup','listbox');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls',id+'-list');
   btn.innerHTML='<span class="cselect-value"></span><svg class="cselect-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
   list.className='cselect-list';list.id=id+'-list';list.setAttribute('role','listbox');list.hidden=true;
   const labels=[...(sel.labels||[])].map((l,i)=>{if(!l.id)l.id=id+'-label'+i;return l.id});
   if(labels.length){btn.setAttribute('aria-labelledby',labels.join(' '));list.setAttribute('aria-labelledby',labels.join(' '))}else if(sel.getAttribute('aria-label')){btn.setAttribute('aria-label',sel.getAttribute('aria-label'));list.setAttribute('aria-label',sel.getAttribute('aria-label'))}
   const api={close};sel._cs=api;sel.before(wrap);wrap.append(sel,btn,list);sel.classList.add('cselect-native');sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');
   const usable=i=>{const o=sel.options[i];return o&&!o.disabled&&!o.hidden};
   const step=(from,dir)=>{for(let i=from+dir;i>=0&&i<sel.options.length;i+=dir)if(usable(i))return i;return from};
   function sync(){const i=pi.get.call(sel),o=sel.options[i];btn.querySelector('.cselect-value').textContent=o?o.textContent:'';
    wrap.classList.toggle('is-placeholder',!o||(o.value===''&&(sel.required||/^choose/i.test(o.textContent.trim()))));btn.disabled=sel.disabled;
    [...list.children].forEach((li,j)=>li.setAttribute('aria-selected',String(j===i)));if(o&&o.value!=='')wrap.classList.remove('is-invalid')}
   function render(){list.innerHTML='';[...sel.options].forEach((o,i)=>{const li=document.createElement('li');li.id=id+'-'+i;li.className='cselect-option';li.setAttribute('role','option');li.textContent=o.textContent;if(o.disabled)li.setAttribute('aria-disabled','true');li.hidden=o.hidden;list.append(li)});sync();if(!list.hidden)setActive(Math.min(active,sel.options.length-1))}
   function setActive(i){active=i;[...list.children].forEach((li,j)=>li.classList.toggle('is-active',j===i));const li=list.children[i];if(!li){btn.removeAttribute('aria-activedescendant');return}btn.setAttribute('aria-activedescendant',li.id);
    if(li.offsetTop<list.scrollTop)list.scrollTop=li.offsetTop-6;else if(li.offsetTop+li.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=li.offsetTop+li.offsetHeight-list.clientHeight+6}
   function place(){const r=btn.getBoundingClientRect(),below=innerHeight-r.bottom-12,above=r.top-12,want=Math.min(list.scrollHeight,300),up=below<want&&above>below;
    list.style.minWidth=r.width+'px';list.style.maxHeight=Math.max(120,Math.min(300,up?above:below))+'px';list.style.top=up?'':r.bottom+6+'px';list.style.bottom=up?innerHeight-r.top+6+'px':'';
    list.style.left=Math.max(8,Math.min(r.left,innerWidth-list.offsetWidth-8))+'px';list.classList.toggle('is-up',up)}
   function show(){if(sel.disabled||!list.hidden)return;current?.close();current=api;list.hidden=false;wrap.classList.add('is-open');btn.setAttribute('aria-expanded','true');place();const i=pi.get.call(sel);setActive(usable(i)?i:step(-1,1))}
   function close(){if(list.hidden)return;list.hidden=true;wrap.classList.remove('is-open');btn.setAttribute('aria-expanded','false');btn.removeAttribute('aria-activedescendant');if(current===api)current=null}
   function choose(i){close();btn.focus();if(!usable(i)||i===pi.get.call(sel))return;pi.set.call(sel,i);sync();sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}))}
   btn.addEventListener('click',e=>{if(e.detail===0)return;list.hidden?show():close()});
   btn.addEventListener('keydown',e=>{const k=e.key,open=!list.hidden;
    if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();if(!open)show();else setActive(step(active,k==='ArrowDown'?1:-1))}
    else if((k==='Home'||k==='End')&&open){e.preventDefault();setActive(k==='Home'?step(-1,1):step(sel.options.length,-1))}
    else if(k==='Enter'||k===' '){e.preventDefault();open?choose(active):show()}
    else if(k==='Escape'&&open){e.preventDefault();e.stopPropagation();close()}
    else if(k==='Tab')close();
    else if(k.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){const now=Date.now();typed=(now-typedAt>700?'':typed)+k.toLowerCase();typedAt=now;const n=sel.options.length,start=open?active:pi.get.call(sel);
     for(let j=typed.length>1?0:1;j<=n;j++){const i=(start+j+n)%n;if(usable(i)&&sel.options[i].textContent.trim().toLowerCase().startsWith(typed)){open?setActive(i):choose(i);break}}}});
   btn.addEventListener('blur',close);
   list.addEventListener('mousedown',e=>e.preventDefault());
   list.addEventListener('click',e=>{const li=e.target.closest('.cselect-option');if(li)choose([...list.children].indexOf(li))});
   list.addEventListener('mousemove',e=>{const li=e.target.closest('.cselect-option'),i=[...list.children].indexOf(li);if(li&&i!==active&&usable(i))setActive(i)});
   sel.addEventListener('focus',()=>btn.focus());sel.addEventListener('change',sync);sel.addEventListener('invalid',()=>wrap.classList.add('is-invalid'));
   sel.form?.addEventListener('reset',()=>setTimeout(sync));
   Object.defineProperty(sel,'value',{configurable:true,get(){return pv.get.call(sel)},set(v){pv.set.call(sel,v);sync()}});
   Object.defineProperty(sel,'selectedIndex',{configurable:true,get(){return pi.get.call(sel)},set(v){pi.set.call(sel,v);sync()}});
   new MutationObserver(render).observe(sel,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','selected','hidden','label']});render()}
  const scan=root=>{if(root.nodeType!==1)return;if(root.tagName==='SELECT')enhance(root);else root.querySelectorAll('select').forEach(enhance)};
  scan(document.documentElement);new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(scan))).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('pointerdown',e=>{if(current&&!e.target.closest?.('.cselect.is-open'))current.close()},true);
  addEventListener('scroll',e=>{if(current&&!e.target.closest?.('.cselect-list'))current.close()},true);addEventListener('resize',()=>current?.close());
 })();
 // Every foreground dialog dismisses on a click outside its visible bounds.
 document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{
  const box=dialog.getBoundingClientRect();
  if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))dialog.close();
 }));
 const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
 function closeMenu(){if(!menu||!nav)return;nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation')}
 menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('is-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')});
 nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
 document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus()}});
 matchMedia('(min-width:1001px)').addEventListener('change',closeMenu);
 document.querySelectorAll('#year').forEach(e=>e.textContent=new Date().getFullYear());
 // FAQ accordions: one answer open at a time, with a smooth height and fade transition.
 document.querySelectorAll('.faq-list').forEach(group=>{
  const items=[...group.querySelectorAll('details')],reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  items.filter(item=>item.open).slice(1).forEach(item=>item.open=false);
  const panel=item=>{let p=item.querySelector(':scope>.faq-answer');if(!p){p=document.createElement('div');p.className='faq-answer';[...item.children].filter(c=>c.tagName!=='SUMMARY').forEach(c=>p.append(c));item.append(p)}return p};
  const animate=(item,open)=>{const p=panel(item),from=item.open?p.getBoundingClientRect().height:0;item._anim?.cancel();item.classList.toggle('is-closing',!open);
   if(reduce()){item.open=open;item.classList.remove('is-closing');return}
   if(open)item.open=true;const to=open?p.scrollHeight:0;
   const a=p.animate([{height:from+'px',opacity:open&&!from?0:1},{height:to+'px',opacity:open?1:0}],{duration:320,easing:'cubic-bezier(.2,.7,.2,1)'});
   item._anim=a;a.onfinish=()=>{item._anim=null;if(!open)item.open=false;item.classList.remove('is-closing')}};
  items.forEach(item=>{panel(item);item.removeAttribute('name');
   item.querySelector(':scope>summary')?.addEventListener('click',e=>{e.preventDefault();const opening=!item.open||item.classList.contains('is-closing');
    if(opening)items.forEach(other=>{if(other!==item&&other.open&&!other.classList.contains('is-closing'))animate(other,false)});animate(item,opening)})});
 });
 document.querySelectorAll('.map-load').forEach(button=>button.addEventListener('click',()=>{const map=button.closest('.location-map'),frame=map.querySelector('iframe');frame.src=frame.dataset.mapSrc;frame.hidden=false;map.querySelector('.map-start').hidden=true;frame.focus()}));
 document.querySelectorAll('.partner img').forEach(img=>{const fallback=()=>img.closest('.partner').classList.add('failed');img.addEventListener('error',fallback);if(img.complete&&!img.naturalWidth)fallback()});
 // Segmented tabs: equal-width segments with a sliding orange indicator.
 // Course and photo filters switch in place; the gallery menu slides first, then opens the page.
 const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function segmented(group,tabs,active){
  group.classList.add('segmented');const indicator=document.createElement('span');indicator.className='segmented-indicator';indicator.setAttribute('aria-hidden','true');group.prepend(indicator);
  const place=(animate=true)=>{const tab=typeof active==='function'?active():group.querySelector(active);indicator.hidden=!tab;if(!tab)return;
   if(!animate)indicator.style.transition='none';indicator.style.width=tab.offsetWidth+'px';indicator.style.transform='translateX('+tab.offsetLeft+'px)';
   if(!animate){indicator.getBoundingClientRect();indicator.style.transition=''}};
  place(false);
  new MutationObserver(()=>place()).observe(group,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed','class']});
  new ResizeObserver(()=>place(false)).observe(group);
  group.addEventListener('click',e=>{const tab=e.target.closest(tabs);if(tab&&group.scrollWidth>group.clientWidth)group.scrollTo({left:tab.offsetLeft-(group.clientWidth-tab.offsetWidth)/2,behavior:reduceMotion()?'auto':'smooth'})});
  return place;
 }
 document.querySelectorAll('.filters').forEach(group=>{if(group.querySelector('.filter'))segmented(group,'.filter','.filter[aria-pressed="true"]')});
 document.querySelectorAll('.gallery-menu').forEach(menu=>{
  const place=segmented(menu,'a',()=>menu.querySelector('a.is-going')||menu.querySelector('a[aria-current="page"]'));
  menu.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.getAttribute('aria-current')==='page'||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
   e.preventDefault();menu.querySelectorAll('a').forEach(x=>x.classList.toggle('is-going',x===a));setTimeout(()=>{location.href=a.href},reduceMotion()?0:280)});
  addEventListener('pageshow',e=>{if(e.persisted){menu.querySelectorAll('.is-going').forEach(x=>x.classList.remove('is-going'));place(false)}});
 });
 const catalog=document.querySelector('#course-catalog')||document.querySelector('.courses .course-grid');
 if(catalog){
  const cards=[...catalog.querySelectorAll('.course-card')],filters=[...document.querySelectorAll('[data-filter]')],search=document.querySelector('#course-search'),sort=document.querySelector('#course-sort');let active='all';
  const count=document.querySelector('#course-count'),empty=document.querySelector('#course-empty');
  function update(){let visible=0;const term=(search?.value||'').trim().toLocaleLowerCase();cards.forEach(c=>{c.hidden=!((active==='all'||c.dataset.category===active)&&(c.dataset.name||c.textContent).toLocaleLowerCase().includes(term));if(!c.hidden)visible++});filters.forEach(f=>f.setAttribute('aria-pressed',String(f.dataset.filter===active)));if(empty)empty.hidden=visible!==0;if(count)count.textContent=`Showing ${visible} ${visible===1?'program':'programs'} · Ask us about current availability.`;if(sort){const sorted=[...cards];if(sort.value==='az')sorted.sort((a,b)=>a.dataset.name.localeCompare(b.dataset.name));else if(sort.value==='za')sorted.sort((a,b)=>b.dataset.name.localeCompare(a.dataset.name));sorted.forEach(c=>catalog.append(c))}}
  filters.forEach(f=>f.addEventListener('click',()=>{active=f.dataset.filter;update()}));search?.addEventListener('input',update);sort?.addEventListener('change',update);
  document.querySelector('#reset-filters')?.addEventListener('click',()=>{active='all';if(search)search.value='';if(sort)sort.value='featured';update();search?.focus()});update();
 }
 const params=new URLSearchParams(location.search),subject=document.querySelector('#subject'),service=document.querySelector('#service');
 if(subject&&params.has('program'))subject.value='Program inquiry: '+params.get('program').slice(0,160);
 if(service&&params.has('service')){service.value=params.get('service');if(!service.value)service.selectedIndex=0}
 document.querySelectorAll('.inquiry-form').forEach(form=>{
  form.addEventListener('submit',e=>{
   e.preventDefault();if(!form.reportValidity())return;const data=new FormData(form),chosen=form.querySelector('select option:checked')?.textContent;
   const topic=data.get('subject')||(chosen?'Service inquiry: '+chosen:'Titanium training inquiry');
   const body=`Hello Titanium,\n\n${topic}\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}${data.get('phone')?'\nPhone: '+data.get('phone'):''}\n\n${data.get('message')}`;
   const preview=form.querySelector('.message-preview');preview.hidden=false;preview.querySelector('pre').textContent=body;
   preview.querySelector('[data-send=whatsapp]').href='https://wa.me/9647811158802?text='+encodeURIComponent(body);
   preview.querySelector('[data-send=email]').href='mailto:info@titanium-tc.com?subject='+encodeURIComponent(topic)+'&body='+encodeURIComponent(body);
   preview.querySelector('h3').focus();
  });
  form.addEventListener('input',()=>{form.querySelector('.message-preview').hidden=true});
 });
 const gallery=document.querySelector('.moments-grid');
 if(gallery){
  const items=[...gallery.querySelectorAll('.moment')],filters=[...document.querySelectorAll('.gallery-filter')],dialog=document.querySelector('#gallery-lightbox'),image=dialog.querySelector('img'),caption=dialog.querySelector('[data-caption]'),counter=dialog.querySelector('[data-photo-counter]');let active=gallery.dataset.initialFilter||'all',selected=0,opener;
  const visible=()=>items.filter(i=>!i.hidden);
  function filter(){let count=0;items.forEach(item=>{item.hidden=active!=='all'&&item.dataset.category!==active;if(!item.hidden)count++});filters.forEach(f=>f.setAttribute('aria-pressed',String(f.dataset.galleryFilter===active)));document.querySelector('#gallery-count').textContent=`${count} ${count===1?'moment':'moments'} · Select a photo to enlarge`}
  function show(){const list=visible(),item=list[selected];image.src=item.querySelector('img').src;image.alt=item.dataset.caption;caption.textContent=item.dataset.caption;counter.textContent=`${selected+1} of ${list.length}`;dialog.querySelector('[data-photo=prev]').disabled=list.length<2;dialog.querySelector('[data-photo=next]').disabled=list.length<2}
  function move(amount){selected=(selected+amount+visible().length)%visible().length;show()}
  filters.forEach(f=>f.addEventListener('click',()=>{active=f.dataset.galleryFilter;filter()}));
  items.forEach(item=>item.addEventListener('click',()=>{opener=item;selected=visible().indexOf(item);show();dialog.showModal();document.body.style.overflow='hidden'}));
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('[data-photo=prev]').addEventListener('click',()=>move(-1));dialog.querySelector('[data-photo=next]').addEventListener('click',()=>move(1));
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}});
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close()});
  dialog.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus()});filter();
 }
})();
