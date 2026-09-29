"""Adapt the supplied textured OBJ into articulated, metre-scaled game geometry.
Source coordinates are retained until segmentation so this build is repeatable.
"""
import bpy,os,math,json,numpy as np
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'art/imported-room');OUT=os.path.join(ROOT,'public/assets/3d')
bpy.ops.wm.open_mainfile(filepath=os.path.join(SRC,'Room-Reduced.blend'))
source=next(o for o in bpy.context.scene.objects if o.type=='MESH')
for o in list(bpy.context.scene.objects):
 if o!=source:bpy.data.objects.remove(o,do_unlink=True)
mesh=source.data
verts=np.array([v.co[:] for v in mesh.vertices]);faces=np.array([p.vertices[:] for p in mesh.polygons]);centers=verts[faces].mean(axis=1);x,y,z=centers.T
uvs=np.array([mesh.uv_layers.active.data[p.loop_start+k].uv[:] for p in mesh.polygons for k in range(3)]).reshape((-1,3,2))
# The raised arched doorway is approximately 2.10 m from threshold to crown.
SXY=SZ=6.12;FLOOR=.021
INTERIOR_XY=6.12/(9/.7001)

def transform(p):
 x,y,z=p;return Vector((-(y+.10104)*SXY,(x+.10061)*SXY,(z-FLOOR)*SZ+.075))
