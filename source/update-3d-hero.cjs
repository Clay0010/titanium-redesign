// Sync the reusable classroom hero into the homepage and editable build source.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const markup = `        <div class="hero-visual skill-universe" aria-label="Interactive Titanium classroom">
          <office-training class="hero-classroom" camera-orbit="38deg 58deg 95%"></office-training>
          <script type="module" src="./components/office-training-3d/office-training.js"></script>
        </div>`;
const css = `.hero{padding-top:2px;padding-bottom:40px}
.hero-visual.skill-universe{position:relative;isolation:isolate;width:100%;max-width:100%;height:560px;min-height:500px;padding:0;border-radius:0;background:transparent;overflow:visible;border:0;box-shadow:none}
.skill-universe .universe-top{position:absolute;top:25px;left:27px;right:27px;display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#686b60;pointer-events:none;z-index:1}
.universe-top span:last-child{display:flex;align-items:center;gap:6px;letter-spacing:1px;white-space:nowrap}.universe-top i{width:6px;height:6px;border-radius:50%;background:#ff8a00;box-shadow:0 0 0 4px #ff8a0019}
.skill-universe office-training.hero-classroom{position:absolute;inset:0;width:100%;height:100%;min-height:0;aspect-ratio:auto}
.universe-bottom{position:absolute;bottom:23px;left:27px;right:27px;display:flex;align-items:flex-end;justify-content:space-between;gap:15px;pointer-events:none}.universe-bottom strong{display:block;font-weight:500;font-size:20px;letter-spacing:-.7px;line-height:1.2}.universe-bottom p{font-size:10px;margin-top:6px;color:#787b6e}.universe-bottom>span{font-size:9px;letter-spacing:2px;color:#8d8f80;writing-mode:vertical-rl;transform:rotate(180deg)}
@media(min-width:901px){.hero .hero-grid{grid-template-columns:minmax(0,.95fr) minmax(0,1.1fr);gap:10px}.hero-copy{min-width:0;position:relative;z-index:1}.hero-visual.skill-universe{min-width:0;height:600px;width:calc(100% + 60px);max-width:none;margin-left:-60px}}
@media(min-width:1440px){.hero-visual.skill-universe{height:620px;min-height:580px}}
@media(max-width:900px){.hero-grid{grid-template-columns:1fr;gap:40px}.hero-visual.skill-universe{max-width:580px;margin-inline:auto}.hero-copy{max-width:620px}}
@media(max-width:420px){.hero-visual.skill-universe{height:400px;min-height:370px}}
`;
for (const file of ['source/home.html', 'index.html']) {
  const full = path.join(root, file);
  const input = fs.readFileSync(full, 'utf8');
  if (!input.includes('class="hero-visual skill-universe"')) throw Error('Missing hero in '+file);
  const output = input.replace(/        <div class="hero-visual skill-universe"[\s\S]*?\n        <\/div>/, () => markup)
    .replace(/<style id="skill-universe-styles">[\s\S]*?<\/style>/, () => `<style id="skill-universe-styles">\n${css}</style>`);
  fs.writeFileSync(full, output);
}
fs.writeFileSync(path.join(__dirname, 'hero-visual.html'), markup+'\n');
fs.writeFileSync(path.join(__dirname, 'hero-visual.css'), css);
console.log('Updated homepage, build source and hero partials.');
