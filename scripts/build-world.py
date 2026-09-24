"""Reproducible original Blender diorama. Run: blender -b --python scripts/build-world.py.
All geometry is authored here; the earlier 2D images are visual references only.
Object pivots form an articulated rig exported with the GLB for runtime animation.
"""
import bpy, math, random, os
from mathutils import Vector
random.seed(23)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'public','assets','3d')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,hex,emission=0):
    srgb=tuple(int(hex[i:i+2],16)/255 for i in (0,2,4))
    rgb=tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in srgb)
    m=bpy.data.materials.new(name); m.diffuse_color=(*rgb,1); m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'); p.inputs['Base Color'].default_value=(*rgb,1); p.inputs['Roughness'].default_value=.86
    if emission: p.inputs['Emission Color'].default_value=(*rgb,1); p.inputs['Emission Strength'].default_value=emission
    return m
stone=[mat('Limestone_%02d'%i,h) for i,h in enumerate(['667577','758180','82908a','717f7d','8b9488','697574'])]
floor=[mat('Paving_%02d'%i,h) for i,h in enumerate(['8f9381','9c9d88','a9aa92','858e82','b0ac94','969e8a'])]
mortar=mat('Deep mortar','394c4b'); edge=mat('Foundation','314748'); trim=mat('Carved sandstone','c5b68f')
wood=mat('Honey oak','95643d'); lightwood=mat('Oak end grain','b88750'); darkwood=mat('Oak grooves','533b2c'); iron=mat('Forged iron','37484a'); gold=mat('Old brass','caa458')
wine=mat('Burgundy velvet','934d49'); wine2=mat('Velvet folds','b26051'); paper=mat('Parchment','ebd6a0'); ink=mat('Faded ink','656953'); blue=mat('Teal book','396a6b'); wax=mat('Beeswax','f1d597'); glow=mat('Candle glow','ffd276',2)
def empty(name,loc=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o); o.location=loc; o.parent=parent; return o
room=empty('CustodianRoom')
def finish(o,name,material,parent):
    o.name=name
    if material:o.data.materials.append(material)
    o.parent=parent
    return o
def box(name,loc,size,material,parent=None,bevel=.035):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.scale=size; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Soft carved edges','BEVEL');mod.width=bevel;mod.segments=2
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return finish(o,name,material,parent)
def sphere(name,loc,size,material,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=1,location=loc);o=bpy.context.object;o.scale=size
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,name,material,parent)
def cyl(name,loc,r,depth,material,parent=None,r2=None):
    bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=r,radius2=r if r2 is None else r2,depth=depth,location=loc)
    return finish(bpy.context.object,name,material,parent)
def beam(name,a,b,r,material,parent):
    a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,r,(b-a).length,material,parent);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def torus(name,loc,r,thick,material,parent=None,rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=20,minor_segments=6,location=loc,major_radius=r,minor_radius=thick,rotation=rot)
    return finish(bpy.context.object,name,material,parent)
# 8 x 8 playable floor. Blender -Y corresponds to browser +Z.
box('Floating stone plinth',(0,0,-.25),(8.5,8.5,.45),edge,room,.10)
box('Foundation inlay',(0,0,-.06),(8.28,8.28,.09),trim,room,.025)
for row in range(10):
    for col in range(10):
        x=-3.6+col*.8;y=-3.6+row*.8
        o=box('Paving', (x,y,.008+random.uniform(-.012,.006)),(.777,.777,.12),random.choice(floor),room,.045)
        o.rotation_euler.z=random.uniform(-.01,.01)
# Rear walls with doorway gap, mortar backing split around doorway.
doorX=-.56
for x,w in [(-2.72,2.56),(2.04,4.0)]:box('Rear wall core',(x,4.06,1.65),(w,.24,3.3),mortar,room)
box('Door lintel core',(doorX,4.06,2.98),(1.8,.24,.66),mortar,room)
box('West wall core',(-4.06,0,1.65),(.24,8.28,3.3),mortar,room)
for row in range(8):
    z=.22+row*.405
    for col in range(11):
        a=-4.25+col*.81+(row%2)*.405
        if a< -3.95 or a>3.95:continue
        if not (abs(a-doorX)<1.02 and z<2.6):box('Rear ashlar',(a,3.98,z),(.785,.30,.382),random.choice(stone),room,.045)
        box('West ashlar',(-3.98,a,z),(.30,.785,.382),random.choice(stone),room,.045)
