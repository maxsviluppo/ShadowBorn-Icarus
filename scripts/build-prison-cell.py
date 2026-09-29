"""Barnaby's cell, reconstructed in metres from the supplied pixel-art reference."""
import bpy,math,random
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];random.seed(17)
bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.92;return m
stone=[mat('Warm limestone '+str(i),(.22+i*.018,.19+i*.014,.135+i*.011)) for i in range(9)]
wood=[mat('Oak '+str(i),(.24+i*.022,.105+i*.012,.043+i*.006)) for i in range(8)]
iron=mat('Old iron',(.075,.073,.065));dark=mat('Crevices',(.095,.065,.037));straw=mat('Straw',(.55,.33,.10));linen=mat('Old linen',(.40,.34,.22));moss=mat('Moss',(.18,.22,.065));bone=mat('Rusty skull',(.34,.135,.065));brass=mat('Brass',(.68,.40,.08));clay=mat('Terracotta',(.45,.19,.07));glass=mat('Pewter',(.25,.25,.23))
def empty(name,pos,target=None,axis=None,angle=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=pos
 if target:o['target']=target
 if axis:o['axis']=[axis[0],axis[2],-axis[1]];o['openAngle']=angle
 return o
def finish(o,name,material,target,parent):
 o.name=name;o.data.materials.append(material)
 if target:o['target']=target
 if parent:o.parent=parent
 return o
def box(name,pos,size,material,target=None,parent=None,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  m=o.modifiers.new('Worn edges','BEVEL');m.width=bevel;m.segments=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
 return finish(o,name,material,target,parent)
def cyl(name,pos,r,depth,material,target=None,parent=None,vertices=12):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=pos);return finish(bpy.context.object,name,material,target,parent)
def ball(name,pos,size,material,target=None,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=1,location=pos);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,material,target,parent)
def rod(name,a,b,r,material,target=None,parent=None):
 a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,r,(b-a).length,material,target,parent,8);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
# Blender XY ground corresponds to runtime X,-Z. Open south/east cutaway.
box('Foundation',(0,0,-.12),(5.6,5.6,.25),dark)
for row in range(18):
 y=-2.64+row*.31
 for col in range(4):
  x=-2.1+col*1.4;box('Floor plank',(x,y,.025),(1.38,.297,.09),random.choice(wood),'floor',bevel=.012)
  for k in range(3):
   xx=x+random.uniform(-.58,.58);box('Grain',(xx,y+random.uniform(-.10,.10),.073),(random.uniform(.15,.42),.008,.002),dark,'floor')
# West wall door at y=-.95, window at y=1.35; rear wall at y=2.8.
for row in range(9):
 z=.19+row*.35
 for col in range(10):
  start=-2.8+col*.62-(row%2)*.31;end=min(start+.62,2.8);start=max(start,-2.8)
  if end-start<.04:continue
  c=(start+end)/2;size=end-start-.02
  # Leave real openings, no invisible wall across either aperture.
  door=(-1.65<c<-.30 and z<2.28)
  window=(.90<c<1.91 and 1.62<z<2.74)
  if not door and not window:box('West stone',(-2.78,c,z),(.28,size,.33),random.choice(stone),'wall',bevel=.045)
  box('Rear stone',(c,2.78,z),(size,.28,.33),random.choice(stone),'wall',bevel=.045)
for i in range(15):
 x=random.uniform(-2.5,2.5);z=random.choice([.5,.85,1.2]);box('Moss seam',(x,2.627,z),(.24,.009,.025),moss,'wall')
# Arched door and frame, on west wall; local panel extends along +Y.
D=empty('DoorHinge',(-2.64,-1.70,.09),'door',[0,0,1],math.radians(90))
for i in range(7):
 y=.095+i*.19;h=1.78+math.sqrt(max(0,.68**2-(y-.665)**2));box('Door oak',(.0,y,h/2),(.10,.181,h),wood[2+i%4],'door',D,bevel=.013)
for z in [.39,1.46]:
 box('Door strap',(.065,.665,z),(.035,1.31,.10),iron,'door',D,bevel=.015)
 for y in [.14,.40,.90,1.18]:ball('Rivet',(.09,y,z),(.028,.025,.025),iron,'door',D)
