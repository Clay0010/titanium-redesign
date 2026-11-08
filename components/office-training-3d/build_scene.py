"""Run with Blender: blender --background --python build_scene.py

Creates an editable master, web GLB, transparent poster, and geometry report.
Only clears the scene in this Blender process; does not open or change other files.
"""
import bpy
import bmesh
import math
import json
from pathlib import Path
from mathutils import Vector, Matrix

OUT = Path(__file__).resolve().parent
LOGO = OUT.parent.parent/'source'/'media'/'titanium-logo.svg'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, roughness=.75, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return m

# Slightly lighter Titanium orange #FF9C26, converted to scene-linear RGB.
BRAND_ORANGE = (1.0, ((156 / 255 + .055) / 1.055) ** 2.4,
                ((38 / 255 + .055) / 1.055) ** 2.4)
M = {k: material(k, c, .55 if k.startswith('hair') else .75) for k, c in {
    'floor': BRAND_ORANGE, 'white': (.88,.90,.88),
    'desk': (.075,.09,.085), 'metal': (.13,.15,.15),
    'glass': BRAND_ORANGE, 'blue': (.015,.22,.40),
    'gray': (.25,.29,.32), 'skirt': (.23,.25,.35),
    'skin': (.73,.51,.31), 'hair': (.065,.035,.02),
    'screen': (.025,.40,.65), 'orange': (.96,.25,.07),
    'paper': (.97,.96,.89), 'leaf': (.19,.38,.07),
    'leaf-light': (.40,.57,.12), 'soil': (.065,.04,.025),
    'key': (.31,.36,.38), 'logo': (.0144,.0152,.0137),
    'hair-red': (.485,.0097,.021), 'hair-red-dark': (.262,.0044,.011),
    'hair-black': (.018,.016,.016), 'hair-chestnut': (.16,.065,.028),
    'hair-blonde': (.42,.25,.09)
}.items()}

def finish(o, name, mat):
    o.name = name
    o.data.materials.append(M[mat])
    return o

def box(name, pos, size, mat, bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    o = bpy.context.object
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(o, name, mat)
    if bevel:
        mod = o.modifiers.new('Soft edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def ellipsoid(name, pos, size, mat, segments=12, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=pos)
    o = bpy.context.object
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for p in o.data.polygons:
        p.use_smooth = True
    return finish(o, name, mat)

def simple_face(name, center, radii, forward):
    """Small surface-following features, without a separate face shell."""
    cx,cy,cz=center
    rx,ry,rz=radii
    def surface(dx,dz,offset=.0015):
        depth=ry*math.sqrt(max(0,1-(dx/rx)**2-(dz/rz)**2))
        return (cx+dx,cy+forward*(depth+offset),cz+dz)
    # Curved patches keep eyes and brows flush even when seen in profile.
    def patch(label,dx,dz,w,h,mat):
        verts=[surface(dx,dz)]
        for i in range(16):
            a=i*math.tau/16
            verts.append(surface(dx+math.cos(a)*w,dz+math.sin(a)*h))
        faces=[(0,i+1,(i+1)%16+1) for i in range(16)]
        mesh=bpy.data.meshes.new(name+' '+label)
        mesh.from_pydata(verts,[],faces)
        mesh.update()
        obj=bpy.data.objects.new(name+' '+label,mesh)
        bpy.context.scene.collection.objects.link(obj)
        finish(obj,name+' '+label,mat)
    for side in [-1,1]:
        patch('eye',side*.044,.005,.011,.015,'hair')
        patch('eyebrow',side*.044,.036,.018,.004,'hair')
        ellipsoid(name+' ear',(cx+side*rx*.97,cy,cz-.015),(.022,.022,.035),'skin')
    ellipsoid(name+' nose',surface(0,-.027,0),(.014,.016,.020),'skin')
    points=[surface(q,-.065+.008*(q/.030)**2,.001) for q in [-.030,-.015,0,.015,.030]]
    for a,b in zip(points,points[1:]):
        rod(name+' smile',a,b,.0025,'hair',8)

def rod(name, a, b, radius, mat, vertices=10):
    d = Vector(b)-Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=d.length,
                                      location=(Vector(a)+Vector(b))/2)
    o = bpy.context.object
    o.rotation_euler = d.to_track_quat('Z','Y').to_euler()
    return finish(o, name, mat)

def smooth(o):
    for p in o.data.polygons:
        p.use_smooth = True
    return o

def limb(name, a, b, r1, r2, mat, vertices=16):
    """Tapered, smooth segment from a to b; joint spheres hide the ends."""
    a, b = Vector(a), Vector(b)
    d = b-a
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r1, radius2=r2,
                                    depth=d.length, location=(a+b)/2)
    o = bpy.context.object
    o.rotation_euler = d.to_track_quat('Z','Y').to_euler()
    finish(o, name, mat)
    # Smooth sides, crisp end caps (no dark shading seams where caps meet the sides).
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(50))
    return o

