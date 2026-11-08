# Titanium Training Center redesign

Open **index.html** to browse the responsive site, or **login.html** to try local accounts. **workspace.html** is reserved for the admin dashboard. Keep the 41 HTML files together so navigation works. Each page embeds its styles and scripts. For consistent storage across pages and password sign-in, run `node server.cjs` and open `http://127.0.0.1:4173/login.html`. This serves files locally; no backend or database is used for workspace features.

## Pages

- Home, About, Courses, Services, Gallery, Contact, and FAQs.
- Eight course and training-area pages, with custom course emblems and clickable instructor names.
- Seven instructor profile pages with published specialisms, credentials where available, related training and inquiry links.
- A dedicated AI assistant chat page with a working course-guide preview and an optional live-AI server.
- Student, event, and course gallery pages, plus the center location page.
- Community activities listing and three activity detail pages.

The approved homepage design is preserved, with navigation and program links connected to the new local pages. All pages use Titanium orange, neutral surfaces and Ubuntu.

## Working interactions

- Responsive navigation and breadcrumbs.
- Course filtering, search, sorting, and empty-state reset.
- Course-specific inquiry links that prefill the contact form.
- Service-specific inquiry links that preselect the requested service.
- Validated forms that prepare a reviewable message and open WhatsApp or an email application. Messages are sent by the visitor in the selected application; no backend submission is simulated.
- Photo filters and a keyboard-accessible lightbox with previous/next controls, Escape to close, and focus restoration.
- Exclusive FAQ accordions: opening one answer closes the previous answer.
- An interactive Google Map loaded on request.

Profile, Saved courses and My courses links open regular pages in the main website. No connection to Titanium's existing account system or payment system is made.

## Files and rebuilding

Each generated HTML file embeds its CSS, JavaScript, logo and selected center photographs. Ubuntu loads from Google Fonts; partner artwork and Google Maps also require internet access. Original low-quality partner files are excluded.

The original approved homepage is retained in `source/home.html`. Shared page styles, behavior, source content and optimized photographs are in `source/`. Rebuild with:

```sh
node build-site.cjs
```

`site-manifest.json` lists the generated pages. `previews/` contains desktop and mobile review captures.

The available original source supplies content, staff, photographs and destinations. Course fees, future schedules, detailed syllabuses and prerequisites were not invented. The source's event listings lack a year, so activities are presented as community stories rather than future bookings. The main site's verified contact email, `info@titanium-tc.com`, is used consistently.

## Validation

Run `node qa-site.cjs` in this workspace. The browser path is configured for the local Playwright and Microsoft Edge installations. Checks cover all 41 pages at five widths, internal destinations, image decoding, course tools, inquiry drafts, gallery keyboard behavior, mobile navigation and FAQs. `node qa-workspace.cjs` checks the local workspace flows and roles.

Local browser checks block external requests because of environment network restrictions. Google Fonts, partner artwork, Maps and the external student portal require a connected browser for live verification.

## Branding and instructor details

Decorative orange dots are removed throughout. The selected navigation link uses primary orange text with no surrounding highlight. Course categories use pale orange rounded pills with primary orange text, and Explore course is a plain orange text link. The navbar CTA and the orange contact panel use white text. Other action links retain a darker Titanium orange. The course emblems are custom illustrations, not official certification logos.

Course cards link to published Titanium staff profiles. Where the source does not assign an instructor to a program, the card says "Meet an instructor"; session assignments should be confirmed with the center. Staff data is maintained in `source/instructors.json`.

The transparent, scalable logo is in `source/media/titanium-logo.svg`; a high-resolution transparent PNG is also provided. [Logo restoration notes and the imagegen prompt](source/logo-restoration.md) document the artwork.

## AI assistant page

Open `assistant.html`, or use **AI assistant** in the navigation. The chat fills the page below the website header, with four compact suggested questions, program and instructor links, copy-reply controls, and a handoff to the center. Conversation history, new-conversation and download controls are removed. The current conversation lasts only until the page is reloaded.

When opened directly, the page is clearly labeled **Course guide preview**. It uses the center's published information to answer common training questions; it is a guided preview, not a live language model.

For live AI, use Node.js 20.6 or newer:

1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY` and `OPENAI_MODEL` to the key and a Responses-compatible model available to your OpenAI project.
3. Run `node --env-file=.env server.cjs`.
4. Open `http://127.0.0.1:4173/assistant.html`.

The page automatically changes to **AI learning assistant** when the server is configured. The key stays on the server. Chat requests include recent conversation context and Titanium's course and instructor information. The server does not log chat content, and the provider request uses `store: false`. Recent messages from the current page session are sent to the provider when live AI is enabled; this page does not save conversation history.

The server serves only the generated HTML pages; source files and environment settings are not public routes. `OPENAI_MODEL`, `HOST` and `PORT` are configurable. Without both AI settings, it serves the functional course-guide preview.

