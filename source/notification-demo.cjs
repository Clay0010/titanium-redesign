// Static examples for the notification interface, independent of account data.
const updates=[
 {title:'Your place is confirmed',body:'Your request to join the CCNA cohort has been approved. View the details in My courses.',time:'10 minutes ago',href:'my-courses.html#my-courses?status=Approved',path:'<path d="m5 12 4 4L19 6"/>'},
 {title:'Request received',body:'Your Certified Ethical Hacker course request is waiting for the team to review.',time:'1 hour ago',href:'my-courses.html#my-courses?status=Pending',path:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'},
 {title:'Something new to learn',body:'Explore Linux System Administration and take a look at the available course instances.',time:'Yesterday',href:'course-instances.html#course/linux',path:'<path d="M12 5v16M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2Z"/>'},
 {title:'Make your profile yours',body:'Add your education, experience and learning interests whenever you are ready.',time:'Yesterday',href:'profile.html',path:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>'}
];
module.exports=`<p class="notification-demo-note">Sample updates for this UI demo.</p><ul class="notification-list">${updates.map(n=>`<li><a class="notification-item" href="${n.href}"><span class="notification-item-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${n.path}</svg></span><span class="notification-item-copy"><strong>${n.title}</strong><span>${n.body}</span><small>${n.time}</small></span></a></li>`).join('')}</ul>`;