for a in range(10):
    t=-3.6+a*.8
    box('Coping rear',(t,4.0,3.34),(.79,.45,.16),trim,room)
    box('Coping west',(-4.0,t,3.34),(.45,.79,.16),trim,room)
# Door jamb and arched crown. Actual animated leaf, hinged at its left edge.
for side in [-1,1]:
    for j in range(6):box('Door dressed jamb',(doorX+side*.83,3.77,.22+j*.40),(.28,.48,.39),trim,room)
for i in range(9):
    a=i*math.pi/8; o=box('Arch voussoir',(doorX+math.cos(a)*.82,3.77,2.20+math.sin(a)*.60),(.30,.48,.32),trim,room);o.rotation_euler.y=-(a-math.pi/2)
box('Door darkness',(doorX,4.08,1.24),(1.4,.08,2.45),edge,room)
door=empty('DoorHinge',(doorX-.67,3.68,.07),room)
for i in range(6):box('Door plank',(.112+i*.224,0,1.12),(.217,.12,2.24),wood if i%2 else lightwood,door,.025)
for h in [.38,1.75]:
    box('Door iron strap',(.67,-.08,h),(1.27,.055,.095),iron,door,.018)
    for x in [.1,.32,1.02,1.24]:sphere('Iron rivet',(x,-.117,h),(.022,.015,.022),gold,door)
box('Lock plate',(1.08,-.086,.95),(.15,.05,.27),iron,door)
torus('Door ring',(1.08,-.15,.95),.074,.016,gold,door,(math.pi/2,0,0))
box('Doorstep',(doorX,3.6,.095),(1.65,.76,.16),trim,room)
# Window on west wall: luminous panes, timber frame, gathered cloth.
window=empty('Window',(-3.77,-.15,1.8),room)
box('Window recess',(0,0,0),(.12,2.1,2.35),darkwood,window)
for i in [-1,1]:
    for j in [-1,1]:box('Warm glass',(.075,i*.46,j*.51),(.035,.84,.94),glow,window,.02)
for y in [-1.08,0,1.08]:box('Window mullion',(.13,y,0),(.13,.09,2.5),wood,window)
for z in [-1.23,0,1.23]:box('Window transom',(.13,0,z),(.13,2.22,.09),wood,window)
box('Window sill',(.2,0,-1.27),(.6,2.45,.15),trim,window)
for side in [-1,1]:
    for f in range(4):
        y=side*(1.04+f*.12);o=sphere('Velvet drape',(.22,y,-.04),(.12,.16,1.32),wine if f%2 else wine2,window);o.rotation_euler.x=side*.055
    sphere('Curtain tie',(.35,side*1.23,-.25),(.11,.29,.075),gold,window)
beam('Curtain rail',(.16,-1.58,1.36),(.16,1.58,1.36),.07,gold,window)
# Framed heraldic textile; geometric appliqué instead of texture.
def banner(name,x,width,basecolor):
    g=empty(name,(x,3.73,2.0),room)
    box('Gilded frame',(0,0,0),(width,.10,1.70),wood,g)
    box('Golden mat',(0,-.065,0),(width-.09,.04,1.59),gold,g)
    box('Woven textile',(0,-.10,0),(width-.2,.035,1.46),basecolor,g)
    o=box('Heraldic diamond',(0,-.14,.12),(.39,.03,.62),paper,g);o.rotation_euler.y=math.pi/4
    beam('Embroidered stem',(0,-.17,-.56),(0,-.17,.57),.025,gold,g)
    for side in [-1,1]:
        for h in [-.2,.05,.3]:
            o=sphere('Embroidered leaf',(side*.14,-.18,h),(.16,.022,.057),gold,g);o.rotation_euler.y=side*.55
banner('Custodian tapestry',2.76,1.16,wine)
banner('Small tapestry',-2.63,.86,blue)
# Central oak table corresponds exactly to navigation footprint.
table=empty('Table',(.44,0,0),room)
for x in [-.87,.87]:
    for y in [-.57,.57]:
        box('Turned table leg',(x,y,.49),(.15,.15,.96),darkwood,table)
        cyl('Leg collar',(x,y,.69),.12,.11,wood,table)