def joint(name, p, r, mat, segments=14, rings=10):
    return ellipsoid(name, p, (r,r,r), mat, segments, rings)

def frame(forward, up):
    f = Vector(forward).normalized()
    s = f.cross(Vector(up)).normalized()
    return s, f, s.cross(f).normalized()

def oriented_ellipsoid(name, center, radii, basis, mat, segments=14, rings=10):
    o = ellipsoid(name, (0,0,0), radii, mat, segments, rings)
    o.matrix_world = Matrix.Translation(Vector(center)) @ Matrix(basis).transposed().to_4x4()
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return o

def hand(name, wrist, forward, up, thumb_side, pose='rest', k=1.0):
    """Palm, two-segment fingers and a thumb. up = back of the hand."""
    s, f, u = frame(forward, up)
    W = Vector(wrist)
    joint(name+' wrist', W, .029*k, 'skin', 12, 8)
    oriented_ellipsoid(name+' palm', W+f*.045*k, (.041*k,.052*k,.018*k), (s,f,u), 'skin')
    curls = {'rest':[.45,.5,.55,.6], 'relaxed':[.35,.45,.5,.55], 'point':[.05,1.45,1.5,1.55]}[pose]
    for off, curl, length in zip([.027,.009,-.009,-.026], curls, [.036,.040,.038,.030]):
        p = W+f*.089*k+s*(thumb_side*off*k)-u*.003*k
        r, theta = .0105*k, 0
        joint(name+' knuckle', p, r*1.05, 'skin', 7, 5)
        for part in [.56,.44]:
            theta += curl
            q = p+(f*math.cos(theta)-u*math.sin(theta))*length*part*k
            limb(name+' finger', p, q, r, r*.9, 'skin', 8)
            r *= .9
            joint(name+' finger joint', q, r, 'skin', 7, 5)
            p = q
    side_amount, down_amount = (.25, .7) if pose == 'point' else (.55, .45)
    thumb_dir = (f*.55+s*thumb_side*side_amount-u*down_amount).normalized()
    p = W+f*.028*k+s*(thumb_side*.033*k)-u*.006*k
    joint(name+' thumb base', p, .014*k, 'skin', 10, 8)
    for length in [.030,.024]:
        q = p+thumb_dir*length*k
        limb(name+' thumb', p, q, .013*k, .011*k, 'skin', 8)
        joint(name+' thumb joint', q, .011*k, 'skin', 7, 5)
        thumb_dir = (thumb_dir+f*.35-u*.25).normalized()
        p = q

