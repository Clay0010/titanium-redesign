(function(){
 var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 var chev=function(d){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(d>0?'m9 6 6 6-6 6':'m15 6-6 6 6 6')+'"/></svg>'};
 function enhance(bar){
  if(bar.closest('.seg-wrap'))return;
  var wrap=document.createElement('div');wrap.className='seg-wrap';bar.parentNode.insertBefore(wrap,bar);wrap.appendChild(bar);
  var next=document.createElement('button'),prev=document.createElement('button');
  next.type=prev.type='button';next.className='seg-more next';prev.className='seg-more prev';
  prev.innerHTML=chev(-1);prev.setAttribute('aria-label','Show previous options');
  wrap.appendChild(prev);wrap.appendChild(next);
  var items=function(){return [].slice.call(bar.children).filter(function(c){return !c.classList.contains('segmented-indicator')})};
  function update(){
   var max=bar.scrollWidth-bar.clientWidth,x=bar.scrollLeft;
   wrap.classList.toggle('can-left',max>2&&x>4);wrap.classList.toggle('can-right',max>2&&x<max-4);wrap.classList.toggle('at-end',max>2&&x>=max-4);
   var box=bar.getBoundingClientRect(),hidden=items().filter(function(c){return c.getBoundingClientRect().right>box.right-40}).length,before=items().filter(function(c){return c.getBoundingClientRect().left<box.left+40}).length;
   next.innerHTML=chev(1);
   prev.innerHTML=chev(-1);prev.setAttribute('aria-label',before?'Show '+before+' previous option'+(before>1?'s':''):'Show previous options');
   next.setAttribute('aria-label',hidden?'Show '+hidden+' more option'+(hidden>1?'s':''):'Show more options');
  }
  next.addEventListener('click',function(){bar.scrollBy({left:bar.clientWidth*.7,behavior:reduce?'auto':'smooth'})});
  prev.addEventListener('click',function(){bar.scrollBy({left:-bar.clientWidth*.7,behavior:reduce?'auto':'smooth'})});
  bar.addEventListener('scroll',update,{passive:true});
  if(window.ResizeObserver)new ResizeObserver(update).observe(bar);
  update();
 }
 function run(){document.querySelectorAll('.segmented').forEach(enhance)}
 if(document.readyState==='complete')run();else addEventListener('load',run);
})();