for y in [-1.79,-.27]:box('Door jamb',(-2.67,y,1.14),(.34,.18,2.28),stone[6],'door',bevel=.025)
for i in range(9):
 a=math.pi*i/8;o=box('Arch stone',(-2.68,-1.03+.77*math.cos(a),1.78+.77*math.sin(a)),(.36,.28,.25),stone[5+i%3],'door',bevel=.025);o.rotation_euler.x=a-math.pi/2
# Skull padlock on the door, independent jaw reserved for later dialogue.
S=empty('TalkingSkull',(.15,.79,1.12),'skull');S.parent=D
ball('Skull',(0,0,0),(.12,.16,.18),bone,'skull',S)
for y in [-.075,.075]:ball('Eye socket',(.108,y,.035),(.025,.054,.054),dark,'skull',S)
ball('Nose',(.119,0,-.05),(.018,.028,.033),dark,'skull',S)
J=empty('SkullJaw',(0,0,-.15),'skull');J.parent=S
box('Jaw',(.025,0,0),(.17,.25,.075),bone,'skull',J,bevel=.02)
for y in [-.08,-.04,0,.04,.08]:box('Tooth',(.12,y,.025),(.022,.028,.06),stone[7],'skull',J)
for i in range(12):
 y=.08+i*.10;ball('Door chain',(.10,y,1.13-.1*math.sin(i/11*math.pi)),(.028,.064,.034),iron,'door',D)
