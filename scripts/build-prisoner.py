import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parents[1];O=R/'art/prisoner-character'
bpy.ops.wm.open_mainfile(filepath=str(O/'Galeotto-Originale.blend'))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH');mesh.name='Prisoner_Skin'
bpy.context.view_layer.objects.active=mesh
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
# Preserve UVs while reducing the source for real-time use.
mod=mesh.modifiers.new('Game mesh','DECIMATE');mod.ratio=min(1,50000/len(mesh.data.polygons));bpy.ops.object.modifier_apply(modifier=mod.name)
# The unwanted lock projects in front of the neck; fold it to the nape.
changed=0
image=next(n.image for m in mesh.data.materials for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and 'normal' not in n.image.name and 'metallic' not in n.image.name and 'roughness' not in n.image.name)
pixels=list(image.pixels);iw,ih=image.size;uv=mesh.data.uv_layers.active.data
hair=set()
for loop in mesh.data.loops:
 u,v=uv[loop.index].uv;idx=(min(ih-1,int(v*ih))*iw+min(iw-1,int(u*iw)))*4;r,g,b=pixels[idx:idx+3]
 if r<.38 and g<.30 and b<.25:hair.add(loop.vertex_index)
for v in mesh.data.vertices:
 x,y,z=v.co
 if v.index in hair and .765<z<.855 and y<-.034:
  t=min(1,max(0,(-y-.034)/.015))*min(1,(.855-z)/.012)*min(1,(z-.765)/.008)
  v.co.y+=(.025-y)*t;v.co.x+=(max(-.045,min(.045,x))-x)*t;changed+=1
print('HAIR_CORRECTED',changed,flush=True)
# Append the established skeleton and its idle/walk/run actions.
source=r'C:\Users\Max\Downloads\A Codici Main\Barnaby-Pixelart-Animazioni\Braccio-borsa\Barnaby-Animated.blend'
with bpy.data.libraries.load(source,link=False) as (a,b):b.objects=['Barnaby']
rig=b.objects[0];bpy.context.collection.objects.link(rig)
rig.name='Prisoner';rig.animation_data.action=None
for tr in rig.animation_data.nla_tracks:tr.mute=True
rig.data.pose_position='REST'
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def weights(p):
 x,y,z=p;a=abs(x);s='L' if x<0 else 'R'
 if z>.65 and a>.105 and (z<.815 or a>.20):
  arm=smooth(.105,.175,a);fore=smooth(.31,.365,a)
  return {'Torso':1-arm,'Arm'+s:arm*(1-fore),'Forearm'+s:arm*fore}
 if z>.815:
  h=smooth(.815,.89,z);return {'Torso':1-h,'Head':h}
 if z<.54:
  leg=1-smooth(.48,.54,z);knee=1-smooth(.27,.34,z);foot=1-smooth(.065,.105,z)
  return {'Torso':1-leg,'Leg'+s:leg*(1-knee),'Shin'+s:leg*knee*(1-foot),'Foot'+s:leg*knee*foot}
 return {'Torso':1}
scale=1.6/1.05026698
shoulders={s:Vector((sign*.15,0,.755)) for s,sign in [('L',-1),('R',1)]}
rots={s:Matrix.Rotation(sign*math.radians(83),4,'Y') for s,sign in [('L',-1),('R',1)]}
def neutral(p,name):
 p=p.copy()
 if name.startswith(('Arm','Forearm')):
  s=name[-1];p=shoulders[s]+rots[s]@(p-shoulders[s])
 elif name.startswith(('Leg','Shin','Foot')):p.x+=(-1 if name[-1]=='L' else 1)*.20*(p.z-.51)
 return p*scale
for bone in rig.data.bones:mesh.vertex_groups.new(name=bone.name)
for v in mesh.data.vertices:
 w={n:a for n,a in weights(v.co).items() if a>1e-6};total=sum(w.values());w={n:a/total for n,a in w.items()}
 p=sum((neutral(v.co,n)*a for n,a in w.items()),Vector());v.co=p
 for n,a in w.items():mesh.vertex_groups[n].add([v.index],a,'REPLACE')
bpy.context.view_layer.objects.active=rig;mesh.select_set(False);rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
pivots={'Torso':(0,0,.50),'Head':(0,0,.86)}
for s,sign in [('L',-1),('R',1)]:
 pivots['Arm'+s]=tuple(shoulders[s]);pivots['Forearm'+s]=(sign*.337,0,.755)
 pivots['Leg'+s]=(sign*.07,0,.51);pivots['Shin'+s]=(sign*.12,0,.295);pivots['Foot'+s]=(sign*.17,0,.075)
for n,p in pivots.items():
 b=rig.data.edit_bones[n];b.head=neutral(Vector(p),n);b.tail=b.head+Vector((0,.08,0))
bpy.ops.object.mode_set(mode='OBJECT');rig.data.pose_position='POSE';mesh.parent=rig
mod=mesh.modifiers.new('Prisoner skeleton','ARMATURE');mod.object=rig
for mat in mesh.data.materials:
 for n in list(mat.node_tree.nodes):
  if n.type=='TEX_IMAGE' and n.image:
   if 'metallic' in n.image.name or 'roughness' in n.image.name or 'normal' in n.image.name:mat.node_tree.nodes.remove(n)
   else:n.image.scale(2048,2048);n.image.pack();n.interpolation='Closest'
  elif n.type=='BSDF_PRINCIPLED':n.inputs['Metallic'].default_value=0;n.inputs['Roughness'].default_value=1
for tr in rig.animation_data.nla_tracks:tr.mute=False
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'public/assets/3d/prisoner.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_image_format='JPEG',export_jpeg_quality=95)
for tr in rig.animation_data.nla_tracks:tr.mute=True
rig.animation_data.action=bpy.data.actions.get('Barnaby_Idle');bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(O/'Galeotto-Animato.blend'))
print('PRISONER_READY',len(mesh.data.polygons),flush=True)