def arm(name, shoulder, elbow, wrist, sleeve, radii, forward, up, thumb_side, pose, k=1.0):
    """Shoulder, upper arm, elbow, tapered forearm, shirt cuff and hand."""
    r_shoulder, r_upper, r_elbow, r_wrist = radii
    joint(name+' shoulder', shoulder, r_shoulder, sleeve, 14, 10)
    limb(name+' upper arm', shoulder, elbow, r_upper, r_elbow, sleeve)
    joint(name+' elbow', elbow, r_elbow, sleeve, 14, 10)
    W, E = Vector(wrist), Vector(elbow)
    d = (W-E).normalized()
    limb(name+' forearm', E, W-d*.03, r_elbow*.97, r_wrist, sleeve)
    limb(name+' cuff', W-d*.034, W-d*.004, r_wrist*1.08, r_wrist*1.05, 'white')
    hand(name, W+d*.004, forward, up, thumb_side, pose, k)

box('Floor platform', (0,0,-.10), (6.6,5.6,.20), 'floor', .035)
# Back window and low cabinets, with opaque glass for inexpensive web rendering.
box('Window pane', (0,2.58,2.02), (5.9,.045,2.45), 'glass')
for x in [-2.96,-1.48,0,1.48,2.96]:
    box('Window mullion', (x,2.54,2.02), (.035,.07,2.5), 'white', .004)
for z in [0.79,3.25]:
    box('Window rail', (0,2.54,z), (5.98,.07,.045), 'white', .004)
for i in range(10):
    box('Blind slat', (0,2.48,3.18+i*.045), (6.0,.13,.018), 'white', .002)
box('Storage cabinet', (1.55,2.10,.52), (2.85,.72,1.04), 'white')
box('Storage worktop', (1.55,2.10,1.065), (2.94,.78,.065), 'desk')
for x in [.15,1.1,2.05,2.98]:
    box('Cabinet seam', (x,1.731,.51), (.012,.008,.95), 'key', 0)
for x in [.57,1.53,2.48]:
    box('Cabinet pull', (x,1.71,.85), (.18,.035,.025), 'metal', .006)

# Presentation board faces the front of the room.
box('Presentation frame', (-2.1,2.33,2.17), (1.65,.09,1.35), 'desk')
box('Presentation surface', (-2.1,2.275,2.17), (1.55,.025,1.25), 'paper', .002)
for i, h in enumerate([.20,.32,.44,.28]):
    box('Chart bar', (-2.62+i*.15,2.253,1.70+h/2), (.09,.012,h),
        'orange' if i == 0 else 'screen', .001)
for i in range(6):
    box('Slide text line', (-1.77,2.25,2.30-i*.11), (.56 if i%3 else .4,.012,.014), 'key', 0)
box('Slide divider', (-2.1,2.252,2.43), (1.3,.008,.008), 'orange', 0)

def titanium_logo(center, width, y):
    """Import the Titanium wordmark SVG and lay it flat on the slide, facing the room."""
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=str(LOGO))
    curves = [o for o in bpy.data.objects if o not in before and o.type == 'CURVE']
    bpy.ops.object.select_all(action='DESELECT')
    for o in curves:
        o.data.resolution_u = 2
        o.data.dimensions = '2D'
        o.data.fill_mode = 'BOTH'
        o.select_set(True)
    bpy.context.view_layer.objects.active = curves[0]
    bpy.ops.object.convert(target='MESH')
    if len(curves) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    pts = [o.matrix_world @ v.co for v in o.data.vertices]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts)))
    scale = width/(hi.x-lo.x)
    mid = (lo+hi)/2
    for v, p in zip(o.data.vertices, pts):
        v.co = Vector((center[0]+(p.x-mid.x)*scale, y, center[1]+(p.y-mid.y)*scale))
    o.matrix_world = Matrix.Identity(4)
    o.data.materials.clear()
    return finish(o, 'Titanium logo', 'logo')

titanium_logo((-2.1,2.61), 1.22, 2.2585)