# Window recess and bars, warm emissive backdrop outside.
lightmat=mat('Warm window',(.95,.53,.17));bs=next(n for n in lightmat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');bs.inputs['Emission Color'].default_value=(1,.48,.10,1);bs.inputs['Emission Strength'].default_value=2
box('Window glow',(-2.96,1.39,2.22),(.035,1.04,1.02),lightmat,'window')
for y in [.93,1.24,1.55,1.86]:rod('Window bar',(-2.61,y,1.71),(-2.61,y,2.73),.032,iron,'window')
for z in [1.64,2.77]:box('Window sill',(-2.67,1.4,z),(.48,1.23,.14),stone[7],'window',bevel=.025)
# Bed beneath window: straw mattress, ragged blanket, four posts.
for x in [-2.34,-1.25]:
 for y in [.20,2.15]:
  cyl('Bed post',(x,y,.43),.043,.76,wood[3],'bed');ball('Post cap',(x,y,.84),(.06,.06,.06),wood[5],'bed')
for x in [-2.34,-1.25]:box('Bed rail',(x,1.17,.42),(.08,2,.12),wood[3],'bed')
box('Straw mattress',(-1.80,1.17,.55),(1.05,1.96,.18),straw,'bed',bevel=.07)
box('Blanket',(-1.79,.88,.665),(1.07,1.24,.06),linen,'bed',bevel=.035)
for i in range(9):box('Blanket fringe',(-2.30+i*.124,.21,.57),(.092,.035,random.uniform(.12,.29)),linen,'bed')
for y in [.22,2.14]:
 rod('Bed headboard',(-2.34,y,.78),(-1.25,y,.78),.035,wood[4],'bed')
 for x in [-2.14,-1.94,-1.74,-1.54]:rod('Head spindle',(x,y,.54),(x,y,.77),.018,wood[5],'bed')
# Cabinet, opening front doors, jug, cup and a small ledger.
C=empty('CabinetRoot',(.0,2.14,0),'cabinet')
box('Cabinet back',(0,.31,.65),(1.12,.06,1.12),wood[1],'cabinet',C)
for x in [-.55,.55]:box('Cabinet side',(x,0,.65),(.09,.7,1.14),wood[3],'cabinet',C)
for z in [.13,.63,1.19]:box('Cabinet shelf',(0,0,z),(1.16,.73,.075),wood[4],'cabinet',C)
for x in [-.5,.5]:
 for y in [-.26,.26]:box('Cabinet leg',(x,y,.15),(.09,.09,.30),wood[2],'cabinet',C)
for name,x,sg,angle in [('CabinetLeft',-.52,1,-105),('CabinetRight',.52,-1,105)]:
 h=empty(name,(x,-.39,.22),'cabinet',[0,0,1],math.radians(angle));h.parent=C
 for i in range(3):box('Cabinet door',(sg*(.085+i*.17),0,.44),(.162,.065,.90),wood[3+i],'cabinet',h,bevel=.012)
 ball('Cabinet pull',(sg*.44,-.06,.52),(.023,.035,.04),iron,'cabinet',h)
ball('Jug belly',(-.20,2.18,1.47),(.19,.18,.23),clay,'jug');cyl('Jug neck',(-.20,2.18,1.70),.085,.16,clay,'jug');cyl('Jug lip',(-.20,2.18,1.79),.10,.04,clay,'jug')
# Jug handle as polygonal loop.
for i in range(10):
 a=i*math.tau/10;b=(i+1)*math.tau/10;rod('Jug handle',(-.40,2.18+.09*math.cos(a),1.57+.12*math.sin(a)),(-.40,2.18+.09*math.cos(b),1.57+.12*math.sin(b)),.025,clay,'jug')
cyl('Cup',(.25,2.20,1.34),.075,.19,glass,'jug');cyl('Cup inside',(.25,2.20,1.438),.062,.004,dark,'jug')
box('Ledger pages',(.24,1.92,1.265),(.31,.24,.065),linen,'table')
B=empty('BookCover',(.08,1.92,1.307),'table',[0,1,0],-2.4);box('Ledger cover',(.16,0,0),(.33,.27,.023),wood[1],'table',B)
# Barrel with removable hinged lid. Staves bulge in silhouette.
T=empty('BarrelRoot',(1.63,2.02,0),'chest')
for i in range(16):
 a=i*math.tau/16
 for z,r,h in [(.24,.40,.32),(.55,.46,.32),(.87,.42,.32)]:
  o=box('Barrel stave',(r*math.cos(a),r*math.sin(a),z),(.16,.10,h+.012),wood[2+i%5],'chest',T,bevel=.012);o.rotation_euler.z=a+math.pi/2
for z,r in [(.15,.417),(.39,.466),(.75,.466),(1.0,.422)]:
 for i in range(16):
  a=i*math.tau/16;o=box('Barrel hoop',(r*math.cos(a),r*math.sin(a),z),(.18,.04,.065),iron,'chest',T);o.rotation_euler.z=a+math.pi/2
L=empty('ChestLid',(0,.39,1.055),'chest',[1,0,0],1.8);L.parent=T
cyl('Barrel lid',(0,-.39,0),.397,.045,wood[5],'chest',L,16)
cyl('Barrel bottom',(0,0,.12),.39,.06,dark,'chest',T)
# Mouse beside barrel, floor rope and forgotten key.
ball('Mouse body',(2.22,1.44,.20),(.15,.21,.19),stone[2],'mouse');ball('Mouse head',(2.21,1.27,.30),(.13,.13,.12),stone[4],'mouse')
for x in [2.11,2.32]:ball('Mouse ear',(x,1.29,.42),(.07,.035,.09),clay,'mouse')
for x in [2.16,2.25]:ball('Mouse eye',(x,1.16,.32),(.014,.014,.018),dark,'mouse')
points=[(1.25+.4*math.sin(t*.6),-.9-t*.07,.10) for t in range(18)]
for a,b in zip(points,points[1:]):rod('Rope',a,b,.025,straw,'rope')
K=empty('BrassKey',(.95,-1.6,.12),'key')
rod('Key stem',(0,0,0),(.19,0,0),.018,brass,'key',K)
for i in range(10):
 a=i*math.tau/10;b=(i+1)*math.tau/10;rod('Key ring',(.045*math.cos(a),.045*math.sin(a),0),(.045*math.cos(b),.045*math.sin(b),0),.013,brass,'key',K)
box('Key tooth',(.16,-.025,0),(.026,.058,.032),brass,'key',K)
for i in range(8):ball('Loose stone',(random.uniform(-2.4,2.4),random.uniform(-2.4,-1.8),.11),(.08,.065,.045),stone[i%9],'wall')
# Join static geometry per parent/target, retaining semantic picking and hinges.
groups={}
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':groups.setdefault((o.parent,o.get('target','floor')),[]).append(o)
for (parent,target),objects in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o['target']=target
 if parent is None:o.name='CellFloor' if target=='floor' else 'Cell_'+target
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(R/'public/assets/3d/prison-cell.glb'),export_format='GLB',export_extras=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=960;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Cell ambience');scene.world.color=(.19,.15,.11)
for pos,power,size,color in [((-1,0,7),750,5,(1,.76,.49)),((4,-5,6),500,5,(.80,.85,1))]:
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=color
bpy.ops.object.camera_add(location=(8,-10,8));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=8.7;scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=str(R/'art/Barnaby-Prison-Cell.blend'))
# Render interactively in the saved scene when needed; web preview is the validation target.