def empty(name,point):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=transform(point);return o
root=empty('FirstAdventureRoom',(-.10061,-.10104,FLOOR));root.location=(0,0,0)
# Keep the supplied UV artwork. A small emission term preserves painted shadows
# while neutral diffuse lighting still gives animated objects dimensional shading.
mat=bpy.data.materials.new('Original room artwork');mat.use_nodes=True
nodes=mat.node_tree.nodes;p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Roughness'].default_value=.83
tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(os.path.join(SRC,'room-colour.jpg'));mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.20
normal=nodes.new('ShaderNodeTexImage');normal.image=bpy.data.images.load(os.path.join(SRC,'room-normal.jpg'));normal.image.colorspace_settings.name='Non-Color';nm=nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.22;mat.node_tree.links.new(normal.outputs['Color'],nm.inputs['Color']);mat.node_tree.links.new(nm.outputs['Normal'],p.inputs['Normal'])
rough=nodes.new('ShaderNodeTexImage');rough.image=bpy.data.images.load(os.path.join(SRC,'room-roughness.jpg'));rough.image.colorspace_settings.name='Non-Color';mat.node_tree.links.new(rough.outputs['Color'],p.inputs['Roughness'])
labels=np.full(len(faces),'Architecture',dtype=object)
def region(name,mask):labels[mask]=name
region('Rug',(x>-.36)&(x<-.015)&(y>-.18)&(y<.06)&(z>.028)&(z<.055))
region('Chest',(x>-.393)&(x<-.211)&(y>.077)&(y<.188)&(z>.025)&(z<.159))
region('LogBasket',(x>-.217)&(x<-.065)&(y>.087)&(y<.195)&(z>.026)&(z<.158))
region('Fireplace',(x>-.085)&(y>-.047)&(z>.025))
region('Cabinet',(x>.102)&(x<.211)&(y>-.273)&(y<-.069)&(z>.025)&(z<.54))
region('Candle',(x>.118)&(x<.202)&(y>-.246)&(y<-.19)&(z>.482)&(z<.60))
region('Book',(x>.115)&(x<.182)&(y>-.161)&(y<-.09)&(z>.461)&(z<.49))
region('Stairs',(x>.067)&(x<.219)&(y>-.431)&(y<-.278)&(z>.024)&(z<.31))
region('Door',(x>.219)&(y>-.420)&(y<-.294)&(z>.126)&(z<.44+np.sqrt(np.maximum(0,.062**2-(y+.357)**2))))
region('Window',(x>-.395)&(x<-.258)&(y>.176)&(z>.157)&(z<.54))
region('Shield',(x>-.24)&(x<-.096)&(y>.173)&(z>.41)&(z<.62))
region('Banner',(x>.206)&(y>-.078)&(y<.061)&(z>.30)&(z<.59))
region('BucketLeft',(x>-.436)&(x<-.381)&(y>.084)&(y<.18)&(z>.025)&(z<.12))
region('BucketRight',(x>.126)&(x<.207)&(y>-.074)&(y<-.017)&(z>.026)&(z<.132))
region('ChestLid',(labels=='Chest')&(z>.096))
region('CabinetLeft',(labels=='Cabinet')&(x<.13)&(z>.036)&(z<.187)&(y>-.171))
region('CabinetRight',(labels=='Cabinet')&(x<.13)&(z>.036)&(z<.187)&(y<=-.171))
region('BookCover',labels=='Book')
pivots={
 'ChestLid':((- .302,.183,.096),'chest',[0,0,1],1.30),
 'CabinetLeft':((.127,-.073,.036),'cabinet',[0,1,0],-1.55),
 'CabinetRight':((.127,-.270,.036),'cabinet',[0,1,0],1.55),
 'Door':((.225,-.416,.126),'door',[0,1,0],1.35),
 'BookCover':((.18,-.127,.468),'table',[1,0,0],-2.65),
}
ids={'Chest':'chest','ChestLid':'chest','Cabinet':'cabinet','CabinetLeft':'cabinet','CabinetRight':'cabinet','Door':'door','Book':'table','BookCover':'table','Stairs':'stairs','Window':'window','Shield':'shield','Banner':'banner','Fireplace':'fireplace','LogBasket':'logs','BucketLeft':'bucket','BucketRight':'bucket','Candle':'candle','Rug':'rug','Architecture':'wall'}
parts={}
for name in np.unique(labels):
 sel=np.flatnonzero(labels==name);f=faces[sel];used,inverse=np.unique(f,return_inverse=True);positions=[transform(verts[i]) for i in used]
 m=bpy.data.meshes.new(name);m.from_pydata(positions,[],inverse.reshape((-1,3)).tolist());m.update();
 for poly in m.polygons:poly.use_smooth=True
 layer=m.uv_layers.new(name='UVMap');layer.data.foreach_set('uv',uvs[sel].reshape(-1).tolist());m.materials.append(mat)
 o=bpy.data.objects.new(name+'Mesh',m);bpy.context.collection.objects.link(o);o['target']=ids[name];o.parent=root
 if name in pivots:
  point,target,axis,angle=pivots[name];pivot=empty('DoorHinge' if name=='Door' else name,point);pivot.parent=root;pivot['target']=target;pivot['axis']=axis;pivot['openAngle']=angle
  o.parent=pivot
  for v in m.vertices:v.co-=pivot.location
  parts[name]=pivot
 else:parts[name]=o
 print('PART',name,len(sel),flush=True)
bpy.data.objects.remove(source,do_unlink=True)
# New hidden interior surfaces use subdued colours sampled from the wood palette.
def solid(name,rgb):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=.9;return m
wood=solid('Dark interior wood',(.048,.027,.019));paper=solid('Old parchment',(.54,.43,.28));gold=solid('Brass key',(.48,.29,.06))
def box(name,point,dimensions,material,parent=root,target=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=transform(point));o=bpy.context.object;o.name=name;o.dimensions=(dimensions[0]*INTERIOR_XY,dimensions[1]*INTERIOR_XY,dimensions[2]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);o.parent=parent
 if parent!=root:o.location-=parent.location
 if target:o['target']=target
 return o
