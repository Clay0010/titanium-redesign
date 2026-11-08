const fs=require('fs');
const instructors=JSON.parse(fs.readFileSync('source/instructors.json','utf8'));
const assignments={ceh:0,ccna:0,iso27001:1,cism:1,'full-stack':3,oracle:5,linux:4,'future-wave':0};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function courseMark(id){
 const designs={
  ceh:'<path d="M32 7 51 15v15c0 12-9 20-19 25-10-5-19-13-19-25V15Z"/><path d="m23 31 6 6 13-15"/>',
  ccna:'<rect x="23" y="23" width="18" height="18" rx="4"/><path d="M32 23V13m0 28v10M23 32H13m28 0h10M20 20l-5-5m29 29 5 5m-5-29 5-5M20 44l-5 5"/><circle cx="32" cy="9" r="4"/><circle cx="32" cy="55" r="4"/><circle cx="9" cy="32" r="4"/><circle cx="55" cy="32" r="4"/>',
  iso27001:'<path d="M16 7h23l10 10v36H16Z"/><path d="M38 7v12h11M24 25h17M24 31h8m-8 11 6 6 12-13"/>',
  cism:'<path d="M32 10 51 18v12c0 12-8 20-19 25-11-5-19-13-19-25V18Z"/><circle cx="32" cy="26" r="6"/><path d="M23 43v-2a9 9 0 0 1 18 0v2"/>',
  'full-stack':'<path d="m32 8 23 12-23 12L9 20Zm-23 24 23 12 23-12M9 44l23 12 23-12"/>',
  linux:'<path d="M20 26c0-17 24-17 24 0l5 19c-7 9-27 9-34 0Z"/><path d="M24 30c-6 5-7 12-3 18m19-18c6 5 7 12 3 18"/><ellipse cx="32" cy="39" rx="9" ry="12" fill="white"/><circle cx="28" cy="22" r="2" fill="currentColor" stroke="none"/><circle cx="36" cy="22" r="2" fill="currentColor" stroke="none"/><path d="m27 27 5 4 5-4M20 50l-7 5h14m17-5 7 5H37"/>',
  oracle:'<ellipse cx="32" cy="14" rx="20" ry="7"/><path d="M12 14v34c0 10 40 10 40 0V14M12 26c0 10 40 10 40 0M12 38c0 10 40 10 40 0"/>',
  'future-wave':'<path d="M10 37c11-22 22 10 44-17M10 49c11-22 22 10 44-17M39 18h17v17"/>'
 };
 return `<svg class="course-mark" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${designs[id]||designs['future-wave']}</svg>`;
}
function teacherRow(id,img){const teacher=instructors[assignments[id]??0];const label=['ccna','future-wave'].includes(id)?'Meet an instructor':'Instructor';return `<a class="course-teacher" href="instructor-${teacher.id}.html" aria-label="View ${esc(teacher.name)}’s instructor profile">${img(teacher.photo,teacher.name)}<span><small>${label}</small><strong>${teacher.name}</strong></span><svg class="arrow" aria-hidden="true"><use href="#diagonal"/></svg></a>`}
function decorateCourses(html,img){
 return html.replace(/<article class="course-card"[\s\S]*?<\/article>/g,card=>{
  const id=card.match(/href="course-([^"]+)\.html"/)?.[1];if(!id)return card;
  card=card.replace(/<div class="course-code([^"\n]*)">([\s\S]*?)<\/div>/,(_,cls,code)=>`<div class="course-identity">${courseMark(id)}<div class="course-code${cls}">${code}</div></div>`);
  return card.replace('<div class="course-bottom">',teacherRow(id,img)+'<div class="course-bottom">').replace('>Explore program ','>Explore course ');
 });
}
function profile(t,C){const {hero,img,checks,link,button,card,courses,cta}=C;const programs=courses.filter(c=>t.programs.includes(c.id));return `${hero('Meet your instructor',t.name,t.title,[['Our team','about.html#team']])}<section class="page-section flush-top"><div class="wrap"><div class="instructor-profile"><figure class="profile-portrait">${img(t.photo,t.name,true)}<figcaption>Titanium Training Center · Teaching team</figcaption></figure><div class="profile-overview"><h2>About ${t.name.split(' ')[0]}.</h2><p>${t.bio}</p><div class="profile-facts"><div><span>Role</span><strong>Instructor</strong></div><div><span>Training center</span><strong>Titanium · Baghdad</strong></div><div><span>Specialism</span><strong>${t.title.replace(' instructor','')}</strong></div></div><div class="profile-actions">${button('Ask about training with '+t.name.split(' ')[0],`contact.html?program=${encodeURIComponent('Learning with '+t.name)}#inquiry`,true)}${link('Meet the team','about.html#team')}</div></div></div></div></section><section class="page-section white"><div class="wrap profile-detail-grid"><div><div class="kicker">Teaching focus</div><h2>Knowledge to share.</h2>${checks(t.focus)}${t.credentials.length?`<div class="profile-credentials"><h3>Published credentials</h3><ul>${t.credentials.map(c=>`<li>${c}</li>`).join('')}</ul></div>`:''}</div><div class="profile-learning"><div class="kicker">Plan your learning</div><h2>Find your next step.</h2><p>${t.teaching}</p><p>Titanium offers practical learning with support during and after a course. The team can confirm the instructor, schedule, delivery format and requirements for your chosen session.</p>${link('Talk to our team',`contact.html?program=${encodeURIComponent('Learning with '+t.name)}#inquiry`)}</div></div></section>${programs.length?`<section class="page-section"><div class="wrap"><div class="section-head"><div><div class="kicker">Explore the subject</div><h2>Related training areas.</h2></div>${link('View all programs','courses.html')}</div><div class="related-grid">${programs.map(card).join('')}</div></div></section>`:`<section class="page-section"><div class="wrap profile-training-note"><div><h2>Interested in penetration testing?</h2><p>Ask the team about specialist training and available sessions with ${t.name}.</p></div>${button('Explore cybersecurity training','courses.html')}</div></section>`}${cta}`}
module.exports={instructors,assignments,courseMark,decorateCourses,profile};