for i in range(5):box('Table top plank',(0,-.56+i*.28,1.05),(2.0,.271,.16),wood if i%2 else lightwood,table,.035)
for y in [-.58,.58]:box('Table apron',(0,y,.87),(1.93,.09,.22),wood,table)
for x in [-.89,.89]:box('Table side apron',(x,0,.87),(.09,1.25,.22),wood,table)
for i in range(10):
    y=random.uniform(-.58,.58);x=random.uniform(-.6,.6)
    box('Oak grain',(x,y,1.135),(random.uniform(.14,.5),.008,.003),darkwood,table,.002)
sheet=box('Letter',(-.42,.16,1.144),(.63,.47,.014),paper,table,.006);sheet.rotation_euler.z=.12
for i in range(4):box('Handwriting',(-.44,.02+i*.075,1.157),(.39-i*.025,.014,.003),ink,table,.002)
cyl('Wax seal',(-.19,-.01,1.161),.056,.014,wine,table)
key=empty('BrassKey',(.45,-.22,1.17),table)
torus('Key bow',(0,0,0),.092,.023,gold,key)
beam('Key shaft',(.075,0,0),(.33,0,0),.02,gold,key)
for x in [.24,.32]:box('Key tooth',(x,-.04,0),(.035,.095,.04),gold,key,.005)
cyl('Mug',(.65,.37,1.25),.105,.23,wood,table);cyl('Mug drink',(.65,.37,1.37),.086,.005,darkwood,table)
torus('Mug handle',(.78,.37,1.27),.08,.018,gold,table,(math.pi/2,0,0))
# Chest: rounded planked lid, straps, hinges and clasp.
chest=empty('Chest',(-.4,-2.32,0),room)
box('Chest body',(0,0,.31),(1.20,.87,.54),wood,chest,.05)
for i in range(5):box('Chest front plank',(-.48+i*.24,-.446,.32),(.232,.03,.46),lightwood if i%2 else wood,chest,.009)
lid=empty('ChestLid',(0,.43,.57),chest)
for i in range(9):
    a=(i+.5)*math.pi/9;y=-.43+math.cos(a)*.43;z=math.sin(a)*.25
    o=box('Curved lid plank',(0,y,z),(1.22,.16,.065),wood if i%2 else lightwood,lid,.016);o.rotation_euler.x=-(a-math.pi/2)
for x in [-.43,.43]:
    box('Chest band',(x,-.455,.31),(.09,.035,.54),iron,chest,.012)
    for i in range(13):
        a=(i+.5)*math.pi/13;o=box('Lid band',(x,-.43+math.cos(a)*.451,math.sin(a)*.27),(.092,.115,.033),iron,lid,.009);o.rotation_euler.x=-(a-math.pi/2)
    for z in [.12,.33,.5]:sphere('Chest rivet',(x,-.482,z),(.024,.016,.024),gold,chest)
box('Chest clasp',(0,-.48,.48),(.14,.04,.25),gold,chest,.02)
box('Chest keyhole',(0,-.505,.48),(.04,.015,.07),iron,chest,.01)
# Back desk and cupboard, within collision rectangles.
desk=empty('WritingDesk',(-2.76,2.48,0),room)
box('Desk top',(0,0,.92),(1.9,.9,.14),wood,desk)
for x in [-.82,.82]:
    for y in [-.32,.32]:box('Desk leg',(x,y,.45),(.13,.13,.90),darkwood,desk)
for i in range(3):box('Stacked folio',(-.5,.05,1.05+i*.065),(.49,.40,.055),[blue,paper,wine][i],desk,.012)
cyl('Ink pot',(.38,-.15,1.08),.095,.16,iron,desk)
beam('Quill',(.38,-.15,1.14),(.52,-.1,1.52),.015,paper,desk)
cabinet=empty('Cabinet',(1.4,3.3,0),room)
box('Cupboard body',(0,0,.48),(1.12,1.1,.90),darkwood,cabinet)
for x in [-.275,.275]:
    box('Cupboard panel',(x,-.56,.48),(.50,.08,.74),wood,cabinet)
    box('Panel inset',(x,-.61,.48),(.37,.04,.56),lightwood,cabinet)
    sphere('Cupboard knob',(x*.25,-.65,.5),(.035,.045,.035),gold,cabinet)
