import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parents[1];O=R/'art/guy-character'
bpy.ops.wm.open_mainfile(filepath=str(O/('Guy-GameSource.blend' if (O/'Guy-GameSource.blend').exists() else 'Guy-Originale.blend')))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH');mesh.name='Guy_Skin'
bpy.context.view_layer.objects.active=mesh;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
height=max(v.co.z for v in mesh.data.vertices)-min(v.co.z for v in mesh.data.vertices)
mod=mesh.modifiers.new('Game mesh','DECIMATE');mod.ratio=min(1,90000/len(mesh.data.polygons));bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.ops.wm.save_as_mainfile(filepath=str(O/'Guy-GameSource.blend'))
source=R/'art/prisoner-character/Galeotto-Pulito.blend'
with bpy.data.libraries.load(str(source),link=False) as (a,b):b.objects=['Prisoner']
rig=b.objects[0];bpy.context.collection.objects.link(rig);rig.name='Guy'
rig.animation_data.action=None
for tr in rig.animation_data.nla_tracks:tr.mute=True
rig.data.pose_position='REST'
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def weights(p):
 x,y,z=p;a=abs(x);s='L' if x<0 else 'R'
 if a>.11 and z>.51:
  arm=smooth(.11,.17,a);fore=smooth(.185,.235,a)
  return {'Torso':1-arm,'Arm'+s:arm*(1-fore),'Forearm'+s:arm*fore}
 if z>.83:
  h=smooth(.83,.89,z);return {'Torso':1-h,'Head':h}
 if z<.54:
  leg=1-smooth(.48,.54,z);knee=1-smooth(.25,.32,z);foot=1-smooth(.065,.105,z)
  return {'Torso':1-leg,'Leg'+s:leg*(1-knee),'Shin'+s:leg*knee*(1-foot),'Foot'+s:leg*knee*foot}
 return {'Torso':1}
scale=1.6/height
shoulders={s:Vector((sign*.12,0,.805)) for s,sign in [('L',-1),('R',1)]}
hips={s:Vector((sign*.075,0,.50)) for s,sign in [('L',-1),('R',1)]}
armrots={s:Matrix.Rotation(sign*math.radians(35),4,'Y') for s,sign in [('L',-1),('R',1)]}
legrots={s:Matrix.Rotation(sign*math.radians(15),4,'Y') for s,sign in [('L',-1),('R',1)]}
def neutral(p,name):
 p=p.copy()
 if name.startswith(('Arm','Forearm')):
  s=name[-1];p=shoulders[s]+armrots[s]@(p-shoulders[s])
 elif name.startswith(('Leg','Shin','Foot')):
  s=name[-1];p=hips[s]+legrots[s]@(p-hips[s])
 return p*scale
for bone in rig.data.bones:mesh.vertex_groups.new(name=bone.name)
for v in mesh.data.vertices:
 w={n:a for n,a in weights(v.co).items() if a>1e-6};total=sum(w.values());w={n:a/total for n,a in w.items()}
 v.co=sum((neutral(v.co,n)*a for n,a in w.items()),Vector())
 for n,a in w.items():mesh.vertex_groups[n].add([v.index],a,'REPLACE')
floor=min(v.co.z for v in mesh.data.vertices);fit=1.6/(max(v.co.z for v in mesh.data.vertices)-floor)
def fitted(p):return (p-Vector((0,0,floor)))*fit
for v in mesh.data.vertices:v.co=fitted(v.co)
bpy.context.view_layer.objects.active=rig;mesh.select_set(False);rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
pivots={'Torso':(0,0,.50),'Head':(0,0,.86)}
for s,sign in [('L',-1),('R',1)]:
 pivots['Arm'+s]=tuple(shoulders[s]);pivots['Forearm'+s]=(sign*.215,0,.695)
 pivots['Leg'+s]=tuple(hips[s]);pivots['Shin'+s]=(sign*.14,0,.285);pivots['Foot'+s]=(sign*.19,0,.075)
for n,p in pivots.items():
 bone=rig.data.edit_bones[n];bone.head=fitted(neutral(Vector(p),n));bone.tail=bone.head+Vector((0,.08,0))
bpy.ops.object.mode_set(mode='OBJECT');rig.data.pose_position='POSE';mesh.parent=rig
mod=mesh.modifiers.new('Guy skeleton','ARMATURE');mod.object=rig
for mat in mesh.data.materials:
 for n in list(mat.node_tree.nodes):
  if n.type=='TEX_IMAGE' and n.image:
   if any(t in n.image.name for t in ['metallic','roughness','normal']):mat.node_tree.nodes.remove(n)
   else:n.image.pack();n.interpolation='Closest'
  elif n.type=='BSDF_PRINCIPLED':n.inputs['Metallic'].default_value=0;n.inputs['Roughness'].default_value=1
for tr in rig.animation_data.nla_tracks:tr.mute=False
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'public/assets/3d/guy.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_image_format='JPEG',export_jpeg_quality=96)
for tr in rig.animation_data.nla_tracks:tr.mute=True
rig.animation_data.action=bpy.data.actions.get('Barnaby_Idle');bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(O/'Guy-Animato.blend'))
(O/'build-info.json').write_text(json.dumps({'sourceHeight':height,'uniformScale':scale,'targetHeight':1.6,'triangles':len(mesh.data.polygons),'armRotationDegrees':35,'legRotationDegrees':15,'texture':'original colour map, full resolution','actions':[a.name for a in bpy.data.actions]},indent=2),encoding='utf-8')
print('GUY_READY',len(mesh.data.polygons),flush=True)
