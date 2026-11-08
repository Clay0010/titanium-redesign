/* Native HTML adaptation of custom-ui-components/components/modal.
   Same header/body/footer composition and platform focus/keyboard behavior. */
(()=>{'use strict';let sequence=0;
 const paths={record:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',delete:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',photo:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 17 5-5 4 4 4-6 5 7"/>'};
 const svg=path=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
 function prepare(dialog,options={}){if(!dialog||dialog.querySelector(':scope>.t-modal-header'))return;
  const oldHeader=dialog.querySelector(':scope>.p-dialog-head'),title=oldHeader?.querySelector('h2')||document.createElement('h2');
  if(!title.textContent)title.textContent=options.title||'Photo viewer';
  title.id=title.id||dialog.id+'-title-'+(++sequence);title.classList.add('t-modal-title');dialog.setAttribute('aria-labelledby',title.id);
  const closeButton=oldHeader?.querySelector('button')||dialog.querySelector(':scope>.dialog-close')||document.createElement('button');
  closeButton.type='button';closeButton.classList.add('t-modal-close');closeButton.setAttribute('aria-label',closeButton.getAttribute('aria-label')||'Close dialog');closeButton.innerHTML=svg('<path d="M6 6l12 12M18 6L6 18"/>');
  closeButton.addEventListener('click',()=>dialog.close());
  const header=document.createElement('header');header.className='t-modal-header';
  const chip=document.createElement('span');chip.className='t-modal-icon';chip.innerHTML=svg(paths[options.icon]||paths.record);
  const text=document.createElement('div');text.className='t-modal-heading';text.append(title);
  const note=dialog.querySelector('.notification-demo-note'),description=options.description||note?.textContent;
  if(description){const p=document.createElement('p');p.className='t-modal-description';p.id=dialog.id+'-description';p.textContent=description;text.append(p);dialog.setAttribute('aria-describedby',p.id)}else dialog.removeAttribute('aria-describedby');
  note?.remove();header.append(chip,text,closeButton);closeButton.remove();header.append(closeButton);oldHeader?.remove();
  let actions=dialog.querySelector('.p-form-actions')||dialog.querySelector('.lightbox-bar');
  if(!actions&&dialog.id==='header-notifications')actions=dialog.querySelector(':scope>a');
  if(actions){actions.querySelectorAll('button[type=submit]').forEach(b=>{const form=b.closest('form');if(form)b.setAttribute('form',form.id)});actions.remove()}
  const body=document.createElement('div');body.className='t-modal-body';while(dialog.firstChild)body.append(dialog.firstChild);
  dialog.append(header,body);
  if(actions){const footer=document.createElement('footer');footer.className='t-modal-footer';footer.append(actions);dialog.append(footer)}
  dialog.classList.add('t-modal');
 }
 window.TitaniumModal={prepare};
 document.querySelectorAll('dialog:not(#portal-dialog)').forEach(dialog=>prepare(dialog,{icon:dialog.id==='header-notifications'?'bell':'photo',description:dialog.id==='gallery-lightbox'?'Moments from the Titanium community.':undefined}));
})();