box('Cupboard cornice',(0,0,.99),(1.21,1.19,.13),wood,cabinet)
# Candles and plants occupy existing navigation obstacles.
def candles(name,x,y,z=0,tall=True):
    g=empty(name,(x,y,z),room);h=1.30 if tall else .24
    cyl('Candlestick base',(0,0,.07),.19,.10,gold,g)
    cyl('Candlestick shaft',(0,0,h/2),.045,h,gold,g)
    for side in [-1,0,1]:
        dx=side*.20;ch=h+(.14 if side==0 else 0)
        if side:beam('Candle arm',(0,0,h-.18),(dx,0,h),.026,gold,g)
        cyl('Wax candle',(dx,0,ch+.12),.046,.25,wax,g)
        sphere('Flame',(dx,0,ch+.30),(.035,.03,.083),glow,g)
candles('West candelabrum',-3.25,-3.08)
candles('East candelabrum',3.45,-.43)
candles('Desk candles',-2.25,2.50,.99,False)
candles('Cupboard candles',1.48,3.23,1.06,False)
candles('Rear candlestick',2.60,3.54,0,True)
# Batch static geometry by material to reduce draw calls on the integrated GPU.
dynamic={door,lid,key}
def animated_parent(o):
    while o:
        if o in dynamic:return True
        o=o.parent
    return False
static=[o for o in bpy.context.scene.objects if o.type=='MESH' and not animated_parent(o)]
for material in list(bpy.data.materials):
    items=[o for o in bpy.context.scene.objects if o.type=='MESH' and not animated_parent(o) and o.data.materials and o.data.materials[0]==material]
    if not items:continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in items:o.select_set(True)
    bpy.context.view_layer.objects.active=items[0]
    bpy.ops.object.convert(target='MESH');bpy.ops.object.join();bpy.context.object.name='Room_'+material.name
def select_tree(root):
    bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
    for o in root.children_recursive:o.select_set(True)
select_tree(room)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'custodian-room.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False)
# Hero: exaggerated head, soft tunic, articulated joints, chunky boots and satchel.
skin=mat('Peach skin','e8aa78');cheek=mat('Rosy cheeks','d38363');hair=mat('Golden hair','d8a13e');hairlight=mat('Hair highlight','f1c467');hairdark=mat('Hair shadow','ae732d')
green=mat('Moss tunic','62805a');greenlight=mat('Quilt highlights','809468');greendark=mat('Tunic seams','3e5b48');leather=mat('Boot leather','6a4937');leatherlight=mat('Leather edges','967049');pants=mat('Warm trousers','8b7959');white=mat('Eye whites','f3ead2');pupil=mat('Eyes','263d39')
hero=empty('Traveller')
body=empty('Body',(0,0,0),hero)
hips=empty('Hips',(0,0,.65),body)
box('Tunic skirt',(0,0,.05),(.48,.32,.22),green,hips,.085)
torso=empty('Torso',(0,0,.77),body)
sphere('Quilted tunic',(0,0,.14),(.285,.185,.32),green,torso)
for side in [-1,1]:
    for row in range(3):
        o=box('Quilt stitching',(side*.095,-.177,.02+row*.115),(.155,.014,.007),greenlight,torso,.003);o.rotation_euler.y=side*.55
box('Tunic hem',(0,-.002,-.11),(.49,.335,.055),greendark,torso,.02)
box('Belt',(0,-.005,-.03),(.49,.35,.066),leather,torso,.025)
box('Belt buckle',(.04,-.194,-.03),(.095,.03,.085),gold,torso,.016)
box('Buckle inset',(.04,-.213,-.03),(.047,.008,.044),leather,torso,.006)
for z in [.1,.18,.26]:sphere('Tunic button',(0,-.197,z),(.018,.012,.018),gold,torso)
neck=cyl('Neck',(0,0,.40),.081,.16,skin,torso)
head=empty('Head',(0,-.012,.45),torso)
sphere('Face',(0,-.012,.13),(.245,.205,.285),skin,head)
for side in [-1,1]:
    sphere('Ear',(side*.238,-.006,.12),(.073,.052,.105),skin,head)
    sphere('Ear inner',(side*.27,-.045,.12),(.03,.018,.052),cheek,head)
    sphere('Eye white',(side*.092,-.184,.17),(.066,.031,.083),white,head)
    sphere('Iris',(side*.09,-.212,.167),(.032,.015,.044),pupil,head)
    sphere('Eye glint',(side*.09-.007,-.226,.184),(.011,.008,.014),white,head)
    sphere('Cheek',(side*.147,-.169,.04),(.052,.016,.028),cheek,head)
    brow=box('Eyebrow',(side*.098,-.197,.27),(.124,.028,.025),hairdark,head,.012);brow.rotation_euler.y=side*.13
