/* Native HTML adaptation of custom-ui-components/components/search-box. */
(()=>{'use strict';let lastSearch;
 const svg=path=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'+path+'</svg>';
 const visible=input=>input.isConnected&&!input.disabled&&input.getClientRects().length>0&&getComputedStyle(input).visibility!=='hidden';
 function upgrade(){document.querySelectorAll('input[type=search]').forEach(input=>{
  if(input.dataset.searchBox)return;input.dataset.searchBox='true';input.setAttribute('aria-keyshortcuts','Control+K Meta+K');
  let wrapper=input.closest('label');if(!wrapper){wrapper=document.createElement('label');input.before(wrapper);wrapper.append(input)}wrapper.classList.add('t-search');
  if(!wrapper.querySelector(':scope>svg')){const span=document.createElement('span');span.innerHTML=svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>');wrapper.prepend(span.firstElementChild)}
  const clear=document.createElement('button');clear.type='button';clear.className='t-search-clear';clear.setAttribute('aria-label','Clear search');clear.innerHTML=svg('<path d="M18 6 6 18M6 6l12 12"/>');
  const hint=document.createElement('kbd');hint.className='t-search-shortcut';hint.setAttribute('aria-hidden','true');const mac=/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);hint.textContent=mac?'⌘K':'Ctrl K';hint.title=mac?'⌘K':'Ctrl+K';wrapper.append(clear,hint);
  const update=()=>{clear.hidden=!input.value||input.disabled;hint.hidden=Boolean(input.value)||document.activeElement===input};
  const reset=()=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();update()};
  clear.addEventListener('click',e=>{e.preventDefault();reset()});input.addEventListener('input',update);input.addEventListener('focus',()=>{lastSearch=input;update()});input.addEventListener('blur',update);input.addEventListener('keydown',e=>{if(e.key==='Escape'&&input.value){e.preventDefault();e.stopPropagation();reset()}});input.form?.addEventListener('reset',()=>requestAnimationFrame(update));update();
 })}
 document.addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='k'||!(e.ctrlKey||e.metaKey)||e.altKey||e.isComposing)return;const openDialogs=[...document.querySelectorAll('dialog[open]')],scope=openDialogs.at(-1)||document;const candidates=[...scope.querySelectorAll('input[type=search]')].filter(visible);if(!candidates.length){if(openDialogs.length)e.preventDefault();return}e.preventDefault();const input=candidates.includes(document.activeElement)?document.activeElement:candidates.includes(lastSearch)?lastSearch:candidates[0];input.focus();input.select()});
 upgrade();new MutationObserver(upgrade).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
})();
