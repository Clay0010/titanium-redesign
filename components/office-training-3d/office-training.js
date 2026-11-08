// Reusable <office-training> element. URLs resolve relative to this module.
// The scene starts locked so page scrolling is never captured; clicking it turns on rotate and zoom.
const base = new URL('.', import.meta.url);
const runtime = new URL('model-viewer.min.js', base).href;
let runtimePromise;
function loadRuntime() {
  if (customElements.get('model-viewer')) return Promise.resolve();
  if (!runtimePromise) runtimePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = runtime;
    script.onload = () => customElements.whenDefined('model-viewer').then(resolve);
    script.onerror = () => { script.remove(); runtimePromise = null; reject(new Error('Viewer unavailable')); };
    document.head.append(script);
  });
  return runtimePromise;
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

class OfficeTraining extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({mode: 'open'});
    root.innerHTML = `
      <style>
        :host { display:block; width:100%; aspect-ratio:1; min-height:280px; color:inherit; }
        * { box-sizing:border-box; }
        .stage { position:relative; width:100%; height:100%; overflow:hidden; }
        model-viewer { width:100%; height:100%; background:transparent; --progress-bar-color:#e86432; opacity:0; transition:opacity .18s ease; }
        model-viewer.ready { opacity:1; }
        .fallback { position:absolute; inset:0; display:grid; place-items:center; }
        .fallback img { width:100%; height:100%; object-fit:contain; }
        .fallback span { position:absolute; bottom:18px; max-width:90%; background:#fff; color:#30363b;
          padding:9px 14px; border-radius:20px; font:13px/1.5 system-ui,sans-serif; text-align:center; }

        /* Locked: a full-size button invites the visitor in. */
        .activate { position:absolute; inset:0; width:100%; height:100%; border:0; padding:0; margin:0;
          background:transparent; cursor:pointer; font:inherit; color:inherit; border-radius:24px; }
        .activate:focus-visible { outline:3px solid #ff8a00; outline-offset:-3px; }
        .invite { position:absolute; left:50%; bottom:20px; transform:translateX(-50%); display:inline-flex; align-items:center; gap:10px;
          padding:10px 18px 10px 12px; border-radius:999px; background:#fff; color:#2b2f31; border:1px solid #e6e2d8;
          box-shadow:0 6px 18px #2a1d0b1a, 0 1px 3px #2a1d0b12; font:500 14px/1.2 'Ubuntu',system-ui,sans-serif; white-space:nowrap;
          transition:transform .2s ease, background .2s ease, color .2s ease, box-shadow .2s ease; }
        .invite .icon { width:30px; height:30px; border-radius:50%; display:grid; place-items:center; background:#fff0dd; color:#c26100; transition:background .2s, color .2s; }
        .invite svg { width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .activate:hover .invite, .activate:focus-visible .invite { background:#ff8a00; color:#fff; border-color:#ff8a00; transform:translateX(-50%) translateY(-2px); box-shadow:0 10px 24px #a34e0033; }
        .activate:hover .invite .icon, .activate:focus-visible .invite .icon { background:#ffffff33; color:#fff; }
        .invite .touch { display:none; }
        @media (hover:none) { .invite .mouse { display:none; } .invite .touch { display:inline; } }
        .invite .pulse { position:absolute; inset:-1px; border-radius:inherit; border:2px solid #ff8a00; opacity:0; animation:pulse 2.4s ease-out 1s 3; pointer-events:none; }
        @keyframes pulse { 0% { opacity:.55; transform:scale(1); } 100% { opacity:0; transform:scale(1.18,1.45); } }

        /* Active: controls appear, with a short hint and an exit button. */
        .controls { position:absolute; bottom:12px; right:12px; display:flex; gap:6px; }
        .exit { position:absolute; top:12px; right:12px; display:inline-flex; align-items:center; gap:6px; height:36px; padding:0 14px 0 10px;
          border:1px solid #d8dde0; border-radius:999px; background:#fff; color:#30363b; cursor:pointer;
          font:500 13px/1 'Ubuntu',system-ui,sans-serif; box-shadow:0 2px 8px #0000000a; }
        .exit svg { width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; }
        .controls button { border:1px solid #d8dde0; border-radius:50%; width:38px; height:38px; background:#fff;
          color:#30363b; cursor:pointer; font:20px system-ui,sans-serif; box-shadow:0 2px 8px #0000000a; }
        .controls button:hover, .exit:hover { background:#fff0dd; border-color:#f2d8b8; color:#a84f00; }
        button:focus-visible { outline:3px solid #e86432; outline-offset:3px; }
        .hint { position:absolute; left:50%; bottom:20px; transform:translateX(-50%); padding:8px 14px; border-radius:999px;
          background:#25282aE6; color:#fff; font:13px/1.3 'Ubuntu',system-ui,sans-serif; white-space:nowrap; pointer-events:none;
          opacity:0; transition:opacity .3s ease; }
        .hint.show { opacity:1; }
        .stage.active model-viewer { cursor:grab; }
        .stage.active model-viewer:active { cursor:grabbing; }

        [hidden] { display:none!important; }
        .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
        @media (prefers-reduced-motion:reduce) {
          model-viewer, .invite, .invite .icon, .hint { transition:none; }
          .invite .pulse { animation:none; }
        }
        @media (max-width:480px) { .invite { font-size:13px; padding:8px 15px 8px 10px; } .invite .icon { width:26px; height:26px; } }
      </style>
      <div class="stage">
        <div class="fallback"><img alt="Reference illustration of an office training session">
          <span>Loading 3D scene…</span></div>
        <button class="activate" type="button" hidden aria-label="Explore the 3D classroom. Turns on rotate and zoom.">
          <span class="invite"><span class="pulse"></span><span class="icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 1-9 9m-9-9a9 9 0 0 1 9-9"/><path d="m16 21-4 0 0-4M8 3l4 0 0 4"/><path d="M12 8.5 15 10v4l-3 1.5L9 14v-4Z"/><path d="M9 10l3 1.5L15 10M12 11.5v4"/></svg></span><span class="mouse">Click to explore in 3D</span><span class="touch">Tap to explore in 3D</span></span>
        </button>
        <button class="exit" type="button" hidden aria-label="Exit 3D controls"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>Done</button>
        <div class="controls" hidden>
          <button type="button" data-action="in" aria-label="Zoom in">+</button>
          <button type="button" data-action="out" aria-label="Zoom out">−</button>
          <button type="button" data-action="reset" aria-label="Reset view">↺</button>
        </div>
        <div class="hint" aria-hidden="true"></div>
        <span class="sr" role="status" aria-live="polite"></span>
      </div>`;
    root.querySelector('img').src = new URL('office-training-poster.png', base).href;
    root.querySelector('img').alt = 'Rendered 3D office training scene';
    root.querySelector('img').hidden = true;
    this._observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        this._observer.disconnect();
        this.load();
      }
    }, {rootMargin:'200px'});
    this._observer.observe(this);
  }
  disconnectedCallback() {
    this._observer?.disconnect();
    this._visibility?.disconnect();
    clearTimeout(this._hintTimer);
  }
  async load() {
    const root = this.shadowRoot;
    const stage = root.querySelector('.stage');
    const activate = root.querySelector('.activate');
    const exit = root.querySelector('.exit');
    const controls = root.querySelector('.controls');
    const hint = root.querySelector('.hint');
    const live = root.querySelector('[role=status]');
    const status = text => {
      root.querySelector('img').hidden = false;
      root.querySelector('.fallback span').textContent = text;
      live.textContent = text;
    };
    try {
      const src = new URL(this.getAttribute('src') || 'office-training.glb',
        this.hasAttribute('src') ? document.baseURI : base).href;
      // Check before downloading the viewer runtime while the asset is being built.
      const response = await fetch(src, {method:'HEAD'});
      if (!response.ok) {
        status(response.status === 404 ? '3D model awaiting Blender export. Reference shown.' : '3D model unavailable.');
        return;
      }
      await loadRuntime();
      const viewer = document.createElement('model-viewer');
      const homeOrbit = this.getAttribute('camera-orbit') || '38deg 58deg 110%';
      const attrs = {
        src, alt:'Interactive 3D office training scene.',
        'disable-pan':'', 'touch-action':'pan-y',
        'camera-orbit':homeOrbit, 'field-of-view':'30deg',
        'min-camera-orbit':'auto 25deg 65%', 'max-camera-orbit':'auto 85deg 180%',
        'min-field-of-view':'30deg', 'max-field-of-view':'30deg',
        'shadow-intensity':'0.65', 'shadow-softness':'1', exposure:'1',
        'interaction-prompt':'none', loading:'eager', tabindex:'-1'
      };
      for (const [k,v] of Object.entries(attrs)) viewer.setAttribute(k,v);
      const progress = document.createElement('span');
      progress.slot = 'progress-bar';
      progress.hidden = true;
      viewer.append(progress);

      const touchDevice = matchMedia('(hover:none)').matches;
      const showHint = text => {
        clearTimeout(this._hintTimer);
        hint.textContent = text;
        hint.classList.add('show');
        this._hintTimer = setTimeout(() => hint.classList.remove('show'), 3200);
      };
      let active = false;
      const setActive = (on, {focus = false} = {}) => {
        if (on === active) return;
        active = on;
        // Without camera-controls, model-viewer ignores the wheel and pointer, so the page scrolls normally.
        viewer.toggleAttribute('camera-controls', on);
        stage.classList.toggle('active', on);
        activate.hidden = on;
        exit.hidden = !on;
        controls.hidden = !on;
        if (on) {
          showHint(touchDevice ? 'Drag to rotate · Pinch to zoom' : 'Drag to rotate · Scroll to zoom');
          live.textContent = '3D controls on. Drag to rotate; scroll or pinch to zoom. Press Escape or Done to exit.';
          if (focus) exit.focus();
        } else {
          clearTimeout(this._hintTimer);
          hint.classList.remove('show');
          // Ease back to the composed homepage view.
          viewer.cameraOrbit = homeOrbit;
          live.textContent = '3D controls off.';
          if (focus) activate.focus();
        }
      };

      viewer.addEventListener('load', () => {
        viewer.jumpCameraToGoal();
        requestAnimationFrame(() => requestAnimationFrame(() => viewer.classList.add('ready')));
        root.querySelector('.fallback').hidden = true;
        activate.hidden = false;
        // A gentle one-time sway shows that the scene is three-dimensional.
        if (!reducedMotion()) setTimeout(() => {
          if (active) return;
          const [theta, ...rest] = homeOrbit.split(/\s+/);
          const deg = parseFloat(theta);
          if (Number.isNaN(deg)) return;
          viewer.cameraOrbit = [`${deg + 12}deg`, ...rest].join(' ');
          setTimeout(() => { if (!active) viewer.cameraOrbit = homeOrbit; }, 900);
        }, 700);
      }, {once:true});
      viewer.addEventListener('error', () => {
        root.querySelector('.fallback').hidden = false;
        activate.hidden = true;
        setActive(false);
        status('Unable to display 3D. Reference shown.');
      });

      activate.addEventListener('click', () => setActive(true, {focus:true}));
      exit.addEventListener('click', () => setActive(false, {focus:true}));
      // Lock again when the mouse leaves, on Escape, when focus moves away, or when scrolled out of view.
      this.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setActive(false); });
      this.addEventListener('keydown', e => { if (e.key === 'Escape' && active) { e.preventDefault(); setActive(false, {focus:true}); } });
      root.addEventListener('focusout', e => {
        if (active && e.relatedTarget && !root.contains(e.relatedTarget)) setActive(false);
      });
      this._visibility = new IntersectionObserver(entries => {
        if (entries.some(e => !e.isIntersecting)) setActive(false);
      }, {threshold:0});
      this._visibility.observe(this);

      stage.prepend(viewer);
      controls.addEventListener('click', event => {
        const action = event.target.closest('button')?.dataset.action;
        if (!action) return;
        if (action === 'reset') viewer.cameraOrbit = homeOrbit;
        else {
          const orbit = viewer.getCameraOrbit();
          // Radius limits remain enforced by model-viewer.
          viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${orbit.radius * (action === 'in' ? .85 : 1.18)}m`;
        }
      });
    } catch {
      status('Unable to load 3D. Serve this page over HTTP and check your connection.');
    }
  }
}
if (!customElements.get('office-training')) customElements.define('office-training', OfficeTraining);