# Chest bottom, inner liner and lid underside are separate from the painted exterior.
box('ChestInteriorBottom',(-.302,.130,.034),(.98,2.08,.035),wood,target='chest')
box('ChestInteriorBack',(-.302,.177,.064),(.035,2.08,.34),wood,target='chest')
box('ChestInteriorFront',(-.302,.084,.064),(.035,2.08,.34),wood,target='chest')
for xx in [-.385,-.218]:box('ChestInnerSide',(xx,.13,.064),(1.20,.035,.34),wood,target='chest')
box('LidUnderside',(-.302,.131,.097),(1.24,2.12,.025),wood,parts['ChestLid'],'chest')
box('CabinetInnerBack',(.192,-.172,.106),(2.32,.04,.83),wood,target='cabinet')
box('CabinetInnerFloor',(.159,-.172,.038),(2.32,.88,.035),wood,target='cabinet')
for n,yy in [('CabinetLeft',-.122),('CabinetRight',-.22)]:box(n+'Inside',(.131,yy,.112),(1.18,.024,.88),wood,parts[n],'cabinet')
box('BookPages',(.15,-.126,.466),(.55,.62,.027),paper,target='table')
# Dark reveal behind the wooden leaf hides the untextured rear of the scan.
shadow=solid('Doorway interior',(.008,.006,.009))
box('DoorwayDepth',(.242,-.357,.295),(1.54,.025,2.06),shadow,target='door')
# Collectible key is reachable on the low chest; it never rides the moving lid.
bpy.ops.mesh.primitive_torus_add(major_radius=.075,minor_radius=.014,major_segments=16,minor_segments=6,location=transform((-.208,.10,.154)));key=bpy.context.object;key.name='BrassKey';key.data.materials.append(gold);key.parent=root;key['target']='key'
box('KeyShaft',(-.208,.09,.154),(.20,.025,.025),gold,key,'key')
# Export only the room. The separately versioned Traveller remains unchanged.
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'adventure-room.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_image_format='AUTO',export_yup=True)
# Editable Blender scene includes the exact same metre-scaled character.
with bpy.data.libraries.load(os.path.join(ROOT,'art/Traveller-Textured.blend'),link=False) as (data,dst):dst.objects=[n for n in data.objects if n in ['Traveller','TexturedTraveller']]
for o in dst.objects:
 if o is not None:bpy.context.collection.objects.link(o)
# Load any skinned mesh name used by the character source.
if not any(o.type=='MESH' and o.find_armature() for o in dst.objects if o):
 with bpy.data.libraries.load(os.path.join(ROOT,'art/Traveller-Textured.blend'),link=False) as (data,dst2):dst2.objects=[n for n in data.objects if 'Traveller' in n and n!='Traveller']
 for o in dst2.objects:
  if o is not None and o.name not in bpy.context.scene.objects:bpy.context.collection.objects.link(o)
rig=bpy.data.objects.get('Traveller')
if rig:
 rig.location=(.45,-1.15,.075)
 if rig.animation_data:
  rig.animation_data.action=bpy.data.actions.get('Reference_Idle');bpy.context.scene.frame_set(1)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=8;s.cycles.use_denoising=True;s.render.threads_mode='FIXED';s.render.threads=4;s.render.resolution_x=1200;s.render.resolution_y=1000;s.render.resolution_percentage=100;s.view_settings.view_transform='Standard'
s.world=bpy.data.worlds.new('Neutral room light');s.world.use_nodes=True;bg=next(n for n in s.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.32,.36,.43,1);bg.inputs[1].default_value=.65
for pos,energy,size,color in [((-4,-1,7),650,5,(.78,.85,1)),((2,-5,6),400,6,(1,.88,.73))]:
 bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.data.energy=energy;l.data.shape='DISK';l.data.size=size;l.data.color=color;l.rotation_euler=(Vector((0,0,0))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(12,-15,13));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.6))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=9.2;s.camera=cam
bpy.data.orphans_purge(do_recursive=True);bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art/First-Adventure-Room.blend'),compress=True)
s.render.filepath=os.path.join(SRC,'adapted-room.png');bpy.ops.render.render(write_still=True)