The integration follows [official OpenAI text-generation documentation](https://developers.openai.com/api/docs/guides/text), using the Responses API and collecting text from its output messages. No model is hardcoded.

Run `node qa-chat.cjs` to check guided answers, contextual follow-ups, links, compact full-page layout, keyboard behavior, seven viewport sizes, server validation, provider response parsing, and retry behavior. Provider responses are mocked for that test; a real paid AI request has not been verified in this workspace.

Rebuild with `node build-site.cjs`. Refresh the complete site archive with `python source/package-site.py`.

## Local accounts and admin dashboard (phases one and two)

Open `login.html`. Choose **Student demo**, **Teacher demo**, or **Admin demo** on the sign-in screen. The sample accounts use fictional `@demo.local` emails. These are explicit role previews, not production authentication. Student and Teacher demos return to the main homepage after sign-in; only Admin opens a dashboard. Use **Sign out** to switch role. All records stay in this browser's localStorage, under `titanium-workspace-v1`; the current session uses `titanium-session-v1`. Clearing browser storage resets the prototype. Changes are not shared between computers, browsers, or different origins.

### Implemented

- **Admin:** create, read, edit, delete courses, course categories, vendors, certificates, certificate categories, teachers and users. Manage course instances separately from courses, with date, duration, program days, teacher, capacity, status, private/active flags, currency, price and discount. View authorization metadata. Referenced records cannot be deleted.
- **Accounts:** local signup and login, logout, Student / Teacher / Admin role views. New registrations are Students. Admin-created accounts can have any role. Passwords use salted PBKDF2 hashes in browser storage; access restrictions are a UI simulation and are not server security. Use sample credentials only.
- **Profile completion:** name, phone, profile-photo reference, CV link, college, department, graduation status, company sector, position, seniority, interests and introduction. Optional fields and signup fields are provisional until final KYC requirements are provided. No identity-document checks or upload service.
- **Students:** save/unsave courses, request a specific open course instance, see joined, pending, rejected and saved courses, and read rejection reasons. Duplicate requests and requests to full/private/inactive instances are blocked. No payment flow.
- **Enrollment review:** admin approval/rejection with a required reason on rejection. Approval checks capacity and availability. The resulting decision appears in the student's My courses screen and the teacher's approved roster.
- **Teachers:** same main-site account experience as Students for now, including profile completion, favorites and enrollment requests. Professional profiles remain linked to Teacher role users and can be assigned to cohorts by Admin. The standalone teaching page is retained for reviewing assigned cohorts; there is no teacher dashboard.
- **Public catalog:** local course additions, title/description/category changes and active states appear on reload. Links open the regular course-instances page; saved courses share the same storage. Original editorial program pages remain static, with an added link to local availability.
- **AI assistant:** the existing chat page remains available from every workspace. The local guided preview works without a provider; live AI is optional and uses the separately documented server settings.

### Demo recommendations and planned notifications

Recommendations display three randomly selected active courses with working course links and save controls. The selection stays stable during the browser session. These are sample UI suggestions, not personalized recommendations. The notification modal displays four linked sample updates: approval, pending request, course discovery and profile completion. These are static UI examples, independent of account data. Notification delivery and unread counts are not implemented.

### Data assumptions

Certificate categories, teacher-account links, favorites and enrollment records are inferred local models because their SQL schemas were not provided. Certificate CRUD manages definitions; issuance to individual students is not included. Admin forms currently use English only. Seeded cohort dates, lecture counts, prices, discounts, capacity and instructor assignments are explicitly demonstration values, not live Titanium offers. Admin may replace them locally. URLs for course media, vendor/certificate artwork, photo and CV are saved as references; no file-upload or media-hosting service is included.

Every generated page embeds its CSS, JavaScript and seed data. `profile.html`, `saved-courses.html` and `my-courses.html` use the public website header and footer, with no dashboard or sidebar. The notification bell beside the header CTA opens a modal on every page, including mobile. It shows sample notification content for the UI demo. Only `workspace.html#admin` exposes the administration dashboard to Admin accounts. Legacy student/teacher dashboard routes redirect to the homepage. Its editable source is in `source/portal-*`, `source/portal.js`, and `source/portal.css`. Rebuild using `node build-site.cjs` and package using `python source/package-site.py`.

The admin dashboard hides the public navbar and footer. Its sidebar has a fixed title, a Back to website button, an independently scrolling navigation area and a fixed account footer. On mobile, the compact admin header opens a full-height menu with the same independent link scrolling.

Admin overview shows open-cohort capacity and pending enrollment counts instead of course suggestions. Form inputs, selects and textareas have no focus outline. Every modal supports outside-click dismissal, and delete confirmations use a filled red button.

Admin View dialogs display bordered data cells directly inside a single modal surface, in two columns on desktop with full-width descriptions and one column on mobile. The record title appears only in the modal header. The full admin user profile page uses the same data-grid styling.

The supplied Modal and Folder Tree components from `custom-ui-components/components/` are adapted to dependency-free native HTML, CSS and JavaScript in `source/modal-ui.*` and `source/folder-tree.*`. Modal chrome matches the source header, scrollable body, fixed footer, close control and restrained open animation. Read-only details are a grid directly inside the modal, with no nested card surface. Courses groups All courses, Course instances, Course categories and Course vendors; Certificates groups All certificates and Certificate categories. Other admin sections remain independent. Folder children are loaded on expansion and cached locally; expanded folders persist during the browser session.

Edit dialogs are 820px wide on desktop and fit the viewport on mobile. Admin sidebar uses consistent icons for primary navigation and account actions, with text-only child links; AI assistant and Notifications links are excluded from this sidebar.

Search inputs use the supplied Search Box component adapted to native HTML: rounded pill styling, leading search glyph, a clear action and Ctrl+K / Cmd+K shortcut hint. The shortcut focuses and selects the current page search; Escape clears it. Dynamically rendered admin search fields use the same behavior. Focus outlines remain disabled as requested.

The latest admin sidebar follows the supplied expanded/icon-rail reference: profile at the top, icons on primary navigation and account actions, connected submenu lines and a bottom website/sign-out area. The desktop collapse control saves its state for the browser session. Compact mode provides hover/focus labels and folder flyouts with working navigation. The fixed heading and independently scrolling links remain; mobile uses the full-width menu.

Primary sidebar rows have a 6px gap and child rows have separate vertical margins so adjacent backgrounds do not touch. Compact tooltips and flyouts sit clear of the rail edge.