sphere('Button nose',(0,-.217,.075),(.064,.065,.060),skin,head)
beam('Crooked smile',(-.05,-.193,-.026),(.063,-.195,-.015),.009,leather,head)
sphere('Hair cap',(0,.015,.27),(.254,.211,.172),hairdark,head)
for i in range(15):
    a=i*2.399;x=math.cos(a)*random.uniform(.06,.2);y=math.sin(a)*random.uniform(.07,.18)
    o=sphere('Tousled lock',(x,y,.36+random.uniform(-.02,.07)),(.077,.145,.076),hair if i%3 else hairlight,head);o.rotation_euler=(random.uniform(-.5,.5),random.uniform(-.3,.3),a)
for i in range(5):
    o=sphere('Fringe',(-.17+i*.08,-.166,.29+abs(i-2)*.017),(.057,.06,.115),hair if i%2 else hairlight,head);o.rotation_euler.y=-.4
pack=empty('Backpack',(0,.19,.16),torso)
box('Satchel',(0,.065,0),(.39,.23,.44),leather,pack,.085)
box('Satchel flap',(0,.20,.12),(.4,.05,.18),leatherlight,pack,.04)
box('Satchel strap',(0,.231,.05),(.065,.025,.27),darkwood,pack,.01)
box('Satchel buckle',(0,.252,.035),(.1,.02,.075),gold,pack,.012)
roll=cyl('Bedroll',(0,.095,.30),.095,.47,blue,pack);roll.rotation_euler.y=math.pi/2
for side in [-1,1]:
    beam('Shoulder strap',(side*.17,-.155,.37),(side*.17,-.18,.01),.025,leatherlight,torso)
    arm=empty('ArmL' if side<0 else 'ArmR',(side*.28,0,.31),torso)
    sphere('Puffed sleeve',(side*.025,0,-.085),(.109,.11,.16),green,arm)
    fore=empty('ForearmL' if side<0 else 'ForearmR',(side*.03,0,-.22),arm)
    sphere('Forearm',(0,-.014,-.06),(.068,.072,.13),skin,fore)
    sphere('Mitten hand',(0,-.023,-.195),(.074,.067,.089),skin,fore)
    sphere('Thumb',(-side*.055,-.04,-.17),(.034,.038,.057),skin,fore)
    leg=empty('LegL' if side<0 else 'LegR',(side*.13,0,.67),body)
    sphere('Trouser thigh',(0,0,-.145),(.105,.104,.187),pants,leg)
    shin=empty('ShinL' if side<0 else 'ShinR',(0,0,-.29),leg)
    cyl('Boot shaft',(0,0,-.105),.088,.22,leather,shin,r2=.103)
    cyl('Boot cuff',(0,0,-.01),.109,.069,leatherlight,shin)
    boot=empty('FootL' if side<0 else 'FootR',(0,0,-.265),shin)
    box('Boot sole',(0,-.065,-.027),(.195,.32,.067),darkwood,boot,.028)
    sphere('Boot toe',(0,-.077,.035),(.106,.19,.092),leather,boot)
    for z in [-.09,-.16]:box('Boot strap',(0,-.083,z),(.16,.035,.035),leatherlight,shin,.01)
# Author a planted-foot walk using the same solver as the browser.
import runpy
runpy.run_path(os.path.join(ROOT,'scripts','animate-traveller.py'))['animate']()
select_tree(hero)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'traveller.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=True)
# Save the actual editable Blender scene, with camera and lighting for art review.
hero.location=(1.6,-2.8,.07)
bpy.ops.object.camera_add(location=(11,-14,12));camera=bpy.context.object;camera.name='IsometricCamera';camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=13.8;bpy.context.scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(-3,-4,9));bpy.context.object.data.energy=1400;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=7
bpy.context.scene.world.color=(.25,.28,.3)
bpy.context.scene.render.engine='CYCLES';bpy.context.scene.cycles.samples=16
bpy.context.scene.render.resolution_x=1200;bpy.context.scene.render.resolution_y=1000;bpy.context.scene.render.resolution_percentage=100
os.makedirs(os.path.join(ROOT,'art'),exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art','Shadowborn-Cartoon.blend'))
print('SHADOWBORN_ASSETS_OK')
