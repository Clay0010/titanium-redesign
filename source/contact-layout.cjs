/* Contact page layout: heading, intro and contact cards on the left, the inquiry form beside them,
   and the map section below. Takes the page's generated <main> markup and returns the new layout.
   Used by build-site.cjs and safe to run on an already converted page (it returns it unchanged). */
module.exports=function contactLayout(main){
 if(main.includes('class="contact-layout"'))return main;
 const pick=(re,label)=>{const m=main.match(re);if(!m)throw Error('contact layout: missing '+label);return m};
 const crumbs=pick(/<nav class="breadcrumb"[\s\S]*?<\/nav>/,'breadcrumb')[0];
 const heading=pick(/<div class="page-heading[^"]*"><div>([\s\S]*?)<\/div><p>([\s\S]*?)<\/p><\/div>/,'heading');
 const copy=pick(/<div class="contact-copy">([\s\S]*?)<div class="call-list"><p>([\s\S]*?)<\/p>([\s\S]*?)<\/div><\/div><div class="form-card"/,'contact details');
 const formStart=main.indexOf('<div class="form-card" id="inquiry">'),locationStart=main.indexOf('<section class="location-block"');
 if(formStart<0||locationStart<0)throw Error('contact layout: missing form or location');
 const form=main.slice(formStart,locationStart).replace(/<\/div>\s*$/,'');
 const location=main.slice(locationStart,main.lastIndexOf('</section>',main.lastIndexOf('</section>')-1)+'</section>'.length);
 const help='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.4 9.2a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.4-2.6 4"/><path d="M12 17.3h.01"/></svg>';
 const tiles=copy[1].replaceAll('<div class="contact-method">','<div class="contact-method contact-tile">').replace('<h3>Come say hello</h3>','<h3>Visit the center</h3>')
  +`<div class="contact-method contact-tile"><span class="caption-icon">${help}</span><div><h3>Quick answers</h3><p>${copy[2]}</p>${copy[3]}</div></div>`;
 return `<main id="main"><section class="page-hero contact-hero"><div class="wrap">${crumbs}<div class="contact-layout"><div class="contact-intro"><div class="contact-heading">${heading[1]}<p class="contact-lead">${heading[2]}</p></div><div class="contact-tiles">${tiles}</div></div>${form}</div></div></section><section class="page-section flush-top contact-location"><div class="wrap">${location}</div></section></main>`;
};
