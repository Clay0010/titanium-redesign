(function(){var h=document.querySelector('.header');if(!h)return;var f=function(){h.classList.toggle('is-scrolled',window.scrollY>8)};f();addEventListener('scroll',f,{passive:true})})();
