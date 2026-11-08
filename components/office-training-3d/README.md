# Office training 3D

Independent asset and reusable HTML component. No website pages or placement changed.

## Current status

Generated successfully using portable Blender 5.4.0 Alpha in background mode.
The editable `.blend`, exported `.glb`, poster and geometry report are available.
First-pass Blender and browser renders have been visually reviewed. Geometry is
stylized and the layout is an interpretation of the reference, not an exact replica.
Export: 84,708 triangles, 23 material meshes, 3,169,044 bytes (3.17 MB).
Arms have shoulder, elbow and wrist joints, shirt cuffs and five-finger hands; the
presenter points back at the slide. The slide shows the Titanium logo, imported
from `../../source/media/titanium-logo.svg` at build time.

## Generate

From PowerShell, using your installed Blender path (adjust version as needed):

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.4\blender.exe' --background --python '.\build_scene.py'
```

Run from this folder. Outputs are written beside the script regardless of working
directory: `office-training.blend`, `office-training.glb`,
`office-training-poster.png`, `model-report.json`.
The script starts a fresh scene in that process and overwrites only those outputs.
Keep hand edits in a separately named `.blend` before rerunning.

The editable master retains objects. Export geometry is joined by material to reduce
draw calls. No animation, transparent glass, external textures, or light objects are
exported. The first pass uses runtime viewer lighting; baked shading is not yet added.
The orthographic Blender render and browser lighting require separate visual review.
The browser uses a narrow perspective camera to approximate the isometric view.

## Preview

Serve over HTTP; do not open with `file://`. For example, from this folder:

```powershell
python -m http.server 4180 --bind 127.0.0.1
```

Open http://127.0.0.1:4180/ . The viewer runtime is pinned to model-viewer 4.1.0
and hosted locally as `model-viewer.min.js` (downloaded from jsDelivr; its bundled
license notices are retained). The runtime loads only when this component is
near the viewport and the GLB exists. Keep the runtime beside the component when
deploying. The exported model does not require animation or geometry decoders.

## Reuse on any HTML page

Paths below assume a page in `redesign-v2/`:

```html
<script type="module" src="./components/office-training-3d/office-training.js"></script>
<office-training style="max-width:720px;aspect-ratio:1"></office-training>
```

Or embed the isolated viewer:

```html
<iframe src="./components/office-training-3d/index.html"
  title="Interactive office training scene" loading="lazy"
  style="width:100%;height:720px;border:0"></iframe>
```

Multiple component instances are supported. Optional `src` supplies another GLB,
resolved relative to the host page. Default assets resolve relative to the module.
Rotation and zoom are enabled; panning and automatic rotation are disabled.

## Before deployment

Inspect front/back geometry, presenter pose and furniture spacing in Blender, then
verify rotation, zoom, framing and lighting in a browser on desktop and mobile.
Read the generated report for actual triangle count and GLB size; no performance
claim has been measured yet. Reference image rights should follow the project's
existing asset license.

API references: https://modelviewer.dev/docs/ and
https://docs.blender.org/api/current/bpy.ops.export_scene.html .