def laptop(x,y):
    box('Laptop base', (x,y,1.10), (.59,.41,.035), 'white', .012)
    # Screen front points toward negative Y, toward the student.
    box('Laptop screen frame', (x,y+.18,1.32), (.59,.035,.43), 'metal', .01)
    box('Laptop display', (x,y+.158,1.32), (.54,.009,.37), 'screen', .002)
    for row in range(4):
        for col in range(9):
            box('Keyboard key', (x-.23+col*.056,y-.015+row*.035,1.121),
                (.039,.022,.003), 'key', 0)
    box('Trackpad', (x,y-.13,1.121), (.15,.07,.003), 'key', .002)

def chair(x,y):
    box('Chair seat', (x,y,.62), (.57,.57,.13), 'metal', .065)
    box('Chair back', (x,y-.29,1.02), (.57,.13,.65), 'white', .065)
    rod('Chair column', (x,y,.15),(x,y,.58), .055, 'metal')
    for i in range(5):
        a=i*math.tau/5
        tip=(x+.39*math.cos(a),y+.39*math.sin(a),.10)
        rod('Chair foot',(x,y,.19),tip,.025,'metal')
        ellipsoid('Caster',tip,(.055,.055,.065),'metal')
    for side in [-1,1]:
        rod('Armrest upright',(x+side*.32,y,.64),(x+side*.32,y,.86),.024,'metal')
        box('Armrest',(x+side*.32,y+.02,.88),(.08,.34,.06),'metal',.025)


def head_point(C, R, fwd, d, lift=1.0):
    """Point on an ellipsoid head. d is a direction in head space: +x side, +y face, +z up."""
    d = Vector(d).normalized()
    return Vector((C[0]+R[0]*d.x*lift, C[1]+fwd*R[1]*d.y*lift, C[2]+R[2]*d.z*lift))

def head_normal(R, fwd, d):
    d = Vector(d).normalized()
    return Vector((d.x/R[0], fwd*d.y/R[1], d.z/R[2])).normalized()

def hair_shell(name, C, R, fwd, keep, mat, lift=1.055, thickness=.014):
    """Hair cap that hugs the head; keep(x,y,z) decides the hairline in head space."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=22, radius=1)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep(*v.co)], context='VERTS')
    for v in bm.verts:
        v.co = head_point(C, R, fwd, v.co, lift) if v.co.length else v.co
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(o)
    finish(o, name, mat)
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    mod = o.modifiers.new('Hair thickness', 'SOLIDIFY')
    mod.thickness = thickness
    mod.offset = 1
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(60))
    return o

def hair_lock(name, C, R, fwd, d, tangent, length, width, thick, mat, lift=1.1):
    """Soft strand lying on the head surface, running along tangent."""
    n = head_normal(R, fwd, d)
    tv = Vector((tangent[0], fwd*tangent[1], tangent[2]))
    tv = (tv-n*tv.dot(n)).normalized()
    return oriented_ellipsoid(name, head_point(C, R, fwd, d, lift), (width, length/2, thick),
                              frame(tv, n), mat, 16, 10)

def hanging_lock(name, top, bottom, outward, width, thick, mat):
    """Strand falling from the head, e.g. long hair over the shoulders."""
    top, bottom = Vector(top), Vector(bottom)
    return oriented_ellipsoid(name, (top+bottom)/2, (width, (bottom-top).length/2, thick),
                              frame(bottom-top, outward), mat, 16, 10)

def student_hair(C, R, style, mat):
    """Four short styles so the students read as different people."""
    hairline = {0: .38, 1: .45, 2: .30, 3: .25}[style]
    def keep(x, y, z):
        if y > .35:
            return z > hairline
        if y > -.35:
            return z > -.02
        return z > -.45
    hair_shell('Student hair', C, R, 1, keep, mat)
    if style == 0:
        # Side part: strands sweep from the part line across the crown and down the far side.
        for i, fy in enumerate([.55, .25, -.05, -.35]):
            hair_lock('Student swept hair', C, R, 1, (-.05, fy, .85), (-1, .15, -.2), .17, .045, .02, mat)
            hair_lock('Student swept hair', C, R, 1, (-.55, fy*.9, .62), (-.4, .1, -1), .12, .04, .018, mat)
        hair_lock('Student part side', C, R, 1, (.45, .3, .8), (.2, 1, .1), .16, .05, .018, mat)
        hair_lock('Student quiff', C, R, 1, (.0, .75, .62), (-1, .3, .2), .16, .045, .024, mat, 1.12)
    elif style == 1:
        # Textured crop: short tufts pointing up and slightly back.
        for i in range(14):
            a = i*2.39996
            r = math.sqrt((i+.5)/14)*.8
            d = Vector((math.cos(a)*r, math.sin(a)*r+.1, 1)).normalized()
            base = head_point(C, R, 1, d, 1.02)
            tip = base+head_normal(R, 1, d)*.06+Vector((0, -.022, .0))
            limb('Student tuft', base, tip, .028, .005, mat, 8)
        hair_lock('Student fringe', C, R, 1, (0, .7, .6), (1, 0, 0), .17, .04, .02, mat)
    elif style == 2:
        # Curly: small round curls over the crown and back.
        for i in range(34):
            z = 1-(i+.5)/34*1.25
            rr = math.sqrt(max(0, 1-z*z))
            a = i*2.39996
            d = Vector((math.cos(a)*rr, math.sin(a)*rr, z))
            if d.z < -.02 or (d.y > .35 and d.z < .32):
                continue
            joint('Student curl', head_point(C, R, 1, d, 1.08), .033, mat, 8, 6)
    else:
        # Short crop with a soft fringe falling forward.
        for dx in [-.45, -.15, .15, .45]:
            hair_lock('Student fringe', C, R, 1, (dx, .78, .42), (.15, .2, -1), .11, .04, .02, mat, 1.08)

def student(x,y,suit,style=0,hair='hair'):
    # Seated figure oriented toward positive Y.
    ellipsoid('Suit torso',(x,y,1.02),(.23,.18,.34),suit)
    rod('Neck',(x,y,1.28),(x,y,1.39),.065,'skin')
    ellipsoid('Head',(x,y+.025,1.52),(.145,.14,.19),'skin',32,24)
    student_hair((x,y+.025,1.52),(.145,.14,.19),style,hair)
    simple_face('Student',(x,y+.025,1.52),(.145,.14,.19),1)
    for side in [-1,1]:
        sx=x+side*.18
        rod('Thigh',(x+side*.11,y,.68),(x+side*.13,y+.35,.65),.092,suit)
        rod('Shin',(x+side*.13,y+.35,.65),(x+side*.13,y+.38,.17),.065,suit)
        ellipsoid('Shoe',(x+side*.13,y+.46,.12),(.085,.17,.07),'metal')
        # Hands rest on the keyboard; thumbs point toward the middle of the body.
        arm('Student arm',(x+side*.165,y,1.21),(x+side*.29,y+.18,.99),(x+side*.17,y+.49,1.155),
            suit,(.068,.064,.056,.045),(-side*.12,1,-.18),(0,0,1),-side,'rest')

for row,y in enumerate([.65,-1.40]):
    for col,x in enumerate([-.45,1.55]):
        box('Desk top',(x,y,1.04),(1.55,.85,.075),'desk')
        for dx in [-.68,.68]:
            box('Desk side',(x+dx,y,.51),(.075,.76,1.0),'white')
        box('Desk modesty panel',(x,y+.34,.72),(1.35,.045,.49),'white')
        laptop(x-.12,y)
        for j in range(2):
            box('Standing binder',(x+.49+j*.09,y+.16,1.22),(.065,.23,.31),
                'orange' if j==0 else 'white',.004)
        chair(x,y-.72)
        student(x,y-.72,'blue' if (row+col)%2==0 else 'gray',row*2+col,
                ['hair','hair-black','hair-chestnut','hair-blonde'][row*2+col])

# Standing presenter, built facing -Y, then turned toward the default browser camera
# so she looks out at the students while pointing at the slide beside her.
x,y=-2.35,1.10
PRESENTER_TURN=math.radians(40)
presenter_before=set(bpy.data.objects)
ellipsoid('Presenter jacket',(x,y,1.23),(.165,.118,.31),'skirt',24,16)
ellipsoid('Presenter waist',(x,y,1.02),(.13,.095,.09),'skirt',20,12)
bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.20,radius2=.135,depth=.40,location=(x,y,.83))
skirt=finish(bpy.context.object,'Presenter skirt','skirt')
skirt.scale=(1,.78,1)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bpy.ops.object.shade_smooth_by_angle(angle=math.radians(50))
rod('Presenter neck',(x,y,1.48),(x,y,1.57),.055,'skin')
ellipsoid('Presenter head',(x,y,1.71),(.135,.13,.18),'skin',32,24)
# Long layered red hair: a fitted cap, a side-swept fringe and strands falling to the shoulders.
HC,HR=(x,y,1.71),(.135,.13,.18)
hair_shell('Presenter hair',HC,HR,-1,lambda hx,hy,hz:hz>-.6 and not (hy>.2 and hz<.48),'hair-red',1.06,.016)
# Side-swept fringe sits low on the forehead, flat against the cap.
for dx,dz in [(.5,.58),(.15,.66),(-.2,.62)]:
    hair_lock('Presenter fringe',HC,HR,-1,(dx,.62,dz),(-1,.2,-.45),.15,.05,.016,'hair-red',1.07)
hair_lock('Presenter fringe',HC,HR,-1,(-.62,.48,.42),(-.25,.25,-1),.16,.045,.018,'hair-red',1.08)
# A smooth back curtain, with overlapping strands on top for texture.
back=Vector((0,1,0))
oriented_ellipsoid('Presenter hair curtain',Vector(HC)+back*.075+Vector((0,0,-.13)),(.155,.27,.07),
                   frame((0,.12,-1),back),'hair-red-dark',20,12)
for i,a in enumerate([-108,-80,-54,-27,0,27,54,80,108]):
    h=Vector((math.sin(math.radians(a)),math.cos(math.radians(a)),0))
    side=abs(a)>95
    top=Vector(HC)+h*.12+Vector((0,0,.07))
    bottom=Vector(HC)+h*(.155 if side else .165)+Vector((0,0,-.22 if side else -.31))
    hanging_lock('Presenter hair strand',top,bottom,h,.075 if not side else .055,.03,'hair-red')
simple_face('Presenter',(x,y,1.71),(.135,.13,.18),-1)
for side in [-1,1]:
    rod('Presenter leg',(x+side*.075,y,.68),(x+side*.075,y-.025,.15),.044,'skin')
    ellipsoid('Presenter shoe',(x+side*.075,y-.08,.09),(.06,.12,.048),'metal')
# Relaxed arm hangs with a slight bend. The pointing arm reaches out and up toward the
# slide (which sits behind her left shoulder once she is turned), elbow gently bent.
arm('Presenter relaxed arm',(x-.145,y,1.40),(x-.20,y-.015,1.17),(x-.215,y-.06,.955),
    'skirt',(.055,.052,.045,.038),(-.04,-.22,-1),(-1,0,0),-1,'relaxed',.95)
arm('Presenter pointing arm',(x+.145,y+.02,1.40),(x+.355,y+.17,1.485),(x+.498,y+.30,1.659),
    'skirt',(.055,.052,.045,.038),(.55,.50,.67),(0,0,1),1,'point',.95)
pivot=Matrix.Translation((x,y,0))
turn=pivot@Matrix.Rotation(PRESENTER_TURN,4,'Z')@pivot.inverted()
for o in set(bpy.data.objects)-presenter_before:
    o.matrix_world=turn@o.matrix_world

# Drawer unit, coffee maker and plant.
box('Drawer pedestal',(-.53,2.07,.62),(.66,.65,1.24),'white')
for z in [.25,.56,.87,1.16]:
    box('Drawer seam',(-.53,1.74,z),(.59,.008,.012),'key',0)
    box('Drawer handle',(-.53,1.72,z-.08),(.16,.025,.024),'metal')
box('Coffee machine',(-.38,2.02,1.48),(.29,.29,.42),'white')
box('Coffee front',(-.38,1.864,1.48),(.23,.025,.24),'metal')
box('Coffee tray',(-.38,1.79,1.28),(.31,.24,.035),'desk')
rod('Coffee cup',(-.38,1.79,1.30),(-.38,1.79,1.39),.045,'paper')
# Pot bottom sits on the right cabinet countertop (top surface Z = 1.0975).
px,py,pz=2.45,2.10,1.0975
rod('Plant pot',(px,py,pz),(px,py,pz+.25),.13,'white',16)
rod('Pot soil',(px,py,pz+.245),(px,py,pz+.255),.115,'soil',16)
for i in range(9):
    angle=i*2.4
    end=(px+math.cos(angle)*.28,py+math.sin(angle)*.24,pz+.51+(i%3)*.12)
    start=(px,py,pz+.24)
    rod('Plant stem',start,end,.009,'leaf',6)
    for t in [.45,.7,1.0]:
        p=Vector(start).lerp(Vector(end),t)
        for sign in [-1,1]:
            leaf=ellipsoid('Plant leaf',p+Vector((sign*.065,0,.025)),(.10,.035,.022),
                           'leaf-light' if i%2 else 'leaf')
            leaf.rotation_euler[2]=angle+sign*.5

scene=bpy.context.scene
scene.world.color=(.65,.65,.65)
scene.render.engine='CYCLES'
scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.render.resolution_x=1200
scene.render.resolution_y=1200
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
def light(name,pos,power,size):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power
    data.shape='DISK'
    data.size=size
    o=bpy.data.objects.new(name,data)
    scene.collection.objects.link(o)
    o.location=pos
    o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
light('Key softbox',(-3,-4,8),1100,5)
light('Fill softbox',(4,1,6),650,4)
bpy.ops.object.camera_add(location=(9,-12,10))
camera=bpy.context.object
camera.name='Isometric reference camera'
camera.rotation_euler=(Vector((0,0,1.25))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=9.6
scene.camera=camera

# Keep the editable scene; join only the exported copy by material to reduce draw calls.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'office-training.blend'))
bpy.ops.object.select_all(action='DESELECT')
originals=[o for o in scene.objects if o.type=='MESH']
copies=[]
for source in originals:
    o=source.copy()
    o.data=source.data.copy()
    scene.collection.objects.link(o)
    copies.append(o)
for mat in M.values():
    group=[o for o in scene.objects if o.type=='MESH' and o not in originals
           and o.data.materials[0]==mat]
    if not group:
        continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in group:
        o.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    bpy.ops.object.join()
    group[0].name='Web '+mat.name
bpy.ops.object.select_all(action='DESELECT')
web=[o for o in scene.objects if o.type=='MESH' and o not in originals]
for o in web:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'office-training.glb'),export_format='GLB',
    use_selection=True,export_animations=False,export_cameras=False,export_lights=False,
    export_yup=True)
triangles=0
for o in web:
    o.data.calc_loop_triangles()
    triangles+=len(o.data.loop_triangles)
report={'triangles':triangles,'meshes':len(web),
        'glb_bytes':(OUT/'office-training.glb').stat().st_size,
        'note':'Browser lighting must be visually checked; lighting is not baked.'}
(OUT/'model-report.json').write_text(json.dumps(report,indent=2))
for o in web:
    bpy.data.objects.remove(o,do_unlink=True)
scene.render.filepath=str(OUT/'office-training-poster.png')
bpy.ops.render.render(write_still=True)
print('OFFICE_SCENE_COMPLETE',json.dumps(report))
